const toastStyles = {
  success: 'border-emerald-400/30 text-emerald-200',
  error: 'border-rose-400/30 text-rose-200',
  warning: 'border-amber-400/30 text-amber-200',
  info: 'border-white/15 text-white/90',
}

const ToastIcon = ({ type }) => {
  if (type === 'success') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9.2 16.2 5.7 12.7l1.4-1.4 2.1 2.1 7-7 1.4 1.4-8.4 8.4Z"
        />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 1 21h22L12 2Zm0 6.8 1 6.2h-2l1-6.2Zm0 10.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z"
        />
      </svg>
    )
  }
  if (type === 'warning') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 1 21h22L12 2Zm0 6.8 1 6.2h-2l1-6.2Zm0 10.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 14h-2v-6h2v6Zm0-8h-2V6h2v2Z"
      />
    </svg>
  )
}

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-3 md:bottom-6 md:left-auto md:right-6 md:max-w-sm" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-glow ${
            toastStyles[toast.type] || toastStyles.info
          }`}
        >
          <span className="mt-0.5">{toast.type ? <ToastIcon type={toast.type} /> : null}</span>
          <div className="flex-1 text-sm">
            {toast.title ? <p className="font-semibold text-white">{toast.title}</p> : null}
            {toast.message ? <p className="text-xs text-white/70">{toast.message}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-xs text-white/50 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
