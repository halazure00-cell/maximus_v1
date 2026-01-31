import { useSync } from '../context/useSync'
import { formatDateTime } from '../lib/formatters'
import { useAlert } from '../context/useAlert'

const SyncBanner = () => {
  const { status, lastSyncAt, lastResult, error, runSync } = useSync()
  const { showToast } = useAlert()

  const handleSync = async () => {
    if (status === 'syncing') return
    showToast({ title: 'Sinkronisasi', message: 'Mengirim & menarik data terbaru.', type: 'info' })
    await runSync()
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-night-900/80 px-4 py-4 text-sm text-white/80 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">Sinkronisasi</p>
        <p className="text-xs text-white/60">
          Terakhir: {lastSyncAt ? formatDateTime(lastSyncAt) : 'Belum pernah'} ·
          Masuk {lastResult.pulled} · Keluar {lastResult.pushed}
        </p>
        {error ? <p className="text-xs text-sunrise-300">{error}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="pill bg-white/10 text-[11px]">
          {navigator.onLine ? 'Online' : 'Offline'}
        </span>
        <button
          className="btn-outline"
          onClick={handleSync}
          disabled={status === 'syncing'}
        >
          {status === 'syncing' ? 'Menyinkron...' : 'Sinkron Sekarang'}
        </button>
      </div>
    </div>
  )
}

export default SyncBanner
