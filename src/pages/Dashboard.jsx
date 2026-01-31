import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useEntityList } from '../lib/hooks/useEntityList'
import { formatCurrency } from '../lib/formatters'
import { supabase } from '../lib/supabaseClient'
import { getSettings, saveSettings, upsertRecord } from '../lib/localStore'
import { subscribe } from '../lib/events'
import { createId, roundCoordinate } from '../lib/utils'
import { useAuth } from '../context/useAuth'
import { useAlert } from '../context/useAlert'
import StatCard from '../components/StatCard'
import SectionCard from '../components/SectionCard'
import SegmentedControl from '../components/SegmentedControl'
import HeatmapLayer from '../components/HeatmapLayer'
import {
  TIME_BUCKETS,
  buildIncomeBucketStats,
  fetchHolidaySet,
  fetchWeather,
  getDeadheadPenalty,
  getDistancePenalty,
  getConfidenceModifier,
  getJakartaDateKey,
  getJakartaHour,
  getDistanceKm,
  getNetIncomeFactors,
  getOverallNetPerHour,
  getTimeBucket,
  getWeatherModifier,
} from '../lib/heatmapSmart'

const UserLocationLayer = ({ location, followMe }) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !location || !followMe) return
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 13), { animate: true })
  }, [map, location, followMe])

  if (!location) return null

  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={Math.max(20, location.accuracy || 20)}
        pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.15 }}
      />
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={6}
        pathOptions={{ color: '#0ea5e9', fillColor: '#38bdf8', fillOpacity: 0.9 }}
      />
    </>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const { showToast } = useAlert()
  const { items: earnings } = useEntityList('earnings')
  const { items: expenses } = useEntityList('expenses')
  const { items: heatmapPoints } = useEntityList('heatmap_points')
  const fileInputRef = useRef(null)
  const controlsTimerRef = useRef(null)
  const [rangeDays, setRangeDays] = useState(7)
  const [useWeather, setUseWeather] = useState(true)
  const [useHoliday, setUseHoliday] = useState(true)
  const [mapPrecision, setMapPrecision] = useState(4)
  const [deadheadCostPerKm, setDeadheadCostPerKm] = useState(2000)
  const [deadheadRadiusKm, setDeadheadRadiusKm] = useState(3)
  const [heatmapGoal, setHeatmapGoal] = useState('order')
  const [useCurrentHour, setUseCurrentHour] = useState(true)
  const [highContrastHeatmap, setHighContrastHeatmap] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState(1)
  const [distancePenaltyKm, setDistancePenaltyKm] = useState(3)
  const [liveLocation, setLiveLocation] = useState(null)
  const [liveLocationEnabled, setLiveLocationEnabled] = useState(false)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [followMe, setFollowMe] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const locationWatchRef = useRef(null)
  const [weatherState, setWeatherState] = useState({ status: 'idle', data: null })
  const [holidayState, setHolidayState] = useState({ status: 'idle', dates: null })
  const [importState, setImportState] = useState({
    status: 'idle',
    total: 0,
    valid: 0,
    skipped: 0,
  })

  useEffect(() => {
    const applySettings = (settings) => {
      setMapPrecision(settings.mapPrecision || 4)
      setDeadheadCostPerKm(settings.deadheadCostPerKm ?? 2000)
      setDeadheadRadiusKm(settings.deadheadRadiusKm ?? 3)
      setHeatmapGoal(settings.heatmapGoal || 'order')
      setUseCurrentHour(settings.useCurrentHour ?? true)
      setHighContrastHeatmap(settings.highContrastHeatmap ?? false)
      setHeatmapIntensity(settings.heatmapIntensity ?? 1)
      setDistancePenaltyKm(settings.distancePenaltyKm ?? 3)
      setControlsOpen(settings.heatmapControlsOpen ?? true)
      setLiveLocationEnabled(settings.liveLocationEnabled ?? false)
      setFollowMe(settings.followMe ?? false)
      setUseWeather(settings.useWeather ?? true)
      setUseHoliday(settings.useHoliday ?? true)
    }
    const loadSettings = async () => {
      const settings = await getSettings()
      applySettings(settings)
    }
    loadSettings()
    const unsub = subscribe((event) => {
      if (event.storeName === 'settings') {
        loadSettings()
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const startWatch = () => {
      if (!navigator.geolocation) {
        showToast({ title: 'Lokasi', message: 'Perangkat tidak mendukung GPS.', type: 'error' })
        setLocationStatus('error')
        return
      }
      if (locationWatchRef.current !== null) return
      setLocationStatus('loading')
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            updatedAt: Date.now(),
          })
          setLocationStatus('ready')
        },
        (geoError) => {
          setLocationStatus('error')
          let message = 'Gagal mengambil lokasi.'
          if (geoError?.code === 1) message = 'Izin lokasi ditolak.'
          if (geoError?.code === 2) message = 'Lokasi tidak tersedia.'
          if (geoError?.code === 3) message = 'Permintaan lokasi timeout.'
          showToast({ title: 'Lokasi', message, type: 'error' })
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      )
    }

    const stopWatch = () => {
      if (locationWatchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchRef.current)
        locationWatchRef.current = null
      }
      setLocationStatus('idle')
      setLiveLocation(null)
    }

    if (liveLocationEnabled) {
      startWatch()
      return
    }
    stopWatch()
  }, [liveLocationEnabled, showToast])

  const summary = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const now = Date.now()
    const weekCutoff = now - 7 * 24 * 60 * 60 * 1000
    const inLastWeek = (value) => {
      if (!value) return false
      const parsed = new Date(value)
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= weekCutoff
    }

    const todayEarnings = earnings.filter((item) => item.date?.startsWith(todayKey))
    const todayExpenses = expenses.filter((item) => item.date?.startsWith(todayKey))
    const weekEarnings = earnings.filter((item) => inLastWeek(item.date))
    const weekExpenses = expenses.filter((item) => inLastWeek(item.date))

    const totalIncomeToday = todayEarnings.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalExpenseToday = todayExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalIncomeWeek = weekEarnings.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalExpenseWeek = weekExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      totalIncomeToday,
      totalExpenseToday,
      netToday: totalIncomeToday - totalExpenseToday,
      totalIncomeWeek,
      totalExpenseWeek,
    }
  }, [earnings, expenses])

  const filteredHeatmapPoints = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000
    return heatmapPoints.filter((point) => {
      if (!point.lat || !point.lng) return false
      const timestamp = point.created_at || point.updated_at
      if (!timestamp) return true
      return new Date(timestamp).getTime() >= cutoff
    })
  }, [heatmapPoints, rangeDays])

  const currentBucket = getTimeBucket(getJakartaHour())

  const activeHeatmapPoints = useMemo(() => {
    if (!useCurrentHour) return filteredHeatmapPoints
    return filteredHeatmapPoints.filter((point) => {
      const timestamp = point.created_at || point.updated_at
      if (!timestamp) return false
      const bucket = getTimeBucket(getJakartaHour(new Date(timestamp)))
      return bucket.id === currentBucket.id
    })
  }, [filteredHeatmapPoints, useCurrentHour, currentBucket])

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
    if (heatmapGoal === 'order' || !useWeather) {
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
      } catch {
        if (active) {
          setWeatherState({ status: 'error', data: null })
        }
      }
    }
    loadWeather()
    return () => {
      active = false
    }
  }, [mapCenter, useWeather, heatmapGoal])

  useEffect(() => {
    if (heatmapGoal === 'order' || !useHoliday) {
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
      } catch {
        if (active) {
          setHolidayState({ status: 'error', dates: null })
        }
      }
    }
    loadHolidays()
    return () => {
      active = false
    }
  }, [useHoliday, heatmapGoal])

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

  const incomeStats = useMemo(
    () => buildIncomeBucketStats({ earnings, expenses }),
    [earnings, expenses]
  )

  const incomeFactors = useMemo(() => getNetIncomeFactors(incomeStats), [incomeStats])

  const overallNetPerHour = useMemo(() => getOverallNetPerHour(incomeStats), [incomeStats])

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
    if (heatmapGoal === 'order') return 1
    if (!useWeather) return 1
    return getWeatherModifier(weatherState.data)
  }, [heatmapGoal, useWeather, weatherState])

  const holidayModifier = useMemo(() => {
    if (heatmapGoal === 'order') return 1
    if (!useHoliday || !holidayState.dates) return 1
    const jakartaDate = getJakartaDateKey()
    return holidayState.dates.has(jakartaDate) ? 1.1 : 1
  }, [heatmapGoal, useHoliday, holidayState])

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

  const bucketPoints = useMemo(() => {
    const map = new Map()
    activeHeatmapPoints.forEach((point) => {
      if (!point.lat || !point.lng) return
      const timestamp = point.created_at || point.updated_at
      if (!timestamp) return
      const bucket = getTimeBucket(getJakartaHour(new Date(timestamp)))
      const list = map.get(bucket.id) || []
      list.push({ lat: point.lat, lng: point.lng })
      map.set(bucket.id, list)
    })
    return map
  }, [activeHeatmapPoints])

  const heatmapData = useMemo(() => {
    if (!activeHeatmapPoints.length) return { points: [], ranked: [] }
    const grouped = new Map()
    activeHeatmapPoints.forEach((point) => {
      if (!point.lat || !point.lng) return
      const lat = roundCoordinate(point.lat, mapPrecision)
      const lng = roundCoordinate(point.lng, mapPrecision)
      const timestamp = point.created_at || point.updated_at
      const bucket = timestamp
        ? getTimeBucket(getJakartaHour(new Date(timestamp)))
        : currentBucket
      const incomeFactor = heatmapGoal === 'order' ? 1 : (incomeFactors[bucket.id] ?? 1)
      const netPerHour = incomeStats[bucket.id]?.perHour ?? overallNetPerHour
      const candidates = bucketPoints.get(bucket.id) || []
      const deadheadPenalty = heatmapGoal === 'order'
        ? 1
        : getDeadheadPenalty({
          point: { lat, lng },
          candidates,
          radiusKm: Number(deadheadRadiusKm) || 3,
          costPerKm: Number(deadheadCostPerKm) || 2000,
          netPerHour,
          fallbackNetPerHour: overallNetPerHour || 20000,
        })
      const key = `${lat}:${lng}`
      const intensity = Number.isFinite(point.intensity) ? point.intensity : 0.7
      const entry = grouped.get(key) || {
        lat,
        lng,
        sum: 0,
        count: 0,
        incomeSum: 0,
        deadheadSum: 0,
      }
      entry.sum += intensity
      entry.count += 1
      entry.incomeSum += incomeFactor
      entry.deadheadSum += deadheadPenalty
      grouped.set(key, entry)
    })

    const scored = Array.from(grouped.values()).map((cell) => {
      const avgIntensity = cell.sum / cell.count
      const avgIncome = cell.incomeSum / cell.count
      const avgDeadhead = cell.deadheadSum / cell.count
      const confidence = getConfidenceModifier(cell.count)
      const effectiveTimeModifier = heatmapGoal === 'order' ? 1 : timeModifier
      const distanceKm = liveLocation
        ? getDistanceKm({ lat: liveLocation.lat, lng: liveLocation.lng }, { lat: cell.lat, lng: cell.lng })
        : null
      const distancePenalty = liveLocation
        ? getDistancePenalty({ distanceKm, radiusKm: distancePenaltyKm })
        : 1
      const score =
        avgIntensity *
        avgIncome *
        avgDeadhead *
        effectiveTimeModifier *
        weatherModifier *
        holidayModifier *
        confidence *
        distancePenalty
      return { ...cell, score, distanceKm }
    })

    const maxScore = Math.max(...scored.map((cell) => cell.score), 0)
    const points = scored.map((cell) => [
      cell.lat,
      cell.lng,
      Math.min(1, Math.max(0.25, maxScore ? cell.score / maxScore : 0.4) * heatmapIntensity),
    ])
    const ranked = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    return { points, ranked }
  }, [
    activeHeatmapPoints,
    mapPrecision,
    deadheadCostPerKm,
    deadheadRadiusKm,
    incomeFactors,
    incomeStats,
    overallNetPerHour,
    bucketPoints,
    currentBucket,
    heatmapGoal,
    heatmapIntensity,
    timeModifier,
    weatherModifier,
    holidayModifier,
    liveLocation,
    distancePenaltyKm,
  ])

  const rankedWithDistance = useMemo(() => heatmapData.ranked, [heatmapData.ranked])

  const updateSettings = async (values) => {
    try {
      await saveSettings(values)
    } catch {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    }
  }

  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current)
    }
    controlsTimerRef.current = null
  }, [])

  const resetControlsTimer = useCallback(() => {
    if (!controlsOpen) return
    clearControlsTimer()
    controlsTimerRef.current = setTimeout(() => {
      setControlsOpen(false)
      updateSettings({ heatmapControlsOpen: false })
    }, 6000)
  }, [clearControlsTimer, controlsOpen, updateSettings])

  useEffect(() => {
    if (controlsOpen) {
      resetControlsTimer()
    } else {
      clearControlsTimer()
    }
    return clearControlsTimer
  }, [controlsOpen, resetControlsTimer, clearControlsTimer])

  const handleControlsToggle = async () => {
    const nextOpen = !controlsOpen
    setControlsOpen(nextOpen)
    await updateSettings({ heatmapControlsOpen: nextOpen })
  }

  const handleToggleLiveLocation = async () => {
    const nextEnabled = !liveLocationEnabled
    const nextFollow = nextEnabled ? followMe : false
    setLiveLocationEnabled(nextEnabled)
    setFollowMe(nextFollow)
    await updateSettings({ liveLocationEnabled: nextEnabled, followMe: nextFollow })
  }

  const handleToggleFollowMe = async () => {
    const nextFollow = !followMe
    const nextEnabled = nextFollow ? true : liveLocationEnabled
    setFollowMe(nextFollow)
    setLiveLocationEnabled(nextEnabled)
    await updateSettings({ followMe: nextFollow, liveLocationEnabled: nextEnabled })
  }

  const handleHeatmapGoalChange = async (goal) => {
    const nextGoal = goal === 'economy' ? 'economy' : 'order'
    setHeatmapGoal(nextGoal)
    await updateSettings({ heatmapGoal: nextGoal })
  }

  const handleWeatherToggle = async (enabled) => {
    const next = Boolean(enabled)
    setUseWeather(next)
    await updateSettings({ useWeather: next })
  }

  const handleCurrentHourToggle = async (enabled) => {
    const next = Boolean(enabled)
    setUseCurrentHour(next)
    await updateSettings({ useCurrentHour: next })
  }

  const handleDistancePenaltyChange = async (value) => {
    const next = Number(value)
    const safe = Number.isFinite(next) && next > 0 ? next : 3
    setDistancePenaltyKm(safe)
    await updateSettings({ distancePenaltyKm: safe })
  }

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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pemasukan Hari Ini"
          value={formatCurrency(summary.totalIncomeToday)}
          caption={`7 hari: ${formatCurrency(summary.totalIncomeWeek)}`}
          accent="text-sunrise-300"
        />
        <StatCard
          title="Pengeluaran Hari Ini"
          value={formatCurrency(summary.totalExpenseToday)}
          caption={`7 hari: ${formatCurrency(summary.totalExpenseWeek)}`}
          accent="text-rose-200"
        />
        <StatCard
          title="Neto Hari Ini"
          value={formatCurrency(summary.netToday)}
          caption="Setelah pengeluaran"
          accent="text-teal-200"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/catat?tab=income" className="btn-primary">
          + Pemasukan
        </Link>
        <Link to="/catat?tab=expense" className="btn-outline">
          + Pengeluaran
        </Link>
      </div>

      <SectionCard title="Peta Panas">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
        <div
          className="relative isolate z-0 h-80 overflow-hidden rounded-2xl border border-white/10"
          onPointerDown={resetControlsTimer}
          onTouchStart={resetControlsTimer}
        >
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <UserLocationLayer location={liveLocation} followMe={followMe} />
            <HeatmapLayer points={heatmapData.points} highContrast={highContrastHeatmap} />
          </MapContainer>
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
            <div className="rounded-2xl border border-white/10 bg-night-950/95 px-3 py-2 text-xs font-semibold text-white/80 shadow-lg">
              Peta Panas
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-night-950/95 px-3 py-2 text-xs font-semibold text-white/80 shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </button>
              <span className="rounded-2xl border border-white/10 bg-night-950/95 px-3 py-2 text-xs font-semibold text-white/70 shadow-lg">
                Bandung
              </span>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleControlsToggle}
              className="rounded-2xl border border-white/10 bg-night-950/95 px-3 py-2 text-xs font-semibold text-white/80 shadow-lg"
              aria-expanded={controlsOpen}
            >
              {controlsOpen ? 'Sembunyikan' : 'Tampilkan'} Kontrol
            </button>
            {controlsOpen ? (
              <div
                className="w-48 space-y-2 rounded-3xl border border-white/10 bg-night-950/95 p-3 shadow-lg"
                onPointerDown={resetControlsTimer}
                onKeyDown={resetControlsTimer}
              >
                <SegmentedControl
                  options={[
                    { value: 'order', label: 'Order' },
                    { value: 'economy', label: 'Untung' },
                  ]}
                  value={heatmapGoal}
                  onChange={handleHeatmapGoalChange}
                  size="sm"
                />
                <SegmentedControl
                  options={[
                    { value: 'current', label: 'Sekarang' },
                    { value: 'all', label: 'Bebas' },
                  ]}
                  value={useCurrentHour ? 'current' : 'all'}
                  onChange={(value) => handleCurrentHourToggle(value === 'current')}
                  size="sm"
                />
                <SegmentedControl
                  options={[
                    { value: 'on', label: 'Cuaca On' },
                    { value: 'off', label: 'Cuaca Off' },
                  ]}
                  value={useWeather ? 'on' : 'off'}
                  onChange={(value) => handleWeatherToggle(value === 'on')}
                  size="sm"
                />
                <SegmentedControl
                  options={[
                    { value: 7, label: '7 Hari' },
                    { value: 30, label: '30 Hari' },
                  ]}
                  value={rangeDays}
                  onChange={setRangeDays}
                  size="sm"
                />
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between text-[11px] text-white/70">
                    <span>Radius</span>
                    <span>{Number(distancePenaltyKm).toFixed(1)} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={distancePenaltyKm}
                    onChange={(event) => handleDistancePenaltyChange(event.target.value)}
                    className="mt-2 w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="absolute right-3 top-24 z-10 flex flex-col gap-2">
            <button
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-night-950/95 text-white/80 shadow-lg ${liveLocationEnabled ? 'bg-sky-400/30 text-sky-100' : ''}`}
              onClick={handleToggleLiveLocation}
              aria-label="Lokasi"
              title="Lokasi"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-night-950/95 text-white/80 shadow-lg ${followMe ? 'bg-sky-400/30 text-sky-100' : ''}`}
              onClick={handleToggleFollowMe}
              aria-label="Ikuti saya"
              title="Ikuti saya"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" />
              </svg>
            </button>
          </div>
          {locationStatus !== 'idle' ? (
            <div className="absolute right-3 top-16 z-[999]">
              {locationStatus === 'loading' ? (
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70 shadow-lg transition-all duration-300 ease-out">
                  Lokasi memuat
                </span>
              ) : null}
              {locationStatus === 'error' ? (
                <span className="rounded-full border border-rose-400/30 bg-rose-400/20 px-3 py-1 text-[11px] font-semibold text-rose-100 shadow-lg transition-all duration-300 ease-out">
                  Lokasi gagal
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="absolute bottom-3 left-3 z-10 rounded-2xl border border-white/10 bg-night-950/95 px-3 py-2 shadow-lg">
            <p className="text-[11px] text-white/60">Legend</p>
            <div className="mt-2 h-2 w-24 rounded-full bg-gradient-to-r from-[#ffd6a3] via-[#ff8a2b] to-[#4fe1c7]" />
            <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
              <span>Rendah</span>
              <span>Tinggi</span>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="soft-border rounded-2xl px-4 py-3">
            <p className="text-xs text-white/60">Rekomendasi cepat</p>
            {rankedWithDistance.length ? (
              <div className="mt-2 space-y-2">
                {rankedWithDistance.map((cell, index) => (
                  <div key={`${cell.lat}-${cell.lng}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{index + 1} • {cell.lat.toFixed(mapPrecision)}, {cell.lng.toFixed(mapPrecision)}
                      </p>
                      <p className="text-xs text-white/50">
                        {useCurrentHour
                          ? 'Sering order di jam ini'
                          : `Padat dalam ${rangeDays} hari`} • {cell.count} riwayat
                        {liveLocation && Number.isFinite(cell.distanceKm)
                          ? ` • ${cell.distanceKm.toFixed(1)} km dari kamu`
                          : ''}
                      </p>
                    </div>
                    <span className="pill bg-white/10 text-white/70">{cell.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/50">
                Belum ada data yang cukup untuk rekomendasi.
              </p>
            )}
            {!liveLocation ? (
              <p className="mt-2 text-xs text-white/50">
                Aktifkan lokasi untuk lihat jarak ke spot.
              </p>
            ) : null}
          </div>
          <div className="soft-border rounded-2xl px-4 py-3">
            <p className="text-xs text-white/60">Mode</p>
            <p className="mt-2 text-sm text-white">
              {heatmapGoal === 'order' ? 'Potensi Order' : 'Potensi Untung'}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {useCurrentHour ? `Bucket ${currentBucket.label}` : 'Semua jam'} • {rangeDays} hari
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/60">
          {heatmapGoal === 'order'
            ? `Filter: ${useCurrentHour ? `Bucket ${currentBucket.label}` : 'Semua jam'} • ${rangeDays} hari • Radius ${Number(distancePenaltyKm).toFixed(1)} km`
            : `${weatherSummary} • ${holidaySummary} • Radius ${Number(distancePenaltyKm).toFixed(1)} km`}
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
