import { useCallback, useMemo, useState } from 'react'
import ToastStack from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import AlertContext from './alertContext'

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const AlertProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Lanjutkan',
    cancelLabel: 'Batal',
    onConfirm: null,
    onCancel: null,
  })

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 2400 }) => {
      const id = createId()
      setToasts((prev) => [...prev, { id, title, message, type }])
      if (duration) {
        setTimeout(() => dismissToast(id), duration)
      }
    },
    [dismissToast]
  )

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const handleClose = () => {
        setConfirmState((prev) => ({ ...prev, open: false }))
      }

      setConfirmState({
        open: true,
        title: options.title || 'Konfirmasi',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Ya, lanjut',
        cancelLabel: options.cancelLabel || 'Batal',
        onConfirm: () => {
          handleClose()
          resolve(true)
        },
        onCancel: () => {
          handleClose()
          resolve(false)
        },
      })
    })
  }, [])

  const value = useMemo(() => ({ showToast, confirm }), [showToast, confirm])

  return (
    <AlertContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </AlertContext.Provider>
  )
}
