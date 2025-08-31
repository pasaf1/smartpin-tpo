'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { usePins } from '@/lib/hooks/usePins'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { PinMarker } from './PinMarker'
import { RegionDrawer } from './RegionDrawer'
import { ProximityIndicator } from './ProximityIndicator'
import { LayerManager } from './LayerManager'
import type { PinWithRelations } from '@/lib/database.types'

interface SpatialCanvasProps {
  roofId: string
  backgroundImageUrl?: string
  className?: string
  onPinCreate?: (x: number, y: number) => void
  onPinSelect?: (pin: PinWithRelations | null) => void
  selectedPinId?: string | null
  editable?: boolean
  showSpatialFeatures?: boolean
  enableRegionDrawing?: boolean
  proximityRadius?: number // meters
}

interface Region {
  id: string
  name: string
  points: { x: number; y: number }[]
  color?: string
  strokeWidth?: number
}

interface SpatialData {
  nearbyPins: Array<{
    pin_id: string
    seq_number: number
    distance_meters: number
    x: number
    y: number
  }>
  regionStats: {
    total_pins: number
    pins_per_zone: Record<string, number>
    pin_density: number
    coverage_area: number
  }
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export function SpatialPinCanvas({
  roofId,
  backgroundImageUrl,
  className,
  onPinCreate,
  onPinSelect,
  selectedPinId,
  editable = true,
  showSpatialFeatures = true,
  enableRegionDrawing = false,
  proximityRadius = 10
}: SpatialCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabaseClient()
  
  const [canvasState, setCanvasState] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    hasMoved: false
  })
  
  const [regions, setRegions] = useState<Region[]>([])
  const [spatialData, setSpatialData] = useState<SpatialData | null>(null)
  const [isDrawingRegion, setIsDrawingRegion] = useState(false)
  const [currentDrawingRegion, setCurrentDrawingRegion] = useState<{ x: number; y: number }[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null)
  const [layers, setLayers] = useState([
    { name: 'Issues', visible: true, opacity: 1, color: '#ef4444' },
    { name: 'Regions', visible: true, opacity: 0.3, color: '#3b82f6' },
    { name: 'Proximity', visible: showSpatialFeatures, opacity: 0.5, color: '#f59e0b' },
    { name: 'Spatial Analysis', visible: showSpatialFeatures, opacity: 0.7, color: '#10b981' }
  ])
  
  const { data: pins = [], isLoading } = usePins(roofId)
  
  // Spatial validation function
  const validatePinLocation = useCallback(async (x: number, y: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('validate_pin_location', {
          p_roof_id: roofId,
          p_x: x / CANVAS_WIDTH,  // Normalize to 0-1 coordinates
          p_y: y / CANVAS_HEIGHT
        })
      
      if (error) {
        console.warn('Spatial validation error:', error)
        return true // Allow creation if validation fails
      }
      
      return data || true
    } catch (error) {
      console.warn('Spatial validation failed:', error)
      return true
    }
  }, [roofId, supabase])
  
  // Find nearby pins for spatial analysis
  const findNearbyPins = useCallback(async (x: number, y: number) => {
    try {
      const { data, error } = await supabase
        .rpc('find_nearby_pins', {
          p_roof_id: roofId,
          p_x: x / CANVAS_WIDTH,
          p_y: y / CANVAS_HEIGHT,
          p_radius_meters: proximityRadius
        })
      
      if (error) {
        console.warn('Nearby pins query error:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.warn('Nearby pins query failed:', error)
      return []
    }
  }, [roofId, supabase, proximityRadius])
  
  // Get region statistics
  const getRegionStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_region_statistics', {
          p_roof_id: roofId
        })
      
      if (error) {
        console.warn('Region statistics error:', error)
        return null
      }
      
      return data?.[0] || null
    } catch (error) {
      console.warn('Region statistics failed:', error)
      return null
    }
  }, [roofId, supabase])
  
  // Enhanced pin creation with spatial validation
  const handleSpatialPinCreate = useCallback(async (x: number, y: number) => {
    if (!editable || !onPinCreate) return
    
    // Validate location before creation
    const isValid = await validatePinLocation(x, y)
    if (!isValid) {
      // Show user feedback
      setHoveredPoint({ x, y })
      setTimeout(() => setHoveredPoint(null), 2000)
      return
    }
    
    // Find nearby pins for context
    const nearby = await findNearbyPins(x, y)
    if (nearby.length > 0) {
      console.log(`Creating pin near ${nearby.length} existing pins`)
    }
    
    // Create the pin with spatial context
    try {
      const { data, error } = await supabase
        .rpc('create_pin_with_spatial_validation', {
          p_roof_id: roofId,
          p_x: x / CANVAS_WIDTH,
          p_y: y / CANVAS_HEIGHT,
          p_zone: getZoneFromCoordinates(x, y)
        })
      
      if (error) {
        console.error('Spatial pin creation error:', error)
        return
      }
      
      // Update spatial data
      setSpatialData(prev => prev ? {
        ...prev,
        nearbyPins: nearby
      } : null)
      
      // Call the original callback
      onPinCreate(x, y)
      
    } catch (error) {
      console.error('Pin creation failed:', error)
    }
  }, [editable, onPinCreate, validatePinLocation, findNearbyPins, roofId, supabase])
  
  // Determine zone from coordinates (based on regions)
  const getZoneFromCoordinates = useCallback((x: number, y: number): string => {
    for (const region of regions) {
      if (isPointInPolygon({ x, y }, region.points)) {
        return region.name
      }
    }
    return 'general'
  }, [regions])
  
  // Point in polygon test
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const pi = polygon[i], pj = polygon[j]
      if (((pi.y > point.y) !== (pj.y > point.y)) &&
          (point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
        inside = !inside
      }
    }
    return inside
  }
  
  // Load region statistics on mount and pin changes
  useEffect(() => {
    if (showSpatialFeatures) {
      getRegionStatistics().then(setSpatialData)
    }
  }, [showSpatialFeatures, getRegionStatistics, pins])
  
  // Mouse move handler with spatial feedback
  const handleMouseMove = useCallback(async (event: React.MouseEvent<SVGSVGElement>) => {
    // ... existing pan logic ...
    
    if (showSpatialFeatures && !canvasState.isDragging) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH
      const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
      
      // Debounce spatial queries
      const nearby = await findNearbyPins(x, y)
      setSpatialData(prev => ({
        ...prev!,
        nearbyPins: nearby
      }))
    }
  }, [showSpatialFeatures, canvasState.isDragging, findNearbyPins])
  
  // Region drawing handlers
  const handleRegionDrawingClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!enableRegionDrawing || !isDrawingRegion) return
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    
    setCurrentDrawingRegion(prev => [...prev, { x, y }])
  }, [enableRegionDrawing, isDrawingRegion])
  
  const finishRegionDrawing = useCallback(() => {
    if (currentDrawingRegion.length < 3) {
      setCurrentDrawingRegion([])
      setIsDrawingRegion(false)
      return
    }
    
    const newRegion: Region = {
      id: `region-${Date.now()}`,
      name: `Region ${regions.length + 1}`,
      points: currentDrawingRegion,
      color: '#3b82f6'
    }
    
    setRegions(prev => [...prev, newRegion])
    setCurrentDrawingRegion([])
    setIsDrawingRegion(false)
  }, [currentDrawingRegion, regions.length])
  
  const transform = `translate(${canvasState.panX}, ${canvasState.panY}) scale(${canvasState.zoom})`
  
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-muted-foreground">Loading spatial canvas...</div>
      </div>
    )
  }
  
  return (
    <div className={cn('relative', className)}>
      {/* Layer Management */}
      <LayerManager 
        layers={layers}
        onLayerToggle={(layerName, visible) => {
          setLayers(prev => prev.map(layer => 
            layer.name === layerName ? { ...layer, visible } : layer
          ))
        }}
        onOpacityChange={(layerName, opacity) => {
          setLayers(prev => prev.map(layer => 
            layer.name === layerName ? { ...layer, opacity } : layer
          ))
        }}
      />
      
      {/* Spatial Statistics Panel */}
      {showSpatialFeatures && spatialData && (
        <div className="absolute top-4 left-4 bg-background/95 p-3 rounded-lg border shadow-lg max-w-sm">
          <h3 className="font-semibold text-sm mb-2">Spatial Analysis</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Total Pins: {spatialData.regionStats?.total_pins || pins.length}</div>
            <div>Pin Density: {spatialData.regionStats?.pin_density?.toFixed(4) || 'N/A'} pins/m²</div>
            <div>Coverage Area: {spatialData.regionStats?.coverage_area?.toFixed(0) || 'N/A'} m²</div>
            {spatialData.nearbyPins.length > 0 && (
              <div className="pt-1 border-t">
                <div>Nearby Pins: {spatialData.nearbyPins.length}</div>
                <div className="text-xs">
                  Closest: {spatialData.nearbyPins[0]?.distance_meters?.toFixed(1)}m
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-muted/30"
        style={{ height: '600px' }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          onClick={enableRegionDrawing ? handleRegionDrawingClick : undefined}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <pattern id="spatial-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <g transform={transform}>
            {/* Background */}
            {backgroundImageUrl && (
              <image
                href={backgroundImageUrl}
                x="0" y="0"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                preserveAspectRatio="xMidYMid slice"
                opacity="0.8"
              />
            )}
            
            {/* Spatial grid */}
            <rect
              x="0" y="0"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="url(#spatial-grid)"
            />
            
            {/* Regions layer */}
            {layers.find(l => l.name === 'Regions')?.visible && (
              <g opacity={layers.find(l => l.name === 'Regions')?.opacity}>
                {regions.map(region => (
                  <polygon
                    key={region.id}
                    points={region.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={region.color || '#3b82f6'}
                    fillOpacity="0.2"
                    stroke={region.color || '#3b82f6'}
                    strokeWidth={region.strokeWidth || 2}
                  />
                ))}
                
                {/* Current drawing region */}
                {isDrawingRegion && currentDrawingRegion.length > 0 && (
                  <>
                    <polyline
                      points={currentDrawingRegion.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                    />
                    {currentDrawingRegion.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill="#3b82f6"
                      />
                    ))}
                  </>
                )}
              </g>
            )}
            
            {/* Proximity indicators */}
            {layers.find(l => l.name === 'Proximity')?.visible && showSpatialFeatures && (
              <g opacity={layers.find(l => l.name === 'Proximity')?.opacity}>
                {pins.map(pin => (
                  <ProximityIndicator
                    key={`proximity-${pin.id}`}
                    centerX={pin.x * CANVAS_WIDTH}
                    centerY={pin.y * CANVAS_HEIGHT}
                    radius={proximityRadius}
                    nearbyPins={spatialData?.nearbyPins || []}
                  />
                ))}
              </g>
            )}
            
            {/* Pins layer */}
            {layers.find(l => l.name === 'Issues')?.visible && (
              <g opacity={layers.find(l => l.name === 'Issues')?.opacity}>
                {pins.map(pin => (
                  <PinMarker
                    key={pin.id}
                    pin={pin as any}
                    isSelected={pin.id === selectedPinId}
                    onClick={() => onPinSelect?.(pin)}
                    editable={editable}
                    showSpatialInfo={showSpatialFeatures}
                  />
                ))}
              </g>
            )}
            
            {/* Hover feedback */}
            {hoveredPoint && (
              <g>
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="15"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  opacity="0.7"
                />
                <text
                  x={hoveredPoint.x}
                  y={hoveredPoint.y - 20}
                  fill="#ef4444"
                  fontSize="12"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Invalid Location
                </text>
              </g>
            )}
            
            {/* Spatial analysis overlay */}
            {layers.find(l => l.name === 'Spatial Analysis')?.visible && spatialData && (
              <g opacity={layers.find(l => l.name === 'Spatial Analysis')?.opacity}>
                {/* Heat map visualization for pin density */}
                {/* This would require additional computation */}
              </g>
            )}
          </g>
        </svg>
        
        {/* Region drawing controls */}
        {enableRegionDrawing && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setIsDrawingRegion(!isDrawingRegion)}
              className={cn(
                "px-3 py-1 text-sm border rounded",
                isDrawingRegion 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background hover:bg-muted"
              )}
            >
              {isDrawingRegion ? 'Drawing Region...' : 'Draw Region'}
            </button>
            
            {isDrawingRegion && (
              <button
                onClick={finishRegionDrawing}
                disabled={currentDrawingRegion.length < 3}
                className="px-3 py-1 text-sm border rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                Finish Region
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}