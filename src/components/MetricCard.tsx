import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  tone?: 'blue' | 'mint' | 'amber' | 'rose'
}

/** 控制台各页复用的关键指标卡，图标和色调由业务页面传入以保持信息语义一致。 */
export function MetricCard({ label, value, hint, icon, tone = 'blue' }: MetricCardProps) {
  return (
    <section className={`console-metric console-metric--${tone}`}>
      <div className="metric-card-top">
        <span>{label}</span>
        {icon && <span className="metric-card-icon" data-testid="metric-card-icon" aria-hidden="true">{icon}</span>}
      </div>
      <strong className="console-metric-value">{value}</strong>
      {hint && <p>{hint}</p>}
    </section>
  )
}
