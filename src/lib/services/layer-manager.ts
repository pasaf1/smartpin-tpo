/**
 * PinMapper Enhanced System - Layer Manager Service
 * Comprehensive layer management with validation, events, and optimization
 */

import { 
  LayerMetadata, 
  LayerKind, 
  LayerVisibility, 
  LayerStatus, 
  LayerFilter,
  LayerEventPayload,
  LayerOperationResult,
  LayerError
} from '../layer-types'
import { 
  createDefaultLayer, 
  createDefaultLayerSet, 
  VALIDATION_RULES,
  DEFAULT_LAYER_ORDER 
} from '../layer-constants'
import { PermissionService, UserRole } from './permission-service'

// Layer change event
export interface LayerChangeEvent {
  type: 'created' | 'updated' | 'deleted' | 'reordered' | 'visibility_changed'
  layerId: string
  layer?: LayerMetadata
  previousState?: Partial<LayerMetadata>
  timestamp: Date
  userId: string
}

// Layer validation result
export interface LayerValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Layer manager options
export interface LayerManagerOptions {
  maxLayers: number
  enableValidation: boolean
  enableEvents: boolean
  autoSave: boolean
  permissionService?: PermissionService
}

// Layer statistics
export interface LayerManagerStats {
  totalLayers: number
  activeLayers: number
  visibleLayers: number
  layersByKind: Record<LayerKind, number>
  averageStats: {
    pinsPerLayer: number
    memoryUsage: number
    renderTime: number
  }
}

export class LayerManager {
  private layers: Map<string, LayerMetadata>
  private layerOrder: string[]
  private eventListeners: Set<(event: LayerChangeEvent) => void>
  private options: LayerManagerOptions
  private permissionService?: PermissionService

  constructor(options: Partial<LayerManagerOptions> = {}) {
    this.layers = new Map()
    this.layerOrder = []
    this.eventListeners = new Set()
    this.options = {
      maxLayers: VALIDATION_RULES.MAX_LAYERS_PER_CANVAS,
      enableValidation: true,
      enableEvents: true,
      autoSave: false,
      ...options
    }
    this.permissionService = options.permissionService
  }

  // Set permission service
  setPermissionService(permissionService: PermissionService): void {
    this.permissionService = permissionService
  }

  // Add event listener
  addEventListener(listener: (event: LayerChangeEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  // Emit event
  private emitEvent(event: Omit<LayerChangeEvent, 'timestamp'>): void {
    if (!this.options.enableEvents) return
    
    const fullEvent: LayerChangeEvent = {
      ...event,
      timestamp: new Date()
    }
    
    this.eventListeners.forEach(listener => {
      try {
        listener(fullEvent)
      } catch (error) {
        console.error('Layer event listener error:', error)
      }
    })
  }

  // Validate layer data
  validateLayer(layer: Partial<LayerMetadata>): LayerValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!layer.name || layer.name.trim().length === 0) {
      errors.push('Layer name is required')
    } else if (layer.name.length < VALIDATION_RULES.LAYER_NAME_MIN_LENGTH) {
      errors.push(`Layer name must be at least ${VALIDATION_RULES.LAYER_NAME_MIN_LENGTH} characters`)
    } else if (layer.name.length > VALIDATION_RULES.LAYER_NAME_MAX_LENGTH) {
      errors.push(`Layer name must not exceed ${VALIDATION_RULES.LAYER_NAME_MAX_LENGTH} characters`)
    }

    if (!layer.kind || !Object.values(['ISSUE_PIN', 'RFI_PIN', 'DETAIL_PIN', 'NOTE_PIN']).includes(layer.kind)) {
      errors.push('Invalid layer kind')
    }

    if (!layer.color || !/^#[0-9A-F]{6}$/i.test(layer.color)) {
      errors.push('Invalid color format (must be hex color)')
    }

    if (layer.settings) {
      if (layer.settings.opacity !== undefined && (layer.settings.opacity < 0 || layer.settings.opacity > 1)) {
        errors.push('Opacity must be between 0 and 1')
      }
      
      if (layer.settings.gridSize !== undefined && layer.settings.gridSize < 1) {
        errors.push('Grid size must be at least 1')
      }
      
      if (layer.settings.clusterThreshold !== undefined && layer.settings.clusterThreshold < 1) {
        errors.push('Cluster threshold must be at least 1')
      }
    }

    // Check for duplicate names
    if (layer.name && layer.id) {
      const existingLayer = this.findLayerByName(layer.name)
      if (existingLayer && existingLayer.id !== layer.id) {
        warnings.push('A layer with this name already exists')
      }
    }

    // Check layer count limit
    if (this.layers.size >= this.options.maxLayers && !layer.id) {
      errors.push(`Cannot exceed maximum of ${this.options.maxLayers} layers`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Create a new layer
  async createLayer(
    layerData: Omit<LayerMetadata, 'id'>, 
    userId: string
  ): Promise<LayerOperationResult<LayerMetadata>> {
    try {
      // Validate permissions
      if (this.permissionService) {
        const permission = this.permissionService.hasPermission({
          operation: 'create_layer',
          layerKind: layerData.kind
        })
        
        if (!permission.allowed) {
          return {
            success: false,
            error: 'PERMISSION_DENIED',
            message: permission.reason,
            timestamp: new Date()
          }
        }
      }

      // Validate layer data
      if (this.options.enableValidation) {
        const validation = this.validateLayer(layerData)
        if (!validation.isValid) {
          return {
            success: false,
            error: 'VALIDATION_FAILED',
            message: validation.errors.join(', '),
            timestamp: new Date()
          }
        }
      }

      // Generate unique ID
      const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create layer with ID
      const layer: LayerMetadata = {
        ...layerData,
        id: layerId
      }

      // Add to collections
      this.layers.set(layerId, layer)
      this.layerOrder.push(layerId)

      // Update layer statistics
      this.updateLayerStats(layer)

      // Emit event
      this.emitEvent({
        type: 'created',
        layerId,
        layer,
        userId
      })

      return {
        success: true,
        data: layer,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Update existing layer
  async updateLayer(
    layerId: string, 
    updates: Partial<LayerMetadata>, 
    userId: string
  ): Promise<LayerOperationResult<LayerMetadata>> {
    try {
      const existingLayer = this.layers.get(layerId)
      if (!existingLayer) {
        return {
          success: false,
          error: 'LAYER_NOT_FOUND',
          message: `Layer ${layerId} not found`,
          timestamp: new Date()
        }
      }

      // Validate permissions
      if (this.permissionService) {
        const permission = this.permissionService.hasPermission({
          operation: 'edit_layer',
          layerId,
          layerKind: existingLayer.kind
        })
        
        if (!permission.allowed) {
          return {
            success: false,
            error: 'PERMISSION_DENIED',
            message: permission.reason,
            timestamp: new Date()
          }
        }
      }

      // Create updated layer
      const updatedLayer = { ...existingLayer, ...updates }

      // Validate updated layer
      if (this.options.enableValidation) {
        const validation = this.validateLayer(updatedLayer)
        if (!validation.isValid) {
          return {
            success: false,
            error: 'VALIDATION_FAILED',
            message: validation.errors.join(', '),
            timestamp: new Date()
          }
        }
      }

      // Store previous state for event
      const previousState = { ...existingLayer }

      // Update layer
      this.layers.set(layerId, updatedLayer)
      this.updateLayerStats(updatedLayer)

      // Emit event
      this.emitEvent({
        type: 'updated',
        layerId,
        layer: updatedLayer,
        previousState,
        userId
      })

      return {
        success: true,
        data: updatedLayer,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Delete layer
  async deleteLayer(layerId: string, userId: string): Promise<LayerOperationResult<void>> {
    try {
      const layer = this.layers.get(layerId)
      if (!layer) {
        return {
          success: false,
          error: 'LAYER_NOT_FOUND',
          message: `Layer ${layerId} not found`,
          timestamp: new Date()
        }
      }

      // Validate permissions
      if (this.permissionService) {
        const permission = this.permissionService.hasPermission({
          operation: 'delete_layer',
          layerId,
          layerKind: layer.kind
        })
        
        if (!permission.allowed) {
          return {
            success: false,
            error: 'PERMISSION_DENIED',
            message: permission.reason,
            timestamp: new Date()
          }
        }
      }

      // Remove from collections
      this.layers.delete(layerId)
      this.layerOrder = this.layerOrder.filter(id => id !== layerId)

      // Emit event
      this.emitEvent({
        type: 'deleted',
        layerId,
        layer,
        userId
      })

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Get layer by ID
  getLayer(layerId: string): LayerMetadata | undefined {
    return this.layers.get(layerId)
  }

  // Get all layers
  getAllLayers(): LayerMetadata[] {
    return this.layerOrder.map(id => this.layers.get(id)!).filter(Boolean)
  }

  // Get layers by kind
  getLayersByKind(kind: LayerKind): LayerMetadata[] {
    return this.getAllLayers().filter(layer => layer.kind === kind)
  }

  // Get visible layers
  getVisibleLayers(): LayerMetadata[] {
    return this.getAllLayers().filter(layer => layer.visibility === 'visible')
  }

  // Get active layers
  getActiveLayers(): LayerMetadata[] {
    return this.getAllLayers().filter(layer => layer.status === 'active')
  }

  // Find layer by name
  findLayerByName(name: string): LayerMetadata | undefined {
    return this.getAllLayers().find(layer => layer.name === name)
  }

  // Filter layers
  filterLayers(filter: LayerFilter): LayerMetadata[] {
    return this.getAllLayers().filter(layer => {
      if (filter.kinds?.length && !filter.kinds.includes(layer.kind)) return false
      if (filter.statuses?.length && !filter.statuses.includes(layer.status)) return false
      if (filter.visibilities?.length && !filter.visibilities.includes(layer.visibility)) return false
      if (filter.searchText && !layer.name.toLowerCase().includes(filter.searchText.toLowerCase())) return false
      return true
    })
  }

  // Reorder layers
  async reorderLayers(newOrder: string[], userId: string): Promise<LayerOperationResult<void>> {
    try {
      // Validate that all layer IDs exist
      const validIds = newOrder.filter(id => this.layers.has(id))
      if (validIds.length !== newOrder.length) {
        return {
          success: false,
          error: 'LAYER_NOT_FOUND',
          message: 'Some layer IDs in the new order are invalid',
          timestamp: new Date()
        }
      }

      // Validate permissions
      if (this.permissionService) {
        const permission = this.permissionService.hasPermission({
          operation: 'manage_layer'
        })
        
        if (!permission.allowed) {
          return {
            success: false,
            error: 'PERMISSION_DENIED',
            message: permission.reason,
            timestamp: new Date()
          }
        }
      }

      const previousOrder = [...this.layerOrder]
      this.layerOrder = newOrder

      // Emit event
      this.emitEvent({
        type: 'reordered',
        layerId: 'all',
        userId
      })

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Toggle layer visibility
  async toggleLayerVisibility(layerId: string, userId: string): Promise<LayerOperationResult<LayerMetadata>> {
    const layer = this.layers.get(layerId)
    if (!layer) {
      return {
        success: false,
        error: 'LAYER_NOT_FOUND',
        message: `Layer ${layerId} not found`,
        timestamp: new Date()
      }
    }

    const newVisibility: LayerVisibility = layer.visibility === 'visible' ? 'hidden' : 'visible'
    return this.updateLayer(layerId, { visibility: newVisibility }, userId)
  }

  // Set layer visibility
  async setLayerVisibility(
    layerId: string, 
    visibility: LayerVisibility, 
    userId: string
  ): Promise<LayerOperationResult<LayerMetadata>> {
    return this.updateLayer(layerId, { visibility }, userId)
  }

  // Set layer status
  async setLayerStatus(
    layerId: string, 
    status: LayerStatus, 
    userId: string
  ): Promise<LayerOperationResult<LayerMetadata>> {
    return this.updateLayer(layerId, { status }, userId)
  }

  // Create default layer set
  async createDefaultLayers(userRole: UserRole, userId: string): Promise<LayerOperationResult<LayerMetadata[]>> {
    try {
      const defaultLayers = createDefaultLayerSet(userRole)
      const createdLayers: LayerMetadata[] = []

      for (const layerData of defaultLayers) {
        const result = await this.createLayer(layerData, userId)
        if (result.success && result.data) {
          createdLayers.push(result.data)
        } else {
          // If any layer fails, clean up created layers
          for (const created of createdLayers) {
            await this.deleteLayer(created.id, userId)
          }
          return {
            success: false,
            error: result.error,
            message: `Failed to create default layer: ${result.message}`,
            timestamp: new Date()
          }
        }
      }

      return {
        success: true,
        data: createdLayers,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Get layer statistics
  getStatistics(): LayerManagerStats {
    const layers = this.getAllLayers()
    const layersByKind: Record<LayerKind, number> = {
      ISSUE_PIN: 0,
      RFI_PIN: 0,
      DETAIL_PIN: 0,
      NOTE_PIN: 0
    }

    let totalPins = 0
    let totalMemoryUsage = 0
    let totalRenderTime = 0

    layers.forEach(layer => {
      layersByKind[layer.kind]++
      totalPins += layer.stats.totalPins
      totalMemoryUsage += layer.stats.performanceMetrics.memoryUsage
      totalRenderTime += layer.stats.performanceMetrics.renderTime
    })

    return {
      totalLayers: layers.length,
      activeLayers: this.getActiveLayers().length,
      visibleLayers: this.getVisibleLayers().length,
      layersByKind,
      averageStats: {
        pinsPerLayer: layers.length > 0 ? totalPins / layers.length : 0,
        memoryUsage: layers.length > 0 ? totalMemoryUsage / layers.length : 0,
        renderTime: layers.length > 0 ? totalRenderTime / layers.length : 0
      }
    }
  }

  // Update layer statistics
  private updateLayerStats(layer: LayerMetadata): void {
    layer.stats.lastUpdated = new Date()
    // Additional stats updates would be handled by the consuming application
  }

  // Clear all layers
  async clearAllLayers(userId: string): Promise<LayerOperationResult<void>> {
    try {
      // Validate permissions
      if (this.permissionService) {
        const permission = this.permissionService.hasPermission({
          operation: 'manage_layer'
        })
        
        if (!permission.allowed) {
          return {
            success: false,
            error: 'PERMISSION_DENIED',
            message: permission.reason,
            timestamp: new Date()
          }
        }
      }

      const layerIds = [...this.layerOrder]
      
      // Delete all layers
      for (const layerId of layerIds) {
        await this.deleteLayer(layerId, userId)
      }

      return {
        success: true,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  // Export layer configuration
  exportLayers(): {
    layers: LayerMetadata[]
    order: string[]
    metadata: {
      exportDate: Date
      totalLayers: number
      statistics: LayerManagerStats
    }
  } {
    return {
      layers: this.getAllLayers(),
      order: [...this.layerOrder],
      metadata: {
        exportDate: new Date(),
        totalLayers: this.layers.size,
        statistics: this.getStatistics()
      }
    }
  }

  // Import layer configuration
  async importLayers(
    data: { layers: LayerMetadata[]; order?: string[] },
    userId: string,
    replaceExisting: boolean = false
  ): Promise<LayerOperationResult<LayerMetadata[]>> {
    try {
      // Clear existing layers if replacing
      if (replaceExisting) {
        await this.clearAllLayers(userId)
      }

      const importedLayers: LayerMetadata[] = []

      // Import layers
      for (const layerData of data.layers) {
        const { id, ...layerWithoutId } = layerData
        const result = await this.createLayer(layerWithoutId, userId)
        
        if (result.success && result.data) {
          importedLayers.push(result.data)
        }
      }

      // Set order if provided
      if (data.order && data.order.length > 0) {
        const newOrder = data.order.map(oldId => {
          const index = data.layers.findIndex(l => l.id === oldId)
          return index >= 0 && importedLayers[index] ? importedLayers[index].id : null
        }).filter(Boolean) as string[]

        if (newOrder.length > 0) {
          await this.reorderLayers(newOrder, userId)
        }
      }

      return {
        success: true,
        data: importedLayers,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: 'INVALID_OPERATION',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }
}

export default LayerManager
