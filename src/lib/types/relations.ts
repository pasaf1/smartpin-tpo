// Relations and derived types for database entities
import type { Database, PinStatus } from '../database.types'

export type IssueRowStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

// Base Pin type from database
type PinRow = Database['public']['Tables']['pins']['Row']

// Extend the base Pin type with relational data
export interface PinWithRelations extends Omit<PinRow, 'children_total' | 'children_open' | 'children_ready' | 'children_closed'> {
  children?: PinWithRelations[]
  child_pins?: PinWithRelations[]
  pin_children?: PinWithRelations[]
  pin_items?: any[]
  photos?: any[]
  // Computed fields for aggregated child pin counts
  children_total?: number
  children_open?: number
  children_ready?: number
  children_closed?: number
}