// src/components/layers/LayerPanel.tsx
// Enhanced layer management panel component
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  MessageSquare,
  Plus,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react'
import { useLayerManagement, useCreateEnhancedPin } from '@/lib/layers'
import type { LayerKind } from '@/lib/layers'

interface LayerPanelProps {
  roofId: string
  onPinCreate?: (pin: any) => void
  onLayerToggle?: (layerName: LayerKind, visible: boolean) => void
}

const LAYER_ICONS = {
  'Issues': AlertTriangle,
  'RFIs': HelpCircle,
  'Details': FileText,
  'Notes': MessageSquare,
} as const

export function LayerPanel({ roofId, onPinCreate, onLayerToggle }: LayerPanelProps) {
  const [visibleLayers, setVisibleLayers] = useState<Set<LayerKind>>(
    new Set(['Issues', 'RFIs', 'Details', 'Notes'])
  )
  const [selectedLayer, setSelectedLayer] = useState<LayerKind>('Issues')

  const { layers, stats, pinsByLayer, isLoading, error } = useLayerManagement(roofId)
  const createPin = useCreateEnhancedPin()

  const handleLayerToggle = (layerName: LayerKind) => {
    const newVisible = new Set(visibleLayers)
    if (newVisible.has(layerName)) {
      newVisible.delete(layerName)
    } else {
      newVisible.add(layerName)
    }
    setVisibleLayers(newVisible)
    onLayerToggle?.(layerName, !visibleLayers.has(layerName))
  }

  const handleCreatePin = async (x: number, y: number) => {
    try {
      const result = await createPin.mutateAsync({
        roof_id: roofId,
        layer_name: selectedLayer,
        x,
        y,
        priority: 'Medium',
        defect_type: selectedLayer,
        description: `New ${selectedLayer} pin`
      })

      if (result.success) {
        onPinCreate?.(result.pin)
      }
    } catch (error) {
      console.error('Failed to create pin:', error)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Failed to load layers</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Layers
          <Filter className="h-4 w-4" />
        </CardTitle>
        <CardDescription>
          Manage pin layers and visibility
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Layer List */}
        <div className="space-y-2">
          {stats.map((stat) => {
            const IconComponent = LAYER_ICONS[stat.layer as LayerKind] || AlertTriangle
            const isVisible = visibleLayers.has(stat.layer as LayerKind)
            const isSelected = selectedLayer === stat.layer
            
            return (
              <div
                key={stat.layer}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-colors hover:bg-muted/50
                  ${isSelected ? 'bg-primary/10 border-primary' : ''}
                  ${!isVisible ? 'opacity-50' : ''}
                `}
                onClick={() => setSelectedLayer(stat.layer as LayerKind)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stat.color }}
                  />
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{stat.layer}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {stat.total}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLayerToggle(stat.layer as LayerKind)
                    }}
                  >
                    {isVisible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Statistics */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Statistics</h4>
          {stats.map((stat) => (
            <div key={stat.layer} className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{stat.layer}:</span>
                <span>
                  {stat.open}O / {stat.ready}R / {stat.closed}C
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Selected Layer Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected: {selectedLayer}
          </h4>
          <div className="text-xs text-muted-foreground">
            {pinsByLayer[selectedLayer]?.length || 0} pins in this layer
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={createPin.isPending}
            onClick={() => {
              // This would typically be triggered by canvas click
              // For demo, create at random position
              handleCreatePin(Math.random(), Math.random())
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add {selectedLayer} Pin
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
