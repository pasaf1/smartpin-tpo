/**
 * PinMapper Enhanced System - Canvas State Store
 * Zustand store for managing canvas state, layers, pins, and interactions
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { 
  LayerMetadata, 
  EnhancedPin, 
  ViewportState, 
  SelectionState, 
  InteractionMode,
  LayerKind,
  LayerVisibility,
  LayerFilter,
  CanvasCoordinates,
  PerformanceMetrics,
  LayerEvent,
  LayerEventPayload
} from '../layer-types'

// Canvas state interface
interface CanvasState {
  // Viewport Management
  viewport: ViewportState
  zoomLimits: { min: number; max: number }
  
  // Layer Management
  layers: LayerMetadata[]
  activeLayerId: string | null
  layerFilter: LayerFilter
  
  // Pin Management
  pins: EnhancedPin[]
  filteredPins: EnhancedPin[]
  pinnedToMemory: Set<string> // For performance optimization
  
  // Selection & Interaction
  selection: SelectionState
  interactionMode: InteractionMode
  isCreatingPin: boolean
  isDragging: boolean
  dragState: DragState | null
  
  // UI State
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  showTooltips: boolean
  showMinimap: boolean
  minimapPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  
  // Performance
  performance: PerformanceMetrics
  enableVirtualization: boolean
  clusteringEnabled: boolean
  clusterThreshold: number
  
  // History & Events
  history: HistoryState
  events: LayerEventPayload[]
  maxHistorySize: number
  
  // Loading & Error States
  isLoading: boolean
  error: string | null
  operationInProgress: string | null
}

// Drag state for pin movement
interface DragState {
  pinId: string
  startPosition: CanvasCoordinates
  currentPosition: CanvasCoordinates
  isDragging: boolean
  dragOffset: CanvasCoordinates
}

// History state for undo/redo
interface HistoryState {
  past: Partial<CanvasState>[]
  present: Partial<CanvasState>
  future: Partial<CanvasState>[]
  canUndo: boolean
  canRedo: boolean
}

// Canvas actions interface
interface CanvasActions {
  // Viewport Actions
  setZoom: (zoom: number) => void
  setPan: (pan: CanvasCoordinates) => void
  zoomIn: () => void
  zoomOut: () => void
  resetViewport: () => void
  fitToContent: () => void
  centerOnPin: (pinId: string) => void
  
  // Layer Actions
  addLayer: (layer: Omit<LayerMetadata, 'id'>) => void
  updateLayer: (layerId: string, updates: Partial<LayerMetadata>) => void
  removeLayer: (layerId: string) => void
  setActiveLayer: (layerId: string | null) => void
  toggleLayerVisibility: (layerId: string) => void
  setLayerVisibility: (layerId: string, visibility: LayerVisibility) => void
  reorderLayers: (layerIds: string[]) => void
  setLayerFilter: (filter: Partial<LayerFilter>) => void
  clearLayerFilter: () => void
  
  // Pin Actions
  addPin: (pin: Omit<EnhancedPin, 'id'>) => void
  updatePin: (pinId: string, updates: Partial<EnhancedPin>) => void
  removePin: (pinId: string) => void
  removePins: (pinIds: string[]) => void
  duplicatePin: (pinId: string) => void
  movePin: (pinId: string, position: CanvasCoordinates) => void
  
  // Selection Actions
  selectPin: (pinId: string, addToSelection?: boolean) => void
  selectPins: (pinIds: string[]) => void
  selectAll: () => void
  clearSelection: () => void
  selectInArea: (startPos: CanvasCoordinates, endPos: CanvasCoordinates) => void
  
  // Interaction Actions
  setInteractionMode: (mode: InteractionMode) => void
  startPinCreation: (layerKind: LayerKind) => void
  cancelPinCreation: () => void
  startDragging: (pinId: string, position: CanvasCoordinates) => void
  updateDragging: (position: CanvasCoordinates) => void
  endDragging: () => void
  
  // UI Actions
  toggleGrid: () => void
  setGridSize: (size: number) => void
  toggleSnapToGrid: () => void
  toggleTooltips: () => void
  toggleMinimap: () => void
  setMinimapPosition: (position: CanvasState['minimapPosition']) => void
  
  // Performance Actions
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void
  toggleVirtualization: () => void
  setClusteringEnabled: (enabled: boolean) => void
  setClusterThreshold: (threshold: number) => void
  pinToMemory: (pinId: string) => void
  unpinFromMemory: (pinId: string) => void
  clearMemoryPins: () => void
  
  // History Actions
  undo: () => void
  redo: () => void
  pushToHistory: (state: Partial<CanvasState>) => void
  clearHistory: () => void
  
  // Event Actions
  dispatchEvent: (event: Omit<LayerEventPayload, 'timestamp'>) => void
  clearEvents: () => void
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOperationInProgress: (operation: string | null) => void
  reset: () => void
  exportState: () => string
  importState: (stateJson: string) => void
}

// Combined store type
type CanvasStore = CanvasState & CanvasActions

// Default viewport state
const defaultViewport: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  bounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
  center: { x: 500, y: 500 }
}

// Default selection state
const defaultSelection: SelectionState = {
  selectedPinIds: [],
  selectionMode: 'single',
  selectionArea: undefined,
  lastSelected: undefined
}

// Default history state
const defaultHistory: HistoryState = {
  past: [],
  present: {},
  future: [],
  canUndo: false,
  canRedo: false
}

// Default performance metrics
const defaultPerformance: PerformanceMetrics = {
  renderTime: 0,
  updateTime: 0,
  memoryUsage: 0,
  pinCount: 0,
  layerCount: 0,
  fps: 60,
  timestamp: new Date()
}

// Create the Zustand store
export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
        // Initial State
        viewport: defaultViewport,
        zoomLimits: { min: 0.1, max: 10 },
        
        layers: [],
        activeLayerId: null,
        layerFilter: {
          kinds: [],
          statuses: [],
          visibilities: []
        },
        
        pins: [],
        filteredPins: [],
        pinnedToMemory: new Set(),
        
        selection: defaultSelection,
        interactionMode: 'select',
        isCreatingPin: false,
        isDragging: false,
        dragState: null,
        
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
        showTooltips: true,
        showMinimap: false,
        minimapPosition: 'top-right',
        
        performance: defaultPerformance,
        enableVirtualization: true,
        clusteringEnabled: true,
        clusterThreshold: 50,
        
        history: defaultHistory,
        events: [],
        maxHistorySize: 50,
        
        isLoading: false,
        error: null,
        operationInProgress: null,

        // Viewport Actions
        setZoom: (zoom: number) => set((state) => {
          const clampedZoom = Math.max(
            state.zoomLimits.min, 
            Math.min(state.zoomLimits.max, zoom)
          )
          state.viewport.zoom = clampedZoom
        }),

        setPan: (pan: CanvasCoordinates) => set((state) => {
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

        fitToContent: () => set((state) => {
          if (state.pins.length === 0) return
          
          const padding = 50
          const positions = state.pins.map(pin => ({ x: pin.x_position, y: pin.y_position }))
          const minX = Math.min(...positions.map(p => p.x)) - padding
          const maxX = Math.max(...positions.map(p => p.x)) + padding
          const minY = Math.min(...positions.map(p => p.y)) - padding
          const maxY = Math.max(...positions.map(p => p.y)) + padding
          
          const width = maxX - minX
          const height = maxY - minY
          
          state.viewport.bounds = { minX, maxX, minY, maxY }
          state.viewport.center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
          state.viewport.zoom = Math.min(
            state.viewport.bounds.maxX / width,
            state.viewport.bounds.maxY / height
          ) * 0.9
        }),

        centerOnPin: (pinId: string) => set((state) => {
          const pin = state.pins.find(p => p.id === pinId)
          if (pin) {
            state.viewport.center = { x: pin.x_position, y: pin.y_position }
            state.viewport.pan = { x: -pin.x_position, y: -pin.y_position }
          }
        }),

        // Layer Actions
        addLayer: (layer) => set((state) => {
          const newLayer: LayerMetadata = {
            ...layer,
            id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          state.layers.push(newLayer)
        }),

        updateLayer: (layerId: string, updates) => set((state) => {
          const layerIndex = state.layers.findIndex(l => l.id === layerId)
          if (layerIndex !== -1) {
            state.layers[layerIndex] = { ...state.layers[layerIndex], ...updates }
          }
        }),

        removeLayer: (layerId: string) => set((state) => {
          state.layers = state.layers.filter(l => l.id !== layerId)
          if (state.activeLayerId === layerId) {
            state.activeLayerId = null
          }
          // Remove pins from this layer
          state.pins = state.pins.filter(p => p.layerId !== layerId)
        }),

        setActiveLayer: (layerId: string | null) => set((state) => {
          state.activeLayerId = layerId
        }),

        toggleLayerVisibility: (layerId: string) => set((state) => {
          const layer = state.layers.find(l => l.id === layerId)
          if (layer) {
            layer.visibility = layer.visibility === 'visible' ? 'hidden' : 'visible'
          }
        }),

        setLayerVisibility: (layerId: string, visibility: LayerVisibility) => set((state) => {
          const layer = state.layers.find(l => l.id === layerId)
          if (layer) {
            layer.visibility = visibility
          }
        }),

        reorderLayers: (layerIds: string[]) => set((state) => {
          const reorderedLayers = layerIds.map(id => 
            state.layers.find(l => l.id === id)!
          ).filter(Boolean)
          state.layers = reorderedLayers
        }),

        setLayerFilter: (filter: Partial<LayerFilter>) => set((state) => {
          state.layerFilter = { ...state.layerFilter, ...filter }
          // Update filtered pins based on new filter
          state.filteredPins = state.pins.filter(pin => {
            const layer = state.layers.find(l => l.id === pin.layerId)
            if (!layer) return false
            
            if (filter.kinds?.length && !filter.kinds.includes(layer.kind)) return false
            if (filter.statuses?.length && !filter.statuses.includes(layer.status)) return false
            if (filter.visibilities?.length && !filter.visibilities.includes(layer.visibility)) return false
            
            return true
          })
        }),

        clearLayerFilter: () => set((state) => {
          state.layerFilter = { kinds: [], statuses: [], visibilities: [] }
          state.filteredPins = [...state.pins]
        }),

        // Pin Actions
        addPin: (pin) => set((state) => {
          const newPin: EnhancedPin = {
            ...pin,
            id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          state.pins.push(newPin)
          state.filteredPins = [...state.pins] // Update filtered pins
        }),

        updatePin: (pinId: string, updates) => set((state) => {
          const pinIndex = state.pins.findIndex(p => p.id === pinId)
          if (pinIndex !== -1) {
            state.pins[pinIndex] = { ...state.pins[pinIndex], ...updates }
            // Update filtered pins as well
            const filteredIndex = state.filteredPins.findIndex(p => p.id === pinId)
            if (filteredIndex !== -1) {
              state.filteredPins[filteredIndex] = state.pins[pinIndex]
            }
          }
        }),

        removePin: (pinId: string) => set((state) => {
          state.pins = state.pins.filter(p => p.id !== pinId)
          state.filteredPins = state.filteredPins.filter(p => p.id !== pinId)
          state.selection.selectedPinIds = state.selection.selectedPinIds.filter(id => id !== pinId)
          state.pinnedToMemory.delete(pinId)
        }),

        removePins: (pinIds: string[]) => set((state) => {
          const pinIdSet = new Set(pinIds)
          state.pins = state.pins.filter(p => !pinIdSet.has(p.id))
          state.filteredPins = state.filteredPins.filter(p => !pinIdSet.has(p.id))
          state.selection.selectedPinIds = state.selection.selectedPinIds.filter(id => !pinIdSet.has(id))
          pinIds.forEach(id => state.pinnedToMemory.delete(id))
        }),

        duplicatePin: (pinId: string) => set((state) => {
          const pin = state.pins.find(p => p.id === pinId)
          if (pin) {
            const duplicatedPin: EnhancedPin = {
              ...pin,
              id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              x_position: pin.x_position + 20,
              y_position: pin.y_position + 20,
              created_at: new Date().toISOString()
            }
            state.pins.push(duplicatedPin)
            state.filteredPins.push(duplicatedPin)
          }
        }),

        movePin: (pinId: string, position: CanvasCoordinates) => set((state) => {
          const pin = state.pins.find(p => p.id === pinId)
          if (pin) {
            pin.x_position = position.x
            pin.y_position = position.y
          }
        }),

        // Selection Actions
        selectPin: (pinId: string, addToSelection = false) => set((state) => {
          if (addToSelection) {
            if (!state.selection.selectedPinIds.includes(pinId)) {
              state.selection.selectedPinIds.push(pinId)
            }
          } else {
            state.selection.selectedPinIds = [pinId]
          }
          state.selection.lastSelected = pinId
        }),

        selectPins: (pinIds: string[]) => set((state) => {
          state.selection.selectedPinIds = [...pinIds]
          state.selection.lastSelected = pinIds[pinIds.length - 1]
        }),

        selectAll: () => set((state) => {
          state.selection.selectedPinIds = state.filteredPins.map(p => p.id)
        }),

        clearSelection: () => set((state) => {
          state.selection.selectedPinIds = []
          state.selection.lastSelected = undefined
          state.selection.selectionArea = undefined
        }),

        selectInArea: (startPos: CanvasCoordinates, endPos: CanvasCoordinates) => set((state) => {
          const minX = Math.min(startPos.x, endPos.x)
          const maxX = Math.max(startPos.x, endPos.x)
          const minY = Math.min(startPos.y, endPos.y)
          const maxY = Math.max(startPos.y, endPos.y)
          
          const pinsInArea = state.filteredPins.filter(pin => 
            pin.x_position >= minX && pin.x_position <= maxX &&
            pin.y_position >= minY && pin.y_position <= maxY
          )
          
          state.selection.selectedPinIds = pinsInArea.map(p => p.id)
          state.selection.selectionArea = { start: startPos, end: endPos }
        }),

        // Interaction Actions
        setInteractionMode: (mode: InteractionMode) => set((state) => {
          state.interactionMode = mode
          if (mode !== 'create') {
            state.isCreatingPin = false
          }
        }),

        startPinCreation: (layerKind: LayerKind) => set((state) => {
          state.isCreatingPin = true
          state.interactionMode = 'create'
          // Set active layer to the first layer of this kind
          const targetLayer = state.layers.find(l => l.kind === layerKind)
          if (targetLayer) {
            state.activeLayerId = targetLayer.id
          }
        }),

        cancelPinCreation: () => set((state) => {
          state.isCreatingPin = false
          state.interactionMode = 'select'
        }),

        startDragging: (pinId: string, position: CanvasCoordinates) => set((state) => {
          const pin = state.pins.find(p => p.id === pinId)
          if (pin) {
            state.isDragging = true
            state.dragState = {
              pinId,
              startPosition: { x: pin.x_position, y: pin.y_position },
              currentPosition: position,
              isDragging: true,
              dragOffset: {
                x: position.x - pin.x_position,
                y: position.y - pin.y_position
              }
            }
          }
        }),

        updateDragging: (position: CanvasCoordinates) => set((state) => {
          if (state.dragState) {
            state.dragState.currentPosition = position
            const newPosition = {
              x: position.x - state.dragState.dragOffset.x,
              y: position.y - state.dragState.dragOffset.y
            }
            
            // Apply snap to grid if enabled
            if (state.snapToGrid) {
              newPosition.x = Math.round(newPosition.x / state.gridSize) * state.gridSize
              newPosition.y = Math.round(newPosition.y / state.gridSize) * state.gridSize
            }
            
            // Update pin position
            const pin = state.pins.find(p => p.id === state.dragState!.pinId)
            if (pin) {
              pin.x_position = newPosition.x
              pin.y_position = newPosition.y
            }
          }
        }),

        endDragging: () => set((state) => {
          state.isDragging = false
          state.dragState = null
        }),

        // UI Actions
        toggleGrid: () => set((state) => {
          state.showGrid = !state.showGrid
        }),

        setGridSize: (size: number) => set((state) => {
          state.gridSize = Math.max(1, size)
        }),

        toggleSnapToGrid: () => set((state) => {
          state.snapToGrid = !state.snapToGrid
        }),

        toggleTooltips: () => set((state) => {
          state.showTooltips = !state.showTooltips
        }),

        toggleMinimap: () => set((state) => {
          state.showMinimap = !state.showMinimap
        }),

        setMinimapPosition: (position) => set((state) => {
          state.minimapPosition = position
        }),

        // Performance Actions
        updatePerformance: (metrics: Partial<PerformanceMetrics>) => set((state) => {
          state.performance = { ...state.performance, ...metrics, timestamp: new Date() }
        }),

        toggleVirtualization: () => set((state) => {
          state.enableVirtualization = !state.enableVirtualization
        }),

        setClusteringEnabled: (enabled: boolean) => set((state) => {
          state.clusteringEnabled = enabled
        }),

        setClusterThreshold: (threshold: number) => set((state) => {
          state.clusterThreshold = Math.max(1, threshold)
        }),

        pinToMemory: (pinId: string) => set((state) => {
          state.pinnedToMemory.add(pinId)
        }),

        unpinFromMemory: (pinId: string) => set((state) => {
          state.pinnedToMemory.delete(pinId)
        }),

        clearMemoryPins: () => set((state) => {
          state.pinnedToMemory.clear()
        }),

        // History Actions
        undo: () => set((state) => {
          if (state.history.past.length > 0) {
            const previous = state.history.past.pop()!
            state.history.future.unshift(state.history.present)
            state.history.present = previous
            
            // Apply the previous state
            Object.assign(state, previous)
            
            state.history.canUndo = state.history.past.length > 0
            state.history.canRedo = true
          }
        }),

        redo: () => set((state) => {
          if (state.history.future.length > 0) {
            const next = state.history.future.shift()!
            state.history.past.push(state.history.present)
            state.history.present = next
            
            // Apply the next state
            Object.assign(state, next)
            
            state.history.canRedo = state.history.future.length > 0
            state.history.canUndo = true
          }
        }),

        pushToHistory: (stateSnapshot: Partial<CanvasState>) => set((state) => {
          state.history.past.push(state.history.present)
          state.history.present = stateSnapshot
          state.history.future = [] // Clear future when new action is performed
          
          // Limit history size
          if (state.history.past.length > state.maxHistorySize) {
            state.history.past.shift()
          }
          
          state.history.canUndo = state.history.past.length > 0
          state.history.canRedo = false
        }),

        clearHistory: () => set((state) => {
          state.history = { ...defaultHistory }
        }),

        // Event Actions
        dispatchEvent: (event) => set((state) => {
          const eventWithTimestamp: LayerEventPayload = {
            ...event,
            timestamp: new Date()
          }
          state.events.push(eventWithTimestamp)
          
          // Limit events array size
          if (state.events.length > 1000) {
            state.events = state.events.slice(-500) // Keep last 500 events
          }
        }),

        clearEvents: () => set((state) => {
          state.events = []
        }),

        // Utility Actions
        setLoading: (loading: boolean) => set((state) => {
          state.isLoading = loading
        }),

        setError: (error: string | null) => set((state) => {
          state.error = error
        }),

        setOperationInProgress: (operation: string | null) => set((state) => {
          state.operationInProgress = operation
        }),

        reset: () => set(() => ({
          viewport: defaultViewport,
          zoomLimits: { min: 0.1, max: 10 },
          layers: [],
          activeLayerId: null,
          layerFilter: { kinds: [], statuses: [], visibilities: [] },
          pins: [],
          filteredPins: [],
          pinnedToMemory: new Set(),
          selection: defaultSelection,
          interactionMode: 'select' as InteractionMode,
          isCreatingPin: false,
          isDragging: false,
          dragState: null,
          showGrid: true,
          snapToGrid: false,
          gridSize: 20,
          showTooltips: true,
          showMinimap: false,
          minimapPosition: 'top-right' as const,
          performance: defaultPerformance,
          enableVirtualization: true,
          clusteringEnabled: true,
          clusterThreshold: 50,
          history: defaultHistory,
          events: [],
          maxHistorySize: 50,
          isLoading: false,
          error: null,
          operationInProgress: null
        })),

        exportState: () => {
          const state = get()
          const exportData = {
            layers: state.layers,
            pins: state.pins,
            viewport: state.viewport,
            settings: {
              showGrid: state.showGrid,
              snapToGrid: state.snapToGrid,
              gridSize: state.gridSize,
              showTooltips: state.showTooltips,
              enableVirtualization: state.enableVirtualization,
              clusteringEnabled: state.clusteringEnabled,
              clusterThreshold: state.clusterThreshold
            }
          }
          return JSON.stringify(exportData, null, 2)
        },

        importState: (stateJson: string) => set((state) => {
          try {
            const importData = JSON.parse(stateJson)
            
            if (importData.layers) state.layers = importData.layers
            if (importData.pins) {
              state.pins = importData.pins
              state.filteredPins = importData.pins
            }
            if (importData.viewport) state.viewport = importData.viewport
            if (importData.settings) {
              Object.assign(state, importData.settings)
            }
            
            state.error = null
          } catch (error) {
            state.error = 'Failed to import state: Invalid JSON format'
          }
        })
      }))
)

// Selector hooks for performance optimization
export const useViewport = () => useCanvasStore((state) => state.viewport)
export const useLayers = () => useCanvasStore((state) => state.layers)
export const usePins = () => useCanvasStore((state) => state.filteredPins)
export const useSelection = () => useCanvasStore((state) => state.selection)
export const useInteractionMode = () => useCanvasStore((state) => state.interactionMode)
export const usePerformance = () => useCanvasStore((state) => state.performance)

// Action hooks
export const useCanvasActions = () => useCanvasStore((state) => ({
  setZoom: state.setZoom,
  setPan: state.setPan,
  addPin: state.addPin,
  selectPin: state.selectPin,
  setInteractionMode: state.setInteractionMode,
  addLayer: state.addLayer,
  toggleLayerVisibility: state.toggleLayerVisibility
}))

export default useCanvasStore
