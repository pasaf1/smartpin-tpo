import { cn } from "@/lib/utils"

type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed' | 'InDispute'

interface StatusBadgeProps {
  status: PinStatus
  className?: string
}

const statusConfig = {
  Open: {
    label: 'Open',
    className: 'status-badge-open',
    icon: '🔴',
  },
  ReadyForInspection: {
    label: 'Ready',
    className: 'status-badge-ready',
    icon: '🟡',
  },
  Closed: {
    label: 'Closed',
    className: 'status-badge-closed',
    icon: '🟢',
  },
  InDispute: {
    label: 'In Dispute',
    className: 'status-badge-dispute',
    icon: '🔶',
  },
} as const

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  if (!config) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground',
          className
        )}
      >
        <span className="text-[10px]" aria-hidden="true">⚪</span>
        {status || 'Unknown'}
      </span>
    )
  }
  
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