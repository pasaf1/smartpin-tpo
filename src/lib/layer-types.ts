/**
 * PinMapper Enhanced System - Layer Types
 * Core type definitions for the layer-based pin mapping system
 */

import { Pin } from './database.types'

// Layer Kind definitions - extensible for future pin types
export type LayerKind = 'ISSUE_PIN' | 'RFI_PIN' | 'DETAIL_PIN' | 'NOTE_PIN'

// Layer visibility states
export type LayerVisibility = 'visible' | 'hidden' | 'dimmed'

// Layer status for management
export type LayerStatus = 'active' | 'inactive' | 'locked'

// Pin interaction modes
export type InteractionMode = 'select' | 'create' | 'edit' | 'delete' | 'move'

// Zoom level categories for Level of Detail (LOD)
export type ZoomLevel = 'overview' | 'medium' | 'detailed' | 'precise'

// Layer permissions for role-based access
export interface LayerPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManage: boolean // For layer settings
}

// Core layer metadata structure
export interface LayerMetadata {
  id: string
  kind: LayerKind
  name: string
  description?: string
  color: string
  icon: string
  visibility: LayerVisibility
  status: LayerStatus
  order: number
  permissions: LayerPermissions
  settings: LayerSettings
  stats: LayerStats
}

// Layer-specific settings
export interface LayerSettings {
  showTooltips: boolean
  enableClustering: boolean
  clusterThreshold: number
  showLabels: boolean
  enableSnapping: boolean
  snapToGrid: boolean
  gridSize: number
  opacity: number // 0-1
  zIndex: number
}

// Layer statistics for monitoring
export interface LayerStats {
  totalPins: number
  visiblePins: number
  activePins: number
  lastUpdated: Date
  performanceMetrics: {
    renderTime: number
    memoryUsage: number
  }
}

// Enhanced pin interface with layer context
export interface EnhancedPin extends Pin {
  layerId: string
  layerKind: LayerKind
  metadata: PinMetadata
  renderingProps: PinRenderingProps
}

// Pin metadata for enhanced functionality
export interface PinMetadata {
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  dueDate?: Date
  estimatedTime?: number // in minutes
  actualTime?: number // in minutes
  dependencies: string[] // IDs of dependent pins
  attachments: PinAttachment[]
}

// Pin rendering properties for performance
export interface PinRenderingProps {
  size: number
  scale: number
  rotation: number
  isVisible: boolean
  isSelected: boolean
  isHovered: boolean
  isDragging: boolean
  animationState: PinAnimationState
}

// Pin animation state
export interface PinAnimationState {
  isAnimating: boolean
  animationType: 'pulse' | 'bounce' | 'fade' | 'scale' | 'none'
  duration: number
  startTime: number
}

// Pin attachments (photos, documents, etc.)
export interface PinAttachment {
  id: string
  type: 'photo' | 'document' | 'link' | 'note'
  url: string
  thumbnail?: string
  title: string
  description?: string
  uploadedAt: Date
  uploadedBy: string
  size: number // in bytes
}

// Coordinate system types
export interface CanvasCoordinates {
  x: number
  y: number
}

export interface NormalizedCoordinates {
  x: number // 0-1
  y: number // 0-1
}

export interface ScreenCoordinates {
  x: number
  y: number
}

// Viewport state
export interface ViewportState {
  zoom: number
  pan: CanvasCoordinates
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  center: CanvasCoordinates
}

// Selection state
export interface SelectionState {
  selectedPinIds: string[]
  selectionMode: 'single' | 'multiple' | 'area'
  selectionArea?: {
    start: CanvasCoordinates
    end: CanvasCoordinates
  }
  lastSelected?: string
}

// Layer filter options
export interface LayerFilter {
  kinds: LayerKind[]
  statuses: LayerStatus[]
  visibilities: LayerVisibility[]
  dateRange?: {
    start: Date
    end: Date
  }
  assignees?: string[]
  priorities?: string[]
  searchText?: string
}

// Performance metrics
export interface PerformanceMetrics {
  renderTime: number
  updateTime: number
  memoryUsage: number
  pinCount: number
  layerCount: number
  fps: number
  timestamp: Date
}

// Error types for layer operations
export type LayerError = 
  | 'PERMISSION_DENIED'
  | 'LAYER_NOT_FOUND'
  | 'INVALID_OPERATION'
  | 'CONCURRENT_MODIFICATION'
  | 'VALIDATION_FAILED'

// Layer operation result
export interface LayerOperationResult<T = any> {
  success: boolean
  data?: T
  error?: LayerError
  message?: string
  timestamp: Date
}

// Event types for layer system
export type LayerEvent = 
  | 'layer:created'
  | 'layer:updated'
  | 'layer:deleted'
  | 'layer:visibility_changed'
  | 'pin:created'
  | 'pin:updated'
  | 'pin:deleted'
  | 'pin:moved'
  | 'selection:changed'
  | 'viewport:changed'

// Layer event payload
export interface LayerEventPayload {
  type: LayerEvent
  layerId?: string
  pinId?: string
  userId: string
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

// Export utility type for layer-specific pin types
export type LayerSpecificPin<T extends LayerKind> = EnhancedPin & {
  layerKind: T
  layerSpecificData: T extends 'ISSUE_PIN' 
    ? IssuePinData 
    : T extends 'RFI_PIN' 
    ? RFIPinData 
    : T extends 'DETAIL_PIN' 
    ? DetailPinData 
    : T extends 'NOTE_PIN' 
    ? NotePinData 
    : never
}

// Layer-specific data types (extensible)
export interface IssuePinData {
  issueType: string
  reproductionSteps?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: string
  browserInfo?: string
}

export interface RFIPinData {
  requestType: string
  specification?: string
  drawings?: string[]
  technicalDetails?: string
  urgency: 'low' | 'medium' | 'high'
}

export interface DetailPinData {
  detailType: string
  scale?: string
  dimensions?: string
  materials?: string[]
  specifications?: string
}

export interface NotePinData {
  noteType: string
  isPrivate: boolean
  reminder?: Date
  color?: string
  fontSize?: number
}
