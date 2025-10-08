/**
 * SmartPin TPO - Layer System
 * Bluebeam-style layer management components
 */

export { LayerManager } from './LayerManager'

// Layer types and interfaces
export type Layer = {
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

export type Annotation = {
  id: string
  layer_id: string
  roof_id: string
  x: number
  y: number
  text?: string
  annotation_type: 'note' | 'arrow' | 'circle' | 'rectangle' | 'line' | 'freehand'
  style?: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

// Layer utilities
export const LayerUtils = {
  // Get next z-index for new layer
  getNextZIndex: (layers: Layer[]): number => {
    return Math.max(...layers.map(l => l.z_index), 0) + 1
  },

  // Sort layers by z-index (top to bottom)
  sortByZIndex: (layers: Layer[]): Layer[] => {
    return [...layers].sort((a, b) => b.z_index - a.z_index)
  },

  // Get visible layers only
  getVisibleLayers: (layers: Layer[]): Layer[] => {
    return layers.filter(l => l.visible)
  },

  // Get unlocked layers only
  getUnlockedLayers: (layers: Layer[]): Layer[] => {
    return layers.filter(l => !l.locked)
  },

  // Default layer configurations
  getDefaultLayers: (roofId: string): Omit<Layer, 'id' | 'created_at' | 'updated_at'>[] => [
    {
      roof_id: roofId,
      name: 'Issues',
      type: 'pins',
      visible: true,
      z_index: 2,
      opacity: 1.0,
      locked: false,
      created_by: 'system'
    },
    {
      roof_id: roofId,
      name: 'Notes',
      type: 'annotations',
      visible: true,
      z_index: 1,
      opacity: 1.0,
      locked: false,
      created_by: 'system'
    }
  ]
}