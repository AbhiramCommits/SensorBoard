import type { SensorStatus, SensorType } from '../api/client'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_RANGE_DAYS,
  PAGE_SIZES,
  SENSOR_STATUSES,
  SENSOR_TYPES,
} from '../constants'

export interface SensorListFilters {
  q: string
  type: SensorType | ''
  status: SensorStatus | ''
  start: string
  end: string
  page: number
  pageSize: number
}

export const DEFAULT_FILTERS: SensorListFilters = {
  q: '',
  type: '',
  status: '',
  start: '',
  end: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null) return fallback
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value >= 1 ? value : fallback
}

function parseEnum<T extends string>(raw: string | null, allowed: readonly T[]): T | '' {
  if (raw === null) return ''
  return allowed.includes(raw as T) ? (raw as T) : ''
}

export function parseSensorListFilters(params: URLSearchParams): SensorListFilters {
  const pageSize = parsePositiveInt(params.get('page_size'), DEFAULT_PAGE_SIZE)
  return {
    q: params.get('q') ?? '',
    type: parseEnum(params.get('type'), SENSOR_TYPES),
    status: parseEnum(params.get('status'), SENSOR_STATUSES),
    start: params.get('start') ?? '',
    end: params.get('end') ?? '',
    page: parsePositiveInt(params.get('page'), 1),
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  }
}

export function filtersToSearchParams(filters: SensorListFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q !== '') params.set('q', filters.q)
  if (filters.type !== '') params.set('type', filters.type)
  if (filters.status !== '') params.set('status', filters.status)
  if (filters.start !== '') params.set('start', filters.start)
  if (filters.end !== '') params.set('end', filters.end)
  if (filters.page > 1) params.set('page', String(filters.page))
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set('page_size', String(filters.pageSize))
  return params
}

export function dateToStartParam(date: string): string | undefined {
  return date === '' ? undefined : `${date}T00:00:00`
}

export function dateToEndParam(date: string): string | undefined {
  return date === '' ? undefined : `${date}T23:59:59`
}

export function defaultStartDate(now: Date = new Date()): string {
  const date = new Date(now.getTime() - DEFAULT_RANGE_DAYS * 86_400_000)
  return date.toISOString().slice(0, 10)
}

export function defaultEndDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}
