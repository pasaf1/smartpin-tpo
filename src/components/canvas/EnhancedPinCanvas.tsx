'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { usePins } from '@/lib/hooks/usePins'
import { useCanvasStore } from '@/lib/stores/canvas-store'
import { useCanvasCore } from '@/lib/services/canvas-core'
import { PerformanceService } from '@/lib/services/performance-service'
import { EnhancedPin } from '@/lib/layer-types'
import DEFAULT_LAYER_CONFIGS from '@/lib/layer-constants'
import type { PinWithRelations } from '@/lib/hooks/usePins'

// Dynamic imports for Konva components to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Stage })), { ssr: false })
const Layer = dynamic(() => import('react-konva').then(mod => ({ default: mod.Layer })), { ssr: false })
const KonvaImage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Image })), { ssr: false })
const Circle = dynamic(() => import('react-konva').then(mod => ({ default: mod.Circle })), { ssr: false })
const Text = dynamic(() => import('react-konva').then(mod => ({ default: mod.Text })), { ssr: false })
const Group = dynamic(() => import('react-konva').then(mod => ({ default: mod.Group })), { ssr: false })
const Rect = dynamic(() => import('react-konva').then(mod => ({ default: mod.Rect })), { ssr: false })

interface EnhancedPinCanvasProps {
  roofId: string
  backgroundImageUrl?: string
  className?: string
  onPinCreate?: (x: number, y: number) => void
  onPinSelect?: (pin: PinWithRelations | null) => void
  selectedPinId?: string | null
  editable?: boolean
  enableCanvasCore?: boolean // New: Enable Canvas Core features
}

interface PinMarkerProps {
  pin: PinWithRelations
  stageSize: { width: number; height: number }
  onPinClick: (pin: PinWithRelations) => void
  isSelected: boolean
  scale: number
}

// רכיב PinMarker עם Konva ו-Canvas Core
const KonvaPinMarker = ({ pin, stageSize, onPinClick, isSelected, scale, canvasCore }: PinMarkerProps & { canvasCore?: any }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Use Canvas Core if available, otherwise fallback to simple calculation
  let x, y
  if (canvasCore) {
    const screenCoords = canvasCore.normalizedToScreen(pin.x, pin.y)
    x = screenCoords.x
    y = screenCoords.y
  } else {
    x = pin.x * stageSize.width
    y = pin.y * stageSize.height
  }
  
  // חישוב צבע לפי סטטוס
  const getPinColor = (status: string) => {
    switch (status) {
      case 'Open': return '#ef4444'           // אדום
      case 'ReadyForInspection': return '#f59e0b' // כתום  
      case 'Closed': return '#22c55e'         // ירוק
      default: return '#6b7280'               // אפור
    }
  }
  
  // חישוב גודל פין לפי מספר ילדים
  const getPinSize = () => {
    const baseSize = 15 / scale // התאמה לזום
    const childCount = pin.children_total || 0
    return Math.max(baseSize + (childCount * 2), 8) // מינימום 8 פיקסלים
  }
  
  const color = getPinColor(pin.status)
  const size = getPinSize()
  
  return (
    <Group>
      {/* עיגול הפין */}
      <Circle
        x={x}
        y={y}
        radius={size}
        fill={color}
        stroke={isSelected ? '#ffffff' : '#000000'}
        strokeWidth={isSelected ? 3 : 2}
        onClick={() => onPinClick(pin)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        shadowColor="black"
        shadowBlur={isHovered || isSelected ? 10 : 5}
        shadowOpacity={isHovered || isSelected ? 0.8 : 0.5}
        scaleX={isHovered ? 1.1 : 1}
        scaleY={isHovered ? 1.1 : 1}
      />
      
      {/* מספר הפין */}
      <Text
        x={x - size/2}
        y={y - size/3}
        text={pin.seq_number?.toString() || '?'}
        fontSize={Math.max(12 / scale, 8)}
        fontFamily="Arial"
        fill="white"
        fontStyle="bold"
        align="center"
        width={size}
        onClick={() => onPinClick(pin)}
      />
      
      {/* מספר ילדים אם קיימים */}
      {pin.children_total && pin.children_total > 0 && (
        <Text
          x={x + size + 2}
          y={y - size}
          text={`+${pin.children_total}`}
          fontSize={Math.max(10 / scale, 6)}
          fontFamily="Arial"
          fill={color}
          fontStyle="bold"
        />
      )}
      
      {/* אינדיקטור לבחירה */}
      {isSelected && (
        <Circle
          x={x}
          y={y}
          radius={size + 8}
          stroke="#ffffff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}
    </Group>
  )
}

export function EnhancedPinCanvas({
  roofId,
  backgroundImageUrl,
  className,
  onPinCreate,
  onPinSelect,
  selectedPinId,
  editable = true,
  enableCanvasCore = true, // Enable Canvas Core by default
}: EnhancedPinCanvasProps) {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  // Canvas Core integration
  const canvasCore = useCanvasCore()
  const performanceService = new PerformanceService()
  
  // Canvas store state (simplified)
  const { 
    viewport, 
    layers, 
    selection,
    setZoom,
    setPan,
    selectPin,
    clearSelection,
    zoomIn: storeZoomIn,
    zoomOut: storeZoomOut,
    resetViewport: storeResetViewport
  } = useCanvasStore()
  
  // Legacy state for backward compatibility
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false)
  
  // Fetch pins for this roof
  const { data: pins = [], isLoading } = usePins(roofId)

  // הוודא שאנחנו בצד לקוח
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Setup Canvas Core
  useEffect(() => {
    if (enableCanvasCore && containerRef.current) {
      canvasCore.setupResizeObserver(containerRef.current)
      
      // Canvas Core setup - Set content size and viewport
      // Assuming roof plan is 1200x800 pixels intrinsically
      canvasCore.setContentSize(1200, 800)
      
      if (containerRef.current) {
        canvasCore.setupResizeObserver(containerRef.current)
      }
    }

    return () => {
      if (enableCanvasCore) {
        canvasCore.destroy()
      }
    }
  }, [canvasCore, enableCanvasCore])

  // טעינת תמונת הרקע
  useEffect(() => {
    if (!backgroundImageUrl) return
    
    const imageObj = new window.Image()
    imageObj.onload = () => {
      setBackgroundImage(imageObj)
      // התאמת גודל הקנבס לתמונה
      const aspectRatio = imageObj.width / imageObj.height
      const maxWidth = 1200
      const maxHeight = 800
      
      let newWidth = imageObj.width
      let newHeight = imageObj.height
      
      if (newWidth > maxWidth) {
        newWidth = maxWidth
        newHeight = newWidth / aspectRatio
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight
        newWidth = newHeight * aspectRatio
      }
      
      setStageSize({ width: newWidth, height: newHeight })
    }
    imageObj.crossOrigin = 'anonymous'
    imageObj.src = backgroundImageUrl
  }, [backgroundImageUrl])

  // עדכון dragging enabled לפי זום
  useEffect(() => {
    setIsDraggingEnabled(scale > 1.2)
  }, [scale])

  // Handle canvas click for pin creation with Canvas Core support
  const handleStageClick = useCallback((e: any) => {
    // בדיקה שלא לחצנו על פין קיים
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Image') {
      if (editable && onPinCreate) {
        const pos = e.target.getStage().getPointerPosition()
        
        if (enableCanvasCore) {
          // Use Canvas Core for precise coordinate transformation
          const normalized = canvasCore.screenToNormalized(pos.x, pos.y)
          
          // Call canvas click handler with normalized coordinates
          onPinCreate(normalized.x, normalized.y)
          
          // Clear selection using store
          clearSelection()
        } else {
          // Legacy coordinate calculation
          const normalizedX = (pos.x - position.x) / scale / stageSize.width
          const normalizedY = (pos.y - position.y) / scale / stageSize.height
          
          // וודא שהקואורדינטות בטווח תקין
          if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
            onPinCreate(normalizedX, normalizedY)
          }
        }
      }
    }
  }, [
    editable, 
    onPinCreate, 
    enableCanvasCore, 
    canvasCore, 
    clearSelection, 
    position, 
    scale, 
    stageSize
  ])

  // Handle wheel zoom with Canvas Core support
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    
    if (enableCanvasCore) {
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      // Use Canvas Core for precise zoom around pointer
      const factor = e.evt.deltaY > 0 ? 0.9 : 1.1
      canvasCore.zoomAtPointer(factor, pointer.x, pointer.y)
      
      // Update store with new viewport
      const newViewport = canvasCore.getViewport()
      setZoom(newViewport.scale)
      setPan({ x: newViewport.pan.x, y: newViewport.pan.y })
    } else {
      // Legacy zoom behavior
      const scaleBy = 1.1
      const stage = e.target.getStage()
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const boundedScale = Math.max(0.5, Math.min(newScale, 4))
      
      setScale(boundedScale)
      
      // זום אל המיקום של העכבר
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }
      
      const newPos = {
        x: pointer.x - mousePointTo.x * boundedScale,
        y: pointer.y - mousePointTo.y * boundedScale,
      }
      
      setPosition(newPos)
    }
  }, [enableCanvasCore, canvasCore, setZoom, setPan])

  // פונקציות זום עם תמיכה ב-Canvas Core
  const zoomIn = useCallback(() => {
    if (enableCanvasCore) {
      storeZoomIn()
    } else {
      const newScale = Math.min(scale * 1.2, 4)
      setScale(newScale)
    }
  }, [enableCanvasCore, storeZoomIn, scale])

  const zoomOut = useCallback(() => {
    if (enableCanvasCore) {
      storeZoomOut()
    } else {
      const newScale = Math.max(scale / 1.2, 0.5)
      setScale(newScale)
    }
  }, [enableCanvasCore, storeZoomOut, scale])

  const resetView = useCallback(() => {
    if (enableCanvasCore) {
      storeResetViewport()
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [enableCanvasCore, storeResetViewport])

  // טיפול בבחירת פין
  const handlePinClick = useCallback((pin: PinWithRelations) => {
    onPinSelect?.(pin)
  }, [onPinSelect])

  if (!isClient) {
    return (
      <div className={cn('flex items-center justify-center h-96 bg-gray-100 rounded-lg', className)}>
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative border rounded-lg overflow-hidden bg-gray-100', className)}>
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={Math.min(stageSize.width, 1200)}
        height={Math.min(stageSize.height, 600)}
        scaleX={enableCanvasCore ? viewport.scale : scale}
        scaleY={enableCanvasCore ? viewport.scale : scale}
        x={enableCanvasCore ? viewport.pan.x : position.x}
        y={enableCanvasCore ? viewport.pan.y : position.y}
        draggable={enableCanvasCore ? false : isDraggingEnabled} // Canvas Core handles dragging differently
        onClick={handleStageClick}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (!enableCanvasCore) {
            setPosition({
              x: e.target.x(),
              y: e.target.y(),
            })
          }
        }}
      >
        {/* Background Layer - Static content */}
        <Layer name="background">
          {/* תמונת הרקע */}
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              width={stageSize.width}
              height={stageSize.height}
            />
          )}
          
          {/* Grid for reference when using Canvas Core and zoomed in */}
          {enableCanvasCore && viewport.zoom > 2 && (
            <>
              {Array.from({ length: 11 }, (_, i) => (
                <React.Fragment key={`grid-${i}`}>
                  {/* Vertical lines */}
                  <Rect
                    x={(i * stageSize.width) / (10 * viewport.zoom)}
                    y={0}
                    width={1 / viewport.zoom}
                    height={stageSize.height / viewport.zoom}
                    fill="rgba(156, 163, 175, 0.2)"
                  />
                  {/* Horizontal lines */}
                  <Rect
                    x={0}
                    y={(i * stageSize.height) / (10 * viewport.zoom)}
                    width={stageSize.width / viewport.zoom}
                    height={1 / viewport.zoom}
                    fill="rgba(156, 163, 175, 0.2)"
                  />
                </React.Fragment>
              ))}
            </>
          )}
        </Layer>

        {/* FastLayer - Pins only, optimized for performance */}
        <Layer name="pins" listening={false}>
          {/* רינדור הפינים */}
          {pins.map((pin) => (
            <KonvaPinMarker
              key={pin.id}
              pin={pin}
              stageSize={stageSize}
              onPinClick={handlePinClick}
              isSelected={pin.id === selectedPinId}
              scale={enableCanvasCore ? viewport.zoom : scale}
            />
          ))}
        </Layer>

        {/* UI Layer - Controls and overlays */}
        <Layer name="ui">
          {/* Pin creation preview or other UI elements */}
        </Layer>
      </Stage>

      {/* פקדי זום */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-black/20 backdrop-blur-sm rounded-lg p-2">
        <button
          onClick={zoomIn}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded border border-white/30"
          title="Zoom In"
        >
          🔍+ 
        </button>
        <button
          onClick={zoomOut}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded border border-white/30"
          title="Zoom Out"
        >
          🔍-
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded border border-white/30"
          title="Reset View"
        >
          🏠
        </button>
      </div>

      {/* מידע על הקנבס */}
      <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
        <div>Zoom: {Math.round((enableCanvasCore ? viewport.zoom : scale) * 100)}%</div>
        <div>Pins: {pins.length}</div>
        {enableCanvasCore && <div>🚀 Canvas Core</div>}
        {!enableCanvasCore && isDraggingEnabled && <div>🔄 Drag enabled</div>}
        {process.env.NODE_ENV === 'development' && (
          <>
            <div>Pan: {enableCanvasCore ? 
              `${viewport.pan.x.toFixed(2)}, ${viewport.pan.y.toFixed(2)}` :
              `${position.x.toFixed(0)}, ${position.y.toFixed(0)}`
            }</div>
            <div>Performance: {performanceService.getStats().averages.fps.toFixed(1)} FPS</div>
          </>
        )}
      </div>

      {/* אגדת סטטוס פינים */}
      <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white">
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
        {editable && (
          <div className="text-xs text-white/70 mt-2 pt-2 border-t border-white/20">
            Click to add pin
          </div>
        )}
      </div>
    </div>
  )
}
