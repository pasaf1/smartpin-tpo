'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { usePins } from '@/lib/hooks/usePins'
import { PinMarker } from './PinMarker'
import type { PinWithRelations } from '@/lib/hooks/usePins'

interface PinCanvasProps {
  roofId: string
  backgroundImageUrl?: string
  className?: string
  onPinCreate?: (x: number, y: number) => void
  onPinSelect?: (pin: PinWithRelations | null) => void
  selectedPinId?: string | null
  editable?: boolean
}

interface CanvasState {
  zoom: number
  panX: number
  panY: number
  isDragging: boolean
  dragStart: { x: number; y: number }
  hasMoved: boolean
}

interface ScaleCache {
  scaleFactor: number
  offsetX: number
  offsetY: number
  containerWidth: number
  containerHeight: number
}

// Canvas dimensions - moved outside component to avoid initialization issues
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export function PinCanvas({
  roofId,
  backgroundImageUrl,
  className,
  onPinCreate,
  onPinSelect,
  selectedPinId,
  editable = true,
}: PinCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scaleCacheRef = useRef<ScaleCache | null>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    hasMoved: false
  })
  
  // State to control if panning is enabled (only when zoomed in)
  const [panningEnabled, setPanningEnabled] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // Calculate and cache scale factors for performance
  const calculateScaleFactors = useCallback((): ScaleCache | null => {
    if (!containerRef.current) return null
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerAspect = containerRect.width / containerRect.height
    const viewBoxAspect = CANVAS_WIDTH / CANVAS_HEIGHT

    let scaleFactor, offsetX, offsetY
    if (containerAspect < viewBoxAspect) {
      scaleFactor = containerRect.width / CANVAS_WIDTH
      offsetX = 0
      offsetY = (containerRect.height - CANVAS_HEIGHT * scaleFactor) / 2
    } else {
      scaleFactor = containerRect.height / CANVAS_HEIGHT
      offsetX = (containerRect.width - CANVAS_WIDTH * scaleFactor) / 2
      offsetY = 0
    }

    return {
      scaleFactor,
      offsetX,
      offsetY,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height
    }
  }, [])

  // Set up ResizeObserver to update scale cache
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      scaleCacheRef.current = calculateScaleFactors()
    })

    resizeObserver.observe(containerRef.current)
    scaleCacheRef.current = calculateScaleFactors()

    return () => resizeObserver.disconnect()
  }, [calculateScaleFactors])

  // Fetch pins for this roof
  const { data: pins = [], isLoading } = usePins(roofId)

  // Convert screen coordinates to SVG coordinates - OPTIMIZED VERSION with cache
  const screenToSvgCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current || !containerRef.current) return { x: 0, y: 0 }

    // Use cached scale factors if available, otherwise calculate
    let scaleData = scaleCacheRef.current
    if (!scaleData) {
      scaleData = calculateScaleFactors()
      if (!scaleData) return { x: 0, y: 0 }
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const containerX = clientX - containerRect.left
    const containerY = clientY - containerRect.top

    // Convert container coordinates to SVG coordinates using cached factors
    const svgX = (containerX - scaleData.offsetX) / scaleData.scaleFactor
    const svgY = (containerY - scaleData.offsetY) / scaleData.scaleFactor

    // Apply inverse of canvas transformations (only once!)
    const canvasX = (svgX - canvasState.panX) / canvasState.zoom
    const canvasY = (svgY - canvasState.panY) / canvasState.zoom

    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, canvasX)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, canvasY))
    }
  }, [canvasState.panX, canvasState.panY, canvasState.zoom, calculateScaleFactors])

  // Handle canvas click for pin creation (only if not dragging)
  const handleCanvasClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Don't create pin if we were dragging or clicking on existing pin
    if (canvasState.hasMoved || (event.target as Element).closest('.pin-marker')) return
    
    if (editable && onPinCreate) {
      const coords = screenToSvgCoords(event.clientX, event.clientY)
      onPinCreate(coords.x, coords.y)
    }
  }, [editable, onPinCreate, screenToSvgCoords, canvasState.hasMoved])

  // Handle mouse down for panning (only when zoomed in)
  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return // Only left mouse button
    
    // Only allow panning when zoomed in significantly
    if (canvasState.zoom <= 1.2) return
    
    setCanvasState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x: event.clientX, y: event.clientY },
      hasMoved: false
    }))
    
    event.preventDefault()
  }, [canvasState.zoom])

  // Handle mouse move for panning (only when zoomed and dragging enabled)
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasState.isDragging || canvasState.zoom <= 1.2) return

    const deltaX = event.clientX - canvasState.dragStart.x
    const deltaY = event.clientY - canvasState.dragStart.y
    
    // Track if we've moved more than 3 pixels (threshold for distinguishing click vs drag)
    const hasMoved = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3

    // Convert screen pixel deltas to SVG coordinate deltas using cached scale factors
    let scaleData = scaleCacheRef.current
    if (!scaleData) {
      scaleData = calculateScaleFactors()
      if (!scaleData) return
    }
    
    // Convert screen deltas to SVG deltas properly using cached scale factor
    const svgDeltaX = deltaX / scaleData.scaleFactor
    const svgDeltaY = deltaY / scaleData.scaleFactor

    setCanvasState(prev => ({
      ...prev,
      panX: prev.panX + svgDeltaX,
      panY: prev.panY + svgDeltaY,
      dragStart: { x: event.clientX, y: event.clientY },
      hasMoved: hasMoved || prev.hasMoved
    }))
  }, [canvasState.isDragging, canvasState.dragStart, canvasState.zoom, calculateScaleFactors])

  // Handle mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    // Reset hasMoved after a short delay to allow click events to process
    setTimeout(() => {
      setCanvasState(prev => ({
        ...prev,
        isDragging: false,
        hasMoved: false
      }))
    }, 10)
  }, [])

  // Handle wheel zoom with zoom-to-cursor
  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    // Only prevent default for zoom, not for regular scrolling
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
    }
    
    if (!containerRef.current) return
    
    const zoomFactor = 1.1
    const zoomIn = event.deltaY < 0
    const newZoom = zoomIn 
      ? Math.min(canvasState.zoom * zoomFactor, 5) 
      : Math.max(canvasState.zoom / zoomFactor, 0.1)

    // Use cached scale factors for zoom-to-cursor calculation
    let scaleData = scaleCacheRef.current
    if (!scaleData) {
      scaleData = calculateScaleFactors()
      if (!scaleData) return
    }

    // Calculate cursor position in SVG coordinates before zoom
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerX = event.clientX - containerRect.left
    const containerY = event.clientY - containerRect.top

    // Get cursor position in SVG coordinates (before pan/zoom) using cached factors
    const svgX = (containerX - scaleData.offsetX) / scaleData.scaleFactor
    const svgY = (containerY - scaleData.offsetY) / scaleData.scaleFactor

    // Calculate zoom delta
    const zoomDelta = newZoom / canvasState.zoom

    // Adjust pan to keep cursor position fixed
    const newPanX = svgX - (svgX - canvasState.panX) * zoomDelta
    const newPanY = svgY - (svgY - canvasState.panY) * zoomDelta

    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY
    }))
  }, [canvasState.zoom, canvasState.panX, canvasState.panY, calculateScaleFactors])

  // Handle pin selection
  const handlePinClick = useCallback((pin: PinWithRelations) => {
    onPinSelect?.(pin)
  }, [onPinSelect])

  // Transform calculation
  const transform = `translate(${canvasState.panX}, ${canvasState.panY}) scale(${canvasState.zoom})`

  if (isLoading) {
    return (
      <div className={cn('canvas-container flex items-center justify-center', className)}>
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'canvas-container relative overflow-hidden bg-muted/30',
        canvasState.isDragging && canvasState.zoom > 1.2 && 'cursor-move',
        canvasState.zoom <= 1.2 && 'cursor-crosshair',
        className
      )}
      style={{ height: '600px' }}
    >
      <svg
        ref={svgRef}
        className={cn(
          'canvas-svg w-full h-full',
          canvasState.isDragging && 'dragging'
        )}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Grid pattern */}
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            opacity="0.1"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
          
          {/* Pin shadow filter */}
          <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="rgb(0 0 0 / 0.1)"
            />
          </filter>
        </defs>

        <g transform={transform}>
          {/* Background image */}
          {backgroundImageUrl && (
            <image
              href={backgroundImageUrl}
              x="0"
              y="0"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              preserveAspectRatio="xMidYMid slice"
              opacity="0.8"
            />
          )}

          {/* Grid overlay */}
          <rect
            x="0"
            y="0"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="url(#grid)"
          />

          {/* Canvas border */}
          <rect
            x="0"
            y="0"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Render pins */}
          {pins.map((pin) => (
            <PinMarker
              key={pin.id}
              pin={pin as any} // Cast to ExtendedPin for compatibility
              isSelected={pin.id === selectedPinId}
              onClick={() => handlePinClick(pin)}
              editable={editable}
            />
          ))}

          {/* Canvas info */}
          <text
            x="10"
            y="25"
            fill="hsl(var(--muted-foreground))"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            Zoom: {Math.round(canvasState.zoom * 100)}% | Pins: {pins.length}
          </text>
        </g>
      </svg>

      {/* Toggle button for controls */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
        title={showControls ? "Hide Controls" : "Show Controls"}
      >
        {showControls ? "👁️" : "⚙️"}
      </button>

      {/* Canvas controls - Map Controls - moved to bottom right */}
      {showControls && (
        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-2 space-y-1">
          <h4 className="text-white text-xs font-semibold mb-1 text-center">Map Controls</h4>
          <button
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }))}
            className="w-full p-1.5 bg-white/20 border border-white/30 rounded-md shadow-sm hover:bg-white/30 transition-colors text-white text-xs"
            title="Zoom In"
          >
            🔍+ Zoom In
          </button>
          
          <button
            onClick={() => setCanvasState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }))}
            className="w-full p-1.5 bg-white/20 border border-white/30 rounded-md shadow-sm hover:bg-white/30 transition-colors text-white text-xs"
            title="Zoom Out"
          >
            🔍- Zoom Out
          </button>
          
          <button
            onClick={() => setCanvasState({ zoom: 1, panX: 0, panY: 0, isDragging: false, dragStart: { x: 0, y: 0 }, hasMoved: false })}
            className="w-full p-1.5 bg-white/20 border border-white/30 rounded-md shadow-sm hover:bg-white/30 transition-colors text-white text-xs"
            title="Reset View"
          >
            🏠 Reset
          </button>
          
          {editable && (
            <div className="text-xs text-white/70 mt-1 pt-1 border-t border-white/20 text-center">
              Click: Add Pin
            </div>
          )}
        </div>
      )}

      {/* Pin Status Legend - smaller and moved to top left */}
      {showControls && (
        <div className="absolute top-4 left-4">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 text-white">
            <h4 className="text-xs font-semibold mb-2">Pin Status</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}