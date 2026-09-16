import type { SensorStatus, SensorType } from './api/client'

export const SENSOR_TYPES: readonly SensorType[] = [
  'temperature',
  'humidity',
  'pressure',
  'vibration',
]

export const SENSOR_STATUSES: readonly SensorStatus[] = ['online', 'offline', 'degraded']

export const PAGE_SIZES: readonly number[] = [10, 25, 50]
export const DEFAULT_PAGE_SIZE = 25
export const DEFAULT_RANGE_DAYS = 7
