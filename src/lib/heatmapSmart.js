const WEATHER_CACHE_MS = 20 * 60 * 1000
const HOLIDAY_CACHE_MS = 7 * 24 * 60 * 60 * 1000
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const HOLIDAY_ENDPOINT = 'https://date.nager.at/api/v3/PublicHolidays'

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
