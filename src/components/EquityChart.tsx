import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'
import type { EquityPoint } from '../types'

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EquityPoint }> }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="chart-tooltip">
      <span>{formatDate(point.date)}</span>
      <strong>{formatCurrency(point.value)}</strong>
    </div>
  )
}

export function EquityChart({ points }: { points: EquityPoint[] }) {
  return (
    <div className="chart" role="img" aria-label="Portfolio equity curve">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#79e1b2" stopOpacity={0.32} />
              <stop offset="90%" stopColor="#79e1b2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(181, 216, 199, 0.1)" strokeDasharray="3 7" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={48}
            tick={{ fill: '#74867f', fontSize: 11 }}
            tickFormatter={(value: string) => new Date(`${value}T00:00:00`).getFullYear().toString()}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            domain={['dataMin - 4000', 'dataMax + 2500']}
            tick={{ fill: '#74867f', fontSize: 11 }}
            tickFormatter={formatCompactCurrency}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(121, 225, 178, 0.3)' }} />
          <Area
            dataKey="value"
            fill="url(#equityFill)"
            stroke="#79e1b2"
            strokeWidth={2.2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
