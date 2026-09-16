import type { Sensor } from '../api/client'
import { StatusBadge } from './StatusBadge'
import './MetadataCard.css'

interface MetadataCardProps {
  sensor: Sensor
}

export function MetadataCard({ sensor }: MetadataCardProps) {
  return (
    <section className="card" aria-labelledby="metadata-title">
      <h2 className="card__title" id="metadata-title">
        Metadata
      </h2>
      <dl className="metadata">
        <div className="metadata__row">
          <dt>ID</dt>
          <dd>{sensor.id}</dd>
        </div>
        <div className="metadata__row">
          <dt>Type</dt>
          <dd>{sensor.type}</dd>
        </div>
        <div className="metadata__row">
          <dt>Location</dt>
          <dd>{sensor.location}</dd>
        </div>
        <div className="metadata__row">
          <dt>Unit</dt>
          <dd>{sensor.unit}</dd>
        </div>
        <div className="metadata__row">
          <dt>Status</dt>
          <dd>
            <StatusBadge status={sensor.status} />
          </dd>
        </div>
      </dl>
    </section>
  )
}
