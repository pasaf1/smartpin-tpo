'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line, Text, Circle, Arrow, Rect } from 'react-konva'
import Konva from 'konva'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Pen, 
  Square, 
  Circle as CircleIcon, 
  MousePointer, 
  Type, 
  ArrowRight,
  Undo,
  Redo,
  Save,
  Download,
  Palette,
  Eraser
} from 'lucide-react'

interface PhotoAnnotationProps {
  imageUrl: string
  initialAnnotations?: AnnotationData[]
  onSave?: (annotatedImageUrl: string, annotations: AnnotationData[]) => void
  onCancel?: () => void
  className?: string
  disabled?: boolean
}

interface AnnotationData {
  id: string
  type: 'pen' | 'rectangle' | 'circle' | 'arrow' | 'text'
  points?: number[]
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  created_at: string
  created_by?: string
}

type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser'

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#000000', // black
  '#ffffff'  // white
]

export function PhotoAnnotation({
  imageUrl,
  initialAnnotations = [],
  onSave,
  onCancel,
  className,
  disabled = false
}: PhotoAnnotationProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const imageRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 })
  
  // Annotation state
  const [annotations, setAnnotations] = useState<AnnotationData[]>(initialAnnotations)
  const [currentTool, setCurrentTool] = useState<Tool>('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  
  // Style settings
  const [strokeColor, setStrokeColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fillColor, setFillColor] = useState('transparent')
  const [fontSize, setFontSize] = useState(16)
  
  // History for undo/redo
  const [history, setHistory] = useState<AnnotationData[][]>([initialAnnotations])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })

  // Load image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      
      // Calculate stage dimensions to fit image
      const containerWidth = 800
      const containerHeight = 600
      const imageRatio = img.width / img.height
      const containerRatio = containerWidth / containerHeight
      
      let newWidth, newHeight
      if (imageRatio > containerRatio) {
        newWidth = containerWidth
        newHeight = containerWidth / imageRatio
      } else {
        newHeight = containerHeight
        newWidth = containerHeight * imageRatio
      }
      
      setStageDimensions({ width: newWidth, height: newHeight })
    }
    img.src = imageUrl
  }, [imageUrl])

  // Add to history
  const addToHistory = useCallback((newAnnotations: AnnotationData[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setAnnotations(newAnnotations)
  }, [history, historyIndex])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      setAnnotations(history[prevIndex])
    }
  }, [history, historyIndex])

  // Redo  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      setAnnotations(history[nextIndex])
    }
  }, [history, historyIndex])

  // Handle mouse down
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (disabled || !stageRef.current) return
    
    const pos = stageRef.current.getPointerPosition()
    if (!pos) return

    setIsDrawing(true)
    setSelectedAnnotation(null)

    const newAnnotation: Partial<AnnotationData> = {
      id: `annotation-${Date.now()}`,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: currentTool === 'rectangle' || currentTool === 'circle' ? fillColor : undefined,
      created_at: new Date().toISOString()
    }

    switch (currentTool) {
      case 'pen':
        setCurrentPath([pos.x, pos.y])
        break
      case 'rectangle':
        const newRect: AnnotationData = {
          ...newAnnotation as AnnotationData,
          type: 'rectangle',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0
        }
        setAnnotations(prev => [...prev, newRect])
        setSelectedAnnotation(newRect.id)
        break
      case 'circle':
        const newCircle: AnnotationData = {
          ...newAnnotation as AnnotationData,
          type: 'circle',
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0
        }
        setAnnotations(prev => [...prev, newCircle])
        setSelectedAnnotation(newCircle.id)
        break
      case 'arrow':
        const newArrow: AnnotationData = {
          ...newAnnotation as AnnotationData,
          type: 'arrow',
          points: [pos.x, pos.y, pos.x, pos.y]
        }
        setAnnotations(prev => [...prev, newArrow])
        setSelectedAnnotation(newArrow.id)
        break
      case 'text':
        setTextPosition(pos)
        setShowTextInput(true)
        setIsDrawing(false)
        break
    }
  }, [disabled, currentTool, strokeColor, strokeWidth, fillColor])

  // Handle mouse move
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || disabled || !stageRef.current) return

    const pos = stageRef.current.getPointerPosition()
    if (!pos) return

    switch (currentTool) {
      case 'pen':
        setCurrentPath(prev => [...prev, pos.x, pos.y])
        break
      case 'rectangle':
      case 'circle':
      case 'arrow':
        setAnnotations(prev => prev.map(ann => {
          if (ann.id === selectedAnnotation) {
            if (currentTool === 'rectangle' || currentTool === 'circle') {
              return {
                ...ann,
                width: pos.x - ann.x!,
                height: pos.y - ann.y!
              }
            } else if (currentTool === 'arrow' && ann.points) {
              return {
                ...ann,
                points: [ann.points[0], ann.points[1], pos.x, pos.y]
              }
            }
          }
          return ann
        }))
        break
    }
  }, [isDrawing, disabled, currentTool, selectedAnnotation])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || disabled) return
    
    setIsDrawing(false)

    if (currentTool === 'pen' && currentPath.length > 0) {
      const newLine: AnnotationData = {
        id: `annotation-${Date.now()}`,
        type: 'pen',
        points: currentPath,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        created_at: new Date().toISOString()
      }
      addToHistory([...annotations, newLine])
      setCurrentPath([])
    } else if (currentTool !== 'text') {
      addToHistory(annotations)
    }
    
    setSelectedAnnotation(null)
  }, [isDrawing, disabled, currentTool, currentPath, strokeColor, strokeWidth, annotations, addToHistory])

  // Add text annotation
  const addTextAnnotation = useCallback(() => {
    if (!textInput.trim()) return
    
    const newText: AnnotationData = {
      id: `annotation-${Date.now()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      fontSize: fontSize,
      fill: strokeColor,
      created_at: new Date().toISOString()
    }
    
    addToHistory([...annotations, newText])
    setTextInput('')
    setShowTextInput(false)
  }, [textInput, textPosition, fontSize, strokeColor, annotations, addToHistory])

  // Delete selected annotation
  const deleteAnnotation = useCallback((id: string) => {
    const newAnnotations = annotations.filter(ann => ann.id !== id)
    addToHistory(newAnnotations)
  }, [annotations, addToHistory])

  // Save annotated image
  const handleSave = useCallback(async () => {
    if (!stageRef.current || !onSave) return
    
    try {
      // Generate annotated image
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/jpeg',
        quality: 0.9,
        pixelRatio: 2
      })
      
      onSave(dataURL, annotations)
    } catch (error) {
      console.error('Failed to save annotated image:', error)
    }
  }, [annotations, onSave])

  // Download annotated image
  const handleDownload = useCallback(() => {
    if (!stageRef.current) return
    
    const dataURL = stageRef.current.toDataURL({
      mimeType: 'image/jpeg',
      quality: 0.9,
      pixelRatio: 2
    })
    
    const link = document.createElement('a')
    link.download = `annotated-photo-${Date.now()}.jpg`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
        {/* Tool Selection */}
        <div className="flex items-center gap-1">
          {[
            { tool: 'select' as Tool, icon: MousePointer, label: 'Select' },
            { tool: 'pen' as Tool, icon: Pen, label: 'Pen' },
            { tool: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
            { tool: 'circle' as Tool, icon: CircleIcon, label: 'Circle' },
            { tool: 'arrow' as Tool, icon: ArrowRight, label: 'Arrow' },
            { tool: 'text' as Tool, icon: Type, label: 'Text' },
            { tool: 'eraser' as Tool, icon: Eraser, label: 'Eraser' }
          ].map(({ tool, icon: Icon, label }) => (
            <Button
              key={tool}
              variant={currentTool === tool ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTool(tool)}
              disabled={disabled}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Color Picker */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={disabled}
            title="Colors"
          >
            <Palette className="w-4 h-4" />
            <div 
              className="w-4 h-4 rounded ml-1 border"
              style={{ backgroundColor: strokeColor }}
            />
          </Button>
          
          {showColorPicker && (
            <div className="absolute top-10 left-0 z-10 p-2 bg-white rounded-lg shadow-lg border">
              <div className="grid grid-cols-4 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: color,
                      borderColor: strokeColor === color ? '#000' : 'transparent'
                    }}
                    onClick={() => {
                      setStrokeColor(color)
                      setShowColorPicker(false)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            disabled={disabled}
            className="w-16"
          />
          <span className="text-xs w-6">{strokeWidth}</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={disabled || historyIndex <= 0}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={redo}
            disabled={disabled || historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={disabled}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={disabled}
              title="Save"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border rounded-lg overflow-hidden bg-gray-100">
        <Stage
          ref={stageRef}
          width={stageDimensions.width}
          height={stageDimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}  
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {/* Background Image */}
            {image && (
              <Konva.Image
                ref={imageRef}
                image={image}
                width={stageDimensions.width}
                height={stageDimensions.height}
              />
            )}
            
            {/* Existing Annotations */}
            {annotations.map(annotation => {
              switch (annotation.type) {
                case 'pen':
                  return (
                    <Line
                      key={annotation.id}
                      points={annotation.points}
                      stroke={annotation.stroke}
                      strokeWidth={annotation.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                    />
                  )
                case 'rectangle':
                  return (
                    <Rect
                      key={annotation.id}
                      x={annotation.x}
                      y={annotation.y}
                      width={annotation.width}
                      height={annotation.height}
                      stroke={annotation.stroke}
                      strokeWidth={annotation.strokeWidth}
                      fill={annotation.fill}
                    />
                  )
                case 'circle':
                  return (
                    <Circle
                      key={annotation.id}
                      x={annotation.x! + annotation.width! / 2}
                      y={annotation.y! + annotation.height! / 2}
                      radius={Math.max(Math.abs(annotation.width! / 2), Math.abs(annotation.height! / 2))}
                      stroke={annotation.stroke}
                      strokeWidth={annotation.strokeWidth}
                      fill={annotation.fill}
                    />
                  )
                case 'arrow':
                  return (
                    <Arrow
                      key={annotation.id}
                      points={annotation.points}
                      stroke={annotation.stroke}
                      strokeWidth={annotation.strokeWidth}
                      fill={annotation.stroke}
                      pointerLength={10}
                      pointerWidth={10}
                    />
                  )
                case 'text':
                  return (
                    <Text
                      key={annotation.id}
                      x={annotation.x}
                      y={annotation.y}
                      text={annotation.text}
                      fontSize={annotation.fontSize}
                      fill={annotation.fill}
                    />
                  )
                default:
                  return null
              }
            })}
            
            {/* Current Drawing */}
            {isDrawing && currentTool === 'pen' && currentPath.length > 0 && (
              <Line
                points={currentPath}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                tension={0.5}
                lineCap="round"
              />
            )}
          </Layer>
        </Stage>

        {/* Text Input Modal */}
        {showTextInput && (
          <div 
            className="absolute z-10 p-2 bg-white border rounded shadow-lg"
            style={{
              left: textPosition.x,
              top: textPosition.y
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="px-2 py-1 border rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTextAnnotation()
                } else if (e.key === 'Escape') {
                  setShowTextInput(false)
                  setTextInput('')
                }
              }}
            />
            <div className="flex gap-1 mt-2">
              <Button size="sm" onClick={addTextAnnotation}>
                Add
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowTextInput(false)
                  setTextInput('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onSave || onCancel) && (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={disabled}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={handleSave} disabled={disabled}>
              Save Annotations
            </Button>
          )}
        </div>
      )}

      {/* Annotation Count */}
      <div className="text-xs text-gray-500">
        {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}