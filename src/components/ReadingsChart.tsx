import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Reading } from '../api/client'
import { formatTimestampUtc, formatValue } from '../utils/format'
import './ReadingsChart.css'

interface ReadingsChartProps {
  readings: Reading[]
  unit: string
  title: string
}

interface ChartPoint {
  t: number
  value: number
}

export function ReadingsChart({ readings, unit, title }: ReadingsChartProps) {
  const data: ChartPoint[] = useMemo(
    () =>
      [...readings]
        .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
        .map((reading) => ({
          t: new Date(reading.recorded_at).getTime(),
          value: reading.value,
        })),
    [readings],
  )

  return (
    <div className="readings-chart" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value: number) => formatTimestampUtc(value)}
            tick={{ fontSize: 12 }}
            tickMargin={8}
            minTickGap={24}
            stroke="var(--color-text-muted)"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickMargin={8}
            width={48}
            stroke="var(--color-text-muted)"
            label={{
              value: unit,
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: 'var(--color-text-muted)' },
            }}
          />
          <Tooltip
            labelFormatter={(label) => formatTimestampUtc(Number(label))}
            formatter={(value) => [`${formatValue(Number(value))} ${unit}`, 'Value']}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
