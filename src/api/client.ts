import type { components, operations } from './schema'

export type Sensor = components['schemas']['Sensor']
export type SensorType = components['schemas']['SensorType']
export type SensorStatus = components['schemas']['SensorStatus']
export type Reading = components['schemas']['Reading']
export type ReadingInput = components['schemas']['ReadingInput']
export type SensorPage = components['schemas']['SensorPage']
export type ReadingList = components['schemas']['ReadingList']
export type BulkIngestResult = components['schemas']['BulkIngestResult']
export type HealthStatus = { status: 'ok' }

export type ListSensorsParams = operations['listSensors']['parameters']['query']
export type ListReadingsParams = operations['listReadings']['parameters']['query']

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

const DEFAULT_TIMEOUT_MS = 10_000

export interface RequestOptions {
  timeoutMs?: number
}

type QueryValue = string | number | undefined

function buildQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const queryString = search.toString()
  return queryString ? `?${queryString}` : ''
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`
  try {
    const text = await response.text()
    if (!text) return fallback
    const body: unknown = JSON.parse(text)
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: unknown }).message
      if (typeof message === 'string' && message !== '') return message
    }
    return fallback
  } catch {
    return fallback
  }
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal })
    if (!response.ok) {
      throw new ApiError(response.status, await extractErrorMessage(response))
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (isAbortError(error)) {
      throw new ApiError(0, `Request timed out after ${timeoutMs} ms`)
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network request failed')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new ApiError(response.status, await extractErrorMessage(response))
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (isAbortError(error)) {
      throw new ApiError(0, `Request timed out after ${timeoutMs} ms`)
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network request failed')
  } finally {
    clearTimeout(timeoutId)
  }
}

export function listSensors(
  params?: ListSensorsParams,
  options?: RequestOptions,
): Promise<SensorPage> {
  return request(`/api/sensors${buildQueryString(params)}`, options)
}

export function getSensor(id: string, options?: RequestOptions): Promise<Sensor> {
  return request(`/api/sensors/${encodeURIComponent(id)}`, options)
}

export function listReadings(
  id: string,
  params?: ListReadingsParams,
  options?: RequestOptions,
): Promise<ReadingList> {
  return request(
    `/api/sensors/${encodeURIComponent(id)}/readings${buildQueryString(params)}`,
    options,
  )
}

export function ingestReadings(
  readings: ReadingInput[],
  options?: RequestOptions,
): Promise<BulkIngestResult> {
  return post('/api/readings/bulk', { readings }, options)
}

export function healthz(options?: RequestOptions): Promise<HealthStatus> {
  return request('/healthz', options)
}
