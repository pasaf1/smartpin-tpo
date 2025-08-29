// Types for relations and forms
import type { Pin, PinChild, Photo, Chat, User } from '../database.types'

export type IssueRowStatus = 'Open' | 'ReadyForInspection' | 'Closed'

export interface PinWithRelations extends Pin {
  children?: PinChild[]
  child_pins?: PinChild[]
  pin_children?: PinChild[]
  parent?: Pin
  photos?: Array<{
    photo_id: string
    type: 'OpenPIC' | 'ClosurePIC'
    file_url_public: string
    uploaded_at: string
  }>
  // Derived Issue Row Status (aggregated from parent + all children)
  row_status?: IssueRowStatus
  // Note: children_open, children_ready, children_closed, children_total 
  // are already defined in the base Pin type from the database schema
}

export interface CreatePinForm {
  x: number
  y: number
  zone?: string
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  status?: 'Open' | 'ReadyForInspection' | 'Closed'
  roof_id: string
  seq_number?: number
}

export interface CreatePinChildForm {
  pin_id: string
  child_code: string
  zone?: string
  defect_type?: string
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  status_child?: 'Open' | 'ReadyForInspection' | 'Closed'
  notes?: string
}

export interface UploadPhotoForm {
  pin_id?: string
  child_id?: string
  file: File
  type: 'OpenPIC' | 'ClosurePIC'
  notes?: string
}

export interface PhotoUploadProgress {
  pinId?: string
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface PinStatistics {
  total: number
  open: number
  ready: number
  closed: number
  completion_percentage: number
  readyForInspection?: number
  bySeverity?: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface PhotoWithContext extends Photo {
  pin?: Pin
  user?: User
  context?: {
    pinTitle?: string
    roofName?: string
    projectName?: string
  }
}

export interface ChatWithAuthor extends Chat {
  author?: User
  author_name?: string
  author_role?: string
}

export interface PinChildWithPhotos extends PinChild {
  photos?: Photo[]
  opening_photo?: Photo
  closure_photo?: Photo
}