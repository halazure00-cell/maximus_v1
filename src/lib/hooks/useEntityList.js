import { useEffect, useState } from 'react'
import { listRecords } from '../localStore'
import { subscribe } from '../events'

export const useEntityList = (storeName) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const records = await listRecords(storeName)
    const sorted = records.sort((a, b) =>
      (b.updated_at || '').localeCompare(a.updated_at || '')
    )
    setItems(sorted)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const unsub = subscribe((event) => {
      if (event.storeName === storeName) {
        refresh()
      }
    })
    return unsub
  }, [storeName])

  return { items, loading, refresh }
}
