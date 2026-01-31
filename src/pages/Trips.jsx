import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEntityList } from '../lib/hooks/useEntityList'
import { addHeatmapPoint, createRecord, getSettings } from '../lib/localStore'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { toNumber } from '../lib/utils'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import { useAlert } from '../context/AlertContext'

const Trips = () => {
  const { user } = useAuth()
  const { items: trips } = useEntityList('trips')
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    fare: '',
    distance: '',
    date: new Date().toISOString().slice(0, 16),
    lat: '',
    lng: '',
  })
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [precision, setPrecision] = useState(4)
  const [showCoords, setShowCoords] = useState(false)
  const { showToast } = useAlert()

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings()
      setPrecision(settings.mapPrecision || 4)
    }
    load()
  }, [])

  const updateField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Perangkat tidak mendukung lokasi')
      showToast({ title: 'Lokasi', message: 'Perangkat tidak mendukung GPS.', type: 'error' })
      return
    }
    setLocationStatus('Mengambil lokasi...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }))
        setLocationStatus('Lokasi tersimpan')
        setShowCoords(true)
        showToast({ title: 'Lokasi', message: 'Koordinat tersimpan.', type: 'success' })
      },
      () => {
        setLocationStatus('Gagal mengambil lokasi')
        showToast({ title: 'Lokasi', message: 'Gagal mengambil lokasi.', type: 'error' })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const record = await createRecord(
        'trips',
        {
          origin: form.origin,
          destination: form.destination,
          fare: toNumber(form.fare),
          distance: toNumber(form.distance),
          date: form.date,
          location_lat: form.lat ? Number(form.lat) : null,
          location_lng: form.lng ? Number(form.lng) : null,
        },
        user.id
      )

      if (form.lat && form.lng) {
        await addHeatmapPoint(
          {
            user_id: user.id,
            trip_id: record.id,
            lat: Number(form.lat),
            lng: Number(form.lng),
            intensity: 0.7,
          },
          precision
        )
      }

      setForm({
        origin: '',
        destination: '',
        fare: '',
        distance: '',
        date: new Date().toISOString().slice(0, 16),
        lat: '',
        lng: '',
      })
      setLocationStatus('')
      setShowCoords(false)
      showToast({ title: 'Trip tersimpan', message: 'Perjalanan berhasil dicatat.', type: 'success' })
    } catch (error) {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Catat Trip</h2>
          <span className="pill bg-white/10 text-[11px] text-white/70">Cepat</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Asal" value={form.origin} onChange={updateField('origin')} required />
          <InputField label="Tujuan" value={form.destination} onChange={updateField('destination')} required />
          <InputField
            label="Tarif (Rp)"
            type="number"
            inputMode="numeric"
            value={form.fare}
            onChange={updateField('fare')}
          />
          <InputField
            label="Jarak (km)"
            type="number"
            inputMode="decimal"
            value={form.distance}
            onChange={updateField('distance')}
          />
          <InputField
            label="Waktu"
            type="datetime-local"
            value={form.date}
            onChange={updateField('date')}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            className="btn-outline border-sunrise-300/40 text-sunrise-200"
            onClick={captureLocation}
          >
            Ambil Lokasi GPS
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Trip'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/60">Koordinat opsional</p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowCoords((prev) => !prev)}
          >
            {showCoords ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>

        {showCoords ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Latitude" value={form.lat} onChange={updateField('lat')} />
            <InputField label="Longitude" value={form.lng} onChange={updateField('lng')} />
          </div>
        ) : null}

        {locationStatus ? <p className="text-xs text-white/60">{locationStatus}</p> : null}
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Riwayat Trip</h2>
        {trips.length === 0 ? (
          <EmptyState
            title="Belum ada trip"
            description="Mulai catat perjalanan pertama kamu hari ini."
          />
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} className="soft-border rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-white/60">{formatDateTime(trip.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-sunrise-300">
                    {formatCurrency(trip.fare || 0)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  {trip.distance ? `${trip.distance} km` : 'Jarak belum diisi'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Trips
