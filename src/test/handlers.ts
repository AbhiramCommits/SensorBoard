import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import type { Reading, Sensor, SensorStatus, SensorType } from '../api/client'

const TYPES: readonly SensorType[] = ['temperature', 'humidity', 'pressure', 'vibration']
const STATUSES: readonly SensorStatus[] = ['online', 'degraded', 'offline']
const UNITS: Record<SensorType, string> = {
  temperature: '°C',
  humidity: '%RH',
  pressure: 'hPa',
  vibration: 'mm/s',
}

const SENSOR_COUNT = 30
const READING_COUNT = 200
const READING_INTERVAL_MS = 15 * 60 * 1000
const READING_END = (() => {
  const now = new Date()
  now.setUTCMinutes(0, 0, 0)
  return now.getTime()
})()

export const SENSORS: Sensor[] = Array.from({ length: SENSOR_COUNT }, (_, index) => {
  const type = TYPES[index % TYPES.length] as SensorType
  const status = STATUSES[index % STATUSES.length] as SensorStatus
  const number = index + 1
  return {
    id: `sens-${String(number).padStart(3, '0')}`,
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Sensor ${String(number).padStart(2, '0')}`,
    type,
    status,
    location: `Building ${String.fromCharCode(65 + (index % 4))}, Room ${String(number).padStart(3, '0')}`,
    unit: UNITS[type],
    last_reading: status === 'offline' ? null : Math.round((20 + number * 0.5) * 100) / 100,
    updated_at: new Date(READING_END - index * 3_600_000).toISOString(),
  }
})

export function buildReadings(sensorId: string): Reading[] {
  return Array.from({ length: READING_COUNT }, (_, index) => ({
    sensor_id: sensorId,
    value: Math.round((20 + index * 0.1) * 100) / 100,
    recorded_at: new Date(READING_END - index * READING_INTERVAL_MS).toISOString(),
  }))
}

function findSensor(id: string): Sensor | undefined {
  return SENSORS.find((sensor) => sensor.id === id)
}

function parseIso(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? -1 : timestamp
}

export const handlers = [
  http.get('*/api/sensors', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1
    const pageSize = Number.parseInt(url.searchParams.get('page_size') ?? '20', 10) || 20

    let filtered = SENSORS
    if (q !== '') {
      filtered = filtered.filter(
        (sensor) =>
          sensor.name.toLowerCase().includes(q) || sensor.location.toLowerCase().includes(q),
      )
    }
    if (type) {
      filtered = filtered.filter((sensor) => sensor.type === type)
    }
    if (status) {
      filtered = filtered.filter((sensor) => sensor.status === status)
    }
    if (start) {
      const startTs = parseIso(start)
      filtered = filtered.filter((sensor) => Date.parse(sensor.updated_at) >= startTs)
    }
    if (end) {
      const endTs = parseIso(end)
      filtered = filtered.filter((sensor) => Date.parse(sensor.updated_at) <= endTs)
    }

    const total = filtered.length
    const items = filtered.slice((page - 1) * pageSize, page * pageSize)
    return HttpResponse.json({ items, total, page, page_size: pageSize })
  }),

  http.get('*/api/sensors/:id', ({ params }) => {
    const sensor = findSensor(String(params.id))
    if (!sensor) {
      return HttpResponse.json({ detail: 'Sensor not found' }, { status: 404 })
    }
    return HttpResponse.json(sensor)
  }),

  http.get('*/api/sensors/:id/readings', ({ request, params }) => {
    if (!findSensor(String(params.id))) {
      return HttpResponse.json({ detail: 'Sensor not found' }, { status: 404 })
    }
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10) || 100
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    let readings = buildReadings(String(params.id))
    if (start) {
      const startTs = parseIso(start)
      readings = readings.filter((reading) => Date.parse(reading.recorded_at) >= startTs)
    }
    if (end) {
      const endTs = parseIso(end)
      readings = readings.filter((reading) => Date.parse(reading.recorded_at) <= endTs)
    }

    return HttpResponse.json({ items: readings.slice(0, limit), total: readings.length })
  }),

  http.post('*/api/readings/bulk', async ({ request }) => {
    const body = (await request.json()) as { readings?: Reading[] }
    const readings = body.readings ?? []
    const errors: { index: number; message: string }[] = []
    const accepted: Reading[] = []
    readings.forEach((reading, index) => {
      if (!findSensor(reading.sensor_id)) {
        errors.push({ index, message: `unknown sensor id '${reading.sensor_id}'` })
      } else if (!Number.isFinite(reading.value)) {
        errors.push({ index, message: 'value must be finite' })
      } else if (parseIso(reading.recorded_at) === -1) {
        errors.push({ index, message: `invalid recorded_at '${reading.recorded_at}'` })
      } else {
        accepted.push(reading)
      }
    })
    return HttpResponse.json({
      accepted: accepted.length,
      rejected: errors.length,
      errors,
    })
  }),

  http.get('*/healthz', () => HttpResponse.json({ status: 'ok' })),
]

export const server = setupServer(...handlers)
