'use client'

import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/types/relations'

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
  // Check if pin has children
  const hasChildren = pin.pin_children && pin.pin_children.length > 0
  
  // Use seq_number from the database
  const displaySequence = pin.seq_number
  
  // Pin configuration
  const pinConfig = {
    size: 24,
    strokeWidth: isSelected ? 3 : 2,
  }

  // Status-based colors
  const statusColors = {
    Open: {
      fill: '#EF4444', // Red 500
      stroke: '#DC2626', // Red 600
      hover: '#F87171', // Red 400
    },
    ReadyForInspection: {
      fill: '#F59E0B', // Amber 500
      stroke: '#D97706', // Amber 600
      hover: '#FBBF24', // Amber 400
    },
    Closed: {
      fill: '#10B981', // Emerald 500
      stroke: '#047857', // Emerald 700
      hover: '#10B981', // Emerald 500
    },
  }

  const colors = statusColors[pin.status as keyof typeof statusColors] || statusColors.Open

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
      {/* Shadow/depth effect */}
      <circle
        cx="1"
        cy="1"
        r={pinConfig.size / 2}
        fill="rgba(0, 0, 0, 0.2)"
        className="pointer-events-none"
      />

      {/* Main pin circle */}
      <circle
        cx="0"
        cy="0"
        r={pinConfig.size / 2}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={pinConfig.strokeWidth}
        className={cn(
          'transition-all duration-200',
          editable && 'hover:fill-opacity-80',
          isSelected && 'ring-2 ring-blue-400 ring-offset-2'
        )}
      />

      {/* Selection ring */}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r={pinConfig.size / 2 + 4}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          opacity="0.6"
          className="animate-pulse"
        />
      )}

      {/* Pin number */}
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="600"
        fill="white"
        className="pointer-events-none select-none"
      >
        {displaySequence}
      </text>

      {/* Child count indicator */}
      {hasChildren && (
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
          pin.status === 'Open' && 'animate-pulse'
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

      {/* Pin ID tooltip on hover */}
      <g className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <rect
          x="-30"
          y={pinConfig.size / 2 + 8}
          width="60"
          height="20"
          rx="4"
          fill="rgba(0, 0, 0, 0.9)"
        />
        <text
          x="0"
          y={pinConfig.size / 2 + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="white"
          fontWeight="500"
        >
          Pin #{displaySequence}
        </text>
      </g>
    </g>
  )
}
