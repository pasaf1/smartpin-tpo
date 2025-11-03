import type { Database } from '../database.types'
import type { PinWithRelations } from './relations'

// Base types from database
export type PinChild = Database["public"]["Tables"]["pin_children"]["Row"]
export type PinStatus = Database["public"]["Enums"]["pin_status"]

// Extended child pin type that includes both database fields and UI compatibility fields
export interface ChildPinWithUIFields extends PinChild {
  // UI compatibility fields that components expect
  id?: string // maps to child_id for components expecting this field
  parent_id?: string // maps to pin_id for components expecting this field
  seq?: string // maps to child_code for components expecting this field
  x: number | null // UI positioning (not in database)
  y: number | null // UI positioning (not in database)
  status?: PinStatus // maps to status_child for components expecting this field
  title?: string | null
  description?: string | null
  open_pic_url?: string | null // maps to openpic_id lookup
  close_pic_url?: string | null // maps to closurepic_id lookup
  metadata?: Record<string, any> // additional UI data
  defect_layer?: string // additional UI field
}

// Handler function type signatures for Pin interactions
export type PinClickHandler = (pin: PinWithRelations) => void
export type ChildPinClickHandler = (childPin: ChildPinWithUIFields, parentPin: PinWithRelations) => void
export type AddChildPinHandler = (parentPin: PinWithRelations, x?: number, y?: number) => void | Promise<void>
export type UpdateChildPinHandler = (childPin: ChildPinWithUIFields) => void
export type DeleteChildPinHandler = (childPinId: string) => void
export type StatusChangeHandler = (pinId: string, newStatus: PinStatus, isChild?: boolean) => void
