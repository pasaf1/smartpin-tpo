/**
 * SmartPin TPO - Pin System Exports
 * Professional roof inspection platform with hierarchical pin management
 *
 * Complete pin system with:
 * - Hierarchical pin management (parent/child relationships)
 * - Professional status workflow with role-based permissions
 * - Advanced photo management with drag-and-drop
 * - Real-time collaboration and live updates
 * - Mobile-first PWA design with touch gestures
 * - Enterprise error handling and validation
 * - Comprehensive TypeScript type safety
 */

// Internal type imports for utility functions
import type { SmartPin, SmartChildPin, PinStatus, PinSeverity, UserRole, PinStatistics } from './types'

// Internal component imports for default export
import { PinDetailsModal } from './PinDetailsModal'
import { PinHierarchyManager } from './PinHierarchyManager'
import { PinStatusWorkflow } from './PinStatusWorkflow'
import { PinPhotoManager } from './PinPhotoManager'
import { PinRealTimeSync } from './PinRealTimeSync'
import { PinErrorBoundary, usePinErrorHandler } from './utils/error-handling'

// Core Components
export { PinDetailsModal, PinHierarchyManager, PinStatusWorkflow, PinPhotoManager, PinRealTimeSync }

// Utility Components
export { PinErrorBoundary, usePinErrorHandler }
export {
  useMobileGestures,
  usePWAInstall,
  useScreenOrientation,
  isMobileDevice,
  hasTouchSupport,
  triggerHapticFeedback
} from './utils/mobile-gestures'

// Type Definitions
export type {
  // Core pin types
  SmartPin,
  SmartChildPin,
  PinStatus,
  PinSeverity,
  PinPriority,
  UserRole,

  // Component prop interfaces
  PinDetailsModalProps,
  PinHierarchyManagerProps,
  PinStatusWorkflowProps,
  PinPhotoManagerProps,
  PinRealTimeSyncProps,

  // Workflow and status management
  StatusTransition,
  UserPermissions,

  // Photo management
  PhotoUpload,

  // Real-time collaboration
  PinActivity,
  RealtimeUpdate,
  UserPresence,

  // Error handling
  PinError,
  OfflineChange,
  DatabaseTransaction,

  // Mobile and PWA
  TouchGesture,
  PWAInstallPrompt,

  // Utility and filtering
  PinFilters,
  PinSortOptions,
  PinStatistics,

  // Validation types
  ExtendedPinStatus,
  DefectLayer,
  ImageKind,
  PinValidationRule,
  PinValidationResult,
  StatusWorkflowRule,

  // Complete type collection
  SmartPinTypes
} from './types'

// Utility Functions
export {
  createPinError,
  withRetry,
  validatePinData,
  handleNetworkError
} from './utils/error-handling'

// Constants and Configuration
export const PIN_SYSTEM_VERSION = '2.0.0'

export const PIN_CONSTANTS = {
  // Status workflow
  STATUSES: {
    OPEN: 'Open' as const,
    READY_FOR_INSPECTION: 'ReadyForInspection' as const,
    CLOSED: 'Closed' as const,
    IN_DISPUTE: 'InDispute' as const
  },

  // Severity levels
  SEVERITIES: {
    CRITICAL: 'Critical' as const,
    HIGH: 'High' as const,
    MEDIUM: 'Medium' as const,
    LOW: 'Low' as const
  },

  // User roles
  ROLES: {
    ADMIN: 'Admin' as const,
    QA_MANAGER: 'QA_Manager' as const,
    INSPECTOR: 'Inspector' as const,
    CONTRACTOR: 'Contractor' as const,
    PM: 'PM' as const,
    CEO: 'CEO' as const,
    OM: 'OM' as const,
    CM: 'CM' as const,
    SITE_MANAGER: 'Site_Manager' as const
  },

  // Issue types
  ISSUE_TYPES: {
    INC: 'INC' as const, // Internal Nonconformity
    COR: 'COR' as const, // Construction Observation Report
    TRADE_DAMAGE: 'TradeDamage' as const,
    QUALITY_CONTROL: 'QualityControl' as const
  },

  // Defect layers
  DEFECT_LAYERS: {
    DENSDECK: 'DENSDECK' as const,
    INSULATION: 'INSULATION' as const,
    SURFACE_PREP: 'SURFACE_PREP' as const,
    TPO: 'TPO' as const,
    VB: 'VB' as const
  },

  // Photo types
  PHOTO_TYPES: {
    OPENING: 'opening' as const,
    CLOSING: 'closing' as const,
    DOCUMENTATION: 'documentation' as const,
    PROGRESS: 'progress' as const
  },

  // Limits and constraints
  LIMITS: {
    MAX_CHILD_PINS: 50,
    MAX_PHOTOS_PER_PIN: 30,
    MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_PIN_NAME_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 1000,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    RECONNECT_DELAY: 5000 // 5 seconds
  }
} as const

// Status color mappings
export const PIN_STATUS_COLORS = {
  [PIN_CONSTANTS.STATUSES.OPEN]: {
    bg: 'bg-red-500',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴'
  },
  [PIN_CONSTANTS.STATUSES.READY_FOR_INSPECTION]: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🟡'
  },
  [PIN_CONSTANTS.STATUSES.CLOSED]: {
    bg: 'bg-green-500',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢'
  },
  [PIN_CONSTANTS.STATUSES.IN_DISPUTE]: {
    bg: 'bg-orange-500',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🟠'
  }
} as const

// Severity color mappings
export const PIN_SEVERITY_COLORS = {
  [PIN_CONSTANTS.SEVERITIES.CRITICAL]: {
    bg: 'bg-red-600',
    text: 'text-red-800',
    icon: '🔴'
  },
  [PIN_CONSTANTS.SEVERITIES.HIGH]: {
    bg: 'bg-orange-500',
    text: 'text-orange-800',
    icon: '🟠'
  },
  [PIN_CONSTANTS.SEVERITIES.MEDIUM]: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-800',
    icon: '🟡'
  },
  [PIN_CONSTANTS.SEVERITIES.LOW]: {
    bg: 'bg-green-500',
    text: 'text-green-800',
    icon: '🟢'
  }
} as const

// Helper functions
export const PinUtils = {
  // Generate child pin code (e.g., "1.1", "2.3")
  generateChildCode: (parentSeq: number, childIndex: number): string => {
    return `${parentSeq}.${childIndex + 1}`
  },

  // Calculate completion percentage
  calculateCompletionPercentage: (pin: SmartPin): number => {
    const total = pin.children_total || 0
    const closed = pin.children_closed || 0
    return total > 0 ? Math.round((closed / total) * 100) : 0
  },

  // Get status color helper
  getStatusColor: (status: PinStatus, variant: 'bg' | 'text' | 'badge' | 'icon' = 'badge'): string => {
    return PIN_STATUS_COLORS[status]?.[variant] || PIN_STATUS_COLORS[PIN_CONSTANTS.STATUSES.OPEN][variant]
  },

  // Get severity color helper
  getSeverityColor: (severity: PinSeverity, variant: 'bg' | 'text' | 'icon' = 'bg'): string => {
    return PIN_SEVERITY_COLORS[severity]?.[variant] || PIN_SEVERITY_COLORS[PIN_CONSTANTS.SEVERITIES.MEDIUM][variant]
  },

  // Check if user can perform action
  canUserPerformAction: (userRole: UserRole, action: string, pin?: SmartPin): boolean => {
    const permissions = {
      [PIN_CONSTANTS.ROLES.ADMIN]: ['create', 'edit', 'delete', 'change_status', 'upload_photos', 'assign', 'approve', 'dispute'],
      [PIN_CONSTANTS.ROLES.QA_MANAGER]: ['create', 'edit', 'change_status', 'upload_photos', 'assign', 'approve', 'dispute'],
      [PIN_CONSTANTS.ROLES.INSPECTOR]: ['create', 'edit', 'change_status', 'upload_photos'],
      [PIN_CONSTANTS.ROLES.CONTRACTOR]: ['upload_photos', 'change_status'],
      [PIN_CONSTANTS.ROLES.PM]: ['view'],
      [PIN_CONSTANTS.ROLES.CEO]: ['view'],
      [PIN_CONSTANTS.ROLES.OM]: ['view'],
      [PIN_CONSTANTS.ROLES.CM]: ['view'],
      [PIN_CONSTANTS.ROLES.SITE_MANAGER]: ['view']
    }

    return permissions[userRole]?.includes(action) || false
  },

  // Validate pin coordinates
  validateCoordinates: (x: number, y: number): boolean => {
    return typeof x === 'number' && typeof y === 'number' &&
           x >= 0 && x <= 1 && y >= 0 && y <= 1
  },

  // Calculate days since creation
  calculateDaysOpen: (createdAt: string): number => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  // Check if pin is overdue
  isPinOverdue: (pin: SmartPin, slaHours: number = 72): boolean => {
    if (pin.status === PIN_CONSTANTS.STATUSES.CLOSED) return false

    const created = new Date(pin.created_at)
    const now = new Date()
    const hoursOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

    return hoursOpen > slaHours
  },

  // Generate pin statistics
  generateStatistics: (pins: SmartPin[]): PinStatistics => {
    const stats = {
      total_pins: pins.length,
      open_pins: 0,
      ready_for_inspection: 0,
      closed_pins: 0,
      disputed_pins: 0,
      overdue_pins: 0,
      critical_pins: 0,
      average_resolution_time: 0,
      completion_rate: 0,
      pins_by_defect_type: {} as Record<string, number>,
      pins_by_severity: {} as Record<PinSeverity, number>,
      pins_by_zone: {} as Record<string, number>
    }

    let totalResolutionTime = 0
    let resolvedPins = 0

    pins.forEach(pin => {
      // Count by status
      switch (pin.status) {
        case PIN_CONSTANTS.STATUSES.OPEN:
          stats.open_pins++
          break
        case PIN_CONSTANTS.STATUSES.READY_FOR_INSPECTION:
          stats.ready_for_inspection++
          break
        case PIN_CONSTANTS.STATUSES.CLOSED:
          stats.closed_pins++
          if (pin.time_to_resolution) {
            totalResolutionTime += pin.time_to_resolution
            resolvedPins++
          }
          break
        case PIN_CONSTANTS.STATUSES.IN_DISPUTE:
          stats.disputed_pins++
          break
      }

      // Count overdue pins
      if (PinUtils.isPinOverdue(pin)) {
        stats.overdue_pins++
      }

      // Count critical pins
      if (pin.severity === PIN_CONSTANTS.SEVERITIES.CRITICAL) {
        stats.critical_pins++
      }

      // Group by defect type
      if (pin.defect_type) {
        stats.pins_by_defect_type[pin.defect_type] = (stats.pins_by_defect_type[pin.defect_type] || 0) + 1
      }

      // Group by severity
      if (pin.severity) {
        stats.pins_by_severity[pin.severity] = (stats.pins_by_severity[pin.severity] || 0) + 1
      }

      // Group by zone
      if (pin.zone) {
        stats.pins_by_zone[pin.zone] = (stats.pins_by_zone[pin.zone] || 0) + 1
      }
    })

    // Calculate averages
    stats.average_resolution_time = resolvedPins > 0 ? Math.round(totalResolutionTime / resolvedPins) : 0
    stats.completion_rate = stats.total_pins > 0 ? Math.round((stats.closed_pins / stats.total_pins) * 100) : 0

    return stats
  }
} as const

// Legacy component exports for backward compatibility
export { BluebinPinDetailsCard } from './BluebinPinDetailsCard'

// Export everything as a namespace as well
export * as PinSystem from './index'

// Default export for convenience
const PinSystemExports = {
  // Components
  PinDetailsModal,
  PinHierarchyManager,
  PinStatusWorkflow,
  PinPhotoManager,
  PinRealTimeSync,
  PinErrorBoundary,

  // Utilities
  PinUtils,
  PIN_CONSTANTS,
  PIN_STATUS_COLORS,
  PIN_SEVERITY_COLORS,

  // Version
  VERSION: PIN_SYSTEM_VERSION
}

export default PinSystemExports