import type { Database } from '../database.types'
import type { PinWithRelations, ChildPinWithUIFields } from './relations'

// Base types from database
export type PinChild = Database["public"]["Tables"]["pin_children"]["Row"]
export type PinStatus = Database["public"]["Enums"]["pin_status"]

// Re-export ChildPinWithUIFields from database.types for convenience
export type { ChildPinWithUIFields }

// Handler function type signatures for Pin interactions
export type PinClickHandler = (pin: PinWithRelations) => void
export type ChildPinClickHandler = (childPin: ChildPinWithUIFields, parentPin: PinWithRelations) => void
export type AddChildPinHandler = (parentPin: PinWithRelations, x?: number, y?: number) => void | Promise<void>
export type UpdateChildPinHandler = (childPin: ChildPinWithUIFields) => void
export type DeleteChildPinHandler = (childPinId: string) => void
export type StatusChangeHandler = (pinId: string, newStatus: PinStatus, isChild?: boolean) => void
