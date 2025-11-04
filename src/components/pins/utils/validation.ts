/**
 * Comprehensive validation utilities for the SmartPin TPO Pin System
 * Handles pin data validation, business rules, and error checking
 */

import {
  SmartPin,
  ExtendedPinStatus,
  PinSeverity,
  DefectLayer,
  ImageKind,
  UserRole,
  PinValidationRule,
  PinValidationResult,
  StatusWorkflowRule,
  PhotoUpload
} from '../types'

// Helper function to map ImageKind to PhotoUpload type
function mapImageKindToPhotoType(imageKind: ImageKind): PhotoUpload['type'] | null {
  const mapping: Record<ImageKind, PhotoUpload['type'] | null> = {
    'Open': 'opening',
    'Close': 'closing',
    'Progress': 'progress',
    'Documentation': 'documentation',
    'Issue': null // Issue type doesn't have a direct PhotoUpload equivalent
  }
  return mapping[imageKind]
}

// Default validation rules for pin fields
export const DEFAULT_PIN_VALIDATION_RULES: PinValidationRule[] = [
  {
    field: 'defectType',
    required: true,
    minLength: 3,
    maxLength: 100
  },
  {
    field: 'description',
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  {
    field: 'severity',
    required: true,
    custom: (value) => {
      const validSeverities: PinSeverity[] = ['Low', 'Medium', 'High', 'Critical']
      return validSeverities.includes(value as PinSeverity) || 'Invalid severity level'
    }
  },
  {
    field: 'position',
    required: true,
    custom: (value: any) => {
      if (!value || typeof value !== 'object') return 'Position is required'
      if (typeof value.x !== 'number' || typeof value.y !== 'number') {
        return 'Position must have valid x and y coordinates'
      }
      if (value.x < 0 || value.x > 1 || value.y < 0 || value.y > 1) {
        return 'Position coordinates must be between 0 and 1'
      }
      return true
    }
  }
]

/**
 * Validates a pin object against the given rules
 */
export function validatePin(pin: Partial<SmartPin>, rules: PinValidationRule[] = DEFAULT_PIN_VALIDATION_RULES): PinValidationResult {
  const errors: Array<{ field: keyof SmartPin | string; message: string }> = []

  for (const rule of rules) {
    const value = getNestedValue(pin, rule.field as string)

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: `${String(rule.field)} is required`
      })
      continue
    }

    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null || value === '') continue

    // Check minimum length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push({
        field: rule.field,
        message: `${String(rule.field)} must be at least ${rule.minLength} characters`
      })
    }

    // Check maximum length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push({
        field: rule.field,
        message: `${String(rule.field)} must not exceed ${rule.maxLength} characters`
      })
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field: rule.field,
        message: `${String(rule.field)} format is invalid`
      })
    }

    // Check custom validation
    if (rule.custom) {
      const customResult = rule.custom(value, pin as SmartPin)
      if (customResult !== true) {
        errors.push({
          field: rule.field,
          message: typeof customResult === 'string' ? customResult : `${String(rule.field)} is invalid`
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates pin status transitions
 */
export function validateStatusTransition(
  pin: SmartPin,
  targetStatus: ExtendedPinStatus,
  userRole: UserRole,
  workflowRules: StatusWorkflowRule[]
): {
  canTransition: boolean
  errors: string[]
  warnings: string[]
  requiredActions?: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const requiredActions: string[] = []

  // Find applicable workflow rule
  const rule = workflowRules.find(r =>
    r.fromStatus === pin.status &&
    r.toStatus === targetStatus
  )

  if (!rule) {
    errors.push(`Status transition from ${pin.status} to ${targetStatus} is not defined`)
    return { canTransition: false, errors, warnings }
  }

  // Check user role permissions
  if (!rule.requiredRoles.includes(userRole)) {
    errors.push(`Your role (${userRole}) is not authorized for this status change`)
  }

  // Check required fields
  if (rule.requiredFields) {
    rule.requiredFields.forEach(fieldPath => {
      const value = getNestedValue(pin, fieldPath)
      if (!value) {
        errors.push(`Required field missing: ${fieldPath}`)
        requiredActions.push(`Please provide ${fieldPath}`)
      }
    })
  }

  // Check required photos
  if (rule.requiredPhotos) {
    rule.requiredPhotos.forEach(photoType => {
      const mappedType = mapImageKindToPhotoType(photoType)
      const hasPhoto = mappedType ? pin.photos.some(photo => photo.type === mappedType) : false
      if (!hasPhoto) {
        errors.push(`Required ${photoType.toLowerCase()} photo missing`)
        requiredActions.push(`Please upload a ${photoType.toLowerCase()} photo`)
      }
    })
  }

  // Validate specific status transition rules
  switch (targetStatus) {
    case 'ReadyForInspection':
      if (pin.status === 'Open') {
        if (!pin.photos.some(p => p.type === 'closing')) {
          errors.push('Close photo is required before marking as Ready for Inspection')
        }
      }
      break

    case 'Closed':
      // Check if all child pins are closed
      if (pin.children.length > 0) {
        const openChildren = pin.children.filter(child => child.status_child === 'Open')
        const readyChildren = pin.children.filter(child => child.status_child === 'ReadyForInspection')
        const disputedChildren = pin.children.filter(child => child.status_child === 'InDispute')

        if (openChildren.length > 0) {
          errors.push(`Cannot close pin: ${openChildren.length} child issues are still open`)
        }

        if (readyChildren.length > 0) {
          warnings.push(`${readyChildren.length} child issues are ready for inspection`)
        }

        if (disputedChildren.length > 0) {
          errors.push(`Cannot close pin: ${disputedChildren.length} child issues are in dispute`)
        }
      }

      // Require inspection data for closing
      if (!pin.inspectionData?.inspectorId) {
        errors.push('Inspector assignment required before closing')
      }

      if (!pin.inspectionData?.inspectionDate) {
        errors.push('Inspection date required before closing')
      }
      break

    case 'InDispute':
      if (!pin.notes || pin.notes.trim().length < 10) {
        errors.push('Detailed reason required for dispute status')
        requiredActions.push('Please provide a detailed explanation for the dispute')
      }
      break
  }

  // Check SLA and time-based rules
  if (pin.sla.isOverdue && targetStatus === 'Closed') {
    warnings.push('This pin is overdue - closure may require escalation approval')
  }

  // Check auto-triggers
  if (rule.autoTriggers) {
    rule.autoTriggers.forEach(trigger => {
      if (evaluateAutoTriggerCondition(pin, trigger.condition)) {
        warnings.push(`Auto-trigger condition met: ${trigger.condition}`)
      }
    })
  }

  return {
    canTransition: errors.length === 0,
    errors,
    warnings,
    ...(requiredActions.length > 0 ? { requiredActions } : {})
  }
}

/**
 * Validates photo uploads
 */
export function validatePhotoUpload(
  file: File,
  photoType: ImageKind,
  pin: SmartPin,
  options: {
    maxFileSize?: number
    allowedTypes?: string[]
    maxPhotosPerType?: number
  } = {}
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxPhotosPerType = 5
  } = options

  const errors: string[] = []
  const warnings: string[] = []

  // Check file size
  if (file.size > maxFileSize) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // Check photo count limit
  const mappedPhotoType = mapImageKindToPhotoType(photoType)
  const existingPhotosOfType = mappedPhotoType ? pin.photos.filter(photo => photo.type === mappedPhotoType) : []
  if (existingPhotosOfType.length >= maxPhotosPerType) {
    errors.push(`Maximum ${maxPhotosPerType} ${photoType.toLowerCase()} photos allowed`)
  }

  // Business rule validations
  switch (photoType) {
    case 'Open':
      if (pin.status !== 'Open') {
        warnings.push('Adding open photo to a pin that is not in Open status')
      }
      break

    case 'Close':
      if (pin.status === 'Open' && !pin.photos.some(p => p.type === 'opening')) {
        warnings.push('Consider adding an open photo before adding close photo')
      }
      break
  }

  // Image quality checks (basic)
  if (file.size < 50000) { // 50KB
    warnings.push('Image file seems very small - ensure good quality for documentation')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates child pin creation
 */
export function validateChildPinCreation(
  parentPin: SmartPin,
  childData: Partial<SmartPin>,
  options: {
    maxChildrenPerParent?: number
  } = {}
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const { maxChildrenPerParent = 10 } = options
  const errors: string[] = []
  const warnings: string[] = []

  // Check if parent can have children
  if (parentPin.hierarchy.depth > 0) {
    errors.push('Child pins cannot have their own child pins (max depth is 1)')
  }

  // Check maximum children limit
  if (parentPin.children.length >= maxChildrenPerParent) {
    errors.push(`Maximum ${maxChildrenPerParent} child pins allowed per parent`)
  }

  // Validate child pin data
  const childValidation = validatePin(childData)
  if (!childValidation.isValid) {
    errors.push(...childValidation.errors.map(e => e.message))
  }

  // Check for duplicate defect types
  if (childData.defect_type) {
    const duplicateDefect = parentPin.children.some(child =>
      child.defect_type === childData.defect_type
    )
    if (duplicateDefect) {
      warnings.push(`A child pin with defect type "${childData.defect_type}" already exists`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates hierarchy operations
 */
export function validateHierarchyOperation(
  operation: 'move' | 'reorder' | 'delete',
  pin: SmartPin,
  targetParent?: SmartPin | null
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  switch (operation) {
    case 'move':
      if (!targetParent) {
        // Moving to root level
        if (pin.children.length > 0) {
          warnings.push('Moving a parent pin to root level')
        }
      } else {
        // Moving to another parent
        if (targetParent.hierarchy.depth > 0) {
          errors.push('Cannot move pin to a child pin (max depth is 1)')
        }
        if (targetParent.children.length >= 10) {
          errors.push('Target parent already has maximum number of children')
        }
      }
      break

    case 'delete':
      if (pin.children.length > 0) {
        const openChildren = pin.children.filter(child => child.status_child === 'Open').length
        if (openChildren > 0) {
          errors.push(`Cannot delete pin: ${openChildren} child pins are still open`)
        }
        warnings.push(`Deleting this pin will also delete ${pin.children.length} child pins`)
      }

      if (pin.status !== 'Open' && pin.status !== 'Closed') {
        warnings.push('Deleting a pin that is not in Open or Closed status')
      }
      break

    case 'reorder':
      // No specific validation needed for reordering
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Helper functions

/**
 * Gets nested object value by dot notation path
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Evaluates auto-trigger conditions
 */
export function evaluateAutoTriggerCondition(pin: SmartPin, condition: string): boolean {
  switch (condition) {
    case 'close_photo_uploaded':
      return pin.photos.some(photo => photo.type === 'closing')

    case 'all_children_closed':
      return pin.children.length > 0 && pin.children.every(child => child.status_child === 'Closed')

    case 'sla_overdue':
      return pin.sla.isOverdue

    case 'has_open_photo':
      return pin.photos.some(photo => photo.type === 'opening')

    default:
      console.warn(`Unknown auto-trigger condition: ${condition}`)
      return false
  }
}

/**
 * Validates user permissions for pin operations
 */
export function validateUserPermissions(
  operation: 'create' | 'update' | 'delete' | 'status_change' | 'photo_upload',
  userRole: UserRole,
  pin?: SmartPin
): {
  hasPermission: boolean
  reason?: string
} {
  const roleHierarchy: Record<UserRole, number> = {
    'Admin': 5,
    'QA_Manager': 4,
    'Inspector': 3,
    'Contractor': 2,
    'PM': 1,
    'CEO': 1,
    'OM': 1,
    'CM': 1,
    'Site_Manager': 2
  }

  const userLevel = roleHierarchy[userRole] || 0

  switch (operation) {
    case 'create':
      return {
        hasPermission: userLevel >= 2,
        ...(userLevel < 2 ? { reason: 'Insufficient permissions to create pins' } : {})
      }

    case 'update':
      return {
        hasPermission: userLevel >= 2,
        ...(userLevel < 2 ? { reason: 'Insufficient permissions to update pins' } : {})
      }

    case 'delete':
      return {
        hasPermission: userLevel >= 3,
        ...(userLevel < 3 ? { reason: 'Only supervisors and above can delete pins' } : {})
      }

    case 'status_change':
      // Status change permissions depend on the target status
      return {
        hasPermission: userLevel >= 2,
        ...(userLevel < 2 ? { reason: 'Insufficient permissions to change pin status' } : {})
      }

    case 'photo_upload':
      return {
        hasPermission: userLevel >= 2,
        ...(userLevel < 2 ? { reason: 'Insufficient permissions to upload photos' } : {})
      }

    default:
      return {
        hasPermission: false,
        reason: `Unknown operation: ${operation}`
      }
  }
}

/**
 * Comprehensive pin data sanitization
 */
export function sanitizePinData(data: Partial<SmartPin>): Partial<SmartPin> {
  const sanitized: any = { ...data }

  // Sanitize strings
  if (sanitized.defect_type && typeof sanitized.defect_type === 'string') {
    sanitized.defect_type = sanitized.defect_type.trim().slice(0, 100)
  }
  if (sanitized.description && typeof sanitized.description === 'string') {
    sanitized.description = sanitized.description.trim().slice(0, 1000)
  }
  if (sanitized.notes && typeof sanitized.notes === 'string') {
    sanitized.notes = sanitized.notes.trim().slice(0, 1000)
  }

  // Sanitize position coordinates
  if (sanitized.position && typeof sanitized.position === 'object') {
    if (typeof sanitized.position.x === 'number') {
      sanitized.position.x = Math.max(0, Math.min(1, sanitized.position.x))
    }
    if (typeof sanitized.position.y === 'number') {
      sanitized.position.y = Math.max(0, Math.min(1, sanitized.position.y))
    }
  }

  // Remove any undefined or null values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key]
    }
  })

  return sanitized as Partial<SmartPin>
}