import { cn } from "@/lib/utils"

type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

const severityConfig = {
  Low: {
    label: 'Low',
    className: 'severity-badge-low',
    icon: '🟢',
  },
  Medium: {
    label: 'Medium',
    className: 'severity-badge-medium',
    icon: '🟡',
  },
  High: {
    label: 'High',
    className: 'severity-badge-high',
    icon: '🟠',
  },
  Critical: {
    label: 'Critical',
    className: 'severity-badge-critical',
    icon: '🔴',
  },
} as const

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity]
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className="text-[10px]" aria-hidden="true">
        {config.icon}
      </span>
      {config.label}
    </span>
  )
}