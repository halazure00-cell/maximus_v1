export const ENTITY_STORES = [
  'earnings',
  'expenses',
  'heatmap_points',
  'settings',
]

export const DEFAULT_SETTINGS = {
  id: 'app',
  themeMode: 'manual',
  theme: 'dark',
  mapPrecision: 4,
  deadheadCostPerKm: 2000,
  deadheadRadiusKm: 3,
  heatmapGoal: 'order',
  useCurrentHour: true,
  highContrastHeatmap: false,
  heatmapIntensity: 1,
  distancePenaltyKm: 3,
  liveLocationEnabled: false,
  followMe: false,
  useWeather: true,
  useHoliday: true,
  lastSyncAt: null,
}
