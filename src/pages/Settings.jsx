import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSync } from '../context/SyncContext'
import { getSettings, saveSettings } from '../lib/localStore'
import { formatDateTime } from '../lib/formatters'
import { useAlert } from '../context/AlertContext'

const Settings = () => {
  const { user, signOut } = useAuth()
  const { status, lastSyncAt } = useSync()
  const [precision, setPrecision] = useState(4)
  const [deadheadCostPerKm, setDeadheadCostPerKm] = useState(2000)
  const [deadheadRadiusKm, setDeadheadRadiusKm] = useState(3)
  const [heatmapGoal, setHeatmapGoal] = useState('order')
  const [useCurrentHour, setUseCurrentHour] = useState(true)
  const [highContrastHeatmap, setHighContrastHeatmap] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState(1)
  const [liveLocationEnabled, setLiveLocationEnabled] = useState(false)
  const [followMe, setFollowMe] = useState(false)
  const [useWeather, setUseWeather] = useState(true)
  const [useHoliday, setUseHoliday] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast, confirm } = useAlert()

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings()
      setPrecision(settings.mapPrecision || 4)
      setDeadheadCostPerKm(settings.deadheadCostPerKm ?? 2000)
      setDeadheadRadiusKm(settings.deadheadRadiusKm ?? 3)
      setHeatmapGoal(settings.heatmapGoal || 'order')
      setUseCurrentHour(settings.useCurrentHour ?? true)
      setHighContrastHeatmap(settings.highContrastHeatmap ?? false)
      setHeatmapIntensity(settings.heatmapIntensity ?? 1)
      setLiveLocationEnabled(settings.liveLocationEnabled ?? false)
      setFollowMe(settings.followMe ?? false)
      setUseWeather(settings.useWeather ?? true)
      setUseHoliday(settings.useHoliday ?? true)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsedCost = Number(deadheadCostPerKm)
      const parsedRadius = Number(deadheadRadiusKm)
      const nextCost = Number.isFinite(parsedCost) && parsedCost >= 0 ? parsedCost : 2000
      const nextRadius = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 3
      const nextIntensity = Number.isFinite(Number(heatmapIntensity))
        ? Number(heatmapIntensity)
        : 1
      const nextGoal = heatmapGoal === 'economy' ? 'economy' : 'order'
      const nextUseCurrent = Boolean(useCurrentHour)
      const nextHighContrast = Boolean(highContrastHeatmap)
      const nextLiveLocation = Boolean(liveLocationEnabled) || Boolean(followMe)
      const nextFollowMe = Boolean(followMe)
      const nextUseWeather = Boolean(useWeather)
      const nextUseHoliday = Boolean(useHoliday)
      await saveSettings({
        mapPrecision: Number(precision),
        deadheadCostPerKm: nextCost,
        deadheadRadiusKm: nextRadius,
        heatmapGoal: nextGoal,
        useCurrentHour: nextUseCurrent,
        highContrastHeatmap: nextHighContrast,
        heatmapIntensity: nextIntensity,
        liveLocationEnabled: nextLiveLocation,
        followMe: nextFollowMe,
        useWeather: nextUseWeather,
        useHoliday: nextUseHoliday,
      })
      setDeadheadCostPerKm(nextCost)
      setDeadheadRadiusKm(nextRadius)
      setHeatmapGoal(nextGoal)
      setUseCurrentHour(nextUseCurrent)
      setHighContrastHeatmap(nextHighContrast)
      setHeatmapIntensity(nextIntensity)
      setLiveLocationEnabled(nextLiveLocation)
      setFollowMe(nextFollowMe)
      setUseWeather(nextUseWeather)
      setUseHoliday(nextUseHoliday)
      showToast({ title: 'Pengaturan tersimpan', message: 'Preferensi peta diperbarui.', type: 'success' })
    } catch (error) {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Keluar aplikasi?',
      message: 'Pastikan data sudah tersinkron sebelum keluar.',
      confirmLabel: 'Ya, keluar',
      cancelLabel: 'Batal',
    })
    if (ok) {
      signOut()
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5 space-y-4">
        <div>
          <h2 className="section-title">Akun & Sinkronisasi</h2>
          <p className="mt-2 text-sm text-white/60">{user?.email}</p>
        </div>
        <div className="soft-border rounded-2xl px-4 py-3">
          <p className="text-xs text-white/60">
            Status: {status === 'syncing' ? 'Sinkron...' : 'Siap'}
          </p>
          <p className="text-xs text-white/60">
            Terakhir: {lastSyncAt ? formatDateTime(lastSyncAt) : 'Belum pernah'}
          </p>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 space-y-4">
        <div>
          <h2 className="section-title">Pengaturan Dasar</h2>
          <p className="text-xs text-white/60">
            Atur pembulatan koordinat sebelum disimpan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="2"
            max="6"
            value={precision}
            onChange={(event) => setPrecision(event.target.value)}
            className="w-full"
          />
          <span className="pill bg-white/10 text-white/70">{precision} digit</span>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white/90">
            Pengaturan Lanjutan
            <span className="pill bg-white/10 text-white/70 group-open:bg-white/20">Buka</span>
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="soft-border rounded-2xl p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Mode Heatmap</h3>
                <p className="text-xs text-white/60">Atur fokus rekomendasi dan waktu.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Potensi Untung</p>
                  <p className="text-xs text-white/50">Matikan untuk potensi order.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={heatmapGoal === 'economy'}
                    onChange={(event) => setHeatmapGoal(event.target.checked ? 'economy' : 'order')}
                  />
                  <span className="h-6 w-11 rounded-full bg-white/10 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white/70 after:transition peer-checked:bg-teal-400/40 peer-checked:after:translate-x-5" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Sekarang</p>
                  <p className="text-xs text-white/50">Gunakan bucket waktu saat ini.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={useCurrentHour}
                    onChange={() => setUseCurrentHour((prev) => !prev)}
                  />
                  <span className="h-6 w-11 rounded-full bg-white/10 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white/70 after:transition peer-checked:bg-white/30 peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            <div className="soft-border rounded-2xl p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Visualisasi</h3>
                <p className="text-xs text-white/60">Sesuaikan tampilan heatmap.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Kontras tinggi</p>
                  <p className="text-xs text-white/50">Warna lebih tegas di peta.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={highContrastHeatmap}
                    onChange={() => setHighContrastHeatmap((prev) => !prev)}
                  />
                  <span className="h-6 w-11 rounded-full bg-white/10 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white/70 after:transition peer-checked:bg-amber-300/40 peer-checked:after:translate-x-5" />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">Intensitas</p>
                  <span className="text-xs text-white/60">x{Number(heatmapIntensity).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={heatmapIntensity}
                  onChange={(event) => setHeatmapIntensity(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </div>
            </div>

            <div className="soft-border rounded-2xl p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Lokasi</h3>
                <p className="text-xs text-white/60">Kelola pelacakan posisi.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Lokasi realtime</p>
                  <p className="text-xs text-white/50">Aktifkan GPS saat dibutuhkan.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={liveLocationEnabled}
                    onChange={() => setLiveLocationEnabled((prev) => !prev)}
                  />
                  <span className="h-6 w-11 rounded-full bg-white/10 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white/70 after:transition peer-checked:bg-sky-400/40 peer-checked:after:translate-x-5" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Ikuti saya</p>
                  <p className="text-xs text-white/50">Peta mengikuti posisi.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={followMe}
                    onChange={() => setFollowMe((prev) => !prev)}
                  />
                  <span className="h-6 w-11 rounded-full bg-white/10 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white/70 after:transition peer-checked:bg-sky-400/40 peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            <div className="soft-border rounded-2xl p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Ekonomi</h3>
                <p className="text-xs text-white/60">Pengaturan biaya rekomendasi.</p>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-white/60">
                  Biaya deadhead (Rp/km)
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={deadheadCostPerKm}
                    onChange={(event) => setDeadheadCostPerKm(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-white/60">
                  Radius rekomendasi (km)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    step="0.5"
                    value={deadheadRadiusKm}
                    onChange={(event) => setDeadheadRadiusKm(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                  />
                </label>
              </div>
            </div>
          </div>
        </details>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
        <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        <button className="btn-outline w-full border-rose-300/30 text-rose-100" onClick={handleSignOut}>
          Keluar
        </button>
      </div>
    </div>
  )
}

export default Settings
