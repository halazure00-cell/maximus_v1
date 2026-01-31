import { getDb } from './db'
import { createId, nowIso, roundCoordinate } from './utils'
import { DEFAULT_SETTINGS } from './constants'
import { emit } from './events'

export const listRecords = async (storeName, { includeDeleted = false } = {}) => {
  const db = await getDb()
  const records = await db.getAll(storeName)
  return includeDeleted
    ? records
    : records.filter((record) => !record.deleted_at)
}

export const getRecord = async (storeName, id) => {
  const db = await getDb()
  return db.get(storeName, id)
}

export const upsertRecord = async (storeName, payload) => {
  const db = await getDb()
  const record = {
    ...payload,
    updated_at: payload.updated_at || nowIso(),
  }
  await db.put(storeName, record)
  emit({ type: 'upsert', storeName, record })
  return record
}

export const createRecord = async (storeName, values, userId) => {
  const base = nowIso()
  const record = {
    id: createId(),
    user_id: userId,
    created_at: base,
    updated_at: base,
    deleted_at: null,
    sync_status: 'pending',
    ...values,
  }
  return upsertRecord(storeName, record)
}

export const updateRecord = async (storeName, id, values) => {
  const current = await getRecord(storeName, id)
  if (!current) return null
  const record = {
    ...current,
    ...values,
    updated_at: nowIso(),
    sync_status: 'pending',
  }
  return upsertRecord(storeName, record)
}

export const softDeleteRecord = async (storeName, id) => {
  const current = await getRecord(storeName, id)
  if (!current) return null
  const record = {
    ...current,
    deleted_at: nowIso(),
    sync_status: 'pending',
  }
  return upsertRecord(storeName, record)
}

export const getSettings = async () => {
  const db = await getDb()
  const stored = await db.get('settings', DEFAULT_SETTINGS.id)
  return stored || DEFAULT_SETTINGS
}

export const saveSettings = async (values) => {
  const current = await getSettings()
  return upsertRecord('settings', {
    ...current,
    ...values,
    id: DEFAULT_SETTINGS.id,
  })
}

export const addHeatmapPoint = async (values, precision = 4) => {
  const roundedLat = roundCoordinate(values.lat, precision)
  const roundedLng = roundCoordinate(values.lng, precision)
  return createRecord('heatmap_points', {
    ...values,
    lat: roundedLat,
    lng: roundedLng,
  }, values.user_id)
}
