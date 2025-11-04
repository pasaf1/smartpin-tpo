// Issue Row Status derivation utilities
import type { Database } from '../database.types'
import type { IssueRowStatus, PinWithRelations } from '../types/relations'

// Define types locally using Database schema
type PinStatus = Database['public']['Tables']['pins']['Row']['status']
type PinChild = Database['public']['Tables']['pin_children']['Row']

/**
 * Derives the Issue Row Status based on parent and children statuses
 * 
 * Rule:
 * - If (parent='Closed' AND children_open=0 AND children_ready=0) → 'Closed'
 * - Else if (children_open=0) AND (parent='ReadyForInspection' OR children_ready>0) → 'ReadyForInspection'
 * - Else → 'Open'
 */
export function deriveIssueRowStatus(
  parentStatus: PinStatus,
  childrenOpen: number = 0,
  childrenReady: number = 0,
  childrenClosed: number = 0
): IssueRowStatus {
  // If parent is closed and no children are open or ready
  if (parentStatus === 'Closed' && childrenOpen === 0 && childrenReady === 0) {
    return 'closed'
  }
  
  // If no children are open AND (parent is ready OR some children are ready)
  if (childrenOpen === 0 && (parentStatus === 'ReadyForInspection' || childrenReady > 0)) {
    return 'in-progress'
  }
  
  // Default to Open
  return 'open'
}

/**
 * Derives Issue Row Status from a PinWithRelations object
 */
export function deriveIssueRowStatusFromPin(pin: PinWithRelations): IssueRowStatus {
  const children = (pin.children || pin.child_pins || pin.pin_children || []) as unknown as PinChild[]

  const childrenOpen = children.filter(child =>
    child.status_child !== 'Closed' && child.status_child !== 'ReadyForInspection'
  ).length

  const childrenReady = children.filter(child =>
    child.status_child === 'ReadyForInspection'
  ).length

  const childrenClosed = children.filter(child =>
    child.status_child === 'Closed'
  ).length

  return deriveIssueRowStatus(pin.status, childrenOpen, childrenReady, childrenClosed)
}

/**
 * Gets the appropriate status color for UI display
 */
export function getIssueStatusColor(status: IssueRowStatus): string {
  switch (status) {
    case 'open':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'in-progress':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'resolved':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'closed':
      return 'text-green-600 bg-green-50 border-green-200'
  }
}

/**
 * Gets the appropriate status icon for UI display
 */
export function getIssueStatusIcon(status: IssueRowStatus): string {
  switch (status) {
    case 'open':
      return '🔴'
    case 'in-progress':
      return '🟡'
    case 'resolved':
      return '🔵'
    case 'closed':
      return '🟢'
  }
}

/**
 * Formats Issue ID in the new format: ISSUE-YYYY-SEQ
 */
export function formatIssueId(year: number, seqNumber: number): string {
  const seq = String(seqNumber).padStart(3, '0')
  return `ISSUE-${year}-${seq}`
}