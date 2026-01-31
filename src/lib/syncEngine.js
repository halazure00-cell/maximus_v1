import { supabase } from './supabaseClient'
import { ENTITY_STORES } from './constants'
import {
  getSettings,
  listRecords,
  saveSettings,
  upsertRecord,
} from './localStore'

const normalizeRemote = (record) => ({
  ...record,
  sync_status: 'synced',
})

const stripLocalFields = (record) => {
  const { sync_status, ...rest } = record
  return rest
}

const pushPending = async (storeName, userId) => {
  const records = await listRecords(storeName, { includeDeleted: true })
  const pending = records.filter(
    (record) => record.sync_status === 'pending' && record.user_id === userId
  )
  if (!pending.length) return 0

  const payload = pending.map(stripLocalFields)
  const { error } = await supabase
    .from(storeName)
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    throw error
  }

  await Promise.all(
    pending.map((record) =>
      upsertRecord(storeName, {
        ...record,
        sync_status: 'synced',
      })
    )
  )
  return pending.length
}

const pullRemote = async (storeName, userId, since) => {
  let query = supabase
    .from(storeName)
    .select('*')
    .eq('user_id', userId)

  if (since) {
    query = query.gte('updated_at', since)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  if (!data?.length) return 0

  await Promise.all(
    data.map((record) => upsertRecord(storeName, normalizeRemote(record)))
  )

  return data.length
}

export const syncAll = async (userId) => {
  const settings = await getSettings()
  const since = settings.lastSyncAt
  let pushed = 0
  let pulled = 0

  for (const storeName of ENTITY_STORES) {
    if (storeName === 'settings') continue
    pushed += await pushPending(storeName, userId)
    pulled += await pullRemote(storeName, userId, since)
  }

  await saveSettings({ lastSyncAt: new Date().toISOString() })

  return { pushed, pulled }
}
