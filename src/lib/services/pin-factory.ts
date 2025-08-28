/**
 * PinMapper Enhanced System - Pin Factory Service
 * Factory for creating layer-specific pins with validation and defaults
 */

import { 
  EnhancedPin, 
  LayerKind, 
  PinMetadata, 
  PinRenderingProps,
  PinAnimationState,
  LayerSpecificPin,
  IssuePinData,
  RFIPinData,
  DetailPinData,
  NotePinData,
  CanvasCoordinates
} from '../layer-types'
import { Pin } from '../database.types'
import { LAYER_KIND_CONFIG } from '../layer-constants'

// Pin creation options
export interface PinCreationOptions {
  layerId: string
  layerKind: LayerKind
  position: CanvasCoordinates
  title?: string
  description?: string
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  assignee?: string
  dueDate?: Date
  tags?: string[]
  attachments?: string[]
  layerSpecificData?: any
}

// Pin factory result
export interface PinFactoryResult {
  success: boolean
  pin?: EnhancedPin
  error?: string
  warnings?: string[]
}

// Default pin metadata
const createDefaultPinMetadata = (): PinMetadata => ({
  tags: [],
  priority: 'medium',
  estimatedTime: 60, // 1 hour default
  dependencies: [],
  attachments: []
})

// Default pin rendering props
const createDefaultRenderingProps = (layerKind: LayerKind): PinRenderingProps => {
  const config = LAYER_KIND_CONFIG[layerKind]
  return {
    size: 16,
    scale: 1,
    rotation: 0,
    isVisible: true,
    isSelected: false,
    isHovered: false,
    isDragging: false,
    animationState: {
      isAnimating: false,
      animationType: 'none',
      duration: 0,
      startTime: 0
    }
  }
}

// Pin Factory class
export class PinFactory {
  // Create a basic enhanced pin
  static createEnhancedPin(options: PinCreationOptions): PinFactoryResult {
    try {
      const warnings: string[] = []

      // Validate required fields
      if (!options.layerId) {
        return { success: false, error: 'Layer ID is required' }
      }

      if (!options.position) {
        return { success: false, error: 'Position is required' }
      }

      // Validate position coordinates
      if (options.position.x < 0 || options.position.x > 1 || 
          options.position.y < 0 || options.position.y > 1) {
        return { success: false, error: 'Position coordinates must be between 0 and 1' }
      }

      // Generate unique ID
      const pinId = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create base pin (matching database schema)
      const basePin: Pin = {
        id: pinId,
        roof_id: '', // Will be set by the application
        seq_number: 1, // Default sequence number
        zone: null,
        x: options.position.x,
        y: options.position.y,
        status: 'Open',
        status_parent_manual: 'Open',
        group_count: 1,
        children_total: 0,
        children_open: 0,
        children_ready: 0,
        children_closed: 0,
        parent_mix_state: null,
        opened_by: null, // Will be set by the application
        opened_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }

      // Create enhanced pin
      const enhancedPin: EnhancedPin = {
        ...basePin,
        layerId: options.layerId,
        layerKind: options.layerKind,
        metadata: {
          ...createDefaultPinMetadata(),
          tags: options.tags || [],
          assignee: options.assignee,
          dueDate: options.dueDate
        },
        renderingProps: createDefaultRenderingProps(options.layerKind)
      }

      // Add layer-specific data if provided
      if (options.layerSpecificData) {
        (enhancedPin as any).layerSpecificData = options.layerSpecificData
      }

      // Add warnings for missing recommended fields
      if (!options.title) {
        warnings.push('Title is recommended for better pin identification')
      }

      if (!options.description) {
        warnings.push('Description helps provide context for the pin')
      }

      return {
        success: true,
        pin: enhancedPin,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating pin'
      }
    }
  }

  // Create issue pin
  static createIssuePin(options: PinCreationOptions & { issueData?: Partial<IssuePinData> }): PinFactoryResult {
    const issueData: IssuePinData = {
      issueType: 'General',
      reproductionSteps: '',
      expectedBehavior: '',
      actualBehavior: '',
      environment: '',
      browserInfo: '',
      ...options.issueData
    }

    return this.createEnhancedPin({
      ...options,
      layerKind: 'ISSUE_PIN',
      layerSpecificData: issueData,
      severity: options.severity || 'Medium'
    })
  }

  // Create RFI pin
  static createRFIPin(options: PinCreationOptions & { rfiData?: Partial<RFIPinData> }): PinFactoryResult {
    const rfiData: RFIPinData = {
      requestType: 'Information',
      specification: '',
      drawings: [],
      technicalDetails: '',
      urgency: 'medium',
      ...options.rfiData
    }

    return this.createEnhancedPin({
      ...options,
      layerKind: 'RFI_PIN',
      layerSpecificData: rfiData
    })
  }

  // Create detail pin
  static createDetailPin(options: PinCreationOptions & { detailData?: Partial<DetailPinData> }): PinFactoryResult {
    const detailData: DetailPinData = {
      detailType: 'Construction',
      scale: '1:1',
      dimensions: '',
      materials: [],
      specifications: '',
      ...options.detailData
    }

    return this.createEnhancedPin({
      ...options,
      layerKind: 'DETAIL_PIN',
      layerSpecificData: detailData
    })
  }

  // Create note pin
  static createNotePin(options: PinCreationOptions & { noteData?: Partial<NotePinData> }): PinFactoryResult {
    const noteData: NotePinData = {
      noteType: 'General',
      isPrivate: false,
      reminder: undefined,
      color: LAYER_KIND_CONFIG.NOTE_PIN.color,
      fontSize: 14,
      ...options.noteData
    }

    return this.createEnhancedPin({
      ...options,
      layerKind: 'NOTE_PIN',
      layerSpecificData: noteData
    })
  }

  // Create pin from template
  static createFromTemplate(template: Partial<EnhancedPin>, options: PinCreationOptions): PinFactoryResult {
    try {
      const result = this.createEnhancedPin(options)
      
      if (!result.success || !result.pin) {
        return result
      }

      // Apply template properties
      const templatePin: EnhancedPin = {
        ...result.pin,
        ...template,
        id: result.pin.id, // Keep the new ID
        opened_at: result.pin.opened_at, // Keep the new timestamp
        layerId: options.layerId, // Keep the specified layer
        x: options.position.x, // Keep the specified position
        y: options.position.y
      }

      return {
        success: true,
        pin: templatePin,
        warnings: result.warnings
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creating pin from template'
      }
    }
  }

  // Duplicate an existing pin
  static duplicatePin(originalPin: EnhancedPin, offset: CanvasCoordinates = { x: 0.02, y: 0.02 }): PinFactoryResult {
    try {
      const newPosition = {
        x: Math.min(1, originalPin.x + offset.x),
        y: Math.min(1, originalPin.y + offset.y)
      }

      const duplicatedPin: EnhancedPin = {
        ...originalPin,
        id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        opened_at: new Date().toISOString(),
        x: newPosition.x,
        y: newPosition.y,
        renderingProps: {
          ...originalPin.renderingProps,
          isSelected: false,
          isHovered: false,
          isDragging: false
        }
      }

      return {
        success: true,
        pin: duplicatedPin
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error duplicating pin'
      }
    }
  }

  // Create pin from database pin
  static enhanceExistingPin(
    databasePin: Pin, 
    layerId: string, 
    layerKind: LayerKind
  ): PinFactoryResult {
    try {
      const enhancedPin: EnhancedPin = {
        ...databasePin,
        layerId,
        layerKind,
        metadata: createDefaultPinMetadata(),
        renderingProps: createDefaultRenderingProps(layerKind)
      }

      return {
        success: true,
        pin: enhancedPin
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error enhancing existing pin'
      }
    }
  }
}

// Pin creator utility functions
export const PinCreator = {
  // Quick creation methods
  createQuickIssue: (layerId: string, position: CanvasCoordinates, title: string) => 
    PinFactory.createIssuePin({
      layerId,
      layerKind: 'ISSUE_PIN',
      position,
      title,
      severity: 'Medium'
    }),

  createQuickRFI: (layerId: string, position: CanvasCoordinates, title: string) =>
    PinFactory.createRFIPin({
      layerId,
      layerKind: 'RFI_PIN',
      position,
      title
    }),

  createQuickNote: (layerId: string, position: CanvasCoordinates, title: string) =>
    PinFactory.createNotePin({
      layerId,
      layerKind: 'NOTE_PIN',
      position,
      title
    }),

  createQuickDetail: (layerId: string, position: CanvasCoordinates, title: string) =>
    PinFactory.createDetailPin({
      layerId,
      layerKind: 'DETAIL_PIN',
      position,
      title
    }),

  // Batch creation
  createMultiplePins: (pinOptions: PinCreationOptions[]): PinFactoryResult[] => {
    return pinOptions.map(options => {
      switch (options.layerKind) {
        case 'ISSUE_PIN':
          return PinFactory.createIssuePin(options)
        case 'RFI_PIN':
          return PinFactory.createRFIPin(options)
        case 'DETAIL_PIN':
          return PinFactory.createDetailPin(options)
        case 'NOTE_PIN':
          return PinFactory.createNotePin(options)
        default:
          return PinFactory.createEnhancedPin(options)
      }
    })
  },

  // Validation helpers
  validatePinData: (options: PinCreationOptions): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!options.layerId) errors.push('Layer ID is required')
    if (!options.position) errors.push('Position is required')
    if (!options.layerKind) errors.push('Layer kind is required')

    if (options.position) {
      if (options.position.x < 0 || options.position.x > 1) {
        errors.push('X position must be between 0 and 1')
      }
      if (options.position.y < 0 || options.position.y > 1) {
        errors.push('Y position must be between 0 and 1')
      }
    }

    if (options.title && options.title.length > 100) {
      errors.push('Title must not exceed 100 characters')
    }

    if (options.description && options.description.length > 1000) {
      errors.push('Description must not exceed 1000 characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Get default data for layer kind
  getDefaultDataForKind: (layerKind: LayerKind): any => {
    switch (layerKind) {
      case 'ISSUE_PIN':
        return {
          issueType: 'General',
          reproductionSteps: '',
          expectedBehavior: '',
          actualBehavior: '',
          environment: '',
          browserInfo: ''
        } as IssuePinData

      case 'RFI_PIN':
        return {
          requestType: 'Information',
          specification: '',
          drawings: [],
          technicalDetails: '',
          urgency: 'medium'
        } as RFIPinData

      case 'DETAIL_PIN':
        return {
          detailType: 'Construction',
          scale: '1:1',
          dimensions: '',
          materials: [],
          specifications: ''
        } as DetailPinData

      case 'NOTE_PIN':
        return {
          noteType: 'General',
          isPrivate: false,
          color: LAYER_KIND_CONFIG.NOTE_PIN.color,
          fontSize: 14
        } as NotePinData

      default:
        return {}
    }
  }
}

export default PinFactory
