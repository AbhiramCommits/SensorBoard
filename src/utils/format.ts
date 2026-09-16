function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateTimeUtc(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
  )
}

export function formatTimeUtc(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

export function formatTimestampUtc(timestamp: number): string {
  return formatTimeUtc(new Date(timestamp).toISOString())
}

export function formatValue(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

export function formatReading(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '—'
  return `${formatValue(value)} ${unit}`
}
