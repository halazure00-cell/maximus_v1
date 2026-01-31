import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useEntityList } from '../lib/hooks/useEntityList'
import { formatCurrency } from '../lib/formatters'
import { supabase } from '../lib/supabaseClient'
import { getSettings, upsertRecord } from '../lib/localStore'
import { createId, roundCoordinate } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import StatCard from '../components/StatCard'
import SectionCard from '../components/SectionCard'
import HeatmapLayer from '../components/HeatmapLayer'
import {
  TIME_BUCKETS,
  fetchHolidaySet,
  fetchWeather,
  getConfidenceModifier,
  getJakartaDateKey,
  getJakartaHour,
  getTimeBucket,
  getWeatherModifier,
} from '../lib/heatmapSmart'

const Dashboard = () => {
  const { user } = useAuth()
  const { showToast } = useAlert()
  const { items: trips } = useEntityList('trips')
  const { items: earnings } = useEntityList('earnings')
  const { items: expenses } = useEntityList('expenses')
  const { items: heatmapPoints } = useEntityList('heatmap_points')
  const fileInputRef = useRef(null)
  const [rangeDays, setRangeDays] = useState(7)
  const [useWeather, setUseWeather] = useState(true)
  const [useHoliday, setUseHoliday] = useState(true)
  const [mapPrecision, setMapPrecision] = useState(4)
  const [weatherState, setWeatherState] = useState({ status: 'idle', data: null })
  const [holidayState, setHolidayState] = useState({ status: 'idle', dates: null })
  const [importState, setImportState] = useState({
    status: 'idle',
    total: 0,
    valid: 0,
    skipped: 0,
  })

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings()
      setMapPrecision(settings.mapPrecision || 4)
    }
    loadSettings()
  }, [])

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayTrips = trips.filter((trip) => trip.date?.startsWith(today))
    const todayEarnings = earnings.filter((item) => item.date?.startsWith(today))
    const todayExpenses = expenses.filter((item) => item.date?.startsWith(today))

    const tripCount = todayTrips.length
    const totalIncome = todayEarnings.reduce((sum, item) => sum + (item.amount || 0), 0)
    const tripIncome = todayTrips.reduce((sum, item) => sum + (item.fare || 0), 0)
    const totalExpense = todayExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      tripCount,
      totalIncome: totalIncome + tripIncome,
      totalExpense,
      net: totalIncome + tripIncome - totalExpense,
    }
  }, [trips, earnings, expenses])

  const filteredHeatmapPoints = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000
    return heatmapPoints.filter((point) => {
      if (!point.lat || !point.lng) return false
      const timestamp = point.created_at || point.updated_at
      if (!timestamp) return true
      return new Date(timestamp).getTime() >= cutoff
    })
  }, [heatmapPoints, rangeDays])

  const mapCenter = useMemo(() => {
    if (!filteredHeatmapPoints.length) return [-6.9147, 107.6098]
    const totals = filteredHeatmapPoints.reduce(
      (acc, point) => {
        if (!point.lat || !point.lng) return acc
        acc.lat += point.lat
        acc.lng += point.lng
        acc.count += 1
        return acc
      },
      { lat: 0, lng: 0, count: 0 }
    )
    if (!totals.count) return [-6.9147, 107.6098]
    return [totals.lat / totals.count, totals.lng / totals.count]
  }, [filteredHeatmapPoints])

  useEffect(() => {
    if (!useWeather) {
      setWeatherState({ status: 'idle', data: null })
      return
    }
    let active = true
    const loadWeather = async () => {
      setWeatherState((prev) => ({ status: 'loading', data: prev.data }))
      try {
        const data = await fetchWeather({ lat: mapCenter[0], lng: mapCenter[1] })
        if (active) {
          setWeatherState({ status: 'ready', data })
        }
      } catch (error) {
        if (active) {
          setWeatherState({ status: 'error', data: null })
        }
      }
    }
    loadWeather()
    return () => {
      active = false
    }
  }, [mapCenter, useWeather])

  useEffect(() => {
    if (!useHoliday) {
      setHolidayState({ status: 'idle', dates: null })
      return
    }
    let active = true
    const loadHolidays = async () => {
      setHolidayState((prev) => ({ status: 'loading', dates: prev.dates }))
      try {
        const jakartaDate = getJakartaDateKey()
        const year = Number(jakartaDate.slice(0, 4))
        const dates = await fetchHolidaySet(year)
        if (active) {
          setHolidayState({ status: 'ready', dates })
        }
      } catch (error) {
        if (active) {
          setHolidayState({ status: 'error', dates: null })
        }
      }
    }
    loadHolidays()
    return () => {
      active = false
    }
  }, [useHoliday])

  const bucketStats = useMemo(() => {
    const stats = TIME_BUCKETS.map(() => ({ count: 0, sum: 0 }))
    filteredHeatmapPoints.forEach((point) => {
      const timestamp = point.created_at || point.updated_at
      if (!timestamp) return
      const hour = getJakartaHour(new Date(timestamp))
      const bucket = getTimeBucket(hour)
      const intensity = Number.isFinite(point.intensity) ? point.intensity : 0.7
      stats[bucket.id].count += 1
      stats[bucket.id].sum += intensity
    })
    return stats
  }, [filteredHeatmapPoints])

  const currentBucket = getTimeBucket(getJakartaHour())

  const timeModifier = useMemo(() => {
    const total = bucketStats.reduce(
      (acc, bucket) => ({
        count: acc.count + bucket.count,
        sum: acc.sum + bucket.sum,
      }),
      { count: 0, sum: 0 }
    )
    const overallAvg = total.count ? total.sum / total.count : 0.7
    const bucket = bucketStats[currentBucket.id]
    const bucketAvg = bucket.count ? bucket.sum / bucket.count : overallAvg
    if (!overallAvg) return 1
    return Math.min(1.2, Math.max(0.85, bucketAvg / overallAvg))
  }, [bucketStats, currentBucket])

  const weatherModifier = useMemo(() => {
    if (!useWeather) return 1
    return getWeatherModifier(weatherState.data)
  }, [useWeather, weatherState])

  const holidayModifier = useMemo(() => {
    if (!useHoliday || !holidayState.dates) return 1
    const jakartaDate = getJakartaDateKey()
    return holidayState.dates.has(jakartaDate) ? 1.1 : 1
  }, [useHoliday, holidayState])

  const weatherSummary = useMemo(() => {
    if (!useWeather) return 'Cuaca dimatikan'
    if (weatherState.status === 'loading') return 'Cuaca memuat'
    if (weatherState.status === 'error') return 'Cuaca gagal'
    if (!weatherState.data) return 'Cuaca belum tersedia'
    const precipitation = weatherState.data.precipitation ?? 0
    const temperature = weatherState.data.temperature
    const rainLabel = precipitation > 0 ? `Hujan ${precipitation} mm` : 'Tidak hujan'
    const tempLabel = Number.isFinite(temperature) ? ` • ${Math.round(temperature)}°C` : ''
    return `${rainLabel}${tempLabel}`
  }, [useWeather, weatherState])

  const holidaySummary = useMemo(() => {
    if (!useHoliday) return 'Libur dimatikan'
    if (holidayState.status === 'loading') return 'Libur memuat'
    if (holidayState.status === 'error') return 'Libur gagal'
    if (!holidayState.dates) return 'Libur belum tersedia'
    const jakartaDate = getJakartaDateKey()
    return holidayState.dates.has(jakartaDate) ? 'Hari libur nasional' : 'Hari kerja'
  }, [useHoliday, holidayState])

  const heatPoints = useMemo(() => {
    if (!filteredHeatmapPoints.length) return []
    const grouped = new Map()
    filteredHeatmapPoints.forEach((point) => {
      if (!point.lat || !point.lng) return
      const lat = roundCoordinate(point.lat, mapPrecision)
      const lng = roundCoordinate(point.lng, mapPrecision)
      const key = `${lat}:${lng}`
      const intensity = Number.isFinite(point.intensity) ? point.intensity : 0.7
      const entry = grouped.get(key) || { lat, lng, sum: 0, count: 0 }
      entry.sum += intensity
      entry.count += 1
      grouped.set(key, entry)
    })

    const scored = Array.from(grouped.values()).map((cell) => {
      const avgIntensity = cell.sum / cell.count
      const confidence = getConfidenceModifier(cell.count)
      const score = avgIntensity * timeModifier * weatherModifier * holidayModifier * confidence
      return { ...cell, score }
    })

    const maxScore = Math.max(...scored.map((cell) => cell.score), 0)
    return scored.map((cell) => [
      cell.lat,
      cell.lng,
      maxScore ? cell.score / maxScore : 0.4,
    ])
  }, [
    filteredHeatmapPoints,
    mapPrecision,
    timeModifier,
    weatherModifier,
    holidayModifier,
  ])

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!user) {
      showToast({ title: 'Login dulu', message: 'Masuk untuk mengimpor data.', type: 'error' })
      event.target.value = ''
      return
    }
    setImportState({ status: 'parsing', total: 0, valid: 0, skipped: 0 })
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      if (!Array.isArray(payload)) {
        throw new Error('Format JSON harus array')
      }

      const existingKeys = new Set()
      heatmapPoints.forEach((point) => {
        if (!point.lat || !point.lng) return
        const timestamp = point.created_at || point.updated_at
        if (!timestamp) return
        const lat = roundCoordinate(point.lat, mapPrecision)
        const lng = roundCoordinate(point.lng, mapPrecision)
        existingKeys.add(`${user.id}-${lat}-${lng}-${timestamp}`)
      })

      const records = []
      const fileKeys = new Set()
      let skipped = 0

      payload.forEach((item) => {
        const timestamp = item?.order_timestamp
        const pickup = item?.locations?.pickup
        if (!timestamp || !pickup?.lat || !pickup?.lng) {
          skipped += 1
          return
        }
        const parsedTime = new Date(timestamp)
        if (Number.isNaN(parsedTime.getTime())) {
          skipped += 1
          return
        }

        const lat = roundCoordinate(Number(pickup.lat), mapPrecision)
        const lng = roundCoordinate(Number(pickup.lng), mapPrecision)
        const isoTime = parsedTime.toISOString()
        const key = `${user.id}-${lat}-${lng}-${isoTime}`
        if (existingKeys.has(key) || fileKeys.has(key)) {
          skipped += 1
          return
        }
        fileKeys.add(key)
        records.push({
          id: createId(),
          user_id: user.id,
          lat,
          lng,
          intensity: 0.7,
          created_at: isoTime,
          updated_at: isoTime,
        })
      })

      if (!records.length) {
        setImportState({ status: 'done', total: payload.length, valid: 0, skipped })
        showToast({
          title: 'Tidak ada data baru',
          message: 'Semua data sudah pernah diimpor atau tidak valid.',
          type: 'info',
        })
        event.target.value = ''
        return
      }

      setImportState({
        status: 'uploading',
        total: payload.length,
        valid: records.length,
        skipped,
      })

      const chunkSize = 200
      for (let i = 0; i < records.length; i += chunkSize) {
        const batch = records.slice(i, i + chunkSize)
        const { error } = await supabase
          .from('heatmap_points')
          .upsert(batch, { onConflict: 'user_id,lat,lng,created_at' })
        if (error) {
          throw error
        }
      }

      await Promise.all(
        records.map((record) =>
          upsertRecord('heatmap_points', { ...record, sync_status: 'synced' })
        )
      )

      setImportState({
        status: 'done',
        total: payload.length,
        valid: records.length,
        skipped,
      })
      showToast({
        title: 'Import selesai',
        message: `${records.length} titik berhasil ditambahkan.`,
        type: 'success',
      })
    } catch (error) {
      setImportState({ status: 'error', total: 0, valid: 0, skipped: 0 })
      showToast({
        title: 'Gagal import',
        message: error?.message || 'Periksa format JSON kamu.',
        type: 'error',
      })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Aksi Cepat</h2>
          <span className="pill bg-white/10 text-[11px] text-white/70">1 Tap</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/perjalanan" className="btn-primary">
            Catat Trip
          </Link>
          <Link to="/pendapatan" className="btn-outline">
            Tambah Pendapatan
          </Link>
          <Link to="/pengeluaran" className="btn-outline">
            Tambah Pengeluaran
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Trip Hari Ini"
          value={summary.tripCount}
          caption="Jumlah perjalanan tercatat"
        />
        <StatCard
          title="Pendapatan"
          value={formatCurrency(summary.totalIncome)}
          caption="Total pemasukan hari ini"
          accent="text-sunrise-300"
        />
        <StatCard
          title="Neto"
          value={formatCurrency(summary.net)}
          caption="Setelah pengeluaran"
          accent="text-teal-200"
        />
      </div>

      <SectionCard
        title="Peta Panas Perjalanan"
        action={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-outline px-3 py-1 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Riwayat
            </button>
            <span className="pill bg-white/10 text-white/70">Bandung</span>
          </div>
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
        <div className="h-72 overflow-hidden rounded-2xl border border-white/10">
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer points={heatPoints} />
          </MapContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`pill ${rangeDays === 7 ? 'bg-sunrise-300/20 text-sunrise-100' : 'bg-white/10 text-white/70'}`}
              onClick={() => setRangeDays(7)}
            >
              7 Hari
            </button>
            <button
              type="button"
              className={`pill ${rangeDays === 30 ? 'bg-sunrise-300/20 text-sunrise-100' : 'bg-white/10 text-white/70'}`}
              onClick={() => setRangeDays(30)}
            >
              30 Hari
            </button>
          </div>
          <button
            type="button"
            className={`pill ${useWeather ? 'bg-teal-400/20 text-teal-100' : 'bg-white/10 text-white/70'}`}
            onClick={() => setUseWeather((prev) => !prev)}
          >
            Cuaca {useWeather ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            className={`pill ${useHoliday ? 'bg-indigo-400/20 text-indigo-100' : 'bg-white/10 text-white/70'}`}
            onClick={() => setUseHoliday((prev) => !prev)}
          >
            Libur {useHoliday ? 'On' : 'Off'}
          </button>
          <span className="pill bg-white/5 text-white/60">
            Bucket {currentBucket.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-white/60">
          {weatherSummary} • {holidaySummary} • Faktor waktu x{timeModifier.toFixed(2)}
        </p>
        {importState.status !== 'idle' ? (
          <p className="mt-2 text-xs text-white/60">
            Import: {importState.status} • Total {importState.total} • Valid{' '}
            {importState.valid} • Skip {importState.skipped}
          </p>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Dashboard
