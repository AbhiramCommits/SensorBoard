import type { Sensor } from '../api/client'
import { formatDateTimeUtc, formatReading } from '../utils/format'
import { StatusBadge } from './StatusBadge'
import './SensorTable.css'

interface SensorTableProps {
  sensors: Sensor[]
  onSelectSensor: (id: string) => void
}

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'last_reading', label: 'Last Reading' },
  { key: 'updated_at', label: 'Updated At' },
] as const

export function SensorTable({ sensors, onSelectSensor }: SensorTableProps) {
  return (
    <div className="table-scroll">
      <table className="sensor-table">
        <caption className="sr-only">Sensors</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sensors.map((sensor) => (
            <tr
              key={sensor.id}
              className="sensor-table__row"
              tabIndex={0}
              role="link"
              aria-label={`View ${sensor.name}`}
              onClick={() => onSelectSensor(sensor.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectSensor(sensor.id)
                }
              }}
            >
              <td data-label="Name">{sensor.name}</td>
              <td data-label="Type">{sensor.type}</td>
              <td data-label="Status">
                <StatusBadge status={sensor.status} />
              </td>
              <td data-label="Last Reading">{formatReading(sensor.last_reading, sensor.unit)}</td>
              <td data-label="Updated At">{formatDateTimeUtc(sensor.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
