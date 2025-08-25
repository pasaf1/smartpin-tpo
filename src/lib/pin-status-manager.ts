/**
 * Pin Status Management for SmartPin TPO
 * Handles parent-child pin relationships and status calculations
 */

export type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed'
export type PinSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Pin {
  id: string
  parent_pin_id?: string | null
  status: PinStatus
  severity: PinSeverity
  title: string
  description: string
  created_at: string
  completed_at?: string | null
  closure_photo_url?: string | null
  has_closure_photo?: boolean
  children?: Pin[]
}

export interface StatusUpdateResult {
  updatedPin: Pin
  affectedPins: Pin[]
  notifications: string[]
}

/**
 * Calculate parent pin status based on child pin statuses
 */
export function calculateParentPinStatus(childPins: Pin[]): PinStatus {
  if (!childPins || childPins.length === 0) {
    return 'Open'
  }

  const statusCounts = {
    Open: 0,
    ReadyForInspection: 0,
    Closed: 0
  }

  childPins.forEach(child => {
    statusCounts[child.status]++
  })

  // If all child pins are closed, parent is closed
  if (statusCounts.Closed === childPins.length) {
    return 'Closed'
  }

  // If any child pins are open, parent remains open
  if (statusCounts.Open > 0) {
    return 'Open'
  }

  // If all remaining pins are ready for inspection, parent is ready for inspection
  if (statusCounts.ReadyForInspection > 0) {
    return 'ReadyForInspection'
  }

  return 'Open'
}

/**
 * Update child pin status when closure photo is uploaded
 */
export function updateChildPinOnClosurePhoto(
  childPin: Pin,
  closurePhotoUrl: string
): StatusUpdateResult {
  const updatedPin: Pin = {
    ...childPin,
    status: 'ReadyForInspection',
    closure_photo_url: closurePhotoUrl,
    has_closure_photo: true
  }

  return {
    updatedPin,
    affectedPins: [updatedPin],
    notifications: [
      `Child pin ${childPin.title} updated to "Ready for Inspection" with closure photo`
    ]
  }
}

/**
 * Update parent pin status based on child pin changes
 */
export function updateParentPinStatus(
  parentPin: Pin,
  childPins: Pin[]
): StatusUpdateResult {
  const newStatus = calculateParentPinStatus(childPins)
  const previousStatus = parentPin.status

  if (newStatus === previousStatus) {
    return {
      updatedPin: parentPin,
      affectedPins: [],
      notifications: []
    }
  }

  const updatedPin: Pin = {
    ...parentPin,
    status: newStatus,
    completed_at: newStatus === 'Closed' ? new Date().toISOString() : null
  }

  const notifications = [
    `Parent pin ${parentPin.title} status changed from "${previousStatus}" to "${newStatus}"`
  ]

  return {
    updatedPin,
    affectedPins: [updatedPin],
    notifications
  }
}

/**
 * Process closure photo upload for a child pin and update related pins
 */
export function processChildPinClosurePhoto(
  childPin: Pin,
  parentPin: Pin,
  allChildPins: Pin[],
  closurePhotoUrl: string
): StatusUpdateResult {
  // Update the child pin
  const childResult = updateChildPinOnClosurePhoto(childPin, closurePhotoUrl)
  
  // Update the list of child pins with the new status
  const updatedChildPins = allChildPins.map(pin => 
    pin.id === childPin.id ? childResult.updatedPin : pin
  )

  // Update parent pin status based on new child statuses
  const parentResult = updateParentPinStatus(parentPin, updatedChildPins)

  return {
    updatedPin: childResult.updatedPin,
    affectedPins: [childResult.updatedPin, ...parentResult.affectedPins],
    notifications: [...childResult.notifications, ...parentResult.notifications]
  }
}

/**
 * Close a child pin manually (inspector approval)
 */
export function closeChildPin(
  childPin: Pin,
  parentPin: Pin,
  allChildPins: Pin[]
): StatusUpdateResult {
  if (childPin.status !== 'ReadyForInspection') {
    return {
      updatedPin: childPin,
      affectedPins: [],
      notifications: [`Cannot close child pin ${childPin.title} - must be "Ready for Inspection" first`]
    }
  }

  const updatedChildPin: Pin = {
    ...childPin,
    status: 'Closed',
    completed_at: new Date().toISOString()
  }

  // Update the list of child pins with the new status
  const updatedChildPins = allChildPins.map(pin => 
    pin.id === childPin.id ? updatedChildPin : pin
  )

  // Update parent pin status based on new child statuses
  const parentResult = updateParentPinStatus(parentPin, updatedChildPins)

  return {
    updatedPin: updatedChildPin,
    affectedPins: [updatedChildPin, ...parentResult.affectedPins],
    notifications: [
      `Child pin ${childPin.title} closed successfully`,
      ...parentResult.notifications
    ]
  }
}

/**
 * Get status summary for a parent pin
 */
export function getParentPinStatusSummary(parentPin: Pin, childPins: Pin[]) {
  const summary = {
    totalChildren: childPins.length,
    open: childPins.filter(p => p.status === 'Open').length,
    readyForInspection: childPins.filter(p => p.status === 'ReadyForInspection').length,
    closed: childPins.filter(p => p.status === 'Closed').length,
    completionPercentage: 0,
    canBeClosed: false
  }

  if (summary.totalChildren > 0) {
    summary.completionPercentage = Math.round((summary.closed / summary.totalChildren) * 100)
    summary.canBeClosed = summary.closed === summary.totalChildren
  }

  return summary
}

/**
 * Validate pin closure requirements
 */
export function validatePinClosure(pin: Pin): { canClose: boolean; reason?: string } {
  if (pin.parent_pin_id) {
    // Child pin validation
    if (!pin.has_closure_photo) {
      return { canClose: false, reason: 'Closure photo required before closing child pin' }
    }
    if (pin.status !== 'ReadyForInspection') {
      return { canClose: false, reason: 'Pin must be "Ready for Inspection" before closing' }
    }
  } else {
    // Parent pin validation
    if (pin.children && pin.children.length > 0) {
      const openChildren = pin.children.filter(child => child.status !== 'Closed')
      if (openChildren.length > 0) {
        return { canClose: false, reason: `Cannot close parent pin while ${openChildren.length} child pins remain open` }
      }
    }
  }

  return { canClose: true }
}