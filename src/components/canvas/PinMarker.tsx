'use client'

import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'

interface PinMarkerProps {
  pin: PinWithRelations
  isSelected?: boolean
  onClick?: () => void
  editable?: boolean
}

export function PinMarker({ pin, isSelected, onClick, editable = true }: PinMarkerProps) {
  const isParent = !pin.parent_pin_id
  const hasChildren = pin.children && pin.children.length > 0
  
  // Pin configuration based on parent/child status
  const pinConfig = {
    size: isParent ? 24 : 16,
    fontSize: isParent ? 14 : 10,
    strokeWidth: isParent ? 2 : 1.5,
  }

  // Status color mapping
  const statusColors = {
    Open: {
      fill: '#DC2626', // Red 600
      stroke: '#B91C1C', // Red 700
      hover: '#EF4444', // Red 500
    },
    ReadyForInspection: {
      fill: '#D97706', // Amber 600
      stroke: '#B45309', // Amber 700
      hover: '#F59E0B', // Amber 500
    },
    Closed: {
      fill: '#059669', // Emerald 600
      stroke: '#047857', // Emerald 700
      hover: '#10B981', // Emerald 500
    },
  }

  const colors = statusColors[pin.status]

  // Severity indicator (small dot on the pin)
  const severityColors = {
    Low: '#65A30D', // Lime 600
    Medium: '#D97706', // Amber 600
    High: '#EA580C', // Orange 600
    Critical: '#DC2626', // Red 600
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (editable) {
      onClick?.()
    }
  }

  return (
    <g 
      className={cn(
        'pin-marker cursor-pointer transition-all duration-150',
        isSelected && 'selected',
        !editable && 'cursor-default'
      )}
      transform={`translate(${pin.x_position}, ${pin.y_position})`}
      onClick={handleClick}
    >
      {/* Selection halo */}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r={pinConfig.size / 2 + 4}
          fill="none"
          stroke={isParent ? '#2563EB' : '#7C3AED'}
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.6"
          className="animate-pulse"
        />
      )}

      {/* Drop shadow */}
      <ellipse
        cx="1"
        cy={pinConfig.size / 2 + 2}
        rx={pinConfig.size / 2.5}
        ry="3"
        fill="rgba(0, 0, 0, 0.2)"
        opacity="0.6"
      />

      {/* Main pin body */}
      <circle
        cx="0"
        cy="0"
        r={pinConfig.size / 2}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={pinConfig.strokeWidth}
        filter="url(#pin-shadow)"
        className="transition-all duration-150 hover:brightness-110"
      />

      {/* Pin number */}
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={pinConfig.fontSize}
        fontWeight="600"
        fill="white"
        className="pointer-events-none select-none"
      >
        {pin.seq_number}
      </text>

      {/* Severity indicator (small dot) */}
      <circle
        cx={pinConfig.size / 2 - 3}
        cy={-pinConfig.size / 2 + 3}
        r="3"
        fill={severityColors[pin.severity]}
        stroke="white"
        strokeWidth="1"
        className="pointer-events-none"
      />

      {/* Child count indicator for parent pins */}
      {isParent && hasChildren && (
        <g transform={`translate(${pinConfig.size / 2 + 2}, ${-pinConfig.size / 2 - 2})`}>
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="#7C3AED"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="600"
            fill="white"
            className="pointer-events-none select-none"
          >
            {pin.children?.length}
          </text>
        </g>
      )}

      {/* Connection line to parent (for child pins) */}
      {!isParent && pin.parent && (
        <line
          x1="0"
          y1="0"
          x2={pin.parent.x_position - pin.x_position}
          y2={pin.parent.y_position - pin.y_position}
          stroke="#7C3AED"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.5"
          className="pointer-events-none"
        />
      )}

      {/* Status indicator ring */}
      <circle
        cx="0"
        cy="0"
        r={pinConfig.size / 2 + 2}
        fill="none"
        stroke={colors.fill}
        strokeWidth="1"
        opacity="0.3"
        className={cn(
          'transition-all duration-300',
          pin.status === 'Open' && 'animate-pulse',
          isSelected && 'opacity-60'
        )}
      />

      {/* Hover effect */}
      <circle
        cx="0"
        cy="0"
        r={pinConfig.size / 2}
        fill="transparent"
        className="hover:fill-white hover:opacity-10 transition-all duration-150"
      />

      {/* Title tooltip (only visible on hover) */}
      {pin.title && (
        <g className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <rect
            x="-40"
            y={pinConfig.size / 2 + 8}
            width="80"
            height="20"
            rx="4"
            fill="rgba(0, 0, 0, 0.9)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
          <text
            x="0"
            y={pinConfig.size / 2 + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="white"
            className="select-none"
          >
            {pin.title.length > 12 ? `${pin.title.slice(0, 12)}...` : pin.title}
          </text>
        </g>
      )}
    </g>
  )
}