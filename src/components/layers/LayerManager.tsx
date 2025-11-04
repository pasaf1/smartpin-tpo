'use client'

/**
 * SmartPin TPO - Layer Manager
 * Bluebeam-style layer management with visibility controls and z-index ordering
 */

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface Layer {
  id: string
  roof_id: string
  name: string
  type: 'pins' | 'annotations' | 'custom' | 'notes' | 'markup'
  visible: boolean
  z_index: number
  opacity: number
  locked: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface LayerManagerProps {
  roofId: string
  layers: Layer[]
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => Promise<void>
  onLayerCreate: (layer: Omit<Layer, 'id' | 'created_at' | 'updated_at'>) => Promise<Layer>
  onLayerDelete: (layerId: string) => Promise<void>
  onLayerReorder: (layers: Layer[]) => Promise<void>
  canEdit?: boolean
  className?: string
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  roofId,
  layers,
  onLayerUpdate,
  onLayerCreate,
  onLayerDelete,
  onLayerReorder,
  canEdit = true,
  className
}) => {
  const [isReordering, setIsReordering] = useState(false)
  const [newLayerName, setNewLayerName] = useState('')
  const [showAddLayer, setShowAddLayer] = useState(false)

  // Sort layers by z_index
  const sortedLayers = [...layers].sort((a, b) => b.z_index - a.z_index)

  // Layer type configuration
  const layerTypeConfig = {
    pins: { icon: '📍', label: 'Pins', color: 'bg-red-100 text-red-800' },
    annotations: { icon: '📝', label: 'Annotations', color: 'bg-blue-100 text-blue-800' },
    custom: { icon: '🎨', label: 'Custom', color: 'bg-purple-100 text-purple-800' },
    notes: { icon: '📋', label: 'Notes', color: 'bg-yellow-100 text-yellow-800' },
    markup: { icon: '✏️', label: 'Markup', color: 'bg-green-100 text-green-800' }
  }

  // Handle layer visibility toggle
  const handleVisibilityToggle = useCallback(async (layerId: string, visible: boolean) => {
    try {
      await onLayerUpdate(layerId, { visible })
    } catch (error) {
      console.error('Failed to update layer visibility:', error)
    }
  }, [onLayerUpdate])

  // Handle opacity change
  const handleOpacityChange = useCallback(async (layerId: string, opacity: number) => {
    try {
      await onLayerUpdate(layerId, { opacity: opacity / 100 })
    } catch (error) {
      console.error('Failed to update layer opacity:', error)
    }
  }, [onLayerUpdate])

  // Handle lock toggle
  const handleLockToggle = useCallback(async (layerId: string, locked: boolean) => {
    try {
      await onLayerUpdate(layerId, { locked })
    } catch (error) {
      console.error('Failed to update layer lock:', error)
    }
  }, [onLayerUpdate])

  // Handle layer reordering
  const moveLayer = useCallback(async (layerId: string, direction: 'up' | 'down') => {
    const currentLayer = layers.find(l => l.id === layerId)
    if (!currentLayer) return

    const newZIndex = direction === 'up'
      ? currentLayer.z_index + 1
      : Math.max(1, currentLayer.z_index - 1)

    // Check if another layer has this z_index
    const conflictingLayer = layers.find(l => l.z_index === newZIndex && l.id !== layerId)

    setIsReordering(true)
    try {
      if (conflictingLayer) {
        // Swap z_indexes
        await onLayerUpdate(conflictingLayer.id, { z_index: currentLayer.z_index })
      }
      await onLayerUpdate(layerId, { z_index: newZIndex })
    } catch (error) {
      console.error('Failed to reorder layer:', error)
    } finally {
      setIsReordering(false)
    }
  }, [layers, onLayerUpdate])

  // Create new layer
  const handleCreateLayer = useCallback(async (type: Layer['type']) => {
    if (!newLayerName.trim()) return

    const maxZIndex = Math.max(...layers.map(l => l.z_index), 0)

    try {
      const newLayer: Omit<Layer, 'id' | 'created_at' | 'updated_at'> = {
        roof_id: roofId,
        name: newLayerName.trim(),
        type,
        visible: true,
        z_index: maxZIndex + 1,
        opacity: 1.0,
        locked: false,
        created_by: 'current-user' // Will be set by backend
      }

      await onLayerCreate(newLayer)
      setNewLayerName('')
      setShowAddLayer(false)
    } catch (error) {
      console.error('Failed to create layer:', error)
    }
  }, [newLayerName, roofId, layers, onLayerCreate])

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
          {canEdit && (
            <Button
              onClick={() => setShowAddLayer(true)}
              size="sm"
              className="text-xs"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Layer
            </Button>
          )}
        </div>
      </div>

      {/* Layers list */}
      <div className="p-2 space-y-2">
        {sortedLayers.map((layer) => {
          const config = layerTypeConfig[layer.type]
          return (
            <div
              key={layer.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                layer.visible ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100",
                layer.locked && "bg-gray-100"
              )}
            >
              {/* Layer header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    config.color
                  )}>
                    {config.icon} {config.label}
                  </span>
                  <span className="font-medium text-gray-900">{layer.name}</span>
                  {layer.locked && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>

                {/* Layer controls */}
                <div className="flex items-center gap-2">
                  {/* Z-index controls */}
                  {canEdit && !layer.locked && (
                    <div className="flex">
                      <button
                        onClick={() => moveLayer(layer.id, 'up')}
                        disabled={isReordering}
                        className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Move layer up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveLayer(layer.id, 'down')}
                        disabled={isReordering || layer.z_index <= 1}
                        className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Move layer down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Visibility toggle */}
                  <Switch
                    checked={layer.visible}
                    onCheckedChange={(visible) => handleVisibilityToggle(layer.id, visible)}
                    disabled={!canEdit}
                  />

                  {/* Lock toggle */}
                  {canEdit && (
                    <button
                      onClick={() => handleLockToggle(layer.id, !layer.locked)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        layer.locked
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-400 hover:bg-gray-200"
                      )}
                      title={layer.locked ? "Unlock layer" : "Lock layer"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {layer.locked ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Opacity control */}
              {layer.visible && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Opacity</span>
                    <span className="text-gray-900 font-medium">{Math.round(layer.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[layer.opacity * 100]}
                    onValueChange={(values) => {
                      const value = values[0]
                      if (value !== undefined) {
                        handleOpacityChange(layer.id, value)
                      }
                    }}
                    min={10}
                    max={100}
                    step={10}
                    disabled={!canEdit || layer.locked}
                    className="w-full"
                  />
                </div>
              )}

              {/* Layer info */}
              <div className="mt-2 text-xs text-gray-500">
                Z-Index: {layer.z_index} • Created: {new Date(layer.created_at).toLocaleDateString()}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {layers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-sm">No layers yet</p>
            <p className="text-xs">Create layers to organize your content</p>
          </div>
        )}
      </div>

      {/* Add layer dialog */}
      {showAddLayer && canEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Layer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layer Name
                </label>
                <input
                  type="text"
                  value={newLayerName}
                  onChange={(e) => setNewLayerName(e.target.value)}
                  placeholder="Enter layer name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layer Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(layerTypeConfig).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => handleCreateLayer(type as Layer['type'])}
                      disabled={!newLayerName.trim()}
                      className={cn(
                        "p-3 text-left border rounded-lg transition-colors",
                        "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
                        "flex items-center gap-2"
                      )}
                    >
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", config.color)}>
                        {config.icon}
                      </span>
                      <span className="text-sm font-medium">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddLayer(false)
                  setNewLayerName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global actions */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {layers.length} layer{layers.length !== 1 ? 's' : ''} •
            {layers.filter(l => l.visible).length} visible
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  layers.forEach(layer => {
                    handleVisibilityToggle(layer.id, false)
                  })
                }}
                className="text-xs"
              >
                Hide All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  layers.forEach(layer => {
                    handleVisibilityToggle(layer.id, true)
                  })
                }}
                className="text-xs"
              >
                Show All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LayerManager