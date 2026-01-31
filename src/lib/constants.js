export const ENTITY_STORES = [
  'trips',
  'earnings',
  'expenses',
  'schedule',
  'notes',
  'heatmap_points',
  'settings',
]

export const DEFAULT_SETTINGS = {
  id: 'app',
  mapPrecision: 4,
  deadheadCostPerKm: 2000,
  deadheadRadiusKm: 3,
  heatmapGoal: 'order',
  useCurrentHour: true,
  highContrastHeatmap: false,
  heatmapIntensity: 1,
  liveLocationEnabled: false,
  followMe: false,
  useWeather: true,
  useHoliday: true,
  lastSyncAt: null,
}
