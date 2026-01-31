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
  const [saving, setSaving] = useState(false)
  const { showToast, confirm } = useAlert()

  useEffect(() => {
    const load = async () => {
      const settings = await getSettings()
      setPrecision(settings.mapPrecision || 4)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings({ mapPrecision: Number(precision) })
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
      <div className="glass rounded-3xl p-5">
        <h2 className="section-title">Profil</h2>
        <p className="mt-2 text-sm text-white/60">{user?.email}</p>
        <button className="btn-outline mt-4" onClick={handleSignOut}>
          Keluar
        </button>
      </div>

      <div className="glass rounded-3xl p-5">
        <h2 className="section-title">Sinkronisasi</h2>
        <p className="mt-2 text-xs text-white/60">
          Status: {status === 'syncing' ? 'Sinkron...' : 'Siap'}
        </p>
        <p className="text-xs text-white/60">
          Terakhir: {lastSyncAt ? formatDateTime(lastSyncAt) : 'Belum pernah'}
        </p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-3">
        <h2 className="section-title">Privasi Peta</h2>
        <p className="text-xs text-white/60">
          Atur tingkat pembulatan koordinat sebelum disimpan.
        </p>
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
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}

export default Settings
