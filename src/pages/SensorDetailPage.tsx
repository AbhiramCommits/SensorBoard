import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { MetadataCard } from '../components/MetadataCard'
import { ReadingsChart } from '../components/ReadingsChart'
import { ReadingsTable } from '../components/ReadingsTable'
import { Skeleton } from '../components/Skeleton'
import { useReadings } from '../hooks/useReadings'
import { useSensor } from '../hooks/useSensor'
import { getErrorMessage } from '../utils/errors'
import {
  dateToEndParam,
  dateToStartParam,
  defaultEndDate,
  defaultStartDate,
  filtersToSearchParams,
  parseSensorListFilters,
} from '../utils/filters'
import './SensorDetailPage.css'

const RECENT_READINGS_COUNT = 50

export function SensorDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseSensorListFilters(searchParams)
  const listUrl = `/sensors?${filtersToSearchParams(filters).toString()}`
  const start = searchParams.get('start') ?? defaultStartDate()
  const end = searchParams.get('end') ?? defaultEndDate()

  const sensorQuery = useSensor(id)
  const readingsQuery = useReadings(id, dateToStartParam(start), dateToEndParam(end))

  const changeRange = useCallback(
    (patch: { start?: string; end?: string }) => {
      const next = new URLSearchParams(searchParams)
      if (patch.start !== undefined) next.set('start', patch.start)
      if (patch.end !== undefined) next.set('end', patch.end)
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const sensorName = sensorQuery.data?.name ?? id
  const unit = sensorQuery.data?.unit ?? ''

  return (
    <div className="sensor-detail">
      <Breadcrumb items={[{ label: 'Sensors', to: listUrl }, { label: sensorName }]} />
      <Link className="sensor-detail__back" to={listUrl}>
        ← Back to list
      </Link>
      <h1 className="sensor-detail__title">{sensorName}</h1>

      <div className="sensor-detail__grid">
        {sensorQuery.isPending ? (
          <section className="card">
            <div role="status" aria-label="Loading sensor">
              <span className="sr-only">Loading sensor</span>
              <Skeleton className="metadata-skeleton" />
            </div>
          </section>
        ) : sensorQuery.isError ? (
          <section className="card">
            <ErrorBanner
              title="Failed to load sensor"
              message={getErrorMessage(sensorQuery.error)}
              onRetry={() => {
                void sensorQuery.refetch()
              }}
            />
          </section>
        ) : sensorQuery.data ? (
          <MetadataCard sensor={sensorQuery.data} />
        ) : null}

        <section className="card sensor-detail__chart-card" aria-labelledby="chart-title">
          <div className="chart-card__header">
            <h2 className="card__title" id="chart-title">
              Readings over date range
            </h2>
            <div className="date-range">
              <div className="date-range__field">
                <label htmlFor="readings-start">From</label>
                <input
                  id="readings-start"
                  type="date"
                  value={start}
                  onChange={(event) => changeRange({ start: event.target.value })}
                />
              </div>
              <div className="date-range__field">
                <label htmlFor="readings-end">To</label>
                <input
                  id="readings-end"
                  type="date"
                  value={end}
                  onChange={(event) => changeRange({ end: event.target.value })}
                />
              </div>
            </div>
          </div>
          {readingsQuery.isPending ? (
            <div role="status" aria-label="Loading readings">
              <span className="sr-only">Loading readings</span>
              <Skeleton className="chart-skeleton" />
            </div>
          ) : readingsQuery.isError ? (
            <ErrorBanner
              title="Failed to load readings"
              message={getErrorMessage(readingsQuery.error)}
              onRetry={() => {
                void readingsQuery.refetch()
              }}
            />
          ) : readingsQuery.data && readingsQuery.data.items.length > 0 ? (
            <ReadingsChart
              readings={readingsQuery.data.items}
              unit={unit}
              title={`Line chart of ${sensorName} readings from ${start} to ${end}`}
            />
          ) : (
            <EmptyState title="No readings" description="No readings in the selected date range." />
          )}
        </section>
      </div>

      <section className="card sensor-detail__recent" aria-labelledby="recent-title">
        <div className="recent-card__header">
          <h2 className="card__title" id="recent-title">
            Recent readings
          </h2>
          {readingsQuery.data ? (
            <p className="recent-card__count" aria-live="polite">
              Showing {Math.min(RECENT_READINGS_COUNT, readingsQuery.data.items.length)} of{' '}
              {readingsQuery.data.total}
            </p>
          ) : null}
        </div>
        {readingsQuery.isPending ? (
          <div role="status" aria-label="Loading readings">
            <span className="sr-only">Loading readings</span>
            <Skeleton className="table-skeleton" />
          </div>
        ) : readingsQuery.isError ? (
          <ErrorBanner
            title="Failed to load readings"
            message={getErrorMessage(readingsQuery.error)}
            onRetry={() => {
              void readingsQuery.refetch()
            }}
          />
        ) : readingsQuery.data && readingsQuery.data.items.length > 0 ? (
          <ReadingsTable
            readings={readingsQuery.data.items.slice(0, RECENT_READINGS_COUNT)}
            unit={unit}
          />
        ) : (
          <EmptyState title="No readings" description="No readings in the selected date range." />
        )}
      </section>
    </div>
  )
}
