import { useContext } from 'react'
import SyncContext from './syncContext'

export const useSync = () => {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within SyncProvider')
  }
  return context
}
