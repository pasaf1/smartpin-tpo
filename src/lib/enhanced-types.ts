/**
 * Enhanced Types & Interfaces - Production Ready
 * Final type definitions for the PinMapper Enhanced System
 */

import { Pin } from './database.types'
import type { 
  LayerKind, 
  LayerMetadata, 
  EnhancedPin, 
  PinMetadata,
  PinRenderingProps,
  ViewportState,
  CanvasCoordinates,
  NormalizedCoordinates,
  ScreenCoordinates
} from './layer-types'

// ===== API TYPES =====

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
  metadata?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

// Pin API types
export interface PinCreateRequest {
  layerKind: LayerKind
  position: CanvasCoordinates
  roofId: string
  title?: string
  description?: string
  metadata?: Partial<PinMetadata>
  layerSpecificData?: Record<string, any>
}

export interface PinUpdateRequest {
  id: string
  position?: CanvasCoordinates
  metadata?: Partial<PinMetadata>
  layerSpecificData?: Record<string, any>
}

export interface PinQueryParams {
  roofId?: string
  layerId?: string
  layerKind?: LayerKind
  status?: Pin['status']
  assignee?: string
  priority?: PinMetadata['priority']
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

// ===== STORE TYPES =====

// Canvas store state
export interface CanvasStoreState {
  // Core state
  viewport: ViewportState
  layers: LayerMetadata[]
  pins: EnhancedPin[]
  selectedPinIds: string[]
  hoveredPinId: string | null
  
  // Interaction state
  isLoading: boolean
  isDragging: boolean
  isCreatingPin: boolean
  currentTool: InteractionTool
  
  // Layer state
  visibleLayerIds: string[]
  lockedLayerIds: string[]
  activeLayerId: string | null
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics
  lastUpdateTimestamp: number
}

// Canvas store actions
export interface CanvasStoreActions {
  // Viewport actions
  setViewport: (viewport: Partial<ViewportState>) => void
  zoomTo: (zoom: number, center?: CanvasCoordinates) => void
  panTo: (position: CanvasCoordinates) => void
  fitToBounds: (bounds: BoundingBox) => void
  
  // Pin actions
  addPin: (pin: EnhancedPin) => void
  updatePin: (id: string, updates: Partial<EnhancedPin>) => void
  removePin: (id: string) => void
  selectPins: (ids: string[]) => void
  clearSelection: () => void
  
  // Layer actions
  setLayerVisibility: (layerId: string, visible: boolean) => void
  setLayerLocked: (layerId: string, locked: boolean) => void
  setActiveLayer: (layerId: string | null) => void
  reorderLayers: (layerIds: string[]) => void
  
  // Performance actions
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void
  
  // Bulk actions
  loadPins: (pins: EnhancedPin[]) => void
  clearAll: () => void
}

// ===== INTERACTION TYPES =====

export type InteractionTool = 
  | 'select' 
  | 'pan' 
  | 'zoom' 
  | 'create-issue' 
  | 'create-rfi' 
  | 'create-detail' 
  | 'create-note'

export interface InteractionState {
  tool: InteractionTool
  isActive: boolean
  startPosition?: CanvasCoordinates
  currentPosition?: CanvasCoordinates
  modifiers: {
    shift: boolean
    ctrl: boolean
    alt: boolean
  }
}

// ===== PERFORMANCE TYPES =====

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number // MB
  renderTime: number // ms
  pinCount: number
  visiblePinCount: number
  lastMeasurement: number
}

export interface PerformanceConfig {
  targetFps: number
  maxMemoryUsage: number // MB
  enableClustering: boolean
  clusteringThreshold: number
  levelOfDetailEnabled: boolean
  maxVisiblePins: number
}

// ===== VALIDATION TYPES =====

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  code: string
  message: string
  suggestion?: string
}

// ===== UTILITY TYPES =====

export interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface Offset {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Color {
  hex: string
  rgb: [number, number, number]
  alpha?: number
}

// ===== LAYER SYSTEM TYPES =====

export interface LayerFilterOptions {
  kind?: LayerKind
  status?: LayerMetadata['status']
  visibility?: LayerMetadata['visibility']
  hasPermission?: keyof LayerMetadata['permissions']
}

export interface LayerQueryResult {
  layers: LayerMetadata[]
  total: number
  filtered: number
}

// ===== PIN FILTERING TYPES =====

export interface PinFilterOptions {
  layerIds?: string[]
  layerKinds?: LayerKind[]
  status?: Pin['status'][]
  priorities?: PinMetadata['priority'][]
  assignees?: string[]
  tags?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  boundingBox?: BoundingBox
  textSearch?: string
}

export interface PinQueryResult {
  pins: EnhancedPin[]
  total: number
  filtered: number
  aggregations?: {
    byStatus: Record<Pin['status'], number>
    byPriority: Record<PinMetadata['priority'], number>
    byLayer: Record<string, number>
    byAssignee: Record<string, number>
  }
}

// ===== EVENT SYSTEM TYPES =====

export type CanvasEventType = 
  | 'pin-created'
  | 'pin-updated' 
  | 'pin-deleted'
  | 'pin-selected'
  | 'layer-visibility-changed'
  | 'viewport-changed'
  | 'performance-warning'

export interface CanvasEvent<T = any> {
  type: CanvasEventType
  payload: T
  timestamp: number
  source: string
}

export interface PinEvent extends CanvasEvent<EnhancedPin> {
  type: 'pin-created' | 'pin-updated' | 'pin-deleted'
}

export interface ViewportEvent extends CanvasEvent<ViewportState> {
  type: 'viewport-changed'
}

// ===== EXPORT & IMPORT TYPES =====

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'png'
  includeMetadata: boolean
  includeAttachments: boolean
  filterOptions?: PinFilterOptions
  compression?: boolean
}

export interface ExportResult {
  url?: string
  data?: any
  filename: string
  size: number
  format: ExportOptions['format']
}

export interface ImportOptions {
  format: 'json' | 'csv'
  skipValidation: boolean
  updateExisting: boolean
  createMissingLayers: boolean
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// ===== CONFIGURATION TYPES =====

export interface PinMapperConfig {
  canvas: {
    backgroundColor: string
    gridEnabled: boolean
    gridColor: string
    gridSize: number
    snapToGrid: boolean
  }
  performance: PerformanceConfig
  layers: {
    defaultVisibility: boolean
    allowReordering: boolean
    maxLayers: number
  }
  pins: {
    defaultSize: number
    minSize: number
    maxSize: number
    selectionColor: string
    hoverColor: string
  }
  interactions: {
    doubleClickZoom: boolean
    mouseWheelZoom: boolean
    touchGestures: boolean
    keyboardShortcuts: boolean
  }
}

// ===== COMPONENT PROPS TYPES =====

export interface PinMapperProps {
  roofId: string
  config?: Partial<PinMapperConfig>
  onPinCreate?: (pin: EnhancedPin) => void
  onPinUpdate?: (pin: EnhancedPin) => void
  onPinDelete?: (pinId: string) => void
  onSelectionChange?: (pinIds: string[]) => void
  onViewportChange?: (viewport: ViewportState) => void
  className?: string
  style?: React.CSSProperties
}

export interface PinComponentProps {
  pin: EnhancedPin
  viewport: ViewportState
  isSelected: boolean
  isHovered: boolean
  onClick?: (pin: EnhancedPin) => void
  onDoubleClick?: (pin: EnhancedPin) => void
  onContextMenu?: (pin: EnhancedPin, event: React.MouseEvent) => void
}

export interface LayerControlProps {
  layers: LayerMetadata[]
  visibleLayerIds: string[]
  activeLayerId: string | null
  onVisibilityChange: (layerId: string, visible: boolean) => void
  onActiveLayerChange: (layerId: string | null) => void
  onLayerReorder: (layerIds: string[]) => void
}

// ===== HOOK TYPES =====

export interface UsePinMapperResult {
  // State
  pins: EnhancedPin[]
  layers: LayerMetadata[]
  viewport: ViewportState
  selection: string[]
  isLoading: boolean
  
  // Actions
  createPin: (options: PinCreateRequest) => Promise<EnhancedPin>
  updatePin: (id: string, updates: PinUpdateRequest) => Promise<EnhancedPin>
  deletePin: (id: string) => Promise<void>
  selectPins: (ids: string[]) => void
  clearSelection: () => void
  
  // Layer actions
  toggleLayerVisibility: (layerId: string) => void
  setActiveLayer: (layerId: string | null) => void
  
  // Viewport actions
  zoomTo: (zoom: number, center?: CanvasCoordinates) => void
  panTo: (position: CanvasCoordinates) => void
  fitToBounds: (bounds?: BoundingBox) => void
}

// ===== TYPE GUARDS =====

export function isEnhancedPin(obj: any): obj is EnhancedPin {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.layerId === 'string' &&
    typeof obj.layerKind === 'string' &&
    obj.metadata &&
    obj.renderingProps
}

export function isValidLayerKind(value: string): value is LayerKind {
  return ['ISSUE_PIN', 'RFI_PIN', 'DETAIL_PIN', 'NOTE_PIN'].includes(value)
}

export function isValidCoordinates(coords: any): coords is CanvasCoordinates {
  return coords && 
    typeof coords.x === 'number' && 
    typeof coords.y === 'number' &&
    coords.x >= 0 && coords.x <= 1 &&
    coords.y >= 0 && coords.y <= 1
}

// ===== RE-EXPORTS =====
export type {
  LayerKind,
  LayerMetadata,
  EnhancedPin,
  PinMetadata,
  PinRenderingProps,
  ViewportState,
  CanvasCoordinates,
  NormalizedCoordinates,
  ScreenCoordinates
} from './layer-types'

export type {
  Pin,
  User,
  UserRole,
  PinStatus,
  Severity
} from './database.types'
