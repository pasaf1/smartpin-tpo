// src/app/roofs/[id]/layers/page.tsx
// Enhanced roof management with layer system
'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useRoof } from '@/lib/hooks/useSupabaseQueries'
import { LayerPanel, LayeredPinCanvas } from '@/components/layers'
import type { LayerKind } from '@/lib/layers'

export default function RoofLayersPage() {
  const params = useParams()
  const roofId = params.id as string
  
  const { data: roof, isLoading: roofLoading } = useRoof(roofId)
  
  const [visibleLayers, setVisibleLayers] = useState<Set<LayerKind>>(
    new Set(['Issues', 'RFIs', 'Details', 'Notes'])
  )
  const [selectedLayer, setSelectedLayer] = useState<LayerKind>('Issues')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  const handleLayerToggle = (layerName: LayerKind, visible: boolean) => {
    const newVisible = new Set(visibleLayers)
    if (visible) {
      newVisible.add(layerName)
    } else {
      newVisible.delete(layerName)
    }
    setVisibleLayers(newVisible)
  }

  const handlePinCreate = (x: number, y: number, layer: LayerKind) => {
    console.log(`Creating ${layer} pin at (${x}, ${y})`)
    // Pin creation is handled by the canvas component
  }

  const handlePinSelect = (pinId: string) => {
    setSelectedPinId(pinId)
    console.log('Selected pin:', pinId)
  }

  if (roofLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="flex space-x-6">
            <div className="w-80 h-96 bg-muted rounded" />
            <div className="flex-1 h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!roof) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center text-muted-foreground">
          Roof not found
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {roof.name} - Enhanced Layers
          </h1>
          <p className="text-muted-foreground">
            {roof.code} • {roof.building || 'Building not specified'}
          </p>
        </div>

        {/* Main Content */}
        <div className="flex space-x-6">
          {/* Layer Panel */}
          <LayerPanel
            roofId={roofId}
            onPinCreate={(pin) => console.log('Pin created:', pin)}
            onLayerToggle={handleLayerToggle}
          />

          {/* Canvas Area */}
          <div className="flex-1 space-y-4">
            <LayeredPinCanvas
              roofId={roofId}
              backgroundImageUrl={roof.roof_plan_url}
              visibleLayers={visibleLayers}
              selectedLayer={selectedLayer}
              onPinSelect={handlePinSelect}
              onPinCreate={handlePinCreate}
              className="w-full"
            />

            {/* Selected Pin Info */}
            {selectedPinId && (
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Selected Pin</h3>
                <p className="text-sm text-muted-foreground">
                  Pin ID: {selectedPinId}
                </p>
                {/* Add more pin details here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
