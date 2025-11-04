'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Image, Group, Circle, Text, Line, Rect } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { cn } from '@/lib/utils'
import { useBluebinRealtimeSync } from '@/lib/hooks/useBluebinRealtimeSync'
import { getSupabase } from '@/lib/supabase'
import type { PinWithRelations, ChildPinWithUIFields } from '@/lib/database.types'
import type { PinClickHandler, AddChildPinHandler } from '@/lib/types/handlers'

// UIChildPin is same as ChildPinWithUIFields
type UIChildPin = ChildPinWithUIFields

// Mobile-first responsive constants
const MOBILE_BREAKPOINT = 768
const MIN_SCALE = 0.5
const MAX_SCALE = 5
const MOBILE_PIN_SIZE = 20
const DESKTOP_PIN_SIZE = 16

// Using unified types from database.types.ts

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

interface BluebinInteractiveRoofPlanProps {
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
}

export function BluebinInteractiveRoofPlan({
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
  isMobile = false
}: BluebinInteractiveRoofPlanProps) {
  // Canvas state management
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [roofImage, setRoofImage] = useState<HTMLImageElement | null>(null)
  const [selectedPin, setSelectedPin] = useState<PinWithRelations | null>(null)
  const [isAddingChildPin, setIsAddingChildPin] = useState(false)

  // Mobile touch handling
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [lastTouchPosition, setLastTouchPosition] = useState<{x: number, y: number} | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
      // Handle optimistic updates or trigger data refetch
    },
    onChildPinUpdate: (payload) => {
      console.log('Real-time child pin update:', payload)
      // Handle optimistic updates or trigger data refetch
    },
    onLayerUpdate: (payload) => {
      console.log('Real-time layer update:', payload)
      // Update layers state or trigger refetch
    },
    onAnnotationUpdate: (payload) => {
      console.log('Real-time annotation update:', payload)
      // Update annotations state or trigger refetch
    },
    onPresenceUpdate: (users) => {
      console.log('Active users updated:', users)
      // Update collaborative UI indicators
    }
  })

  // Responsive canvas sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(width, isMobile ? 320 : 600),
          height: Math.max(height, isMobile ? 480 : 400)
        })
      }
    }

    updateDimensions()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions)
      return () => window.removeEventListener('resize', updateDimensions)
    }
  }, [isMobile])

  // Load roof plan image
  useEffect(() => {
    if (roofPlanImageUrl && typeof window !== 'undefined') {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => setRoofImage(img)
      img.src = roofPlanImageUrl
    }
  }, [roofPlanImageUrl])

  // Update selected tool in real-time for collaboration
  useEffect(() => {
    updateSelectedTool(selectedTool, selectedLayerId || undefined)
  }, [selectedTool, selectedLayerId, updateSelectedTool])

  // Utility functions
  const getSeverityColor = (severity: string | number | null | undefined): string => {
    const sev = severity != null ? String(severity) : undefined
    switch (sev) {
      case 'Critical': return '#dc2626'
      case 'High': return '#f97316'
      case 'Medium': return '#eab308'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Open': return '#dc2626'
      case 'ReadyForInspection': return '#f97316'
      case 'Closed': return '#10b981'
      default: return '#6b7280'
    }
  }

  const normalizedToCanvas = useCallback((normalized: { x: number, y: number }) => ({
    x: normalized.x * dimensions.width,
    y: normalized.y * dimensions.height
  }), [dimensions.width, dimensions.height])

  const canvasToNormalized = useCallback((canvas: { x: number, y: number }) => ({
    x: canvas.x / dimensions.width,
    y: canvas.y / dimensions.height
  }), [dimensions.width, dimensions.height])

  // Touch gesture handlers for mobile
  const handleTouchStart = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length === 2) {
      const touch1 = touches[0]
      const touch2 = touches[1]
      if (!touch1 || !touch2) return
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setLastTouchDistance(distance)
    } else if (touches.length === 1) {
      const touch = touches[0]
      if (touch) {
        setLastTouchPosition({ x: touch.clientX, y: touch.clientY })
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault()
    const touches = e.evt.touches

    if (touches.length === 2) {
      // Pinch zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      if (!touch1 || !touch2) return
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      if (lastTouchDistance > 0) {
        const scaleMultiplier = distance / lastTouchDistance
        const newScale = Math.min(Math.max(scale * scaleMultiplier, MIN_SCALE), MAX_SCALE)
        setScale(newScale)
      }
      setLastTouchDistance(distance)
    } else if (touches.length === 1 && isDragging && lastTouchPosition) {
      // Pan gesture
      const touch = touches[0]
      if (!touch) return
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
      }
    }
  }, [lastTouchDistance, lastTouchPosition, scale, isDragging, position])

  // Desktop wheel zoom
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const scaleBy = 1.05
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
  }, [])

  // Canvas click handlers
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
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
      // Broadcast to other users using BLUEBIN real-time manager
      broadcastPinOperation('create', {
        x: normalizedPos.x,
        y: normalizedPos.y,
        layerId: selectedLayerId
      })
    } else if (selectedTool === 'childPin' && selectedPin && onAddChildPin) {
      onAddChildPin(selectedPin, normalizedPos.x, normalizedPos.y)
      setIsAddingChildPin(false)
      // Broadcast child pin creation
      broadcastChildPinOperation('create', {
        parentId: selectedPin.id,
        x: normalizedPos.x,
        y: normalizedPos.y
      })
    }
  }, [selectedTool, onAddPin, selectedLayerId, selectedPin, onAddChildPin, position, scale, dimensions, canvasToNormalized, broadcastPinOperation, broadcastChildPinOperation])

  // Pin click handler
  const handlePinClick = useCallback((pin: PinWithRelations) => {
    setSelectedPin(pin)
    onPinClick(pin)

    if (selectedTool === 'childPin') {
      setIsAddingChildPin(true)
    }
  }, [onPinClick, selectedTool])

  // Child pin click handler
  const handleChildPinClick = useCallback((childPin: ChildPinWithUIFields) => {
    const parentPin = pins.find(p => p.id === childPin.pin_id)
    if (parentPin) {
      onChildPinClick(childPin, parentPin)
    }
  }, [pins, onChildPinClick])

  // Normalize child pins for UI usage (childPins are already in UIChildPin format)
  const uiChildPins: UIChildPin[] = childPins

  // Render visible layers with pins
  const visibleLayers = layers.filter(layer => layer.visible).sort((a, b) => a.z_index - b.z_index)
  const visiblePins = pins.filter(pin => {
    // Note: Pins don't have layer_id in current schema - show all pins for now
    // TODO: Implement proper layer system integration with database schema
    return true
  })
  const visibleChildPins = uiChildPins.filter(childPin => {
    const parent = pins.find(p => p.id === childPin.pin_id)
    if (!parent) return false
    // Note: Parent pins don't have layer_id in current schema - show all child pins
    return true
  })

  const pinSize = isMobile ? MOBILE_PIN_SIZE : DESKTOP_PIN_SIZE

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl overflow-hidden", className)}
      style={{ width: '100%', height: '100%', minHeight: isMobile ? '400px' : '500px' }}
    >
      {/* Real-time connection status */}
      <div className={cn(
        "absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-medium",
        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}>
        {isConnected ? "🟢 Live" : "🔴 Offline"}
      </div>

      {/* Tool indicator for mobile */}
      {isMobile && (
        <div className="absolute top-2 right-2 z-10 bg-black/70 text-white px-3 py-2 rounded-full text-sm font-medium">
          {selectedTool === 'childPin' && isAddingChildPin
            ? `Adding child to Pin ${selectedPin?.seq_number}`
            : `Tool: ${selectedTool}`}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        draggable={!isMobile}
        onDragEnd={(e) => {
          setPosition({ x: e.target.x(), y: e.target.y() })
        }}
      >
        {/* Base layer with roof image */}
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={2}
          />

          {/* Roof plan image */}
          {roofImage && (
            <Image
              x={0}
              y={0}
              image={roofImage}
              width={dimensions.width}
              height={dimensions.height}
              opacity={0.8}
              alt="Roof plan background"
            />
          )}
        </Layer>

        {/* Render layers in z-index order */}
        {visibleLayers.map(layer => (
          <Layer key={layer.id} opacity={layer.opacity}>
            {/* Render pins for this layer */}
            {visiblePins
              .filter(pin => true) // Show all pins since layer_id doesn't exist
              .map(pin => {
                const canvasPos = normalizedToCanvas({ x: pin.x, y: pin.y })
                const isSelected = selectedPin?.id === pin.id

                return (
                  <Group key={pin.id}>
                    {/* Pin marker */}
                    <Circle
                      x={canvasPos.x}
                      y={canvasPos.y}
                      radius={pinSize}
                      fill={getSeverityColor('Medium')} // Default severity since pins don't have severity
                      stroke={isSelected ? "#ffffff" : getStatusColor(pin.status ?? 'pending')}
                      strokeWidth={isSelected ? 4 : 2}
                      shadowColor="black"
                      shadowBlur={6}
                      shadowOpacity={0.3}
                      onClick={() => handlePinClick(pin)}
                      onTap={() => handlePinClick(pin)}
                    />

                    {/* Pin number */}
                    <Text
                      x={canvasPos.x}
                      y={canvasPos.y - 6}
                      text={pin.seq_number.toString()}
                      fontSize={isMobile ? 12 : 10}
                      fontStyle="bold"
                      fill="white"
                      align="center"
                      width={pinSize * 2}
                      offsetX={pinSize}
                    />

                    {/* Child pin count indicator */}
                    {(pin.children_total ?? 0) > 0 && (
                      <Circle
                        x={canvasPos.x + pinSize * 0.7}
                        y={canvasPos.y - pinSize * 0.7}
                        radius={isMobile ? 8 : 6}
                        fill={pin.parent_mix_state === 'ALL_CLOSED' ? '#10b981' :
                              pin.parent_mix_state === 'MIXED' ? '#f97316' : '#dc2626'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}

                    {(pin.children_total ?? 0) > 0 && (
                      <Text
                        x={canvasPos.x + pinSize * 0.7}
                        y={canvasPos.y - pinSize * 0.7 - 4}
                        text={(pin.children_total ?? 0).toString()}
                        fontSize={isMobile ? 8 : 6}
                        fontStyle="bold"
                        fill="white"
                        align="center"
                        width={isMobile ? 16 : 12}
                        offsetX={isMobile ? 8 : 6}
                      />
                    )}
                  </Group>
                )
              })}

            {/* Render child pins for this layer */}
            {visibleChildPins
              .filter(childPin => {
                const parent = pins.find(p => p.id === childPin.pin_id)
                return true // Show all child pins since layer_id doesn't exist
              })
              .map(childPin => {
                // Child pins don't have x,y - use parent's position with slight offset
                const parent = pins.find(p => p.id === childPin.pin_id)
                const parentX = parent?.x || 0.5
                const parentY = parent?.y || 0.5
                const canvasPos = normalizedToCanvas({ x: parentX, y: parentY })

                return (
                  <Group key={childPin.child_id}>
                    <Circle
                      x={canvasPos.x}
                      y={canvasPos.y}
                      radius={pinSize * 0.6}
                      fill={getSeverityColor(childPin.severity)}
                      stroke={getStatusColor(childPin.status_child || 'Open')}
                      strokeWidth={2}
                      onClick={() => handleChildPinClick(childPin as any)}
                      onTap={() => handleChildPinClick(childPin as any)}
                    />

                    <Text
                      x={canvasPos.x}
                      y={canvasPos.y - 4}
                      text={childPin.seq?.split('.')[1] || childPin.seq || 'N/A'}
                      fontSize={isMobile ? 8 : 6}
                      fontStyle="bold"
                      fill="white"
                      align="center"
                      width={pinSize * 1.2}
                      offsetX={pinSize * 0.6}
                    />
                  </Group>
                )
              })}
          </Layer>
        ))}

        {/* Annotations layer */}
        <Layer>
          {annotations
            .filter(annotation => {
              // Show all annotations since layer_id doesn't exist in current schema
              return true
            })
            .map(annotation => {
              // Render different annotation types
              switch (annotation.type) {
                case 'rectangle':
                  const rect = annotation.data
                  return (
                    <Rect
                      key={annotation.id}
                      x={rect.x * dimensions.width}
                      y={rect.y * dimensions.height}
                      width={rect.width * dimensions.width}
                      height={rect.height * dimensions.height}
                      stroke={annotation.style['color'] || '#3b82f6'}
                      strokeWidth={annotation.style['strokeWidth'] || 2}
                      fill="transparent"
                    />
                  )
                case 'circle':
                  const circle = annotation.data
                  return (
                    <Circle
                      key={annotation.id}
                      x={circle.x * dimensions.width}
                      y={circle.y * dimensions.height}
                      radius={circle.radius * Math.min(dimensions.width, dimensions.height)}
                      stroke={annotation.style['color'] || '#3b82f6'}
                      strokeWidth={annotation.style['strokeWidth'] || 2}
                      fill="transparent"
                    />
                  )
                case 'text':
                  const textData = annotation.data
                  return (
                    <Text
                      key={annotation.id}
                      x={textData.x * dimensions.width}
                      y={textData.y * dimensions.height}
                      text={textData.text}
                      fontSize={textData.fontSize || (isMobile ? 14 : 12)}
                      fill={annotation.style['color'] || '#000000'}
                    />
                  )
                default:
                  return null
              }
            })}
        </Layer>
      </Stage>

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
