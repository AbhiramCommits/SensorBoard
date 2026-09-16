import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ListSensorsParams } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { FilterBar } from '../components/FilterBar'
import { Pagination } from '../components/Pagination'
import { SensorTable } from '../components/SensorTable'
import { SkeletonRows } from '../components/Skeleton'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useSensors } from '../hooks/useSensors'
import { getErrorMessage } from '../utils/errors'
import {
  dateToEndParam,
  dateToStartParam,
  DEFAULT_FILTERS,
  filtersToSearchParams,
  parseSensorListFilters,
  type SensorListFilters,
} from '../utils/filters'
import './SensorListPage.css'

export function SensorListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const filters = useMemo(() => parseSensorListFilters(searchParams), [searchParams])
  const debouncedQ = useDebouncedValue(filters.q, 300)

  const applyFilterPatch = useCallback(
    (patch: Partial<SensorListFilters>) => {
      const replace = 'q' in patch
      setSearchParams(filtersToSearchParams({ ...filters, ...patch, page: 1 }), { replace })
    },
    [filters, setSearchParams],
  )

  const changePage = useCallback(
    (page: number) => {
      setSearchParams(filtersToSearchParams({ ...filters, page }))
    },
    [filters, setSearchParams],
  )

  const changePageSize = useCallback(
    (pageSize: number) => {
      setSearchParams(filtersToSearchParams({ ...filters, pageSize, page: 1 }))
    },
    [filters, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(filtersToSearchParams(DEFAULT_FILTERS))
  }, [setSearchParams])

  const apiParams: ListSensorsParams = useMemo(
    () => ({
      q: debouncedQ === '' ? undefined : debouncedQ,
      type: filters.type === '' ? undefined : filters.type,
      status: filters.status === '' ? undefined : filters.status,
      start: dateToStartParam(filters.start),
      end: dateToEndParam(filters.end),
      page: filters.page,
      page_size: filters.pageSize,
    }),
    [debouncedQ, filters],
  )

  const { data, isPending, isError, error, refetch } = useSensors(apiParams)

  const openSensor = useCallback(
    (id: string) => {
      const query = searchParams.toString()
      navigate(query === '' ? `/sensors/${id}` : `/sensors/${id}?${query}`)
    },
    [navigate, searchParams],
  )

  return (
    <div className="sensor-list">
      <h1 className="sensor-list__title">Sensors</h1>
      <section className="card" aria-labelledby="sensor-filters-title">
        <h2 className="sr-only" id="sensor-filters-title">
          Filters
        </h2>
        <FilterBar
          values={{
            q: filters.q,
            type: filters.type,
            status: filters.status,
            start: filters.start,
            end: filters.end,
          }}
          onChange={applyFilterPatch}
          onReset={resetFilters}
        />
      </section>

      <section className="card sensor-list__results" aria-labelledby="sensor-results-title">
        <h2 className="sr-only" id="sensor-results-title">
          Sensor results
        </h2>
        {isPending ? (
          <div role="status" aria-label="Loading sensors">
            <span className="sr-only">Loading sensors</span>
            <SkeletonRows />
          </div>
        ) : isError ? (
          <ErrorBanner
            title="Failed to load sensors"
            message={getErrorMessage(error)}
            onRetry={() => {
              void refetch()
            }}
          />
        ) : data && data.items.length > 0 ? (
          <>
            <SensorTable sensors={data.items} onSelectSensor={openSensor} />
            <Pagination
              page={filters.page}
              pageSize={filters.pageSize}
              total={data.total}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
            />
          </>
        ) : data && data.total > 0 ? (
          <EmptyState
            title="No sensors on this page"
            description="The current page is empty."
            action={
              <button className="button" type="button" onClick={() => changePage(1)}>
                Go to page 1
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No sensors found"
            description="Try adjusting your filters."
            action={
              <button className="button" type="button" onClick={resetFilters}>
                Reset
              </button>
            }
          />
        )}
      </section>
    </div>
  )
}
