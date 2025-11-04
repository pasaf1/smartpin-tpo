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