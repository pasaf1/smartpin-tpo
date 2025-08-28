/**
 * PinMapper Enhanced System - Pin Factory Service
 * Factory for creating layer-specific pins with validation and defaults
 * Normalized coordinates (0..1), UUID, no external config dependency
 */

import {
  EnhancedPin,
  LayerKind,
  PinRenderingProps,
  IssuePinData,
  RFIPinData,
  DetailPinData,
  NotePinData,
} from '../layer-types'
import { Pin } from '../database.types'

// --- Types ---
export interface NormalizedCoordinates { x: number; y: number }

export interface PinCreationOptions {
  roofId: string
  layerId: string
  layerKind: LayerKind
  position: NormalizedCoordinates
  title?: string
  description?: string
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  assignee?: string
  dueDate?: Date
  tags?: string[]
  attachments?: string[]
  layerSpecificData?: Record<string, any>
}

export interface PinFactoryResult {
  success: boolean
  pin?: EnhancedPin
  error?: string
  warnings?: string[]
}

// --- Helpers ---
const genId = () =>
  (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function')
    ? (crypto as any).randomUUID()
    : `pin_${Date.now()}_${Math.random().toString(36).slice(2)}`

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const DEFAULT_NOTE_COLOR = '#10b981' // no external config

const createDefaultRenderingProps = (_: LayerKind): PinRenderingProps => ({
  size: 16,
  scale: 1,
  rotation: 0,
  isVisible: true,
  isSelected: false,
  isHovered: false,
  isDragging: false,
  animationState: { isAnimating: false, animationType: 'none', duration: 0, startTime: 0 },
})

// Layer-specific options types
type SafetyPinOptions = Omit<PinCreationOptions, 'layerId' | 'layerKind' | 'roofId' | 'position'>
type QualityPinOptions = Omit<PinCreationOptions, 'layerId' | 'layerKind' | 'roofId' | 'position'>
type ProgressPinOptions = Omit<PinCreationOptions, 'layerId' | 'layerKind' | 'roofId' | 'position'>
type MaintenancePinOptions = Omit<PinCreationOptions, 'layerId' | 'layerKind' | 'roofId' | 'position'>
type InspectionPinOptions = Omit<PinCreationOptions, 'layerId' | 'layerKind' | 'roofId' | 'position'>
type GenericPinOptions = Partial<Omit<PinCreationOptions, 'layerId' | 'roofId' | 'position'>> & {
  layerKind?: LayerKind; // Make layerKind optional for generic pins
}

// --- Factory ---
export class PinFactory {
  static createEnhancedPin(options: PinCreationOptions): PinFactoryResult {
    try {
      const warnings: string[] = []

      if (!options.layerId) return { success: false, error: 'Layer ID is required' }
      if (!options.roofId) return { success: false, error: 'Roof ID is required' }
      if (!options.position) return { success: false, error: 'Position is required' }

      const { x, y } = options.position
      if (Number.isNaN(x) || Number.isNaN(y)) return { success: false, error: 'Position must be numeric' }
      if (x < 0 || x > 1 || y < 0 || y > 1) return { success: false, error: 'Position must be normalized (0..1)' }

      const id = genId()

      // Base DB record (align with your schema)
      const basePin: Pin = {
        id,
        roof_id: options.roofId,
        seq_number: 1,           // recommended: set server-side
        zone: null,
        x,
        y,
        status: 'Open',
        status_parent_manual: 'Open',
        group_count: 1,
        children_total: 0,
        children_open: 0,
        children_ready: 0,
        children_closed: 0,
        parent_mix_state: null,
        opened_by: null,         // set by app/server
        opened_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      }

      // Merge layerSpecificData + title/description/severity fallback
      const layerSpecificData = {
        ...(options.layerSpecificData ?? {}),
        ...(options.title ? { title: options.title } : {}),
        ...(options.description ? { description: options.description } : {}),
        ...(options.severity ? { severity: options.severity } : {}),
      }

      const enhancedPin: EnhancedPin = {
        ...basePin,
        layerId: options.layerId,
        layerKind: options.layerKind,
        tags: options.tags ?? [],
        assignee: options.assignee,
        dueDate: options.dueDate,
        priority: 'medium',
        renderingProps: createDefaultRenderingProps(options.layerKind),
        // attach layerSpecificData in a consistent key
        ...(Object.keys(layerSpecificData).length ? { layerSpecificData } : {}),
      } as EnhancedPin

      if (!options.title) warnings.push('Title is recommended')
      if (!options.description) warnings.push('Description is recommended')

      return { success: true, pin: enhancedPin, warnings: warnings.length ? warnings : undefined }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error creating pin' }
    }
  }

  // Layer-specific factory methods with roofId preservation
  static createSafetyPin(roofId: string, position: NormalizedCoordinates, options: SafetyPinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      layerId: 'safety',
      layerKind: 'ISSUE_PIN', // Use standard LayerKind
      roofId,
      position,
      ...options,
      layerSpecificData: {
        type: 'safety',
        equipment: '',
        ...options.layerSpecificData,
      },
    })
  }

  static createQualityPin(roofId: string, position: NormalizedCoordinates, options: QualityPinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      layerId: 'quality',
      layerKind: 'ISSUE_PIN', // Use standard LayerKind
      roofId,
      position,
      ...options,
      layerSpecificData: {
        defectType: 'visual',
        impact: 'low',
        ...options.layerSpecificData,
      },
    })
  }

  static createProgressPin(roofId: string, position: NormalizedCoordinates, options: ProgressPinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      layerId: 'progress',
      layerKind: 'NOTE_PIN', // Use standard LayerKind
      roofId,
      position,
      ...options,
      layerSpecificData: {
        stageType: 'inspection',
        completion: 0,
        ...options.layerSpecificData,
      },
    })
  }

  static createMaintenancePin(roofId: string, position: NormalizedCoordinates, options: MaintenancePinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      layerId: 'maintenance',
      layerKind: 'ISSUE_PIN', // Use standard LayerKind
      roofId,
      position,
      ...options,
      layerSpecificData: {
        actionType: 'preventive',
        urgency: 'low',
        ...options.layerSpecificData,
      },
    })
  }

  static createInspectionPin(roofId: string, position: NormalizedCoordinates, options: InspectionPinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      layerId: 'inspection',
      layerKind: 'NOTE_PIN', // Use standard LayerKind
      roofId,
      position,
      ...options,
      layerSpecificData: {
        checkType: 'visual',
        result: 'pass',
        ...options.layerSpecificData,
      },
    })
  }

  static createGenericPin(layerId: string, roofId: string, position: NormalizedCoordinates, options: GenericPinOptions = {}): PinFactoryResult {
    return this.createEnhancedPin({
      ...options,
      layerId,
      roofId,
      position,
      layerKind: options.layerKind ?? 'NOTE_PIN', // Use provided or default LayerKind
    })
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
      ...options.issueData,
    }
    return this.createEnhancedPin({
      ...options,
      layerKind: 'ISSUE_PIN',
      severity: options.severity ?? 'Medium',
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
      layerKind: 'RFI_PIN'
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
      layerKind: 'DETAIL_PIN'
    })
  }

  // Create note pin
  static createNotePin(options: PinCreationOptions & { noteData?: Partial<NotePinData> }): PinFactoryResult {
    const noteData: NotePinData = {
      noteType: 'General',
      isPrivate: false,
      reminder: undefined,
      color: '#3b82f6', // default blue color
      fontSize: 14,
      ...options.noteData
    }

    return this.createEnhancedPin({
      ...options,
      layerKind: 'NOTE_PIN'
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
  static duplicatePin(originalPin: EnhancedPin, offset: NormalizedCoordinates = { x: 0.02, y: 0.02 }): PinFactoryResult {
    try {
      const pin: EnhancedPin = {
        ...originalPin,
        id: genId(),
        x: clamp01(originalPin.x + offset.x),
        y: clamp01(originalPin.y + offset.y),
        opened_at: new Date().toISOString(),
        renderingProps: { ...originalPin.renderingProps, isSelected: false, isHovered: false, isDragging: false },
      }
      return { success: true, pin }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Error duplicating pin' }
    }
  }

  // Create pin from database pin
  static enhanceExistingPin(dbPin: Pin, layerId: string, layerKind: LayerKind): PinFactoryResult {
    try {
      const pin: EnhancedPin = {
        id: dbPin.id,
        roof_id: dbPin.roof_id,
        seq_number: dbPin.seq_number,
        zone: dbPin.zone,
        x: dbPin.x, y: dbPin.y,
        status: dbPin.status,
        status_parent_manual: dbPin.status_parent_manual,
        group_count: dbPin.group_count,
        children_total: dbPin.children_total,
        children_open: dbPin.children_open,
        children_ready: dbPin.children_ready,
        children_closed: dbPin.children_closed,
        parent_mix_state: dbPin.parent_mix_state,
        opened_by: dbPin.opened_by,
        opened_at: dbPin.opened_at,
        last_activity_at: dbPin.last_activity_at,
        layerId,
        layerKind,
        tags: [],
        priority: 'medium',
        renderingProps: createDefaultRenderingProps(layerKind),
      }
      return { success: true, pin }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Error enhancing existing pin' }
    }
  }
}

// Pin creator utility functions - normalized coordinate focused
export const PinCreator = {
  // Robust validation helpers with normalized coordinates
  validatePinData: (options: PinCreationOptions): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!options.layerId) errors.push('Layer ID is required')
    if (!options.roofId) errors.push('Roof ID is required')
    if (!options.position) errors.push('Position is required')
    if (!options.layerKind) errors.push('Layer kind is required')

    if (options.position) {
      const { x, y } = options.position
      if (Number.isNaN(x) || Number.isNaN(y)) {
        errors.push('Position coordinates must be numeric')
      }
      if (x < 0 || x > 1) {
        errors.push('X position must be normalized (0..1)')
      }
      if (y < 0 || y > 1) {
        errors.push('Y position must be normalized (0..1)')
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

  // Coordinate utilities for normalized coordinates
  normalizePosition: (x: number, y: number): NormalizedCoordinates => ({
    x: clamp01(x),
    y: clamp01(y),
  }),

  // Layer-specific defaults with proper data structure
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
          color: '#3b82f6',
          fontSize: 14
        } as NotePinData

      default:
        return {}
    }
  },

  // Utility to create pin with coordinated position validation
  createWithValidatedPosition: (options: PinCreationOptions): PinFactoryResult => {
    const validation = PinCreator.validatePinData(options)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join('; ') }
    }

    const normalizedPosition = PinCreator.normalizePosition(
      options.position.x,
      options.position.y
    )

    return PinFactory.createEnhancedPin({
      ...options,
      position: normalizedPosition,
    })
  },

  // Batch creation helper
  createMultiple: (pins: PinCreationOptions[]): Array<PinFactoryResult> => {
    return pins.map(pinOptions => PinCreator.createWithValidatedPosition(pinOptions))
  },
}

export default PinFactory
