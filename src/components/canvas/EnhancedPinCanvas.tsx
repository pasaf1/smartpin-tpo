'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { usePins } from '@/lib/hooks/usePins'
import type { PinWithRelations } from '@/lib/hooks/usePins'

// Dynamic imports for Konva components to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Stage })), { ssr: false })
const Layer = dynamic(() => import('react-konva').then(mod => ({ default: mod.Layer })), { ssr: false })
const KonvaImage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Image })), { ssr: false })
const Circle = dynamic(() => import('react-konva').then(mod => ({ default: mod.Circle })), { ssr: false })
const Text = dynamic(() => import('react-konva').then(mod => ({ default: mod.Text })), { ssr: false })
const Group = dynamic(() => import('react-konva').then(mod => ({ default: mod.Group })), { ssr: false })

interface EnhancedPinCanvasProps {
  roofId: string
  backgroundImageUrl?: string
  className?: string
  onPinCreate?: (x: number, y: number) => void
  onPinSelect?: (pin: PinWithRelations | null) => void
  selectedPinId?: string | null
  editable?: boolean
}

interface PinMarkerProps {
  pin: PinWithRelations
  stageSize: { width: number; height: number }
  onPinClick: (pin: PinWithRelations) => void
  isSelected: boolean
  scale: number
}

// רכיב PinMarker עם Konva
const KonvaPinMarker = ({ pin, stageSize, onPinClick, isSelected, scale }: PinMarkerProps) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const x = pin.x * stageSize.width
  const y = pin.y * stageSize.height
  
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
}: EnhancedPinCanvasProps) {
  const stageRef = useRef<any>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Fetch pins for this roof
  const { data: pins = [], isLoading } = usePins(roofId)

  // הוודא שאנחנו בצד לקוח
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // טיפול בלחיצה על הקנבס
  const handleStageClick = useCallback((e: any) => {
    // בדיקה שלא לחצנו על פין קיים
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Image') {
      if (editable && onPinCreate) {
        const pos = e.target.getStage().getPointerPosition()
        const normalizedX = (pos.x - position.x) / scale / stageSize.width
        const normalizedY = (pos.y - position.y) / scale / stageSize.height
        
        // וודא שהקואורדינטות בטווח תקין
        if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
          onPinCreate(normalizedX, normalizedY)
        }
      }
    }
  }, [editable, onPinCreate, position, scale, stageSize])

  // טיפול בזום
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault()
    
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
  }, [])

  // פונקציות זום
  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 4)
    setScale(newScale)
  }, [scale])

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.2, 0.5)
    setScale(newScale)
  }, [scale])

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

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
    <div className={cn('relative border rounded-lg overflow-hidden bg-gray-100', className)}>
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={Math.min(stageSize.width, 1200)}
        height={Math.min(stageSize.height, 600)}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={isDraggingEnabled}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setPosition({
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
      >
        <Layer>
          {/* תמונת הרקע */}
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              width={stageSize.width}
              height={stageSize.height}
            />
          )}
          
          {/* רינדור הפינים */}
          {pins.map((pin) => (
            <KonvaPinMarker
              key={pin.id}
              pin={pin}
              stageSize={stageSize}
              onPinClick={handlePinClick}
              isSelected={pin.id === selectedPinId}
              scale={scale}
            />
          ))}
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
        <div>Zoom: {Math.round(scale * 100)}%</div>
        <div>Pins: {pins.length}</div>
        {isDraggingEnabled && <div>🔄 Drag enabled</div>}
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
