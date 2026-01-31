export const nowIso = () => new Date().toISOString()

export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const createId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

export const roundCoordinate = (value, precision = 4) => {
  if (value === null || value === undefined) return value
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
