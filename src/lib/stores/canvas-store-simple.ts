/**
 * PinMapper MVP Canvas Store - Simple & Stable
 * Focused on core functionality without premature optimization
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { 
  LayerMetadata, 
  EnhancedPin, 
  ViewportState, 
  SelectionState
} from '../layer-types'

// Simplified Canvas State - MVP Focus
interface CanvasState {
  // Core Viewport Management
  viewport: ViewportState
  zoomLimits: { min: number; max: number }
  
  // Layer Management (minimal)
  layers: LayerMetadata[]
  activeLayerId: string | null
  
  // Pin Management (basic only)
  pins: EnhancedPin[]
  
  // Selection (simple)
  selection: SelectionState
  
  // Loading State
  isLoading: boolean
  error: string | null
  
  // Feature Flags (disabled by default - enable when needed)
  featureFlags: {
    enableMinimap: boolean
    enableClustering: boolean
    enableVirtualization: boolean
    enableHistory: boolean
    enableEvents: boolean
  }
}

// Store Actions Interface
interface CanvasStore extends CanvasState {
  // Viewport Actions
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  resetViewport: () => void
  fitToContent: () => void
  
  // Layer Actions
  addLayer: (layer: LayerMetadata) => void
  removeLayer: (layerId: string) => void
  setActiveLayer: (layerId: string | null) => void
  
  // Pin Actions
  addPin: (pin: EnhancedPin) => void
  removePin: (pinId: string) => void
  updatePin: (pinId: string, updates: Partial<EnhancedPin>) => void
  
  // Selection Actions
  selectPin: (pinId: string) => void
  selectMultiplePins: (pinIds: string[]) => void
  clearSelection: () => void
  
  // Feature Flag Actions
  toggleFeature: (feature: keyof CanvasState['featureFlags']) => void
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Default states
const defaultViewport: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  center: { x: 0.5, y: 0.5 },
  bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }
}

const defaultSelection: SelectionState = {
  selectedPinIds: [],
  selectionMode: 'single',
  selectionArea: undefined,
  lastSelected: undefined
}

// Create the simplified Zustand store
export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial State
    viewport: defaultViewport,
    zoomLimits: { min: 0.1, max: 10 },
    
    layers: [],
    activeLayerId: null,
    
    pins: [],
    
    selection: defaultSelection,
    
    isLoading: false,
    error: null,
    
    featureFlags: {
      enableMinimap: false,
      enableClustering: false,
      enableVirtualization: false,
      enableHistory: false,
      enableEvents: false
    },

    // Viewport Actions
    setZoom: (zoom: number) => set((state) => {
      const clampedZoom = Math.max(
        state.zoomLimits.min, 
        Math.min(state.zoomLimits.max, zoom)
      )
      state.viewport.zoom = clampedZoom
    }),

    setPan: (pan: { x: number; y: number }) => set((state) => {
      state.viewport.pan = pan
    }),

    zoomIn: () => set((state) => {
      const newZoom = Math.min(state.zoomLimits.max, state.viewport.zoom * 1.2)
      state.viewport.zoom = newZoom
    }),

    zoomOut: () => set((state) => {
      const newZoom = Math.max(state.zoomLimits.min, state.viewport.zoom / 1.2)
      state.viewport.zoom = newZoom
    }),

    resetViewport: () => set((state) => {
      state.viewport = { ...defaultViewport }
    }),

    // Fixed fitToContent algorithm - proper zoom calculation
    fitToContent: () => set((state) => {
      if (state.pins.length === 0) return
      
      // Find actual content bounds
      const positions = state.pins.map(pin => ({ x: pin.x, y: pin.y }))
      const minX = Math.min(...positions.map(p => p.x))
      const maxX = Math.max(...positions.map(p => p.x))
      const minY = Math.min(...positions.map(p => p.y))
      const maxY = Math.max(...positions.map(p => p.y))
      
      const contentWidth = maxX - minX
      const contentHeight = maxY - minY
      
      // Assume container size (should come from Canvas Core)
      const containerWidth = 800 // TODO: Get from Canvas Core
      const containerHeight = 600
      
      // Calculate zoom to fit content with padding
      const padding = 0.1 // 10% padding
      const zoomX = containerWidth / (contentWidth + padding * contentWidth)
      const zoomY = containerHeight / (contentHeight + padding * contentHeight)
      const newZoom = Math.min(zoomX, zoomY, state.zoomLimits.max)
      
      // Center on content
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      
      state.viewport.zoom = newZoom
      state.viewport.center = { x: centerX, y: centerY }
      state.viewport.bounds = { minX, maxX, minY, maxY }
    }),

    // Layer Actions
    addLayer: (layer: LayerMetadata) => set((state) => {
      const exists = state.layers.find(l => l.id === layer.id)
      if (!exists) {
        state.layers.push(layer)
      }
    }),

    removeLayer: (layerId: string) => set((state) => {
      state.layers = state.layers.filter(l => l.id !== layerId)
      // Remove pins from this layer
      state.pins = state.pins.filter(p => p.layerId !== layerId)
      // Clear selection if active layer is removed
      if (state.activeLayerId === layerId) {
        state.activeLayerId = null
      }
    }),

    setActiveLayer: (layerId: string | null) => set((state) => {
      state.activeLayerId = layerId
    }),

    // Pin Actions
    addPin: (pin: EnhancedPin) => set((state) => {
      const exists = state.pins.find(p => p.id === pin.id)
      if (!exists) {
        state.pins.push(pin)
      }
    }),

    removePin: (pinId: string) => set((state) => {
      state.pins = state.pins.filter(p => p.id !== pinId)
      // Remove from selection if selected
      state.selection.selectedPinIds = state.selection.selectedPinIds.filter(id => id !== pinId)
    }),

    updatePin: (pinId: string, updates: Partial<EnhancedPin>) => set((state) => {
      const pinIndex = state.pins.findIndex(p => p.id === pinId)
      if (pinIndex !== -1) {
        Object.assign(state.pins[pinIndex], updates)
      }
    }),

    // Selection Actions
    selectPin: (pinId: string) => set((state) => {
      state.selection.selectedPinIds = [pinId]
    }),

    selectMultiplePins: (pinIds: string[]) => set((state) => {
      state.selection.selectedPinIds = pinIds
    }),

    clearSelection: () => set((state) => {
      state.selection.selectedPinIds = []
      state.selection.selectionArea = undefined
      state.selection.lastSelected = undefined
    }),

    // Feature Flag Actions
    toggleFeature: (feature: keyof CanvasState['featureFlags']) => set((state) => {
      state.featureFlags[feature] = !state.featureFlags[feature]
    }),

    // Utility Actions
    setLoading: (loading: boolean) => set((state) => {
      state.isLoading = loading
    }),

    setError: (error: string | null) => set((state) => {
      state.error = error
    })
  }))
)

// Convenience selectors for common use cases
export const useViewport = () => useCanvasStore((state) => state.viewport)
export const useLayers = () => useCanvasStore((state) => state.layers)
export const usePins = () => useCanvasStore((state) => state.pins)
export const useSelection = () => useCanvasStore((state) => state.selection)
export const useActiveLayer = () => useCanvasStore((state) => state.activeLayerId)
export const useFeatureFlags = () => useCanvasStore((state) => state.featureFlags)

// Computed selectors
export const useVisiblePins = () => useCanvasStore((state) => {
  // Simple filtering - no premature optimization
  return state.pins.filter(pin => {
    const layer = state.layers.find(l => l.id === pin.layerId)
    return layer && layer.visibility === 'visible'
  })
})

export const useSelectedPins = () => useCanvasStore((state) => {
  return state.pins.filter(pin => state.selection.selectedPinIds.includes(pin.id))
})

// Debug selector for development
export const useDebugInfo = () => useCanvasStore((state) => ({
  pinCount: state.pins.length,
  selectedCount: state.selection.selectedPinIds.length,
  layerCount: state.layers.length,
  zoom: state.viewport.zoom,
  pan: state.viewport.pan,
  activeLayer: state.activeLayerId,
  isLoading: state.isLoading,
  error: state.error,
  featureFlags: state.featureFlags
}))

export type { CanvasStore, CanvasState }
