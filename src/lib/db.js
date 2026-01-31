import { openDB } from 'idb'
import { ENTITY_STORES } from './constants'

const DB_NAME = 'asisten-taksi-db'
const DB_VERSION = 1

export const getDb = async () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      ENTITY_STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          store.createIndex('updated_at', 'updated_at')
          store.createIndex('user_id', 'user_id')
          store.createIndex('deleted_at', 'deleted_at')
        }
      })
    },
  })
