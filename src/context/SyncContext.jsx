import { useCallback, useEffect, useMemo, useState } from 'react'
import { syncAll } from '../lib/syncEngine'
import { getSettings } from '../lib/localStore'
import { useAuth } from './useAuth'
import SyncContext from './syncContext'

export const SyncProvider = ({ children }) => {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [lastResult, setLastResult] = useState({ pushed: 0, pulled: 0 })
  const [error, setError] = useState(null)

  const runSync = useCallback(async () => {
    if (!user) return
    if (!navigator.onLine) return
    setStatus('syncing')
    setError(null)
    try {
      const result = await syncAll(user.id)
      const settings = await getSettings()
      setLastSyncAt(settings.lastSyncAt)
      setLastResult(result)
      setStatus('idle')
    } catch (err) {
      setError(err?.message || 'Gagal sinkron')
      setStatus('error')
    }
  }, [user])

  useEffect(() => {
    const init = async () => {
      const settings = await getSettings()
      setLastSyncAt(settings.lastSyncAt)
    }
    init()
  }, [])

  useEffect(() => {
    if (!user) return
    const timeout = setTimeout(() => runSync(), 0)
    const handleOnline = () => runSync()
    const interval = setInterval(() => runSync(), 5 * 60 * 1000)
    window.addEventListener('online', handleOnline)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [user, runSync])

  const value = useMemo(
    () => ({
      status,
      lastSyncAt,
      lastResult,
      error,
      runSync,
    }),
    [status, lastSyncAt, lastResult, error, runSync]
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
