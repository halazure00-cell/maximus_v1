const WEATHER_CACHE_MS = 20 * 60 * 1000
const HOLIDAY_CACHE_MS = 7 * 24 * 60 * 60 * 1000
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const HOLIDAY_ENDPOINT = 'https://date.nager.at/api/v3/PublicHolidays'
const DEFAULT_DEADHEAD_COST_PER_KM = 2000
const DEFAULT_DEADHEAD_RADIUS_KM = 3

export const TIME_BUCKETS = [
  { id: 0, label: '00-05', start: 0, end: 5 },
  { id: 1, label: '06-10', start: 6, end: 10 },
  { id: 2, label: '11-15', start: 11, end: 15 },
  { id: 3, label: '16-20', start: 16, end: 20 },
  { id: 4, label: '21-23', start: 21, end: 23 },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const getJakartaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

export const getJakartaHour = (date = new Date()) =>
  Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    }).format(date)
  )

export const getTimeBucket = (hour) =>
  TIME_BUCKETS.find((bucket) => hour >= bucket.start && hour <= bucket.end) ||
  TIME_BUCKETS[0]

export const getBucketHours = (bucket) => bucket.end - bucket.start + 1

const parseDateSafe = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const buildIncomeBucketStats = ({ earnings = [], expenses = [] }) => {
  const stats = TIME_BUCKETS.map((bucket) => ({
    net: 0,
    count: 0,
    hours: getBucketHours(bucket),
    perHour: 0,
  }))

  const addValue = (value, when) => {
    const parsed = parseDateSafe(when)
    if (!parsed) return
    const bucket = getTimeBucket(getJakartaHour(parsed))
    const entry = stats[bucket.id]
    entry.net += value
    entry.count += 1
  }

  earnings.forEach((item) => {
    const amount = Number(item.amount || 0)
    addValue(amount, item.date)
  })

  expenses.forEach((item) => {
    const amount = Number(item.amount || 0)
    addValue(-amount, item.date)
  })

  stats.forEach((entry) => {
    entry.perHour = entry.hours ? entry.net / entry.hours : 0
  })

  return stats
}

export const getNetIncomeFactors = (bucketStats) => {
  const active = bucketStats.filter((entry) => entry.count > 0 || entry.net !== 0)
  const totalNet = active.reduce((sum, entry) => sum + entry.net, 0)
  const totalHours = active.reduce((sum, entry) => sum + entry.hours, 0)
  const overallPerHour = totalHours ? totalNet / totalHours : 0

  return bucketStats.map((entry) => {
    if (!overallPerHour) return 1
    const perHour = Math.max(0, entry.perHour)
    const factor = perHour / overallPerHour
    return clamp(factor, 0.75, 1.35)
  })
}

export const getOverallNetPerHour = (bucketStats) => {
  const active = bucketStats.filter((entry) => entry.count > 0 || entry.net !== 0)
  const totalNet = active.reduce((sum, entry) => sum + entry.net, 0)
  const totalHours = active.reduce((sum, entry) => sum + entry.hours, 0)
  return totalHours ? totalNet / totalHours : 0
}

const toRad = (value) => (value * Math.PI) / 180

export const getDistanceKm = (start, end) => {
  if (!start || !end) return 0
  const lat1 = Number(start.lat)
  const lng1 = Number(start.lng)
  const lat2 = Number(end.lat)
  const lng2 = Number(end.lng)
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return 0
  }
  const radius = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return radius * c
}

export const getDeadheadPenalty = ({
  point,
  candidates = [],
  radiusKm = DEFAULT_DEADHEAD_RADIUS_KM,
  costPerKm = DEFAULT_DEADHEAD_COST_PER_KM,
  netPerHour = 0,
  fallbackNetPerHour = 20000,
}) => {
  if (!candidates.length) return 0.85
  let nearest = Number.POSITIVE_INFINITY
  candidates.forEach((candidate) => {
    const distance = getDistanceKm(point, candidate)
    if (!distance && candidates.length > 1) return
    if (distance < nearest) nearest = distance
  })

  const effectiveDistance = Number.isFinite(nearest)
    ? Math.min(nearest || radiusKm, radiusKm)
    : radiusKm
  const safeNetPerHour = netPerHour > 0 ? netPerHour : fallbackNetPerHour
  const cost = effectiveDistance * costPerKm
  return clamp(1 - cost / safeNetPerHour, 0.6, 1)
}

export const getDistancePenalty = ({ distanceKm, radiusKm = DEFAULT_DEADHEAD_RADIUS_KM }) => {
  const safeRadius = Number.isFinite(Number(radiusKm)) && Number(radiusKm) > 0
    ? Number(radiusKm)
    : DEFAULT_DEADHEAD_RADIUS_KM
  const safeDistance = Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 0
  if (!safeDistance) return 1
  const normalized = safeDistance / safeRadius
  const penalty = Math.exp(-normalized * 0.55)
  return clamp(penalty, 0.55, 1)
}

export const getConfidenceModifier = (count, target = 6) => {
  if (!count) return 0.2
  return clamp(Math.log(1 + count) / Math.log(1 + target), 0.2, 1)
}

export const getWeatherModifier = (weather) => {
  if (!weather) return 1
  const precipitation = weather.precipitation ?? 0
  if (precipitation >= 5) return 1.25
  if (precipitation >= 2) return 1.18
  if (precipitation >= 0.2) return 1.08

  const code = weather.weatherCode
  const rainyCodes = new Set([61, 63, 65, 80, 81, 82, 95])
  if (rainyCodes.has(code)) return 1.1
  return 1
}

export const fetchWeather = async ({ lat, lng }) => {
  const latKey = Number(lat).toFixed(2)
  const lngKey = Number(lng).toFixed(2)
  const cacheKey = `weather-${latKey}-${lngKey}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached)
    if (Date.now() - parsed.storedAt < WEATHER_CACHE_MS) {
      return parsed.data
    }
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'precipitation,weather_code,temperature_2m',
    timezone: 'Asia/Jakarta',
  })

  const response = await fetch(`${WEATHER_ENDPOINT}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Gagal mengambil data cuaca')
  }
  const payload = await response.json()
  const current = payload?.current || {}
  const data = {
    precipitation: current.precipitation ?? 0,
    weatherCode: current.weather_code ?? null,
    temperature: current.temperature_2m ?? null,
  }
  localStorage.setItem(cacheKey, JSON.stringify({ storedAt: Date.now(), data }))
  return data
}

export const fetchHolidaySet = async (year) => {
  const cacheKey = `holidays-id-${year}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached)
    if (Date.now() - parsed.storedAt < HOLIDAY_CACHE_MS) {
      return new Set(parsed.dates)
    }
  }

  const response = await fetch(`${HOLIDAY_ENDPOINT}/${year}/ID`)
  if (!response.ok) {
    throw new Error('Gagal mengambil data hari libur')
  }
  const payload = await response.json()
  const dates = payload.map((item) => item.date)
  localStorage.setItem(cacheKey, JSON.stringify({ storedAt: Date.now(), dates }))
  return new Set(dates)
}
