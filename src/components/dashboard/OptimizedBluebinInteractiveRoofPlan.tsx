'use client'

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { useBluebinRealtimeSync } from '@/lib/hooks/useBluebinRealtimeSync'
import type { PinWithRelations, ChildPinWithUIFields } from '@/lib/types/relations'
import type { PinClickHandler, AddChildPinHandler } from '@/lib/types/handlers'
import { KonvaPerformanceMonitor } from '@/lib/konva/performance-monitor'
import { KonvaMemoryManager } from '@/lib/konva/memory-manager'
import { createViewportCuller } from '@/lib/konva/viewport-culling'

// Selective imports for smaller bundle size
import dynamic from 'next/dynamic'

// Dynamic import for Konva components to reduce initial bundle
const KonvaComponents = dynamic(() => import('@/lib/konva/optimized-components'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl">
      <div className="flex items-center gap-2 text-luxury-600">
        <div className="w-4 h-4 border-2 border-luxury-600 border-t-transparent rounded-full animate-spin"></div>
        Loading Canvas...
      </div>
    </div>
  )
})

// Mobile-first responsive constants - optimized for performance
const MOBILE_BREAKPOINT = 768
const MIN_SCALE = 0.3  // Allow more zoom out for better overview
const MAX_SCALE = 8    // Increased for detailed inspection
const MOBILE_PIN_SIZE = 18  // Slightly smaller for better performance
const DESKTOP_PIN_SIZE = 14
const VIEWPORT_PADDING = 100  // Padding for viewport culling
const PIN_CACHE_THRESHOLD = 50  // Start caching pins when count exceeds this

// Performance constants
const DEBOUNCE_DELAY = 16  // ~60fps
const BATCH_SIZE = 25  // Max items to render per frame
const MEMORY_CHECK_INTERVAL = 30000  // 30 seconds

interface Layer {
  id: string
  roof_id: string
  name: string
  type: 'base' | 'pins' | 'annotations' | 'qa' | 'measurements'
  visible: boolean
  locked: boolean
  z_index: number
  opacity: number
  settings: Record<string, any>
}

interface Annotation {
  id: string
  roof_id: string
  layer_id: string
  type: 'rectangle' | 'circle' | 'polygon' | 'polyline' | 'text' | 'arrow'
  data: any
  style: Record<string, any>
}

interface OptimizedBluebinInteractiveRoofPlanProps {
  roofId: string
  pins: PinWithRelations[]
  childPins: ChildPinWithUIFields[]
  layers: Layer[]
  annotations: Annotation[]
  roofPlanImageUrl?: string
  onPinClick: PinClickHandler
  onChildPinClick: (childPin: ChildPinWithUIFields, parentPin: PinWithRelations) => void
  onAddPin?: (x: number, y: number, layerId: string) => void
  onAddChildPin?: AddChildPinHandler
  onAddAnnotation?: (annotation: Omit<Annotation, 'id'>) => void
  selectedLayerId?: string
  selectedTool?: 'pin' | 'childPin' | 'annotation' | 'text' | 'measure'
  className?: string
  isMobile?: boolean
  // Performance options
  enableViewportCulling?: boolean
  enablePinCaching?: boolean
  maxRenderItems?: number
  performanceMode?: 'high' | 'balanced' | 'performance'
}

// Memoized pin renderer for better performance
const PinRenderer = memo(({
  pin,
  canvasPos,
  pinSize,
  isSelected,
  isMobile,
  onPinClick,
  getSeverityColor,
  getStatusColor
}: any) => (
  <div>
    {/* Pin implementation will be in the optimized components */}
  </div>
))

PinRenderer.displayName = 'PinRenderer'

export function OptimizedBluebinInteractiveRoofPlan({
  roofId,
  pins,
  childPins,
  layers,
  annotations,
  roofPlanImageUrl,
  onPinClick,
  onChildPinClick,
  onAddPin,
  onAddChildPin,
  onAddAnnotation,
  selectedLayerId,
  selectedTool = 'pin',
  className,
  isMobile = false,
  enableViewportCulling = true,
  enablePinCaching = true,
  maxRenderItems = 500,
  performanceMode = 'balanced'
}: OptimizedBluebinInteractiveRoofPlanProps) {
  // Canvas state management
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [roofImage, setRoofImage] = useState<HTMLImageElement | null>(null)
  const [selectedPin, setSelectedPin] = useState<PinWithRelations | null>(null)
  const [isAddingChildPin, setIsAddingChildPin] = useState(false)
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 800, height: 600 })
  const [isReady, setIsReady] = useState(false)

  // Performance monitoring state
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    visiblePins: 0
  })

  // Mobile touch handling
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [lastTouchPosition, setLastTouchPosition] = useState<{x: number, y: number} | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const performanceMonitor = useRef<KonvaPerformanceMonitor | null>(null)
  const memoryManager = useRef<KonvaMemoryManager | null>(null)
  const viewportCuller = useRef<any>(null)

  // Debounced update function for performance
  const debouncedUpdate = useRef<NodeJS.Timeout>()

  // BLUEBIN real-time sync integration
  const {
    isConnected,
    activeUsers,
    broadcast,
    broadcastPinOperation,
    broadcastChildPinOperation,
    updateCursorPosition,
    updateSelectedTool
  } = useBluebinRealtimeSync({
    roofId,
    onPinUpdate: (payload) => {
      console.log('Real-time pin update:', payload)
    },
    onChildPinUpdate: (payload) => {
      console.log('Real-time child pin update:', payload)
    },
    onLayerUpdate: (payload) => {
      console.log('Real-time layer update:', payload)
    },
    onAnnotationUpdate: (payload) => {
      console.log('Real-time annotation update:', payload)
    },
    onPresenceUpdate: (users) => {
      console.log('Active users updated:', users)
    }
  })

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined') {
      performanceMonitor.current = new KonvaPerformanceMonitor({
        onStatsUpdate: (stats) => {
          setPerformanceStats(prev => ({ ...prev, ...stats }))
        }
      })

      memoryManager.current = new KonvaMemoryManager({
        checkInterval: MEMORY_CHECK_INTERVAL,
        maxMemoryMB: performanceMode === 'performance' ? 50 : 100
      })

      if (enableViewportCulling) {
        viewportCuller.current = createViewportCuller({
          padding: VIEWPORT_PADDING
        })
      }

      setIsReady(true)

      return () => {
        performanceMonitor.current?.destroy()
        memoryManager.current?.destroy()
      }
    }
  }, [enableViewportCulling, performanceMode])

  // Responsive canvas sizing with performance optimization
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        const newDimensions = {
          width: Math.max(width, isMobile ? 320 : 600),
          height: Math.max(height, isMobile ? 480 : 400)
        }
        setDimensions(newDimensions)
        setViewport({ x: 0, y: 0, ...newDimensions })
      }
    }

    // Debounced resize handler for performance
    const debouncedResize = () => {
      if (debouncedUpdate.current) {
        clearTimeout(debouncedUpdate.current)
      }
      debouncedUpdate.current = setTimeout(updateDimensions, DEBOUNCE_DELAY)
    }

    updateDimensions()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', debouncedResize)
      return () => {
        window.removeEventListener('resize', debouncedResize)
        if (debouncedUpdate.current) {
          clearTimeout(debouncedUpdate.current)
        }
      }
    }
  }, [isMobile])

  // Optimized image loading with error handling and cleanup
  useEffect(() => {
    if (roofPlanImageUrl && typeof window !== 'undefined') {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = reject
      })

      // Timeout for image loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Image load timeout')), 10000)
      })

      Promise.race([loadPromise, timeoutPromise])
        .then(setRoofImage)
        .catch((error) => {
          console.warn('Failed to load roof image:', error)
          // Set a placeholder or continue without image
        })

      img.src = roofPlanImageUrl

      return () => {
        img.onload = null
        img.onerror = null
      }
    }
  }, [roofPlanImageUrl])

  // Update selected tool in real-time for collaboration
  useEffect(() => {
    updateSelectedTool(selectedTool, selectedLayerId || undefined)
  }, [selectedTool, selectedLayerId, updateSelectedTool])

  // Memoized utility functions
  const getSeverityColor = useCallback((severity: string | null | undefined): string => {
    switch (severity) {
      case 'Critical': return '#dc2626'
      case 'High': return '#f97316'
      case 'Medium': return '#eab308'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  }, [])

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'Open': return '#dc2626'
      case 'ReadyForInspection': return '#f97316'
      case 'Closed': return '#10b981'
      default: return '#6b7280'
    }
  }, [])

  const normalizedToCanvas = useCallback((normalized: { x: number, y: number }) => ({
    x: normalized.x * dimensions.width,
    y: normalized.y * dimensions.height
  }), [dimensions])

  const canvasToNormalized = useCallback((canvas: { x: number, y: number }) => ({
    x: canvas.x / dimensions.width,
    y: canvas.y / dimensions.height
  }), [dimensions])

  // Optimized viewport culling
  const visiblePins = useMemo(() => {
    if (!enableViewportCulling || !viewportCuller.current) {
      return pins.slice(0, maxRenderItems)
    }

    const filteredPins = pins.filter(pin => {
      // Note: Pins don't have layer_id in current schema - show all pins for now
      // const pinLayer = layers.find(l => l.id === pin.layer_id)
      // if (!pinLayer?.visible) return false

      const canvasPos = normalizedToCanvas({ x: pin.x, y: pin.y })
      return viewportCuller.current.isInViewport(canvasPos, viewport, scale)
    })

    setPerformanceStats(prev => ({ ...prev, visiblePins: filteredPins.length }))
    return filteredPins.slice(0, maxRenderItems)
  }, [pins, layers, viewport, scale, enableViewportCulling, maxRenderItems, normalizedToCanvas])

  const visibleChildPins = useMemo(() => {
    if (!enableViewportCulling) {
      return childPins.slice(0, maxRenderItems)
    }

    return childPins.filter(childPin => {
      const parent = pins.find(p => p.id === (childPin.parent_id || childPin.pin_id))
      if (!parent) return false

      // Layer filtering removed - layers table doesn't exist in schema
      // const layer = layers.find(l => l.id === parent.layer_id)
      // if (!layer?.visible) return false

      const canvasPos = normalizedToCanvas({ x: childPin.x || 0.5, y: childPin.y || 0.5 })
      return viewportCuller.current.isInViewport(canvasPos, viewport, scale)
    }).slice(0, maxRenderItems)
  }, [childPins, pins, layers, viewport, scale, enableViewportCulling, maxRenderItems, normalizedToCanvas])

  // Performance-optimized touch handlers
  const handleTouchStart = useCallback((e: any) => {
    performanceMonitor.current?.startFrame()

    const touches = e.evt.touches
    if (touches.length === 2) {
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setLastTouchDistance(distance)
    } else if (touches.length === 1) {
      setLastTouchPosition({ x: touches[0].clientX, y: touches[0].clientY })
    }
  }, [])

  const handleTouchMove = useCallback((e: any) => {
    e.evt.preventDefault()
    const touches = e.evt.touches

    if (touches.length === 2) {
      // Optimized pinch zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      if (lastTouchDistance > 0) {
        const scaleMultiplier = distance / lastTouchDistance
        const newScale = Math.min(Math.max(scale * scaleMultiplier, MIN_SCALE), MAX_SCALE)
        setScale(newScale)

        // Update viewport for culling
        setViewport(prev => ({
          ...prev,
          x: position.x,
          y: position.y
        }))
      }
      setLastTouchDistance(distance)
    } else if (touches.length === 1 && isDragging && lastTouchPosition) {
      // Optimized pan gesture
      const touch = touches[0]
      const stage = stageRef.current
      if (stage) {
        const deltaX = touch.clientX - lastTouchPosition.x
        const deltaY = touch.clientY - lastTouchPosition.y
        const newPosition = {
          x: position.x + deltaX,
          y: position.y + deltaY
        }
        setPosition(newPosition)
        stage.position(newPosition)
        setLastTouchPosition({ x: touch.clientX, y: touch.clientY })

        // Update viewport for culling
        setViewport(prev => ({
          ...prev,
          x: newPosition.x,
          y: newPosition.y
        }))
      }
    }

    performanceMonitor.current?.endFrame()
  }, [lastTouchDistance, lastTouchPosition, scale, isDragging, position])

  // Optimized wheel zoom with throttling
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    performanceMonitor.current?.startFrame()

    const scaleBy = 1.03  // Smoother zoom
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    }

    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, MAX_SCALE)
      : Math.max(oldScale / scaleBy, MIN_SCALE)

    setScale(newScale)
    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
    }
    stage.position(newPos)
    setPosition(newPos)

    // Update viewport for culling
    setViewport(prev => ({
      ...prev,
      x: newPos.x,
      y: newPos.y
    }))

    performanceMonitor.current?.endFrame()
  }, [])

  // Optimized canvas click handlers
  const handleStageClick = useCallback((e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (!clickedOnEmpty) return

    const stage = stageRef.current
    const pointerPosition = stage.getPointerPosition()
    const canvasPos = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale
    }

    // Check if within bounds
    if (canvasPos.x < 0 || canvasPos.x > dimensions.width ||
        canvasPos.y < 0 || canvasPos.y > dimensions.height) return

    const normalizedPos = canvasToNormalized(canvasPos)

    if (selectedTool === 'pin' && onAddPin && selectedLayerId) {
      onAddPin(normalizedPos.x, normalizedPos.y, selectedLayerId)
      broadcastPinOperation('create', {
        x: normalizedPos.x,
        y: normalizedPos.y,
        layerId: selectedLayerId
      })
    } else if (selectedTool === 'childPin' && selectedPin && onAddChildPin) {
      onAddChildPin(selectedPin, normalizedPos.x, normalizedPos.y)
      setIsAddingChildPin(false)
      broadcastChildPinOperation('create', {
        parentId: selectedPin.id,
        x: normalizedPos.x,
        y: normalizedPos.y
      })
    }
  }, [selectedTool, onAddPin, selectedLayerId, selectedPin, onAddChildPin, position, scale, dimensions, broadcastPinOperation, broadcastChildPinOperation, canvasToNormalized])

  const handlePinClick = useCallback((pin: PinWithRelations) => {
    setSelectedPin(pin)
    onPinClick(pin)

    if (selectedTool === 'childPin') {
      setIsAddingChildPin(true)
    }
  }, [onPinClick, selectedTool])

  const handleChildPinClick = useCallback((childPin: ChildPinWithUIFields) => {
    const parentPin = pins.find(p => p.id === (childPin.parent_id || childPin.pin_id))
    if (parentPin) {
      onChildPinClick(childPin, parentPin)
    }
  }, [pins, onChildPinClick])

  const pinSize = isMobile ? MOBILE_PIN_SIZE : DESKTOP_PIN_SIZE

  if (!isReady) {
    return (
      <div className={cn("relative bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl overflow-hidden flex items-center justify-center", className)}
           style={{ width: '100%', height: '100%', minHeight: isMobile ? '400px' : '500px' }}>
        <div className="flex items-center gap-2 text-luxury-600">
          <div className="w-4 h-4 border-2 border-luxury-600 border-t-transparent rounded-full animate-spin"></div>
          Initializing Canvas...
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl overflow-hidden", className)}
      style={{ width: '100%', height: '100%', minHeight: isMobile ? '400px' : '500px' }}
    >
      {/* Performance indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-10 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>FPS: {Math.round(performanceStats.fps)}</div>
          <div>Visible: {performanceStats.visiblePins}/{pins.length}</div>
          <div>Memory: {Math.round(performanceStats.memoryUsage)}MB</div>
        </div>
      )}

      {/* Real-time connection status */}
      <div className={cn(
        "absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-medium",
        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}>
        {isConnected ? "🟢 Live" : "🔴 Offline"}
      </div>

      {/* Tool indicator for mobile */}
      {isMobile && (
        <div className="absolute top-12 right-2 z-10 bg-black/70 text-white px-3 py-2 rounded-full text-sm font-medium">
          {selectedTool === 'childPin' && isAddingChildPin
            ? `Adding child to Pin ${selectedPin?.seq_number}`
            : `Tool: ${selectedTool}`}
        </div>
      )}

      {/* Optimized Konva Canvas */}
      <KonvaComponents
        ref={stageRef}
        dimensions={dimensions}
        scale={scale}
        position={position}
        roofImage={roofImage}
        visiblePins={visiblePins}
        visibleChildPins={visibleChildPins}
        layers={layers}
        annotations={annotations}
        pinSize={pinSize}
        isMobile={isMobile}
        selectedPin={selectedPin}
        isAddingChildPin={isAddingChildPin}
        onStageClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        onPinClick={handlePinClick}
        onChildPinClick={handleChildPinClick}
        getSeverityColor={getSeverityColor}
        getStatusColor={getStatusColor}
        normalizedToCanvas={normalizedToCanvas}
        enablePinCaching={enablePinCaching}
        performanceMode={performanceMode}
      />

      {/* Mobile pan/zoom instructions */}
      {isMobile && (
        <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded-lg">
          <div className="flex justify-between items-center">
            <span>Pinch to zoom • Drag to pan</span>
            <span>Scale: {Math.round(scale * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Export with display name for better debugging
OptimizedBluebinInteractiveRoofPlan.displayName = 'OptimizedBluebinInteractiveRoofPlan'