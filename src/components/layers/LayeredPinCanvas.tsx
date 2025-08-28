// src/components/layers/LayeredPinCanvas.tsx
// Enhanced canvas with layer-based pin management
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Circle, Text } from 'react-konva'
import { useEnhancedPinsForRoof, useCreateEnhancedPin } from '@/lib/layers'
import type { LayerKind } from '@/lib/layers'

interface LayeredPinCanvasProps {
  roofId: string
  backgroundImageUrl?: string | null
  visibleLayers?: Set<LayerKind>
  selectedLayer?: LayerKind
  onPinSelect?: (pinId: string) => void
  onPinCreate?: (x: number, y: number, layer: LayerKind) => void
  className?: string
}

const LAYER_COLORS = {
  'Issues': '#ef4444',
  'RFIs': '#f59e0b', 
  'Details': '#3b82f6',
  'Notes': '#10b981',
} as const

export function LayeredPinCanvas({
  roofId,
  backgroundImageUrl,
  visibleLayers = new Set(['Issues', 'RFIs', 'Details', 'Notes']),
  selectedLayer = 'Issues',
  onPinSelect,
  onPinCreate,
  className = ''
}: LayeredPinCanvasProps) {
  const stageRef = useRef<any>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  const { data: pinsData, isLoading } = useEnhancedPinsForRoof(roofId)
  const createPin = useCreateEnhancedPin()

  // Load background image
  useEffect(() => {
    if (!backgroundImageUrl) {
      setBackgroundImage(null)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setBackgroundImage(img)
      // Adjust stage size to image aspect ratio
      const aspectRatio = img.width / img.height
      const maxWidth = 1200
      const maxHeight = 800
      
      let width = maxWidth
      let height = maxWidth / aspectRatio
      
      if (height > maxHeight) {
        height = maxHeight
        width = maxHeight * aspectRatio
      }
      
      setStageSize({ width, height })
    }
    img.onerror = () => {
      console.error('Failed to load background image:', backgroundImageUrl)
      setBackgroundImage(null)
    }
    img.src = backgroundImageUrl
  }, [backgroundImageUrl])

  // Handle stage click for creating pins
  const handleStageClick = (e: any) => {
    // Only create pin if clicking on empty space (not on existing pin)
    if (e.target === e.target.getStage() || e.target.getParent().name() === 'backgroundLayer') {
      const stage = e.target.getStage()
      const pointerPosition = stage.getPointerPosition()
      
      if (pointerPosition) {
        const x = pointerPosition.x / stageSize.width
        const y = pointerPosition.y / stageSize.height
        
        onPinCreate?.(x, y, selectedLayer)
        
        // Auto-create pin if onPinCreate not provided
        if (!onPinCreate) {
          createPin.mutate({
            roof_id: roofId,
            layer_name: selectedLayer,
            x,
            y,
            priority: 'Medium',
            defect_type: selectedLayer,
            description: `New ${selectedLayer} pin`
          })
        }
      }
    }
  }

  // Handle pin click
  const handlePinClick = (pinId: string) => {
    setSelectedPinId(pinId)
    onPinSelect?.(pinId)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <div className="animate-pulse">Loading pins...</div>
      </div>
    )
  }

  const pins = pinsData?.success ? pinsData.pins : []

  return (
    <div className={`relative ${className}`}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        className="border rounded-lg bg-white"
      >
        {/* Background Layer */}
        <Layer name="backgroundLayer">
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              width={stageSize.width}
              height={stageSize.height}
            />
          )}
        </Layer>

        {/* Pins Layer */}
        <Layer name="pinsLayer">
          {pins.map((pinData) => {
            const layerName = pinData.layer?.name as LayerKind
            
            // Skip if layer is not visible
            if (layerName && !visibleLayers.has(layerName)) {
              return null
            }
            
            const x = pinData.pin.x * stageSize.width
            const y = pinData.pin.y * stageSize.height
            const color = pinData.layer?.color || LAYER_COLORS[layerName] || '#666666'
            const isSelected = selectedPinId === pinData.pin.id
            
            // Different pin sizes based on status
            const getRadius = () => {
              if (pinData.pin.status === 'Closed') return 6
              if (pinData.pin.status === 'ReadyForInspection') return 8
              return 10
            }
            
            return (
              <React.Fragment key={pinData.pin.id}>
                {/* Pin Circle */}
                <Circle
                  x={x}
                  y={y}
                  radius={getRadius()}
                  fill={color}
                  stroke={isSelected ? '#000' : '#fff'}
                  strokeWidth={isSelected ? 3 : 2}
                  onClick={() => handlePinClick(pinData.pin.id)}
                  onTap={() => handlePinClick(pinData.pin.id)}
                  shadowColor="black"
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  shadowOffsetX={2}
                  shadowOffsetY={2}
                />
                
                {/* Pin Number */}
                <Text
                  x={x}
                  y={y - 4}
                  text={pinData.pin.seq_number.toString()}
                  fontSize={10}
                  fontStyle="bold"
                  fill="white"
                  align="center"
                  verticalAlign="middle"
                  width={20}
                  offset={{ x: 10, y: 0 }}
                  onClick={() => handlePinClick(pinData.pin.id)}
                  onTap={() => handlePinClick(pinData.pin.id)}
                />
                
                {/* Status Indicator */}
                {pinData.children && pinData.children.length > 0 && (
                  <Circle
                    x={x + 12}
                    y={y - 12}
                    radius={4}
                    fill={
                      pinData.children.every(c => c.status_child === 'Closed') ? '#10b981' :
                      pinData.children.some(c => c.status_child === 'ReadyForInspection') ? '#f59e0b' :
                      '#ef4444'
                    }
                    stroke="#fff"
                    strokeWidth={1}
                  />
                )}
              </React.Fragment>
            )
          })}
        </Layer>
      </Stage>
      
      {/* Layer Legend */}
      <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg">
        <div className="text-sm font-medium mb-2">Layers</div>
        <div className="space-y-1">
          {Array.from(visibleLayers).map(layer => (
            <div key={layer} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: LAYER_COLORS[layer] }}
              />
              <span>{layer}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pin Creation Hint */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded text-xs text-muted-foreground">
        Click to create {selectedLayer} pin
      </div>
    </div>
  )
}
