'use client'

import { useMemo } from 'react'

interface ProximityIndicatorProps {
  centerX: number
  centerY: number
  radius: number // in canvas units (meters converted to pixels)
  nearbyPins: Array<{
    pin_id: string
    seq_number: number
    distance_meters: number
    x: number
    y: number
  }>
  showLabels?: boolean
  opacity?: number
}

export function ProximityIndicator({
  centerX,
  centerY,
  radius,
  nearbyPins,
  showLabels = false,
  opacity = 0.3
}: ProximityIndicatorProps) {
  // Convert radius from meters to canvas pixels (approximate)
  // This is a simplified conversion - in reality, you'd need to know the real-world scale
  const pixelRadius = radius * 2 // Assume 2 pixels per meter for demo
  
  // Calculate proximity zones (inner, outer)
  const zones = useMemo(() => [
    { radius: pixelRadius * 0.5, color: '#ef4444', intensity: 0.6, label: 'Critical' },
    { radius: pixelRadius * 0.75, color: '#f97316', intensity: 0.4, label: 'Warning' },
    { radius: pixelRadius, color: '#f59e0b', intensity: 0.2, label: 'Caution' }
  ], [pixelRadius])
  
  // Only show if there are nearby pins or we want to show potential zones
  if (nearbyPins.length === 0) return null
  
  return (
    <g opacity={opacity} className="proximity-indicator">
      {/* Proximity circles */}
      {zones.map((zone, index) => (
        <circle
          key={index}
          cx={centerX}
          cy={centerY}
          r={zone.radius}
          fill={zone.color}
          fillOpacity={zone.intensity * 0.1}
          stroke={zone.color}
          strokeWidth="1"
          strokeOpacity={zone.intensity * 0.3}
          strokeDasharray="2,3"
        />
      ))}
      
      {/* Connection lines to nearby pins */}
      {nearbyPins.map(pin => {
        const pinX = pin.x * 800 // Convert normalized coordinates back to canvas
        const pinY = pin.y * 600
        const distance = Math.sqrt(
          Math.pow(pinX - centerX, 2) + Math.pow(pinY - centerY, 2)
        )
        
        if (distance > pixelRadius) return null
        
        // Color based on distance
        const intensity = 1 - (distance / pixelRadius)
        const color = intensity > 0.7 ? '#ef4444' : 
                     intensity > 0.4 ? '#f97316' : '#f59e0b'
        
        return (
          <g key={pin.pin_id}>
            {/* Connection line */}
            <line
              x1={centerX}
              y1={centerY}
              x2={pinX}
              y2={pinY}
              stroke={color}
              strokeWidth="1"
              strokeOpacity={intensity * 0.5}
              strokeDasharray="1,2"
            />
            
            {/* Distance label */}
            {showLabels && (
              <text
                x={(centerX + pinX) / 2}
                y={(centerY + pinY) / 2}
                fill={color}
                fontSize="8"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none"
              >
                {pin.distance_meters.toFixed(1)}m
              </text>
            )}
          </g>
        )
      })}
      
      {/* Center indicator */}
      <circle
        cx={centerX}
        cy={centerY}
        r="2"
        fill="#3b82f6"
        fillOpacity={0.8}
      />
      
      {/* Zone labels */}
      {showLabels && zones.map((zone, index) => (
        <text
          key={`label-${index}`}
          x={centerX + zone.radius * 0.7}
          y={centerY - zone.radius * 0.7}
          fill={zone.color}
          fontSize="8"
          fontWeight="bold"
          className="pointer-events-none"
        >
          {zone.label}
        </text>
      ))}
      
      {/* Proximity count badge */}
      {nearbyPins.length > 0 && (
        <g transform={`translate(${centerX + pixelRadius + 5}, ${centerY - pixelRadius - 5})`}>
          <circle
            r="8"
            fill="#3b82f6"
            fillOpacity={0.9}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="8"
            fontWeight="bold"
          >
            {nearbyPins.length}
          </text>
        </g>
      )}
    </g>
  )
}

export default ProximityIndicator