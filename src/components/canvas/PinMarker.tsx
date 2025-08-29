'use client'

import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'

type ExtendedPin = PinWithRelations & {
  parent_pin_id?: string | null
  children?: ExtendedPin[]
  parent?: ExtendedPin
  sequence?: number
}

interface PinMarkerProps {
  pin: ExtendedPin
  isSelected?: boolean
  onClick?: () => void
  editable?: boolean
}

export function PinMarker({ pin, isSelected, onClick, editable = true }: PinMarkerProps) {
  // For now, treat all pins as standalone (not hierarchical) since we don't have hierarchy data
  const isParent = true // All pins are standalone
  const hasChildren = pin.pin_children && pin.pin_children.length > 0
  
  // Use seq_number from the database
  const displaySequence = pin.seq_number
  const displayTitle = `Pin ${displaySequence}`
  
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

  const colors = statusColors[pin.status as keyof typeof statusColors] || statusColors.Open

  // Status-based styling (removed severity since it's not in current schema)
  const strokeWidth = isSelected ? 3 : 2

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
      transform={`translate(${pin.x}, ${pin.y})`}
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
            dominantBaseline="middle"
            fontSize="10"
            fill="white"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {pin.pin_children?.length || 0}
          </text>
        </g>
      )}

      {/* Connection line to parent not supported yet */}

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
      {pin.seq_number && (
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
            {pin.seq_number.toString().length > 12 ? `${pin.seq_number.toString().slice(0, 12)}...` : pin.seq_number}
          </text>
        </g>
      )}
    </g>
  )
}