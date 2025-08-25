'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Pin {
  id: string
  x: number
  y: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'ready' | 'closed'
  issueType: string
  title?: string
}

interface PinPreview {
  id: string
  title: string
  issueType: string
  status: 'open' | 'ready' | 'closed'
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface InteractiveRoofPlanProps {
  pins: Pin[]
  onPinClick: (pin: Pin) => void
  onAddPin?: (x: number, y: number) => void
  highlightedPinId?: string
  className?: string
}

export function InteractiveRoofPlan({ 
  pins, 
  onPinClick, 
  onAddPin, 
  highlightedPinId, 
  className 
}: InteractiveRoofPlanProps) {
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const pinData: Record<string, PinPreview> = {
    '1': {
      id: 'PIN-001',
      title: 'Membrane Defect',
      issueType: 'Membrane Defect',
      status: 'open',
      severity: 'critical'
    },
    '2': {
      id: 'PIN-002',
      title: 'Seam Issue',
      issueType: 'Seam Issue',
      status: 'ready',
      severity: 'high'
    },
    '3': {
      id: 'PIN-003',
      title: 'Insulation Problem',
      issueType: 'Insulation Problem',
      status: 'closed',
      severity: 'low'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'ready': return 'bg-amber-100 text-amber-800'
      case 'closed': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'low': return 'bg-luxury-100 text-luxury-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePinHover = (pin: Pin, event: React.MouseEvent) => {
    setHoveredPin(pin)
    const rect = (event.target as Element).getBoundingClientRect()
    setPreviewPosition({
      x: rect.right + 10,
      y: rect.top
    })
  }

  const handlePinLeave = () => {
    setHoveredPin(null)
  }

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onAddPin || !svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 600
    const y = ((event.clientY - rect.top) / rect.height) * 400
    
    // Check if click is within the roof boundary
    if (x >= 40 && x <= 560 && y >= 40 && y <= 360) {
      onAddPin(x, y)
    }
  }

  return (
    <div className={cn("relative bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl p-4", className)}>
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox="0 0 600 400"
        onClick={handleSvgClick}
      >
        {/* Roof Structure */}
        <rect x="40" y="40" width="520" height="320" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" rx="12"/>
        <line x1="240" y1="40" x2="240" y2="360" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8,4" opacity="0.6"/>
        <line x1="400" y1="40" x2="400" y2="360" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8,4" opacity="0.6"/>
        
        {/* Sample pins for demo */}
        <g 
          className={cn(
            "cursor-pointer pin-element transition-all duration-200",
            highlightedPinId === '1' && "animate-pulse-highlight"
          )}
          onClick={() => onPinClick({ id: '1', x: 140, y: 132, severity: 'critical', status: 'open', issueType: 'membrane' })}
          onMouseEnter={(e) => handlePinHover({ id: '1', x: 140, y: 132, severity: 'critical', status: 'open', issueType: 'membrane' }, e)}
          onMouseLeave={handlePinLeave}
        >
          <path d="M140 120 C130 120, 124 126, 124 132 C124 138, 140 150, 140 150 C140 150, 156 138, 156 132 C156 126, 150 120, 140 120 Z" fill="#dc2626" stroke="#ffffff" strokeWidth="3"/>
          <circle cx="140" cy="132" r="8" fill="#ffffff"/>
          <text x="140" y="138" textAnchor="middle" className="text-red-600 text-sm font-bold">1</text>
        </g>
        
        <g 
          className={cn(
            "cursor-pointer pin-element transition-all duration-200",
            highlightedPinId === '2' && "animate-pulse-highlight"
          )}
          onClick={() => onPinClick({ id: '2', x: 300, y: 192, severity: 'high', status: 'ready', issueType: 'seam' })}
          onMouseEnter={(e) => handlePinHover({ id: '2', x: 300, y: 192, severity: 'high', status: 'ready', issueType: 'seam' }, e)}
          onMouseLeave={handlePinLeave}
        >
          <path d="M300 180 C290 180, 284 186, 284 192 C284 198, 300 210, 300 210 C300 210, 316 198, 316 192 C316 186, 310 180, 300 180 Z" fill="#f97316" stroke="#ffffff" strokeWidth="3"/>
          <circle cx="300" cy="192" r="8" fill="#ffffff"/>
          <text x="300" y="198" textAnchor="middle" className="text-orange-600 text-sm font-bold">2</text>
        </g>
        
        <g 
          className={cn(
            "cursor-pointer pin-element transition-all duration-200",
            highlightedPinId === '3' && "animate-pulse-highlight"
          )}
          onClick={() => onPinClick({ id: '3', x: 460, y: 252, severity: 'low', status: 'closed', issueType: 'insulation' })}
          onMouseEnter={(e) => handlePinHover({ id: '3', x: 460, y: 252, severity: 'low', status: 'closed', issueType: 'insulation' }, e)}
          onMouseLeave={handlePinLeave}
        >
          <path d="M460 240 C450 240, 444 246, 444 252 C444 258, 460 270, 460 270 C460 270, 476 258, 476 252 C476 246, 470 240, 460 240 Z" fill="#10b981" stroke="#ffffff" strokeWidth="3"/>
          <circle cx="460" cy="252" r="8" fill="#ffffff"/>
          <text x="460" y="258" textAnchor="middle" className="text-emerald-600 text-sm font-bold">3</text>
        </g>

        {/* Dynamic pins */}
        {pins.map((pin) => (
          <g
            key={pin.id}
            className={cn(
              "cursor-pointer pin-element transition-all duration-200",
              highlightedPinId === pin.id && "animate-pulse-highlight"
            )}
            onClick={() => onPinClick(pin)}
            onMouseEnter={(e) => handlePinHover(pin, e)}
            onMouseLeave={handlePinLeave}
          >
            <path
              d={`M${pin.x} ${pin.y - 12} C${pin.x - 10} ${pin.y - 12}, ${pin.x - 16} ${pin.y - 9}, ${pin.x - 16} ${pin.y - 6} C${pin.x - 16} ${pin.y - 3}, ${pin.x} ${pin.y + 3}, ${pin.x} ${pin.y + 3} C${pin.x} ${pin.y + 3}, ${pin.x + 16} ${pin.y - 3}, ${pin.x + 16} ${pin.y - 6} C${pin.x + 16} ${pin.y - 9}, ${pin.x + 10} ${pin.y - 12}, ${pin.x} ${pin.y - 12} Z`}
              fill={getSeverityColor(pin.severity)}
              stroke="#ffffff"
              strokeWidth="3"
            />
            <circle cx={pin.x} cy={pin.y - 6} r="8" fill="#ffffff"/>
            <text x={pin.x} y={pin.y - 2} textAnchor="middle" className="text-xs font-bold" fill={getSeverityColor(pin.severity)}>
              {pin.id.slice(-1)}
            </text>
          </g>
        ))}
      </svg>

      {/* Pin Legend */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Open Issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Ready for Inspection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span>Closed</span>
          </div>
        </div>
      </div>

      {/* Pin Preview Tooltip */}
      {hoveredPin && (
        <div
          className="fixed bg-white rounded-xl shadow-luxury-xl border border-luxury-200 p-4 max-w-sm z-50 pointer-events-none"
          style={{ left: previewPosition.x, top: previewPosition.y }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: getSeverityColor(hoveredPin.severity) }}
            >
              <span className="text-white font-bold text-sm">{hoveredPin.id}</span>
            </div>
            <div>
              <div className="font-semibold text-luxury-900">
                {pinData[hoveredPin.id]?.id || `PIN-${hoveredPin.id}`}
              </div>
              <div className="text-xs text-luxury-600">
                {pinData[hoveredPin.id]?.issueType || hoveredPin.issueType}
              </div>
            </div>
          </div>
          <div className="w-full h-32 bg-luxury-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-luxury-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div className="flex justify-between items-center">
            <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", getStatusColors(hoveredPin.status))}>
              {hoveredPin.status.charAt(0).toUpperCase() + hoveredPin.status.slice(1)}
            </span>
            <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", getSeverityColors(hoveredPin.severity))}>
              {hoveredPin.severity.charAt(0).toUpperCase() + hoveredPin.severity.slice(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}