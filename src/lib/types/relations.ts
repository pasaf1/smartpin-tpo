// Relations and derived types for database entities
import type { Database } from '../database.types'

export type IssueRowStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

// Base Pin type from database
type PinRow = Database['public']['Tables']['pins']['Row']
type PinStatus = Database['public']['Enums']['pin_status']

// Extend the base Pin type with relational data
// Keep the nullable fields from PinRow as-is
export interface PinWithRelations extends PinRow {
  children?: PinWithRelations[]
  child_pins?: PinWithRelations[]
  pin_children?: PinWithRelations[]
  pin_items?: any[]
  photos?: any[]
}

// Child Pin type with UI-specific fields
// Supports multiple naming conventions for backwards compatibility
export interface ChildPinWithUIFields {
  // Primary identifiers
  child_id: string
  id?: string // Alternative identifier

  // Parent relationship
  pin_id: string
  parent_id?: string // Alternative parent reference

  // Sequence/code
  child_code: string
  seq?: string // Alternative sequence field

  // Basic properties
  zone: string | null
  defect_type: string | null
  defect_layer?: string | null // Alternative defect field
  severity: string | null

  // Status (dual naming for compatibility)
  status_child: 'Open' | 'ReadyForInspection' | 'Closed'
  status?: 'Open' | 'ReadyForInspection' | 'Closed' // Alternative status field

  // Dates
  due_date: string | null
  open_date: string
  closed_date: string | null
  created_at: string
  updated_at: string

  // Photos
  openpic_id: string | null
  closurepic_id: string | null
  open_pic_url?: string | null // Direct URL reference
  close_pic_url?: string | null // Direct URL reference

  // Text fields
  notes: string | null
  description?: string | null // Alternative notes field
  title?: string | null // Display title

  // Coordinates (UI-specific)
  x: number | null
  y: number | null
}