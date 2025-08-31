'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Settings, Palette } from 'lucide-react'

export interface Layer {
  name: string
  visible: boolean
  opacity: number
  color?: string
}

interface LayerManagerProps {
  layers: Layer[]
  onLayerToggle: (layerName: string, visible: boolean) => void
  onOpacityChange: (layerName: string, opacity: number) => void
  onColorChange?: (layerName: string, color: string) => void
  className?: string
}

const LAYER_ICONS = {
  'Issues': '📌',
  'Regions': '🔷',
  'Proximity': '🎯',
  'Spatial Analysis': '📊',
  'Background': '🖼️',
  'Grid': '⚏',
  'Annotations': '✏️'
}

export function LayerManager({
  layers,
  onLayerToggle,
  onOpacityChange,
  onColorChange,
  className
}: LayerManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingLayer, setEditingLayer] = useState<string | null>(null)
  
  return (
    <div className={cn(
      "absolute top-4 right-4 bg-background/95 border rounded-lg shadow-lg",
      "transition-all duration-200 ease-in-out",
      isExpanded ? "w-72" : "w-10",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Toggle Layer Manager"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        {isExpanded && (
          <span className="text-sm font-medium">Layers</span>
        )}
      </div>
      
      {/* Layer List */}
      {isExpanded && (
        <div className="border-t">
          {layers.map((layer) => (
            <div
              key={layer.name}
              className={cn(
                "p-2 border-b last:border-b-0",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              {/* Layer Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-base">
                    {LAYER_ICONS[layer.name as keyof typeof LAYER_ICONS] || '📄'}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {layer.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Color Picker */}
                  {onColorChange && layer.color && (
                    <button
                      onClick={() => setEditingLayer(
                        editingLayer === layer.name ? null : layer.name
                      )}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Change Color"
                    >
                      <Palette className="w-3 h-3" />
                    </button>
                  )}
                  
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => onLayerToggle(layer.name, !layer.visible)}
                    className={cn(
                      "p-1 rounded transition-colors",
                      layer.visible 
                        ? "hover:bg-muted text-foreground" 
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title={layer.visible ? "Hide Layer" : "Show Layer"}
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Opacity Slider */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-12">
                  Opacity:
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => onOpacityChange(layer.name, parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  disabled={!layer.visible}
                />
                <span className="text-xs text-muted-foreground w-8">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
              
              {/* Color Picker Dropdown */}
              {editingLayer === layer.name && onColorChange && layer.color && (
                <div className="mt-2 p-2 bg-muted/50 rounded">
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {[
                      '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
                      '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
                      '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          onColorChange(layer.name, color)
                          setEditingLayer(null)
                        }}
                        className="w-6 h-6 rounded border-2 border-transparent hover:border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  <input
                    type="color"
                    value={layer.color}
                    onChange={(e) => onColorChange(layer.name, e.target.value)}
                    className="w-full h-8 border rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
          
          {/* Layer Statistics */}
          <div className="p-2 text-xs text-muted-foreground bg-muted/30">
            <div className="flex justify-between">
              <span>Visible: {layers.filter(l => l.visible).length}</span>
              <span>Total: {layers.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}