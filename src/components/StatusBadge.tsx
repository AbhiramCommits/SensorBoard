import type { SensorStatus } from '../api/client'
import './StatusBadge.css'

interface StatusBadgeProps {
  status: SensorStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{status}</span>
}
