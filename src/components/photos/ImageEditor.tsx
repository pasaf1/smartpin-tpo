'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getImageProcessor, type AnnotationData } from '@/lib/utils/image-processing'

export interface Annotation {
  id: string
  type: 'arrow' | 'rectangle' | 'circle' | 'text' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  color: string
  strokeWidth: number
  points?: Array<{ x: number; y: number }> // for freehand
  endX?: number // for arrows
  endY?: number
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'
  timestamp: number
  author: string
}

interface ImageEditorProps {
  imageUrl: string
  annotations?: Annotation[]
  onAnnotationsChange?: (annotations: Annotation[]) => void
  onSave?: (originalUrl: string, annotatedDataUrl: string, annotations: Annotation[]) => void
  onExportDualSave?: (originalBlob: Blob, annotatedBlob: Blob, annotations: Annotation[]) => Promise<void>
  className?: string
  editable?: boolean
  showTools?: boolean
  maxWidth?: number
  maxHeight?: number
}

const COLORS = [
  '#DC2626', // Red - Critical/Issues
  '#EA580C', // Orange - High Priority  
  '#D97706', // Amber - Medium Priority
  '#059669', // Green - Good/Complete
  '#2563EB', // Blue - Information
  '#7C3AED', // Purple - Notes
  '#000000', // Black - General
  '#FFFFFF', // White - Highlights
]

const SEVERITY_COLORS = {
  Critical: '#DC2626',
  High: '#EA580C', 
  Medium: '#D97706',
  Low: '#059669',
}

export function ImageEditor({
  imageUrl,
  annotations = [],
  onAnnotationsChange,
  onSave,
  onExportDualSave,
  className,
  editable = true,
  showTools = true,
  maxWidth = 800,
  maxHeight = 600,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [tool, setTool] = useState<Annotation['type']>('arrow')
  const [color, setColor] = useState(COLORS[0] || '#DC2626')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [severity, setSeverity] = useState<Annotation['severity']>('High')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [showAnnotations, setShowAnnotations] = useState(true)

  // Load and setup image
  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth || maxWidth
      const containerHeight = maxHeight

      // Calculate scale to fit image in container
      const scaleX = containerWidth / img.width
      const scaleY = containerHeight / img.height
      const newScale = Math.min(scaleX, scaleY, 1) // Don't upscale

      const scaledWidth = img.width * newScale
      const scaledHeight = img.height * newScale

      setCanvasSize({ width: scaledWidth, height: scaledHeight })
      setScale(newScale)
      setImageLoaded(true)

      if (imageRef.current) {
        imageRef.current.src = img.src
      }
    }
    
    img.src = imageUrl
  }, [imageUrl, maxWidth, maxHeight])

  // Redraw canvas when annotations or image changes
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    }

    // Draw annotations
    if (showAnnotations) {
      annotations.forEach(annotation => {
        drawAnnotation(ctx, annotation)
      })
    }

    // Draw current annotation being created
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation)
    }
  }, [annotations, currentAnnotation, imageLoaded, showAnnotations, canvasSize])

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.save()
    ctx.strokeStyle = annotation.color
    ctx.lineWidth = annotation.strokeWidth
    ctx.fillStyle = annotation.color

    switch (annotation.type) {
      case 'arrow':
        if (annotation.endX !== undefined && annotation.endY !== undefined) {
          drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY, annotation.strokeWidth)
        }
        break
        
      case 'rectangle':
        if (annotation.width && annotation.height) {
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
          if (annotation.severity) {
            ctx.fillStyle = SEVERITY_COLORS[annotation.severity] + '20' // 20% opacity
            ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height)
          }
        }
        break
        
      case 'circle':
        if (annotation.radius) {
          ctx.beginPath()
          ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI)
          ctx.stroke()
          if (annotation.severity) {
            ctx.fillStyle = SEVERITY_COLORS[annotation.severity] + '20'
            ctx.fill()
          }
        }
        break
        
      case 'text':
        if (annotation.text) {
          ctx.font = `${annotation.strokeWidth * 4}px Arial`
          ctx.fillText(annotation.text, annotation.x, annotation.y)
        }
        break
        
      case 'freehand':
        if (annotation.points && annotation.points.length > 1) {
          const firstPoint = annotation.points[0]
          if (firstPoint) {
            ctx.beginPath()
            ctx.moveTo(firstPoint.x, firstPoint.y)
            annotation.points.forEach(point => {
              ctx.lineTo(point.x, point.y)
            })
            ctx.stroke()
          }
        }
        break
    }

    ctx.restore()
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLength = width * 3
    
    // Draw line
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    
    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - Math.PI / 6),
      y2 - arrowLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + Math.PI / 6),
      y2 - arrowLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current) return

    const pos = getMousePos(e)
    setIsDrawing(true)

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: tool,
      x: pos.x,
      y: pos.y,
      color,
      strokeWidth,
      ...(severity ? { severity } : {}),
      timestamp: Date.now(),
      author: 'current-user', // TODO: Get from auth context
    }

    if (tool === 'freehand') {
      newAnnotation.points = [pos]
    }

    setCurrentAnnotation(newAnnotation)
  }, [editable, tool, color, strokeWidth, severity])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return

    const pos = getMousePos(e)

    switch (tool) {
      case 'arrow':
        setCurrentAnnotation(prev => prev ? {
          ...prev,
          endX: pos.x,
          endY: pos.y,
        } : null)
        break
        
      case 'rectangle':
        setCurrentAnnotation(prev => prev ? {
          ...prev,
          width: pos.x - prev.x,
          height: pos.y - prev.y,
        } : null)
        break
        
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(pos.x - currentAnnotation.x, 2) + 
          Math.pow(pos.y - currentAnnotation.y, 2)
        )
        setCurrentAnnotation(prev => prev ? {
          ...prev,
          radius,
        } : null)
        break
        
      case 'freehand':
        setCurrentAnnotation(prev => prev ? {
          ...prev,
          points: [...(prev.points || []), pos],
        } : null)
        break
    }
  }, [isDrawing, currentAnnotation, tool])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentAnnotation) return

    setIsDrawing(false)
    
    // Add completed annotation to list
    const newAnnotations = [...annotations, currentAnnotation]
    onAnnotationsChange?.(newAnnotations)
    
    setCurrentAnnotation(null)
  }, [isDrawing, currentAnnotation, annotations, onAnnotationsChange])

  const handleClear = () => {
    onAnnotationsChange?.([])
  }

  const handleSave = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png', 0.9)
    
    onSave?.(imageUrl, dataUrl, annotations)
  }

  const handleDualSave = async () => {
    if (!canvasRef.current || !imageRef.current) return

    try {
      const processor = getImageProcessor()
      
      // Convert image URL to File object
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const originalFile = new File([blob], 'original.png', { type: blob.type })

      // Convert annotations to the processor format
      const processorAnnotations: AnnotationData[] = annotations.map(ann => ({
        id: ann.id,
        type: ann.type,
        x: ann.x / scale, // Convert back to original image coordinates
        y: ann.y / scale,
        ...(ann.width !== undefined ? { width: ann.width / scale } : {}),
        ...(ann.height !== undefined ? { height: ann.height / scale } : {}),
        color: ann.color,
        strokeWidth: ann.strokeWidth,
        ...(ann.text ? { text: ann.text } : {}),
        ...(ann.severity ? { severity: ann.severity } : {}),
        timestamp: ann.timestamp,
        author: ann.author,
        ...(ann.points ? { points: ann.points.map(p => ({ x: p.x / scale, y: p.y / scale })) } : {})
      }))

      // Process the image to get both original and annotated versions
      const result = await processor.processImage(originalFile, processorAnnotations)
      
      // Convert data URLs to blobs
      const originalBlob = processor.dataURLToBlob(result.originalUrl)
      const annotatedBlob = processor.dataURLToBlob(result.annotatedUrl)

      // Call the export callback
      await onExportDualSave?.(originalBlob, annotatedBlob, annotations)

      console.log('Dual-save export completed:', {
        original: result.originalUrl.length,
        annotated: result.annotatedUrl.length,
        annotations: annotations.length
      })
    } catch (error) {
      console.error('Dual-save export failed:', error)
    }
  }

  const handleUndo = () => {
    if (annotations.length > 0) {
      const newAnnotations = annotations.slice(0, -1)
      onAnnotationsChange?.(newAnnotations)
    }
  }

  if (!imageUrl) {
    return (
      <div className={cn('border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center', className)}>
        <div className="text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No image provided</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {showTools && editable && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg border">
          {/* Tools */}
          <div className="flex items-center gap-1">
            <label className="text-sm font-medium">Tool:</label>
            <Select value={tool} onValueChange={(value) => setTool(value as Annotation['type'])}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arrow">Arrow</SelectItem>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="freehand">Freehand</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Color:</label>
            <div className="flex gap-1">
              {COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform',
                    color === colorOption ? 'border-foreground' : 'border-muted-foreground/25'
                  )}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Width:</label>
            <div className="flex items-center gap-2 w-24">
              <Slider
                value={[strokeWidth]}
                onValueChange={(values) => {
                  const value = values[0]
                  if (value !== undefined) {
                    setStrokeWidth(value)
                  }
                }}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-xs w-4">{strokeWidth}</span>
            </div>
          </div>

          {/* Severity */}
          <div className="flex items-center gap-1">
            <label className="text-sm font-medium">Severity:</label>
            <Select value={severity || 'High'} onValueChange={(value) => setSeverity(value as Annotation['severity'])}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={annotations.length === 0}>
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} disabled={annotations.length === 0}>
                Clear All
              </Button>
            </>
          )}
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? 'Hide' : 'Show'} Annotations
          </Button>

          <Badge variant="secondary">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {editable && (
          <div className="flex gap-2">
            {onSave && (
              <Button variant="outline" onClick={handleSave} disabled={!imageLoaded}>
                Save Annotated
              </Button>
            )}
            {onExportDualSave && (
              <Button onClick={handleDualSave} disabled={!imageLoaded}>
                Export Dual-Save
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative border rounded-lg overflow-hidden bg-muted/25">
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className={cn(
              'block max-w-full cursor-crosshair',
              !editable && 'cursor-default'
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}
        
        {!imageLoaded && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading image...
            </div>
          </div>
        )}

        <img
          ref={imageRef}
          className="hidden"
          alt="Source for canvas"
        />
      </div>

      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Annotations</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {annotations.map((annotation, index) => (
              <div 
                key={annotation.id}
                className="flex items-center justify-between p-2 bg-muted/25 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span className="capitalize">{annotation.type}</span>
                  {annotation.severity && (
                    <Badge variant="outline" className="text-xs px-1">
                      {annotation.severity}
                    </Badge>
                  )}
                </div>
                
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      const newAnnotations = annotations.filter((_, i) => i !== index)
                      onAnnotationsChange?.(newAnnotations)
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}