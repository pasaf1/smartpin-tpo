'use client'

import { forwardRef, memo, useCallback, useMemo } from 'react'

// Selective Konva imports to reduce bundle size
import { Stage, Layer, Image, Group, Circle, Text, Rect } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'

interface OptimizedKonvaComponentsProps {
  dimensions: { width: number; height: number }
  scale: number
  position: { x: number; y: number }
  roofImage: HTMLImageElement | null
  visiblePins: any[]
  visibleChildPins: any[]
  layers: any[]
  annotations: any[]
  pinSize: number
  isMobile: boolean
  selectedPin: any
  isAddingChildPin: boolean
  onStageClick: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void
  onTouchStart: (e: KonvaEventObject<TouchEvent>) => void
  onTouchMove: (e: KonvaEventObject<TouchEvent>) => void
  onWheel: (e: KonvaEventObject<WheelEvent>) => void
  onPinClick: (pin: any) => void
  onChildPinClick: (childPin: any) => void
  getSeverityColor: (severity: string | null | undefined) => string
  getStatusColor: (status: string) => string
  normalizedToCanvas: (normalized: { x: number; y: number }) => { x: number; y: number }
  enablePinCaching?: boolean
  performanceMode?: 'high' | 'balanced' | 'performance'
}

// Memoized Pin Component for better performance
const OptimizedPin = memo(({
  pin,
  pinSize,
  isSelected,
  isMobile,
  onPinClick,
  getSeverityColor,
  getStatusColor,
  normalizedToCanvas,
  enableCaching = false
}: any) => {
  const canvasPos = useMemo(() => normalizedToCanvas({ x: pin.x, y: pin.y }), [pin.x, pin.y, normalizedToCanvas])

  const pinGroup = useMemo(() => (
    <Group
      key={pin.id}
      // Cache complex pins for better performance
      cache={enableCaching && pin.children_total > 0}
    >
      {/* Pin marker */}
      <Circle
        x={canvasPos.x}
        y={canvasPos.y}
        radius={pinSize}
        fill={getSeverityColor(pin.severity)}
        stroke={isSelected ? "#ffffff" : getStatusColor(pin.status)}
        strokeWidth={isSelected ? 4 : 2}
        shadowColor="black"
        shadowBlur={6}
        shadowOpacity={0.3}
        onClick={() => onPinClick(pin)}
        onTap={() => onPinClick(pin)}
        // Optimize hit detection
        perfectDrawEnabled={false}
        listening={true}
        hitStrokeWidth={pinSize * 2} // Larger hit area for mobile
      />

      {/* Pin number */}
      <Text
        x={canvasPos.x}
        y={canvasPos.y - (isMobile ? 7 : 6)}
        text={pin.seq_number.toString()}
        fontSize={isMobile ? 12 : 10}
        fontStyle="bold"
        fill="white"
        align="center"
        width={pinSize * 2}
        offsetX={pinSize}
        listening={false} // Text doesn't need to be clickable
        perfectDrawEnabled={false}
      />

      {/* Child pin count indicator */}
      {pin.children_total > 0 && (
        <>
          <Circle
            x={canvasPos.x + pinSize * 0.7}
            y={canvasPos.y - pinSize * 0.7}
            radius={isMobile ? 8 : 6}
            fill={pin.parent_mix_state === 'ALL_CLOSED' ? '#10b981' :
                  pin.parent_mix_state === 'MIXED' ? '#f97316' : '#dc2626'}
            stroke="#ffffff"
            strokeWidth={2}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Text
            x={canvasPos.x + pinSize * 0.7}
            y={canvasPos.y - pinSize * 0.7 - (isMobile ? 5 : 4)}
            text={pin.children_total.toString()}
            fontSize={isMobile ? 8 : 6}
            fontStyle="bold"
            fill="white"
            align="center"
            width={isMobile ? 16 : 12}
            offsetX={isMobile ? 8 : 6}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      )}
    </Group>
  ), [pin, canvasPos, pinSize, isSelected, isMobile, onPinClick, getSeverityColor, getStatusColor, enableCaching])

  return pinGroup
})

OptimizedPin.displayName = 'OptimizedPin'

// Memoized Child Pin Component
const OptimizedChildPin = memo(({
  childPin,
  pinSize,
  isMobile,
  onChildPinClick,
  getSeverityColor,
  getStatusColor,
  normalizedToCanvas
}: any) => {
  const canvasPos = useMemo(() => normalizedToCanvas({ x: childPin.x || 0.5, y: childPin.y || 0.5 }), [childPin.x, childPin.y, normalizedToCanvas])

  return (
    <Group key={childPin.child_id || childPin.id}>
      <Circle
        x={canvasPos.x}
        y={canvasPos.y}
        radius={pinSize * 0.6}
        fill={getSeverityColor(childPin.severity)}
        stroke={getStatusColor(childPin.status || 'Open')}
        strokeWidth={2}
        onClick={() => onChildPinClick(childPin)}
        onTap={() => onChildPinClick(childPin)}
        perfectDrawEnabled={false}
        listening={true}
        hitStrokeWidth={pinSize * 1.5}
      />

      <Text
        x={canvasPos.x}
        y={canvasPos.y - (isMobile ? 5 : 4)}
        text={childPin.seq?.split('.')[1] || childPin.seq || 'N/A'}
        fontSize={isMobile ? 8 : 6}
        fontStyle="bold"
        fill="white"
        align="center"
        width={pinSize * 1.2}
        offsetX={pinSize * 0.6}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  )
})

OptimizedChildPin.displayName = 'OptimizedChildPin'

// Memoized Annotation Component
const OptimizedAnnotation = memo(({ annotation, dimensions, isMobile }: any) => {
  const renderAnnotation = useCallback(() => {
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
            listening={false}
            perfectDrawEnabled={false}
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
            listening={false}
            perfectDrawEnabled={false}
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
            listening={false}
            perfectDrawEnabled={false}
          />
        )
      default:
        return null
    }
  }, [annotation, dimensions, isMobile])

  return renderAnnotation()
})

OptimizedAnnotation.displayName = 'OptimizedAnnotation'

// Main optimized Konva components
const OptimizedKonvaComponents = forwardRef<any, OptimizedKonvaComponentsProps>(({
  dimensions,
  scale,
  position,
  roofImage,
  visiblePins,
  visibleChildPins,
  layers,
  annotations,
  pinSize,
  isMobile,
  selectedPin,
  isAddingChildPin,
  onStageClick,
  onTouchStart,
  onTouchMove,
  onWheel,
  onPinClick,
  onChildPinClick,
  getSeverityColor,
  getStatusColor,
  normalizedToCanvas,
  enablePinCaching = true,
  performanceMode = 'balanced'
}, ref) => {

  // Memoized visible layers for performance
  const visibleLayers = useMemo(() =>
    layers.filter(layer => layer.visible).sort((a, b) => a.z_index - b.z_index),
    [layers]
  )

  // Memoized visible annotations
  const visibleAnnotations = useMemo(() =>
    annotations.filter(annotation => {
      const layer = layers.find(l => l.id === annotation.layer_id)
      return layer?.visible
    }),
    [annotations, layers]
  )

  // Performance settings based on mode
  const stageConfig = useMemo(() => {
    const baseConfig = {
      width: dimensions.width,
      height: dimensions.height,
      scaleX: scale,
      scaleY: scale,
      x: position.x,
      y: position.y,
      onClick: onStageClick,
      onTouchStart: onTouchStart,
      onTouchMove: onTouchMove,
      onWheel: onWheel,
      draggable: !isMobile,
    }

    // Performance optimizations based on mode
    switch (performanceMode) {
      case 'performance':
        return {
          ...baseConfig,
          pixelRatio: isMobile ? 1 : window.devicePixelRatio,
          clearBeforeDraw: true,
          imageSmoothingEnabled: false,
        }
      case 'high':
        return {
          ...baseConfig,
          pixelRatio: window.devicePixelRatio,
          clearBeforeDraw: true,
          imageSmoothingEnabled: true,
        }
      default: // balanced
        return {
          ...baseConfig,
          pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
          clearBeforeDraw: true,
          imageSmoothingEnabled: !isMobile,
        }
    }
  }, [dimensions, scale, position, isMobile, performanceMode, onStageClick, onTouchStart, onTouchMove, onWheel])

  return (
    <Stage
      ref={ref}
      {...stageConfig}
      onDragEnd={(e) => {
        // Handle drag end if needed
      }}
    >
      {/* Base layer with roof image */}
      <Layer
        imageSmoothingEnabled={stageConfig.imageSmoothingEnabled}
        clearBeforeDraw={true}
      >
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={dimensions.width}
          height={dimensions.height}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth={2}
          listening={false}
          perfectDrawEnabled={false}
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
            listening={false}
            perfectDrawEnabled={performanceMode !== 'performance'}
            alt="Roof plan background"
          />
        )}
      </Layer>

      {/* Render layers in z-index order */}
      {visibleLayers.map(layer => (
        <Layer
          key={layer.id}
          opacity={layer.opacity}
          listening={!layer.locked}
          clearBeforeDraw={true}
        >
          {/* Render pins for this layer */}
          {visiblePins
            .filter(pin => pin.layer_id === layer.id)
            .map(pin => (
              <OptimizedPin
                key={pin.id}
                pin={pin}
                pinSize={pinSize}
                isSelected={selectedPin?.id === pin.id}
                isMobile={isMobile}
                onPinClick={onPinClick}
                getSeverityColor={getSeverityColor}
                getStatusColor={getStatusColor}
                normalizedToCanvas={normalizedToCanvas}
                enableCaching={enablePinCaching && pin.children_total > 0}
              />
            ))}

          {/* Render child pins for this layer */}
          {visibleChildPins
            .filter(childPin => {
              const parent = visiblePins.find(p => p.id === (childPin.parent_id || childPin.pin_id))
              return parent?.layer_id === layer.id
            })
            .map(childPin => (
              <OptimizedChildPin
                key={childPin.child_id || childPin.id}
                childPin={childPin}
                pinSize={pinSize}
                isMobile={isMobile}
                onChildPinClick={onChildPinClick}
                getSeverityColor={getSeverityColor}
                getStatusColor={getStatusColor}
                normalizedToCanvas={normalizedToCanvas}
              />
            ))}
        </Layer>
      ))}

      {/* Annotations layer */}
      <Layer
        listening={false}
        clearBeforeDraw={true}
      >
        {visibleAnnotations.map(annotation => (
          <OptimizedAnnotation
            key={annotation.id}
            annotation={annotation}
            dimensions={dimensions}
            isMobile={isMobile}
          />
        ))}
      </Layer>
    </Stage>
  )
})

OptimizedKonvaComponents.displayName = 'OptimizedKonvaComponents'

export default OptimizedKonvaComponents