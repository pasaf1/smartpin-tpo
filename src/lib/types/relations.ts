// Relations and derived types for database entities
import type { PinStatus } from '../database.types'

export type IssueRowStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export interface PinWithRelations {
  id: string
  status: PinStatus
  children?: PinWithRelations[]
  child_pins?: PinWithRelations[]
  pin_children?: PinWithRelations[]
  parent_id?: string | null
  status_child?: PinStatus
  // Add other pin properties as needed
}