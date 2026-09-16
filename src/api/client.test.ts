import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getSensor, healthz, ingestReadings, listReadings, listSensors } from './client'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('listSensors', () => {
  it('serializes query params and parses the response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 2, page_size: 10 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await listSensors({
      q: 'roof',
      type: 'temperature',
      status: 'online',
      start: '2026-02-01T00:00:00',
      end: '2026-02-01T23:59:59',
      page: 2,
      page_size: 10,
    })

    expect(result).toEqual({ items: [], total: 0, page: 2, page_size: 10 })
    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toContain('http://localhost:8000/api/sensors?')
    expect(url).toContain('q=roof')
    expect(url).toContain('type=temperature')
    expect(url).toContain('status=online')
    expect(url).toContain('start=2026-02-01T00%3A00%3A00')
    expect(url).toContain('end=2026-02-01T23%3A59%3A59')
    expect(url).toContain('page=2')
    expect(url).toContain('page_size=10')
  })

  it('omits empty params from the query string', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, page_size: 20 }))
    vi.stubGlobal('fetch', fetchMock)

    await listSensors({ q: '', page: 1 })

    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toBe('http://localhost:8000/api/sensors?page=1')
    expect(url).not.toContain('q=')
  })

  it('throws ApiError with the server message on non-2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'boom' }, { status: 500 })),
    )

    await expect(listSensors()).rejects.toEqual(new ApiError(500, 'boom'))
  })

  it('falls back to a generic message when the error body has no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'nope' }, { status: 502 })),
    )

    await expect(listSensors()).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message: 'Request failed with status 502',
    })
  })

  it('wraps network failures in an ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(listSensors()).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Failed to fetch',
    })
  })
})

describe('request timeout', () => {
  it('aborts the request after the configured timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }),
      ),
    )

    const pending = listSensors({}, { timeoutMs: 50 })
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Request timed out after 50 ms',
    })

    await vi.advanceTimersByTimeAsync(60)
    await assertion
  })
})

describe('other endpoints', () => {
  it('getSensor URL-encodes the id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 'a/b',
        name: 'x',
        type: 'temperature',
        status: 'online',
        location: 'l',
        unit: '°C',
        last_reading: null,
        updated_at: '2026-02-01T00:00:00',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const sensor = await getSensor('a/b')
    expect(sensor.id).toBe('a/b')
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8000/api/sensors/a%2Fb')
  })

  it('listReadings passes start/end/limit and parses the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await listReadings('sens-001', {
      start: '2026-02-01T00:00:00',
      end: '2026-02-02T00:00:00',
      limit: 250,
    })

    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toContain('/api/sensors/sens-001/readings?')
    expect(url).toContain('start=')
    expect(url).toContain('end=')
    expect(url).toContain('limit=250')
  })

  it('ingestReadings posts JSON and parses the result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ accepted: 1, rejected: 1, errors: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await ingestReadings([
      { sensor_id: 'sens-001', value: 21.5, recorded_at: '2026-02-01T00:00:00Z' },
    ])

    expect(result).toEqual({ accepted: 1, rejected: 1, errors: [] })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:8000/api/readings/bulk')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(
      JSON.stringify({
        readings: [{ sensor_id: 'sens-001', value: 21.5, recorded_at: '2026-02-01T00:00:00Z' }],
      }),
    )
  })

  it('healthz returns the health payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' })))
    await expect(healthz()).resolves.toEqual({ status: 'ok' })
  })
})
