import type { Reading } from '../api/client'
import { formatDateTimeUtc, formatValue } from '../utils/format'
import './ReadingsTable.css'

interface ReadingsTableProps {
  readings: Reading[]
  unit: string
}

export function ReadingsTable({ readings, unit }: ReadingsTableProps) {
  return (
    <div className="table-scroll">
      <table className="readings-table">
        <caption className="sr-only">Recent readings</caption>
        <thead>
          <tr>
            <th scope="col">Recorded At</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={`${reading.sensor_id}-${reading.recorded_at}`}>
              <td data-label="Recorded At">{formatDateTimeUtc(reading.recorded_at)}</td>
              <td data-label="Value">
                {formatValue(reading.value)} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
