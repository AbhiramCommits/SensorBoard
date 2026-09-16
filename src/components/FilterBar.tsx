import type { SensorStatus, SensorType } from '../api/client'
import { SENSOR_STATUSES, SENSOR_TYPES } from '../constants'
import './FilterBar.css'

export interface FilterBarValues {
  q: string
  type: SensorType | ''
  status: SensorStatus | ''
  start: string
  end: string
}

interface FilterBarProps {
  values: FilterBarValues
  onChange: (patch: Partial<FilterBarValues>) => void
  onReset: () => void
}

export function FilterBar({ values, onChange, onReset }: FilterBarProps) {
  return (
    <form className="filter-bar" role="search" onSubmit={(event) => event.preventDefault()}>
      <div className="filter-bar__field filter-bar__field--search">
        <label htmlFor="sensor-search">Search</label>
        <input
          id="sensor-search"
          type="search"
          placeholder="Search sensors…"
          value={values.q}
          onChange={(event) => onChange({ q: event.target.value })}
        />
      </div>
      <div className="filter-bar__field">
        <label htmlFor="sensor-type">Type</label>
        <select
          id="sensor-type"
          value={values.type}
          onChange={(event) => onChange({ type: event.target.value as SensorType | '' })}
        >
          <option value="">All types</option>
          {SENSOR_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-bar__field">
        <label htmlFor="sensor-status">Status</label>
        <select
          id="sensor-status"
          value={values.status}
          onChange={(event) => onChange({ status: event.target.value as SensorStatus | '' })}
        >
          <option value="">All statuses</option>
          {SENSOR_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-bar__field">
        <label htmlFor="sensor-start">From</label>
        <input
          id="sensor-start"
          type="date"
          value={values.start}
          onChange={(event) => onChange({ start: event.target.value })}
        />
      </div>
      <div className="filter-bar__field">
        <label htmlFor="sensor-end">To</label>
        <input
          id="sensor-end"
          type="date"
          value={values.end}
          onChange={(event) => onChange({ end: event.target.value })}
        />
      </div>
      <div className="filter-bar__actions">
        <button className="button button--ghost" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </form>
  )
}
