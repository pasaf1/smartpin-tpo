/**
 * PinMapper Enhanced System - Permission Service
 * Role-based access control and permission management
 */

import { LayerPermissions, LayerKind } from '../layer-types'
import { DEFAULT_LAYER_PERMISSIONS } from '../layer-constants'

// User role definitions
export type UserRole = 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Inspector' | 'Contractor'

// Permission context for operations
export interface PermissionContext {
  userId: string
  userRole: UserRole
  layerId?: string
  layerKind?: LayerKind
  pinId?: string
  operation: PermissionOperation
  resourceOwnerId?: string
}

// Available operations that require permissions
export type PermissionOperation = 
  | 'view_layer'
  | 'create_layer'
  | 'edit_layer'
  | 'delete_layer'
  | 'manage_layer'
  | 'view_pin'
  | 'create_pin'
  | 'edit_pin'
  | 'delete_pin'
  | 'move_pin'
  | 'assign_pin'
  | 'close_pin'
  | 'reopen_pin'
  | 'view_analytics'
  | 'export_data'
  | 'import_data'
  | 'manage_users'
  | 'manage_permissions'

// Permission result
export interface PermissionResult {
  allowed: boolean
  reason?: string
  conditions?: string[]
  alternatives?: string[]
}

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  Admin: 100,
  QA_Manager: 80,
  Supervisor: 60,
  Foreman: 40,
  Inspector: 20,
  Contractor: 10
}

// Base permissions for each role
const BASE_ROLE_PERMISSIONS: Record<UserRole, PermissionOperation[]> = {
  Admin: [
    'view_layer', 'create_layer', 'edit_layer', 'delete_layer', 'manage_layer',
    'view_pin', 'create_pin', 'edit_pin', 'delete_pin', 'move_pin', 'assign_pin', 'close_pin', 'reopen_pin',
    'view_analytics', 'export_data', 'import_data', 'manage_users', 'manage_permissions'
  ],
  QA_Manager: [
    'view_layer', 'create_layer', 'edit_layer', 'delete_layer', 'manage_layer',
    'view_pin', 'create_pin', 'edit_pin', 'delete_pin', 'move_pin', 'assign_pin', 'close_pin', 'reopen_pin',
    'view_analytics', 'export_data', 'import_data'
  ],
  Supervisor: [
    'view_layer', 'create_layer', 'edit_layer',
    'view_pin', 'create_pin', 'edit_pin', 'move_pin', 'assign_pin', 'close_pin',
    'view_analytics', 'export_data'
  ],
  Foreman: [
    'view_layer', 'create_layer', 'edit_layer',
    'view_pin', 'create_pin', 'edit_pin', 'move_pin', 'assign_pin', 'close_pin',
    'export_data'
  ],
  Inspector: [
    'view_layer', 'create_layer',
    'view_pin', 'create_pin', 'edit_pin', 'close_pin',
    'export_data'
  ],
  Contractor: [
    'view_layer',
    'view_pin', 'create_pin',
    'export_data'
  ]
}

// Layer-specific permissions
const LAYER_PERMISSIONS: Record<LayerKind, Record<UserRole, Partial<LayerPermissions>>> = {
  ISSUE_PIN: {
    Admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    QA_Manager: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    Supervisor: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Foreman: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Inspector: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
    Contractor: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false }
  },
  RFI_PIN: {
    Admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    QA_Manager: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    Supervisor: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Foreman: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Inspector: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    Contractor: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false }
  },
  DETAIL_PIN: {
    Admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    QA_Manager: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    Supervisor: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Foreman: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    Inspector: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    Contractor: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false }
  },
  NOTE_PIN: {
    Admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    QA_Manager: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    Supervisor: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Foreman: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Inspector: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    Contractor: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false }
  }
}

// Permission service class
export class PermissionService {
  private userRole: UserRole
  private userId: string

  constructor(userId: string, userRole: UserRole) {
    this.userId = userId
    this.userRole = userRole
  }

  // Update user context
  updateUserContext(userId: string, userRole: UserRole): void {
    this.userId = userId
    this.userRole = userRole
  }

  // Check if user has permission for an operation
  hasPermission(context: Omit<PermissionContext, 'userId' | 'userRole'>): PermissionResult {
    const fullContext: PermissionContext = {
      ...context,
      userId: this.userId,
      userRole: this.userRole
    }

    return this.checkPermission(fullContext)
  }

  // Main permission checking logic
  private checkPermission(context: PermissionContext): PermissionResult {
    // Admin always has permission
    if (context.userRole === 'Admin') {
      return { allowed: true }
    }

    // Check base role permissions
    const basePermissions = BASE_ROLE_PERMISSIONS[context.userRole] || []
    if (!basePermissions.includes(context.operation)) {
      return {
        allowed: false,
        reason: `Role '${context.userRole}' does not have permission for operation '${context.operation}'`,
        alternatives: this.suggestAlternatives(context)
      }
    }

    // Layer-specific permission checks
    if (context.layerKind && this.isLayerOperation(context.operation)) {
      return this.checkLayerPermission(context)
    }

    // Pin-specific permission checks
    if (context.pinId && this.isPinOperation(context.operation)) {
      return this.checkPinPermission(context)
    }

    // Resource ownership checks
    if (context.resourceOwnerId && context.resourceOwnerId !== context.userId) {
      return this.checkOwnershipPermission(context)
    }

    return { allowed: true }
  }

  // Check layer-specific permissions
  private checkLayerPermission(context: PermissionContext): PermissionResult {
    if (!context.layerKind) {
      return { allowed: false, reason: 'Layer kind not specified' }
    }

    const layerPerms = LAYER_PERMISSIONS[context.layerKind]?.[context.userRole]
    if (!layerPerms) {
      return { allowed: false, reason: 'Layer permissions not found for role' }
    }

    const operationMap: Record<string, keyof LayerPermissions> = {
      'view_layer': 'canView',
      'create_layer': 'canCreate',
      'edit_layer': 'canEdit',
      'delete_layer': 'canDelete',
      'manage_layer': 'canManage'
    }

    const requiredPermission = operationMap[context.operation]
    if (!requiredPermission || !layerPerms[requiredPermission]) {
      return {
        allowed: false,
        reason: `Insufficient permissions for ${context.operation} on ${context.layerKind} layer`,
        alternatives: this.suggestLayerAlternatives(context)
      }
    }

    return { allowed: true }
  }

  // Check pin-specific permissions
  private checkPinPermission(context: PermissionContext): PermissionResult {
    // For now, pin permissions follow layer permissions
    // Can be extended for pin-specific rules
    if (context.layerKind) {
      return this.checkLayerPermission(context)
    }

    // Default pin permission check based on role
    const allowedOperations = BASE_ROLE_PERMISSIONS[context.userRole] || []
    if (!allowedOperations.includes(context.operation)) {
      return {
        allowed: false,
        reason: `Role '${context.userRole}' cannot perform '${context.operation}' on pins`
      }
    }

    return { allowed: true }
  }

  // Check ownership-based permissions
  private checkOwnershipPermission(context: PermissionContext): PermissionResult {
    // Some operations can only be performed by the owner or higher roles
    const ownerOnlyOperations: PermissionOperation[] = ['delete_pin', 'delete_layer']
    
    if (ownerOnlyOperations.includes(context.operation)) {
      const requiredLevel = ROLE_HIERARCHY['Supervisor'] // Supervisor and above can delete others' resources
      const userLevel = ROLE_HIERARCHY[context.userRole]
      
      if (userLevel < requiredLevel && context.resourceOwnerId !== context.userId) {
        return {
          allowed: false,
          reason: 'Can only delete your own resources, or need Supervisor+ role',
          conditions: ['Must be resource owner', 'Or have Supervisor+ role']
        }
      }
    }

    return { allowed: true }
  }

  // Check if operation is layer-related
  private isLayerOperation(operation: PermissionOperation): boolean {
    return operation.includes('layer')
  }

  // Check if operation is pin-related
  private isPinOperation(operation: PermissionOperation): boolean {
    return operation.includes('pin')
  }

  // Suggest alternative actions
  private suggestAlternatives(context: PermissionContext): string[] {
    const alternatives: string[] = []
    
    switch (context.operation) {
      case 'delete_layer':
      case 'delete_pin':
        alternatives.push('Request deletion from a Supervisor or Admin')
        alternatives.push('Mark as inactive instead of deleting')
        break
      case 'manage_layer':
        alternatives.push('Request layer management from QA Manager or Admin')
        break
      case 'manage_users':
        alternatives.push('Contact an Admin for user management')
        break
      case 'edit_pin':
        alternatives.push('Create a comment or note instead')
        alternatives.push('Request edit from the pin owner')
        break
    }
    
    return alternatives
  }

  // Suggest layer-specific alternatives
  private suggestLayerAlternatives(context: PermissionContext): string[] {
    const alternatives: string[] = []
    
    if (context.layerKind === 'DETAIL_PIN' && context.userRole === 'Inspector') {
      alternatives.push('Create an ISSUE_PIN instead to flag the detail')
      alternatives.push('Add a note to an existing detail pin')
    }
    
    if (context.layerKind === 'RFI_PIN' && context.userRole === 'Inspector') {
      alternatives.push('Create an ISSUE_PIN to highlight information needs')
      alternatives.push('Contact a Supervisor to create the RFI')
    }
    
    return alternatives
  }

  // Get all permissions for current user
  getAllPermissions(): {
    role: UserRole
    basePermissions: PermissionOperation[]
    layerPermissions: Record<LayerKind, LayerPermissions>
    hierarchyLevel: number
  } {
    const layerPermissions: Record<LayerKind, LayerPermissions> = {} as any
    
    Object.keys(LAYER_PERMISSIONS).forEach(layerKind => {
      const kind = layerKind as LayerKind
      const perms = LAYER_PERMISSIONS[kind][this.userRole]
      layerPermissions[kind] = {
        canView: perms?.canView || false,
        canCreate: perms?.canCreate || false,
        canEdit: perms?.canEdit || false,
        canDelete: perms?.canDelete || false,
        canManage: perms?.canManage || false
      }
    })

    return {
      role: this.userRole,
      basePermissions: BASE_ROLE_PERMISSIONS[this.userRole] || [],
      layerPermissions,
      hierarchyLevel: ROLE_HIERARCHY[this.userRole]
    }
  }

  // Check if user can perform bulk operations
  canPerformBulkOperation(operation: PermissionOperation, itemCount: number): PermissionResult {
    const maxBulkItems: Record<UserRole, number> = {
      Admin: 10000,
      QA_Manager: 1000,
      Supervisor: 500,
      Foreman: 100,
      Inspector: 50,
      Contractor: 10
    }

    const maxItems = maxBulkItems[this.userRole] || 0
    
    if (itemCount > maxItems) {
      return {
        allowed: false,
        reason: `Role '${this.userRole}' can only perform bulk operations on up to ${maxItems} items`,
        conditions: [`Reduce selection to ${maxItems} items or less`]
      }
    }

    return this.hasPermission({ operation })
  }

  // Get permission warnings for UI
  getPermissionWarnings(operation: PermissionOperation): string[] {
    const warnings: string[] = []
    
    if (this.userRole === 'Contractor' && operation.includes('create')) {
      warnings.push('As a Contractor, your pins will need approval from project staff')
    }
    
    if (this.userRole === 'Inspector' && operation.includes('delete')) {
      warnings.push('Inspectors cannot delete items - consider marking as resolved instead')
    }
    
    if (ROLE_HIERARCHY[this.userRole] < ROLE_HIERARCHY['Supervisor'] && operation.includes('manage')) {
      warnings.push('Management operations require Supervisor level or higher')
    }
    
    return warnings
  }

  // Get required role for operation
  getRequiredRole(operation: PermissionOperation): UserRole | null {
    for (const [role, operations] of Object.entries(BASE_ROLE_PERMISSIONS)) {
      if (operations.includes(operation)) {
        return role as UserRole
      }
    }
    return null
  }
}

// Utility functions
export const PermissionUtils = {
  // Create permission service for user
  createService: (userId: string, userRole: UserRole) => new PermissionService(userId, userRole),

  // Check if role is valid
  isValidRole: (role: string): role is UserRole => {
    return Object.keys(ROLE_HIERARCHY).includes(role)
  },

  // Get role hierarchy level
  getRoleLevel: (role: UserRole): number => ROLE_HIERARCHY[role],

  // Compare role levels
  isRoleHigherOrEqual: (role1: UserRole, role2: UserRole): boolean => {
    return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
  },

  // Get default layer permissions for role
  getDefaultLayerPermissions: (role: UserRole): LayerPermissions => {
    return DEFAULT_LAYER_PERMISSIONS[role] || DEFAULT_LAYER_PERMISSIONS.Inspector
  },

  // Get layer permissions for specific layer kind
  getLayerPermissions: (role: UserRole, layerKind: LayerKind): Partial<LayerPermissions> => {
    return LAYER_PERMISSIONS[layerKind]?.[role] || {}
  },

  // Get all available roles
  getAllRoles: (): UserRole[] => Object.keys(ROLE_HIERARCHY) as UserRole[],

  // Get operations available to role
  getRoleOperations: (role: UserRole): PermissionOperation[] => {
    return BASE_ROLE_PERMISSIONS[role] || []
  }
}

export default PermissionService
