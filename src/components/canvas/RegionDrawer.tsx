'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Shapes, Square, Circle, Trash2, Save } from 'lucide-react'

export interface Region {
  id: string
  name: string
  type: 'polygon' | 'rectangle' | 'circle'
  points: { x: number; y: number }[]
  color?: string
  strokeWidth?: number
  metadata?: Record<string, any>
}

interface RegionDrawerProps {
  regions: Region[]
  onRegionAdd: (region: Omit<Region, 'id'>) => void
  onRegionUpdate: (id: string, updates: Partial<Region>) => void
  onRegionDelete: (id: string) => void
  isDrawing: boolean
  onDrawingStateChange: (isDrawing: boolean) => void
  drawingType: Region['type']
  onDrawingTypeChange: (type: Region['type']) => void
  className?: string
}

export function RegionDrawer({
  regions,
  onRegionAdd,
  onRegionUpdate,
  onRegionDelete,
  isDrawing,
  onDrawingStateChange,
  drawingType,
  onDrawingTypeChange,
  className
}: RegionDrawerProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [regionName, setRegionName] = useState('')
  
  const handleStartDrawing = useCallback((type: Region['type']) => {
    onDrawingTypeChange(type)
    onDrawingStateChange(true)
    setRegionName(`${type.charAt(0).toUpperCase() + type.slice(1)} ${regions.length + 1}`)
  }, [onDrawingTypeChange, onDrawingStateChange, regions.length])
  
  const handleStopDrawing = useCallback(() => {
    onDrawingStateChange(false)
  }, [onDrawingStateChange])
  
  const handleSaveRegion = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < (drawingType === 'polygon' ? 3 : 2)) return
    
    const newRegion: Omit<Region, 'id'> = {
      name: regionName || `Region ${regions.length + 1}`,
      type: drawingType,
      points,
      color: '#3b82f6',
      strokeWidth: 2,
      metadata: {
        createdAt: new Date().toISOString(),
        area: calculatePolygonArea(points)
      }
    }
    
    onRegionAdd(newRegion)
    setRegionName('')
    handleStopDrawing()
  }, [drawingType, regionName, regions.length, onRegionAdd, handleStopDrawing])
  
  const calculatePolygonArea = (points: { x: number; y: number }[]) => {
    if (points.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    return Math.abs(area) / 2
  }
  
  return (
    <div className={cn(
      "bg-background border rounded-lg shadow-lg p-3",
      className
    )}>
      <div className="space-y-3">
        {/* Drawing Tools */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Drawing Tools</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleStartDrawing('polygon')}
              disabled={isDrawing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm border rounded",
                "hover:bg-muted transition-colors",
                drawingType === 'polygon' && isDrawing && "bg-primary text-primary-foreground",
                isDrawing && drawingType !== 'polygon' && "opacity-50"
              )}
              title="Draw Polygon"
            >
              <Shapes className="w-4 h-4" />
              Polygon
            </button>
            
            <button
              onClick={() => handleStartDrawing('rectangle')}
              disabled={isDrawing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm border rounded",
                "hover:bg-muted transition-colors",
                drawingType === 'rectangle' && isDrawing && "bg-primary text-primary-foreground",
                isDrawing && drawingType !== 'rectangle' && "opacity-50"
              )}
              title="Draw Rectangle"
            >
              <Square className="w-4 h-4" />
              Rectangle
            </button>
            
            <button
              onClick={() => handleStartDrawing('circle')}
              disabled={isDrawing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm border rounded",
                "hover:bg-muted transition-colors",
                drawingType === 'circle' && isDrawing && "bg-primary text-primary-foreground",
                isDrawing && drawingType !== 'circle' && "opacity-50"
              )}
              title="Draw Circle"
            >
              <Circle className="w-4 h-4" />
              Circle
            </button>
            
            {isDrawing && (
              <button
                onClick={handleStopDrawing}
                className="px-3 py-2 text-sm border border-destructive text-destructive rounded hover:bg-destructive/10"
                title="Cancel Drawing"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Region Name Input (when drawing) */}
        {isDrawing && (
          <div>
            <label className="text-sm font-medium">Region Name:</label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              placeholder={`${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)} ${regions.length + 1}`}
              className="w-full mt-1 px-2 py-1 text-sm border rounded"
            />
          </div>
        )}
        
        {/* Drawing Instructions */}
        {isDrawing && (
          <div className="p-2 bg-muted/50 rounded text-xs">
            {drawingType === 'polygon' && "Click to add points. Double-click or press Enter to finish."}
            {drawingType === 'rectangle' && "Click and drag to create rectangle."}
            {drawingType === 'circle' && "Click center, then drag to set radius."}
          </div>
        )}
        
        {/* Regions List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Regions ({regions.length})</h3>
          </div>
          
          {regions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No regions defined. Use drawing tools above to create regions.
            </div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className={cn(
                    "flex items-center justify-between p-2 border rounded",
                    "hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedRegion === region.id && "bg-muted"
                  )}
                  onClick={() => setSelectedRegion(
                    selectedRegion === region.id ? null : region.id
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm border"
                      style={{ backgroundColor: region.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {region.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {region.type} • {region.points.length} points
                        {region.metadata?.area && (
                          <> • {Math.round(region.metadata.area)} px²</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRegionDelete(region.id)
                    }}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    title="Delete Region"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Region Properties (when selected) */}
        {selectedRegion && (
          <div className="border-t pt-3">
            {(() => {
              const region = regions.find(r => r.id === selectedRegion)
              if (!region) return null
              
              return (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Region Properties</h4>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">Name:</label>
                    <input
                      type="text"
                      value={region.name}
                      onChange={(e) => onRegionUpdate(region.id, { name: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">Color:</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={region.color}
                        onChange={(e) => onRegionUpdate(region.id, { color: e.target.value })}
                        className="w-8 h-8 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={region.color}
                        onChange={(e) => onRegionUpdate(region.id, { color: e.target.value })}
                        className="flex-1 px-2 py-1 text-sm border rounded font-mono"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Stroke Width: {region.strokeWidth}px
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={region.strokeWidth || 2}
                      onChange={(e) => onRegionUpdate(region.id, { 
                        strokeWidth: parseInt(e.target.value) 
                      })}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegionDrawer