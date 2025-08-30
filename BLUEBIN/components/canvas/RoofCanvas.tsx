'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { useParentPins, useCreatePin } from '@/hooks/useSupabase'
import { useRealtimeSync, useBroadcastCursor } from '@/hooks/useRealtimeSync'
import { LayerPanel } from './LayerPanel'
import { ToolChest } from './ToolChest'
import { ParentPinComponent } from './ParentPinComponent'
import { PinDetailsModal } from './PinDetailsModal'

interface RoofCanvasProps {
  roofId: string
  planUrl?: string
}

interface Viewport {
  x: number
  y: number
  scale: number
}

// Mobile breakpoint detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])
  
  return isMobile
}

// Touch gesture handling for mobile
const useTouchGestures = (stageRef: React.RefObject<Konva.Stage>) => {
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [isMultiTouch, setIsMultiTouch] = useState(false)
  
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const [touch1, touch2] = [touches[0], touches[1]]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }
  
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length === 2) {
      setIsMultiTouch(true)
      setLastTouchDistance(getTouchDistance(touches))
      e.evt.preventDefault() // Prevent browser zoom
    } else {
      setIsMultiTouch(false)
    }
  }, [])
  
  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!stageRef.current) return
    
    const touches = e.evt.touches
    const stage = stageRef.current
    
    if (touches.length === 2 && isMultiTouch) {
      e.evt.preventDefault()
      
      const currentDistance = getTouchDistance(touches)
      if (lastTouchDistance > 0) {
        const scaleFactor = currentDistance / lastTouchDistance
        const oldScale = stage.scaleX()
        const newScale = Math.max(0.1, Math.min(oldScale * scaleFactor, 5))
        
        // Get center point between two touches
        const touch1 = touches[0]
        const touch2 = touches[1]
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        
        const mousePointTo = {
          x: (centerX - stage.x()) / oldScale,
          y: (centerY - stage.y()) / oldScale,
        }
        
        stage.scale({ x: newScale, y: newScale })
        
        const newPos = {
          x: centerX - mousePointTo.x * newScale,
          y: centerY - mousePointTo.y * newScale,
        }
        stage.position(newPos)
      }
      setLastTouchDistance(currentDistance)
    }
  }, [isMultiTouch, lastTouchDistance, stageRef])
  
  const handleTouchEnd = useCallback(() => {
    setIsMultiTouch(false)
    setLastTouchDistance(0)
  }, [])
  
  return {
    handleTouchStart,
    handleTouchMove, 
    handleTouchEnd
  }
}

export function RoofCanvas({ roofId, planUrl }: RoofCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const isMobile = useIsMobile()
  
  // State management
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 })
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [selectedPin, setSelectedPin] = useState<any>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['pins']))
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1920, height: 1080 })
  
  // Mobile-optimized viewport culling
  const viewportBounds = isMobile ? {
    minX: Math.max(0, (viewport.x * -1) / (viewport.scale * canvasDimensions.width)),
    maxX: Math.min(1, ((viewport.x * -1) + window.innerWidth) / (viewport.scale * canvasDimensions.width)),
    minY: Math.max(0, (viewport.y * -1) / (viewport.scale * canvasDimensions.height)),
    maxY: Math.min(1, ((viewport.y * -1) + window.innerHeight) / (viewport.scale * canvasDimensions.height))
  } : undefined
  
  // Data hooks with mobile optimization
  const { data: pins } = useParentPins(roofId, viewportBounds)
  const createPin = useCreatePin()
  const { broadcastCursor } = useBroadcastCursor(roofId, !isMobile) // Disable cursor on mobile for performance
  
  // Touch gesture handlers
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures(stageRef)
  
  // Real-time sync
  useRealtimeSync(roofId)
  
  // Canvas size management for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setCanvasDimensions({ width, height })
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    window.addEventListener('orientationchange', updateCanvasSize)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('orientationchange', updateCanvasSize)
    }
  }, [])
  
  // Desktop wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    if (isMobile) return // Disable wheel zoom on mobile
    
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    
    const oldScale = viewport.scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale
    }
    
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5)
    
    const newViewport = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
      scale: clampedScale
    }
    
    setViewport(newViewport)
    stage.scale({ x: clampedScale, y: clampedScale })
    stage.position({ x: newViewport.x, y: newViewport.y })
  }, [viewport, isMobile])
  
  // Stage click/tap for pin creation
  const handleStageClick = useCallback(async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (selectedTool !== 'pin') return
    if (!activeLayers.has('pins')) return // Can't create pins if layer is hidden
    
    const stage = e.target.getStage()
    const pointer = stage?.getPointerPosition()
    if (!stage || !pointer) return
    
    // Convert to normalized coordinates (0-1)
    const normalizedX = (pointer.x - viewport.x) / (viewport.scale * canvasDimensions.width)
    const normalizedY = (pointer.y - viewport.y) / (viewport.scale * canvasDimensions.height)
    
    // Clamp coordinates to canvas bounds
    const clampedX = Math.max(0, Math.min(1, normalizedX))
    const clampedY = Math.max(0, Math.min(1, normalizedY))
    
    try {
      // Get first active layer or default layer ID
      const layerId = Array.from(activeLayers)[0] || 'default-pins-layer'
      
      await createPin.mutateAsync({
        type: 'parent',
        roofId,
        layerId,
        x: clampedX,
        y: clampedY,
        title: `Pin ${(pins?.length || 0) + 1}`
      })
      
      // Reset tool to select after creation (mobile UX)
      if (isMobile) {
        setSelectedTool('select')
      }
    } catch (error) {
      console.error('Failed to create pin:', error)
      // TODO: Show error toast
    }
  }, [selectedTool, viewport, canvasDimensions, activeLayers, createPin, roofId, pins, isMobile])
  
  // Mouse/touch move tracking
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isMobile && e.evt.touches?.length > 1) return // Skip during multi-touch
    
    const stage = e.target.getStage()
    const pointer = stage?.getPointerPosition()
    if (!stage || !pointer) return
    
    const normalizedPos = {
      x: (pointer.x - viewport.x) / (viewport.scale * canvasDimensions.width),
      y: (pointer.y - viewport.y) / (viewport.scale * canvasDimensions.height)
    }
    
    setMousePos(normalizedPos)
    
    // Broadcast cursor position (desktop only)
    if (!isMobile) {
      broadcastCursor(normalizedPos.x, normalizedPos.y)
    }
  }, [viewport, canvasDimensions, isMobile, broadcastCursor])
  
  // Stage drag handling
  const handleStageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage
    const newViewport = {
      x: stage.x(),
      y: stage.y(),
      scale: viewport.scale
    }
    setViewport(newViewport)
  }, [viewport.scale])
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">
      {/* Layer Panel - Mobile: Bottom sheet, Desktop: Floating */}
      <LayerPanel
        roofId={roofId}
        activeLayers={activeLayers}
        isMobile={isMobile}
        onToggleLayer={(layerId) => {
          const newActive = new Set(activeLayers)
          if (newActive.has(layerId)) {
            newActive.delete(layerId)
          } else {
            newActive.add(layerId)
          }
          setActiveLayers(newActive)
        }}
      />
      
      {/* Tool Chest - Mobile: FAB, Desktop: Floating panel */}
      <ToolChest
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        mousePosition={mousePos}
        roofId={roofId}
        isMobile={isMobile}
      />
      
      {/* Main Konva Stage */}
      <Stage
        ref={stageRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.x}
        y={viewport.y}
        draggable={selectedTool === 'pan' || selectedTool === 'select'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick} // Mobile tap support
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleStageDragEnd}
      >
        {/* Background Layer */}
        <Layer>
          {planUrl && (
            <RoofPlanImage 
              src={planUrl} 
              width={canvasDimensions.width}
              height={canvasDimensions.height}
            />
          )}
        </Layer>
        
        {/* Pins Layer */}
        <Layer visible={activeLayers.has('pins')} listening={!isMobile || selectedTool !== 'pan'}>
          {pins?.map(pin => (
            <ParentPinComponent
              key={pin.id}
              pin={pin}
              scale={viewport.scale}
              canvasWidth={canvasDimensions.width}
              canvasHeight={canvasDimensions.height}
              isMobile={isMobile}
              onSelect={() => setSelectedPin(pin)}
            />
          ))}
        </Layer>
        
        {/* UI Overlay Layer */}
        <Layer listening={false}>
          {/* Cursor indicators, loading states, etc. */}
        </Layer>
      </Stage>
      
      {/* Pin Details Modal */}
      {selectedPin && (
        <PinDetailsModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// Background image component
function RoofPlanImage({ src, width, height }: { src: string; width: number; height: number }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setImage(img)
    img.onerror = (e) => console.error('Failed to load roof plan image:', e)
    img.src = src
  }, [src])
  
  if (!image) return null
  
  return (
    <KonvaImage
      image={image}
      width={width}
      height={height}
      listening={false} // Background is not interactive
    />
  )
}