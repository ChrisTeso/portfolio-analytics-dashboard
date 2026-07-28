import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'negative' | 'neutral'
}

export function MetricCard({ icon: Icon, label, value, detail, tone = 'neutral' }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card__header">
        <span>{label}</span>
        <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
      </div>
      <p className={`metric-card__value value--${tone}`}>{value}</p>
      <p className="metric-card__detail">{detail}</p>
    </article>
  )
}
