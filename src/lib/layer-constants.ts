/**
 * PinMapper Enhanced System - Layer Constants
 * Default configurations and constants for the layer system
 */

import { LayerMetadata, LayerKind, LayerPermissions, LayerSettings, LayerStats } from './layer-types'

// Default layer permissions based on user roles
export const DEFAULT_LAYER_PERMISSIONS: Record<string, LayerPermissions> = {
  Admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManage: true
  },
  QA_Manager: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManage: true
  },
  Supervisor: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManage: false
  },
  Foreman: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManage: false
  },
  Inspector: {
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canManage: false
  },
  Contractor: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManage: false
  }
}

// Default layer settings
export const DEFAULT_LAYER_SETTINGS: LayerSettings = {
  showTooltips: true,
  enableClustering: true,
  clusterThreshold: 50,
  showLabels: true,
  enableSnapping: false,
  snapToGrid: false,
  gridSize: 20,
  opacity: 1.0,
  zIndex: 1
}

// Default layer statistics
export const DEFAULT_LAYER_STATS: LayerStats = {
  totalPins: 0,
  visiblePins: 0,
  activePins: 0,
  lastUpdated: new Date(),
  performanceMetrics: {
    renderTime: 0,
    memoryUsage: 0
  }
}

// Layer kind configurations
export const LAYER_KIND_CONFIG: Record<LayerKind, {
  name: string
  description: string
  color: string
  icon: string
  defaultSettings: Partial<LayerSettings>
}> = {
  ISSUE_PIN: {
    name: 'Issues',
    description: 'Construction issues and defects requiring attention',
    color: '#ef4444', // red-500
    icon: 'AlertTriangle',
    defaultSettings: {
      showTooltips: true,
      enableClustering: true,
      clusterThreshold: 30,
      opacity: 1.0,
      zIndex: 10
    }
  },
  RFI_PIN: {
    name: 'RFI',
    description: 'Requests for Information from contractors and stakeholders',
    color: '#3b82f6', // blue-500
    icon: 'HelpCircle',
    defaultSettings: {
      showTooltips: true,
      enableClustering: true,
      clusterThreshold: 40,
      opacity: 1.0,
      zIndex: 8
    }
  },
  DETAIL_PIN: {
    name: 'Details',
    description: 'Construction details and specifications',
    color: '#10b981', // emerald-500
    icon: 'Search',
    defaultSettings: {
      showTooltips: true,
      enableClustering: false,
      clusterThreshold: 20,
      opacity: 0.8,
      zIndex: 6
    }
  },
  NOTE_PIN: {
    name: 'Notes',
    description: 'General notes and observations',
    color: '#f59e0b', // amber-500
    icon: 'StickyNote',
    defaultSettings: {
      showTooltips: true,
      enableClustering: true,
      clusterThreshold: 60,
      opacity: 0.7,
      zIndex: 4
    }
  }
}

// Default layer order (rendering order)
export const DEFAULT_LAYER_ORDER: LayerKind[] = [
  'NOTE_PIN',
  'DETAIL_PIN', 
  'RFI_PIN',
  'ISSUE_PIN'
]

// Canvas constants
export const CANVAS_CONSTANTS = {
  // Zoom limits
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 10,
  ZOOM_STEP: 1.2,
  
  // Grid settings
  GRID_SIZE_MIN: 5,
  GRID_SIZE_MAX: 100,
  GRID_SIZE_DEFAULT: 20,
  
  // Pin constants
  PIN_SIZE_MIN: 8,
  PIN_SIZE_MAX: 48,
  PIN_SIZE_DEFAULT: 16,
  
  // Selection
  SELECTION_TOLERANCE: 5, // pixels
  MULTI_SELECT_DISTANCE: 10, // pixels
  
  // Clustering
  CLUSTER_MIN_PINS: 2,
  CLUSTER_MAX_RADIUS: 50,
  CLUSTER_DEFAULT_THRESHOLD: 50,
  
  // Performance
  VIRTUALIZATION_THRESHOLD: 1000, // pins
  LOD_THRESHOLD_OVERVIEW: 0.5, // zoom level
  LOD_THRESHOLD_MEDIUM: 1.0,
  LOD_THRESHOLD_DETAILED: 2.0,
  
  // Animations
  ANIMATION_DURATION: 300, // ms
  ANIMATION_EASING: 'ease-out',
  
  // Debounce delays
  SEARCH_DEBOUNCE: 300, // ms
  RESIZE_DEBOUNCE: 100, // ms
  RENDER_DEBOUNCE: 16, // ms (~60fps)
  
  // Memory management
  MAX_HISTORY_SIZE: 50,
  MAX_EVENTS_SIZE: 1000,
  MEMORY_CLEANUP_INTERVAL: 30000, // 30 seconds
  
  // Export settings
  EXPORT_IMAGE_SCALE: 2,
  EXPORT_MAX_WIDTH: 4096,
  EXPORT_MAX_HEIGHT: 4096
} as const

// Color schemes for different themes
export const COLOR_SCHEMES = {
  light: {
    background: '#ffffff',
    grid: '#f3f4f6',
    text: '#1f2937',
    border: '#d1d5db',
    selection: '#3b82f6',
    hover: '#eff6ff'
  },
  dark: {
    background: '#111827',
    grid: '#374151',
    text: '#f9fafb',
    border: '#4b5563',
    selection: '#60a5fa',
    hover: '#1e3a8a'
  }
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  // Selection
  SELECT_ALL: 'ctrl+a',
  CLEAR_SELECTION: 'escape',
  
  // Zoom
  ZOOM_IN: 'ctrl+plus',
  ZOOM_OUT: 'ctrl+minus',
  ZOOM_FIT: 'ctrl+0',
  
  // Tools
  SELECT_TOOL: 's',
  CREATE_TOOL: 'c',
  EDIT_TOOL: 'e',
  DELETE_TOOL: 'd',
  MOVE_TOOL: 'm',
  
  // History
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  
  // Layers
  TOGGLE_LAYER_1: '1',
  TOGGLE_LAYER_2: '2',
  TOGGLE_LAYER_3: '3',
  TOGGLE_LAYER_4: '4',
  
  // UI
  TOGGLE_GRID: 'ctrl+g',
  TOGGLE_SNAP: 'ctrl+shift+g',
  TOGGLE_MINIMAP: 'ctrl+m',
  
  // Navigation
  PAN_UP: 'arrowup',
  PAN_DOWN: 'arrowdown',
  PAN_LEFT: 'arrowleft',
  PAN_RIGHT: 'arrowright'
} as const

// Status icons and colors
export const STATUS_CONFIG = {
  Open: {
    color: '#ef4444', // red-500
    icon: 'Circle',
    label: 'Open'
  },
  ReadyForInspection: {
    color: '#f59e0b', // amber-500
    icon: 'Clock',
    label: 'Ready for Inspection'
  },
  Closed: {
    color: '#10b981', // emerald-500
    icon: 'CheckCircle',
    label: 'Closed'
  }
} as const

// Severity configurations
export const SEVERITY_CONFIG = {
  Critical: {
    color: '#dc2626', // red-600
    icon: 'AlertTriangle',
    priority: 4,
    label: 'Critical'
  },
  High: {
    color: '#ea580c', // orange-600
    icon: 'AlertCircle',
    priority: 3,
    label: 'High'
  },
  Medium: {
    color: '#ca8a04', // yellow-600
    icon: 'Alert',
    priority: 2,
    label: 'Medium'
  },
  Low: {
    color: '#16a34a', // green-600
    icon: 'Info',
    priority: 1,
    label: 'Low'
  }
} as const

// Export formats
export const EXPORT_FORMATS = {
  PNG: {
    extension: 'png',
    mimeType: 'image/png',
    label: 'PNG Image'
  },
  JPG: {
    extension: 'jpg',
    mimeType: 'image/jpeg',
    label: 'JPEG Image'
  },
  PDF: {
    extension: 'pdf',
    mimeType: 'application/pdf',
    label: 'PDF Document'
  },
  SVG: {
    extension: 'svg',
    mimeType: 'image/svg+xml',
    label: 'SVG Vector'
  },
  JSON: {
    extension: 'json',
    mimeType: 'application/json',
    label: 'JSON Data'
  }
} as const

// Validation rules
export const VALIDATION_RULES = {
  LAYER_NAME_MIN_LENGTH: 3,
  LAYER_NAME_MAX_LENGTH: 50,
  PIN_TITLE_MAX_LENGTH: 100,
  PIN_DESCRIPTION_MAX_LENGTH: 1000,
  MAX_PINS_PER_LAYER: 10000,
  MAX_LAYERS_PER_CANVAS: 20,
  COORDINATE_PRECISION: 6, // decimal places
  FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/svg+xml']
} as const

// API endpoints
export const API_ENDPOINTS = {
  LAYERS: '/api/layers',
  PINS: '/api/pins',
  EXPORT: '/api/export',
  IMPORT: '/api/import',
  PERMISSIONS: '/api/permissions',
  ANALYTICS: '/api/analytics'
} as const

// Create default layer metadata
export function createDefaultLayer(
  kind: LayerKind, 
  order: number,
  userRole: string = 'Inspector'
): Omit<LayerMetadata, 'id'> {
  const config = LAYER_KIND_CONFIG[kind]
  const permissions = DEFAULT_LAYER_PERMISSIONS[userRole] || DEFAULT_LAYER_PERMISSIONS.Inspector
  
  return {
    kind,
    name: config.name,
    description: config.description,
    color: config.color,
    icon: config.icon,
    visibility: 'visible',
    status: 'active',
    order,
    permissions,
    settings: {
      ...DEFAULT_LAYER_SETTINGS,
      ...config.defaultSettings
    },
    stats: { ...DEFAULT_LAYER_STATS }
  }
}

// Create default layer set for a new canvas
export function createDefaultLayerSet(userRole: string = 'Inspector'): Omit<LayerMetadata, 'id'>[] {
  return DEFAULT_LAYER_ORDER.map((kind, index) => 
    createDefaultLayer(kind, index + 1, userRole)
  )
}

// Helper function to get layer configuration
export function getLayerConfig(kind: LayerKind) {
  return LAYER_KIND_CONFIG[kind]
}

// Helper function to get status configuration
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
}

// Helper function to get severity configuration
export function getSeverityConfig(severity: string) {
  return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]
}

// Helper function to validate coordinates
export function validateCoordinate(value: number): boolean {
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value) &&
         value >= 0 && 
         value <= 1
}

// Helper function to clamp zoom level
export function clampZoom(zoom: number): number {
  return Math.max(CANVAS_CONSTANTS.ZOOM_MIN, Math.min(CANVAS_CONSTANTS.ZOOM_MAX, zoom))
}

// Helper function to determine LOD level
export function getLODLevel(zoom: number): 'overview' | 'medium' | 'detailed' | 'precise' {
  if (zoom < CANVAS_CONSTANTS.LOD_THRESHOLD_OVERVIEW) return 'overview'
  if (zoom < CANVAS_CONSTANTS.LOD_THRESHOLD_MEDIUM) return 'medium'
  if (zoom < CANVAS_CONSTANTS.LOD_THRESHOLD_DETAILED) return 'detailed'
  return 'precise'
}

export default {
  DEFAULT_LAYER_PERMISSIONS,
  DEFAULT_LAYER_SETTINGS,
  DEFAULT_LAYER_STATS,
  LAYER_KIND_CONFIG,
  DEFAULT_LAYER_ORDER,
  CANVAS_CONSTANTS,
  COLOR_SCHEMES,
  KEYBOARD_SHORTCUTS,
  STATUS_CONFIG,
  SEVERITY_CONFIG,
  EXPORT_FORMATS,
  VALIDATION_RULES,
  API_ENDPOINTS,
  createDefaultLayer,
  createDefaultLayerSet,
  getLayerConfig,
  getStatusConfig,
  getSeverityConfig,
  validateCoordinate,
  clampZoom,
  getLODLevel
}
