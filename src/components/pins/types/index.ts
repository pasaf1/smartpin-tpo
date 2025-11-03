/**
 * SmartPin TPO - Pin System Type Definitions
 * Professional roof inspection platform with hierarchical pin management
 */

import { Database } from '@/lib/database.types'

// ===== Core database types from Supabase =====
export type Pin = Database['public']['Tables']['pins']['Row']
export type PinInsert = Database['public']['Tables']['pins']['Insert']
export type PinUpdate = Database['public']['Tables']['pins']['Update']

export type ChildPin = Database['public']['Tables']['pin_children']['Row']
export type ChildPinInsert = Database['public']['Tables']['pin_children']['Insert']
export type ChildPinUpdate = Database['public']['Tables']['pin_children']['Update']

export type Project = Database['public']['Tables']['projects']['Row']

// ===== Workflow and status types =====
export type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed' | 'InDispute'
export type PinSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type PinPriority = 1 | 2 | 3 | 4 | 5

export interface StatusTransition {
  from: PinStatus
  to: PinStatus
  reason?: string
  requires_approval?: boolean
  auto_trigger?: boolean
  user_role_required?: UserRole[]
}

// ===== User roles and permissions =====
export type UserRole =
  | 'Admin'
  | 'QA_Manager'
  | 'Inspector'
  | 'Contractor'
  | 'PM'
  | 'CEO'
  | 'OM'
  | 'CM'
  | 'Site_Manager'

export interface UserPermissions {
  role: UserRole
  can_create_pins: boolean
  can_edit_pins: boolean
  can_delete_pins: boolean
  can_change_status: boolean
  can_upload_photos: boolean
  can_assign_pins: boolean
  can_approve_closure: boolean
  can_dispute_pins: boolean
  project_access: 'all' | 'assigned' | 'read_only'
}

// ===== Enhanced SmartPin (augmentation over DB row) =====
// חשוב: לא לשנות כאן טיפוסים קיימים מה־DB כדי למנוע התנגשויות.
// אם חייבים לצמצם/להרחיב, עדיף להשתמש בשדות חדשים (למשל ui_* / calc_*).

export interface SmartPin extends Omit<Pin, 'status' | 'zone' | 'priority' | 'severity'> {
  // Hierarchy
  children: SmartChildPin[]
  parent_id?: string | null
  seq_number: number
  child_count: number

  // Location & Visual
  x: number
  y: number
  zone?: string // לא מחמיר מול ה־DB. אם ב־DB זה nullable, זה עדיין תואם

  // Status & Workflow (Typed overlays)
  status: PinStatus
  severity?: PinSeverity
  priority: PinPriority

  // Classification (שדות ייעודיים לא מחליפים את ה־DB אם קיימים שם אותם שמות)
  issue_type: 'INC' | 'COR' | 'TradeDamage' | 'QualityControl'
  defect_type: string // אם ב־DB קיים אותו שדה כ-nullable, שקול לשנות ל: string | null
  defect_layer: 'DENSDECK' | 'INSULATION' | 'SURFACE_PREP' | 'TPO' | 'VB'
  defect_category: string

  // Photos & Documentation
  opening_photo_url?: string
  closing_photo_url?: string
  documentation_photos: string[]

  // Metadata (שומרים שמות שלא מתנגשים עם ה־DB; אם קיימים ב־DB באותם שמות, הסר מכאן)
  created_by: string
  assigned_to?: string
  inspector?: string
  contractor?: string
  created_at: string
  updated_at: string
  due_date?: string

  // Business Logic
  is_overdue: boolean
  days_open: number
  escalation_level: 0 | 1 | 2 | 3
  requires_approval: boolean

  // Statistics (calculated)
  children_total: number
  children_open: number
  children_ready: number
  children_closed: number
  completion_percentage: number

  // Status aggregation from children
  parent_mix_state: 'ALL_OPEN' | 'MIXED' | 'ALL_CLOSED'

  // SLA tracking
  time_to_resolution?: number
  target_resolution_time: number

  // Activity & Collaboration
  last_activity?: string
  activity_count: number
  comment_count: number
  mention_count: number

  // Integration
  external_id?: string
  sync_status: 'synced' | 'pending' | 'failed'

  // Mobile & PWA
  offline_changes?: OfflineChange[]
  needs_sync: boolean

  // Additional computed/helper properties used in validation
  photos: PhotoUpload[]
  sla: {
    isOverdue: boolean
    dueDate?: string
    hoursRemaining?: number
  }
  hierarchy: {
    depth: number
    path: string[]
  }
  inspectionData?: {
    inspectorId?: string
    inspectionDate?: string
    notes?: string
  }
  notes?: string
  position?: {
    x: number
    y: number
  }
}

// ===== Enhanced SmartChildPin (augmentation over DB row) =====
// קריטי: שמירה על תאימות מול ה־DB. לפי השגיאה, defect_type חייב להיות string | null.

export interface SmartChildPin extends ChildPin {
  // Hierarchy
  parent_pin: SmartPin | null
  child_code: string // e.g., "1.1", "1.2", "2.3"
  display_order: number

  // Location (offsets יחסיים להורה; נמנע מדריסת x/y אם קיימים ב־DB)
  offset_x: number
  offset_y: number
  x?: number
  y?: number

  // Status & Workflow
  status_child: PinStatus
  severity?: PinSeverity

  // Classification (מיישר ל־DB: null במקום undefined)
  defect_type: string | null
  defect_layer: string | null
  issue_description: string

  // Photos (מומלץ לתת null במקום undefined אם ב־DB nullable)
  open_pic_url?: string
  close_pic_url?: string
  documentation_photos: string[]

  // Metadata (אל תדרוס שמות שקיימים ב־DB אם הם כבר מוגדרים שם)
  created_by: string
  assigned_to?: string
  created_at: string
  updated_at: string

  // Notes & Documentation
  notes?: string
  resolution_notes?: string

  // Business Logic
  requires_inspection: boolean
  is_critical: boolean
  estimated_hours?: number
  actual_hours?: number

  // Mobile
  needs_sync: boolean
}

// ===== Photo management =====
export interface PhotoUpload {
  id: string
  pin_id?: string
  child_pin_id?: string
  type: 'opening' | 'closing' | 'documentation' | 'progress'
  url: string
  thumbnail_url?: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_at: string
  description?: string
  gps_coordinates?: { lat: number; lng: number }
  camera_metadata?: Record<string, any>
}

// ===== Real-time collaboration =====
export interface PinActivity {
  id: string
  pin_id: string
  child_pin_id?: string
  action:
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'photo_uploaded'
    | 'assigned'
    | 'commented'
    | 'resolved'
  details: Record<string, any>
  user_id: string
  user_name: string
  timestamp: string
  is_system_generated: boolean
}

export interface RealtimeUpdate {
  type: 'pin_update' | 'child_pin_update' | 'activity' | 'user_presence'
  payload: any
  timestamp: string
  user_id: string
}

export interface UserPresence {
  user_id: string
  user_name: string
  project_id: string
  pin_id?: string
  last_seen: string
  is_online: boolean
  current_action?: string
}

// ===== Error handling =====
export interface PinError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  context?: Record<string, any>
  timestamp: string
  user_action?: string
}

// ===== Mobile and offline support =====
export interface OfflineChange {
  id: string
  type: 'create' | 'update' | 'delete' | 'photo_upload'
  target: 'pin' | 'child_pin' | 'photo'
  target_id: string
  changes: Record<string, any>
  timestamp: string
  synced: boolean
}

// ===== Component props =====
export interface PinDetailsModalProps {
  pin: SmartPin | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<SmartPin>) => Promise<void>
  onStatusChange: (newStatus: PinStatus, reason?: string) => Promise<void>
  onPhotoUpload: (photos: PhotoUpload[]) => Promise<void>
  onChildPinCreate: (childPin: Partial<SmartChildPin>) => Promise<SmartChildPin>
  onChildPinUpdate: (childPin: SmartChildPin) => Promise<void>
  onChildPinDelete: (childPinId: string) => Promise<void>
  currentUser: { id: string; role: UserRole; name: string }
  isMobile?: boolean
  canEdit?: boolean
  canDelete?: boolean
  className?: string
}

export interface PinHierarchyManagerProps {
  pin: SmartPin | null
  onChildReorder: (childPins: SmartChildPin[]) => Promise<void>
  onChildAdd: () => void
  onChildEdit: (childPin: SmartChildPin) => void
  onChildDelete: (childPinId: string) => void
  canEdit: boolean
  isMobile?: boolean
}

export interface PinStatusWorkflowProps {
  pin: SmartPin | null
  childPin?: SmartChildPin
  currentStatus: PinStatus
  onStatusChange: (newStatus: PinStatus, reason?: string) => Promise<void>
  userRole: UserRole
  availableTransitions: StatusTransition[]
  isUpdating?: boolean
  showReasonInput?: boolean
  className?: string
}

export interface PinPhotoManagerProps {
  pin: SmartPin | null
  childPin?: SmartChildPin
  photos: PhotoUpload[]
  onPhotoUpload: (files: File[], type: PhotoUpload['type']) => Promise<void>
  onPhotoDelete: (photoId: string) => Promise<void>
  onPhotoUpdate: (photo: Partial<PhotoUpload>) => Promise<void>
  canUpload: boolean
  canDelete: boolean
  maxPhotos?: number
  acceptedTypes?: string[]
  maxFileSize?: number
  isMobile?: boolean
  className?: string
}

export interface PinRealTimeSyncProps {
  projectId?: string
  roofId?: string
  pinId?: string
  onPinUpdate: (pin: SmartPin) => void
  onChildPinUpdate: (childPin: SmartChildPin) => void
  onActivity: (activity: PinActivity) => void
  onPresenceUpdate: (presence: UserPresence[]) => void
  onError: (error: PinError) => void
  userId: string
  enabled?: boolean
}

// ===== Utility types =====
export interface PinFilters {
  status?: PinStatus[]
  severity?: PinSeverity[]
  priority?: PinPriority[]
  assigned_to?: string[]
  defect_type?: string[]
  overdue_only?: boolean
  created_date_range?: { start: string; end: string }
  zone?: string[]
  search_query?: string
}

export interface PinSortOptions {
  field:
    | 'seq_number'
    | 'created_at'
    | 'updated_at'
    | 'priority'
    | 'severity'
    | 'status'
    | 'due_date'
  direction: 'asc' | 'desc'
}

export interface PinStatistics {
  total_pins: number
  open_pins: number
  ready_for_inspection: number
  closed_pins: number
  disputed_pins: number
  overdue_pins: number
  critical_pins: number
  average_resolution_time: number
  completion_rate: number
  pins_by_defect_type: Record<string, number>
  pins_by_severity: Record<PinSeverity, number>
  pins_by_zone: Record<string, number>
}

// ===== Mobile gesture types =====
export interface TouchGesture {
  type: 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'pinch' | 'pan'
  startPosition: { x: number; y: number }
  endPosition?: { x: number; y: number }
  duration: number
  target?: 'pin' | 'canvas' | 'ui_element'
  data?: Record<string, any>
}

export interface PWAInstallPrompt {
  show: () => void
  isAvailable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
}

// ===== Integration types =====
export interface DatabaseTransaction {
  id: string
  operations: Array<{
    table: string
    operation: 'insert' | 'update' | 'delete'
    data: Record<string, any>
    where?: Record<string, any>
  }>
  rollback_plan: Array<{
    table: string
    operation: 'insert' | 'update' | 'delete'
    data: Record<string, any>
    where?: Record<string, any>
  }>
  status: 'pending' | 'committed' | 'rolled_back' | 'failed'
  created_at: string
}

// ===== Validation types =====
export type ExtendedPinStatus = PinStatus
export type DefectLayer = 'DENSDECK' | 'INSULATION' | 'SURFACE_PREP' | 'TPO' | 'VB'
export type ImageKind = 'Open' | 'Close' | 'Progress' | 'Documentation' | 'Issue'

export interface PinValidationRule {
  field: keyof SmartPin | string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any, pin?: SmartPin) => boolean | string
}

export interface PinValidationResult {
  isValid: boolean
  errors: Array<{ field: keyof SmartPin | string; message: string }>
  warnings?: string[]
}

export interface StatusWorkflowRule {
  fromStatus: PinStatus
  toStatus: PinStatus
  requiredRoles: UserRole[]
  requiredFields?: string[]
  requiredPhotos?: ImageKind[]
  autoTriggers?: Array<{
    condition: string
    action: string
  }>
  description?: string
}

// ===== Aggregate type exports =====
export const SmartPinTypes = {
  Pin,
  PinInsert,
  PinUpdate,
  ChildPin,
  ChildPinInsert,
  ChildPinUpdate,
  SmartPin,
  SmartChildPin,
  PinStatus,
  PinSeverity,
  PinPriority,
  UserRole,
  PhotoUpload,
  PinActivity,
  UserPresence,
  PinError,
  StatusTransition,
  ExtendedPinStatus,
  DefectLayer,
  ImageKind
} as const
