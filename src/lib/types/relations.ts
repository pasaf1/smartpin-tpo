// Extended types with relations for SmartPin TPO
import type { 
  Project, 
  Roof, 
  Pin, 
  PinChild, 
  Photo, 
  Chat, 
  User,
  PinStatus,
  Severity,
  UserRole,
  PhotoType
} from '../database.types'

// ===============================
// EXTENDED TYPES WITH RELATIONS
// ===============================

export interface PinWithRelations extends Pin {
  pin_children: PinChildWithPhotos[]
  photos: Photo[]
  roof?: Roof
  opened_by_user?: User | null
}

export interface PinChildWithPhotos extends PinChild {
  opening_photo?: Photo | null
  closure_photo?: Photo | null
  pin?: Pin
}

export interface RoofWithPins extends Roof {
  pins: PinWithRelations[]
  project?: Project
}

export interface ProjectWithRoofs extends Project {
  roofs: RoofWithPins[]
  created_by_user?: User
}

export interface PhotoWithContext extends Photo {
  pin?: Pin
  pin_child?: PinChild
  roof?: Roof
  project?: Project
  uploaded_by_user?: User
}

export interface ChatWithAuthor extends Chat {
  author?: User
}

// ===============================
// BUSINESS LOGIC TYPES
// ===============================

export interface PinStatistics {
  total: number
  open: number
  ready: number
  closed: number
  completion_percentage: number
}

export interface RoofStatistics extends PinStatistics {
  roof_id: string
  roof_name: string
}

export interface ProjectStatistics extends PinStatistics {
  project_id: string
  project_name: string
  roofs_count: number
}

// ===============================
// FORM TYPES
// ===============================

export interface CreateProjectForm {
  name: string
  contractor?: string
  location: string
  roof_plan_file?: File
}

export interface CreatePinForm {
  roof_id: string
  x: number
  y: number
  zone?: string
}

export interface CreatePinChildForm {
  pin_id: string
  child_code: string
  defect_type?: string
  severity: Severity
  zone?: string
  notes?: string
}

export interface UploadPhotoForm {
  pin_id?: string
  child_id?: string
  type: PhotoType
  file: File
  notes?: string
}

// ===============================
// API RESPONSE TYPES
// ===============================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// ===============================
// ERROR TYPES
// ===============================

export interface SupabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface RLSError extends SupabaseError {
  code: 'PGRST116' | 'PGRST301' | 'PGRST204'
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
}

export interface StorageError extends SupabaseError {
  code: 'STORAGE_OBJECT_NOT_FOUND' | 'STORAGE_INVALID_FILE_TYPE' | 'STORAGE_FILE_TOO_LARGE'
  bucket?: string
  file_path?: string
}

// ===============================
// UI STATE TYPES
// ===============================

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface FilterState {
  status: PinStatus | 'all'
  severity: Severity | 'all'
  date_range: {
    from: string | null
    to: string | null
  }
}

export interface PinCanvasState {
  zoom: number
  panX: number
  panY: number
  isDragging: boolean
  selectedPinId: string | null
}

// ===============================
// REAL-TIME TYPES
// ===============================

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
}

export interface PresenceUser {
  user_id: string
  full_name: string
  role: UserRole
  last_seen: string
  is_online: boolean
}

// ===============================
// PHOTO CONTAINER TYPES
// ===============================

export interface PhotoContainerProps {
  pinId?: string
  childId?: string
  type: 'opening' | 'closure'
  currentPhotoUrl?: string
  isAdminOnly?: boolean
  onPhotoUpload: (file: File) => Promise<void>
  onPhotoDelete?: () => Promise<void>
  className?: string
}

export interface PhotoUploadProgress {
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

// ===============================
// ANALYTICS TYPES
// ===============================

export interface RiskMatrixData {
  defect_layer: string
  severity: Severity
  occurrence_count: number
  risk_score: number
}

export interface QualityTrend {
  date: string
  total_pins: number
  closed_pins: number
  quality_score: number
}

export interface DefectAnalysis {
  defect_type: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

// ===============================
// EXPORT TYPES
// ===============================

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  include_photos: boolean
  include_comments: boolean
  date_range?: {
    from: string
    to: string
  }
  filter?: FilterState
}

export interface ExportData {
  roof: RoofWithPins
  pins: PinWithRelations[]
  statistics: RoofStatistics
  generated_at: string
  generated_by: User
}

// ===============================
// UTILITY TYPES
// ===============================

export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Type guards
export function isPinWithRelations(pin: any): pin is PinWithRelations {
  return pin && typeof pin === 'object' && 'pin_children' in pin && Array.isArray(pin.pin_children)
}

export function isRLSError(error: any): error is RLSError {
  return error && typeof error === 'object' && 
    ['PGRST116', 'PGRST301', 'PGRST204'].includes(error.code)
}

export function isStorageError(error: any): error is StorageError {
  return error && typeof error === 'object' && 
    error.code?.startsWith('STORAGE_')
}
