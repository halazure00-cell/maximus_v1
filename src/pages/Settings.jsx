import { useAuth } from '../context/useAuth'
import { useSync } from '../context/useSync'
import { formatDateTime } from '../lib/formatters'
import { useAlert } from '../context/useAlert'

const Settings = () => {
  const { user, signOut } = useAuth()
  const { status, lastSyncAt } = useSync()
  const { confirm } = useAlert()

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

      <div className="glass rounded-3xl p-5 space-y-3">
        <button className="btn-outline w-full border-rose-300/30 text-rose-100" onClick={handleSignOut}>
          Keluar
        </button>
      </div>
    </div>
  )
}

export default Settings
