const ConfirmDialog = ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 md:items-center">
      <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {message ? <p className="mt-1 text-xs text-white/60">{message}</p> : null}
          </div>
          <span className="pill bg-white/10 text-[11px] text-white/70">Konfirmasi</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
