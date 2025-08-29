'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
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
  planImageUrl?: string | null
  fallbackText?: string
}

export function InteractiveRoofPlan({ 
  pins, 
  onPinClick, 
  onAddPin, 
  highlightedPinId, 
  className,
  planImageUrl,
  fallbackText = "No roof plan image available"
}: InteractiveRoofPlanProps) {
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
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

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onAddPin || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100 // Convert to percentage
    const y = ((event.clientY - rect.top) / rect.height) * 100 // Convert to percentage
    
    // Only allow adding pins if there's an image loaded
    if (imageLoaded && !imageError) {
      onAddPin(x, y)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  return (
    <div className={cn("relative bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl overflow-hidden", className)}>
      {/* Main Container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full aspect-[4/3] min-h-[400px]",
          (imageLoaded && !imageError && onAddPin) && "cursor-crosshair"
        )}
        onClick={handleContainerClick}
      >
        {/* Roof Plan Image */}
        {planImageUrl && !imageError ? (
          <Image
            src={planImageUrl}
            alt="Roof Plan"
            fill
            className="object-contain bg-white"
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-gray-600 font-medium">{fallbackText}</p>
              <p className="text-gray-400 text-sm mt-2">Upload a roof plan image when creating a project</p>
            </div>
          </div>
        )}

        {/* Pin Overlay Layer */}
        {(imageLoaded && !imageError) && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Sample pins with percentage positioning */}
            <div 
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-200",
                highlightedPinId === '1' && "animate-pulse scale-110"
              )}
              style={{ left: '23%', top: '33%' }}
              onClick={(e) => {
                e.stopPropagation()
                onPinClick({ id: '1', x: 23, y: 33, severity: 'critical', status: 'open', issueType: 'membrane' })
              }}
              onMouseEnter={(e) => handlePinHover({ id: '1', x: 23, y: 33, severity: 'critical', status: 'open', issueType: 'membrane' }, e)}
              onMouseLeave={handlePinLeave}
            >
              <div className="relative">
                <div className="w-8 h-10 flex items-center justify-center">
                  <svg className="w-8 h-10" viewBox="0 0 24 28" fill="none">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" fill="#dc2626" stroke="#ffffff" strokeWidth="3"/>
                  </svg>
                  <span className="absolute text-white font-bold text-sm">1</span>
                </div>
              </div>
            </div>

            <div 
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-200",
                highlightedPinId === '2' && "animate-pulse scale-110"
              )}
              style={{ left: '50%', top: '48%' }}
              onClick={(e) => {
                e.stopPropagation()
                onPinClick({ id: '2', x: 50, y: 48, severity: 'high', status: 'ready', issueType: 'seam' })
              }}
              onMouseEnter={(e) => handlePinHover({ id: '2', x: 50, y: 48, severity: 'high', status: 'ready', issueType: 'seam' }, e)}
              onMouseLeave={handlePinLeave}
            >
              <div className="relative">
                <div className="w-8 h-10 flex items-center justify-center">
                  <svg className="w-8 h-10" viewBox="0 0 24 28" fill="none">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" fill="#f97316" stroke="#ffffff" strokeWidth="3"/>
                  </svg>
                  <span className="absolute text-white font-bold text-sm">2</span>
                </div>
              </div>
            </div>

            <div 
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-200",
                highlightedPinId === '3' && "animate-pulse scale-110"
              )}
              style={{ left: '77%', top: '63%' }}
              onClick={(e) => {
                e.stopPropagation()
                onPinClick({ id: '3', x: 77, y: 63, severity: 'low', status: 'closed', issueType: 'insulation' })
              }}
              onMouseEnter={(e) => handlePinHover({ id: '3', x: 77, y: 63, severity: 'low', status: 'closed', issueType: 'insulation' }, e)}
              onMouseLeave={handlePinLeave}
            >
              <div className="relative">
                <div className="w-8 h-10 flex items-center justify-center">
                  <svg className="w-8 h-10" viewBox="0 0 24 28" fill="none">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" fill="#10b981" stroke="#ffffff" strokeWidth="3"/>
                  </svg>
                  <span className="absolute text-white font-bold text-sm">3</span>
                </div>
              </div>
            </div>

            {/* Dynamic pins */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-200",
                  highlightedPinId === pin.id && "animate-pulse scale-110"
                )}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  onPinClick(pin)
                }}
                onMouseEnter={(e) => handlePinHover(pin, e)}
                onMouseLeave={handlePinLeave}
              >
                <div className="relative">
                  <div className="w-8 h-10 flex items-center justify-center">
                    <svg className="w-8 h-10" viewBox="0 0 24 28" fill="none">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" fill={getSeverityColor(pin.severity)} stroke="#ffffff" strokeWidth="3"/>
                    </svg>
                    <span className="absolute text-white font-bold text-xs">{pin.id.slice(-1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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