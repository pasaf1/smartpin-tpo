// Pin Service - Comprehensive pin management with atomic operations
import { BaseService, SupabaseServiceError, ValidationError } from './BaseService'
import type { 
  Pin, 
  PinInsert, 
  PinUpdate, 
  PinChild,
  PinChildInsert,
  PinChildUpdate
} from '../database.types'
import type { 
  PinWithRelations,
  PinChildWithPhotos,
  CreatePinForm,
  CreatePinChildForm,
  PinStatistics
} from '../types/relations'

export class PinService extends BaseService {
  
  /**
   * Get all pins for a roof with full relations
   */
  async getPinsForRoof(roofId: string): Promise<PinWithRelations[]> {
    this.validateUUID(roofId, 'roofId')
    this.logOperation('getPinsForRoof', { roofId })

    return this.safeArrayOperation(
      async () => await this.supabase
        .from('pins')
        .select(`
          *,
          pin_children (
            *,
            opening_photo:photos!pin_children_openpic_id_fkey (*),
            closure_photo:photos!pin_children_closurepic_id_fkey (*)
          ),
          photos (*),
          roof:roofs (*),
          opened_by_user:users!pins_opened_by_fkey (*)
        `)
        .eq('roof_id', roofId)
        .order('seq_number', { ascending: true }),
      'getPinsForRoof',
      'pins'
    )
  }

  /**
   * Get single pin with relations
   */
  async getPinById(pinId: string): Promise<PinWithRelations> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('getPinById', { pinId })

    return this.safeOperation(
      async () => await this.supabase
        .from('pins')
        .select(`
          *,
          pin_children (
            *,
            opening_photo:photos!pin_children_openpic_id_fkey (*),
            closure_photo:photos!pin_children_closurepic_id_fkey (*)
          ),
          photos (*),
          roof:roofs (*),
          opened_by_user:users!pins_opened_by_fkey (*)
        `)
        .eq('id', pinId)
        .single(),
      'getPinById',
      'pins'
    )
  }

  /**
   * Create new pin atomically
   */
  async createPin(data: CreatePinForm): Promise<Pin> {
    this.validateRequired(data, ['roof_id', 'x', 'y'])
    this.validateUUID(data.roof_id, 'roof_id')
    this.logOperation('createPin', data)

    // Get next sequence number for the roof
    const { data: maxSeq } = await this.supabase
      .from('pins')
      .select('seq_number')
      .eq('roof_id', data.roof_id)
      .order('seq_number', { ascending: false })
      .limit(1)
      .single()

    const nextSeqNumber = (maxSeq?.seq_number || 0) + 1

    const pinData: PinInsert = {
      roof_id: data.roof_id,
      seq_number: nextSeqNumber,
      zone: data.zone || null,
      x: data.x,
      y: data.y,
      status: 'Open',
      status_parent_manual: 'Open',
      group_count: 0,
      children_total: 0,
      children_open: 0,
      children_ready: 0,
      children_closed: 0,
      parent_mix_state: null,
      opened_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    }

    return this.safeOperation(
      async () => await this.supabase
        .from('pins')
        .insert(pinData)
        .select()
        .single(),
      'createPin',
      'pins'
    )
  }

  /**
   * Update pin with validation
   */
  async updatePin(pinId: string, updates: PinUpdate): Promise<Pin> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('updatePin', { pinId, updates })

    // Add timestamp
    const updateData = {
      ...updates,
      last_activity_at: new Date().toISOString()
    }

    return this.safeOperation(
      async () => await this.supabase
        .from('pins')
        .update(updateData)
        .eq('id', pinId)
        .select()
        .single(),
      'updatePin',
      'pins'
    )
  }

  /**
   * Delete pin and all children atomically
   */
  async deletePin(pinId: string): Promise<void> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('deletePin', { pinId })

    // First delete all children
    await this.safeOperation(
      async () => await this.supabase
        .from('pin_children')
        .delete()
        .eq('pin_id', pinId),
      'deletePin_children',
      'pin_children'
    )

    // Then delete the pin
    await this.safeOperation(
      async () => await this.supabase
        .from('pins')
        .delete()
        .eq('id', pinId),
      'deletePin',
      'pins'
    )
  }

  /**
   * Create child pin with validation
   */
  async createChildPin(data: CreatePinChildForm): Promise<PinChild | null> {
    this.validateRequired(data, ['pin_id', 'child_code', 'severity'])
    this.validateUUID(data.pin_id, 'pin_id')
    this.logOperation('createChildPin', data)

    const childData: PinChildInsert = {
      pin_id: data.pin_id,
      child_code: data.child_code,
      zone: data.zone || null,
      defect_type: data.defect_type || null,
      severity: data.severity,
      status_child: 'Open',
      open_date: new Date().toISOString(),
      notes: data.notes || null
    }

    const result = await this.safeOperation(
      async () => await this.supabase
        .from('pin_children')
        .insert(childData)
        .select()
        .single(),
      'createChildPin',
      'pin_children'
    )

    // Recompute parent aggregates
    await this.recomputeParentAggregates(data.pin_id)

    return result
  }

  /**
   * Update child pin
   */
  async updateChildPin(childId: string, updates: PinChildUpdate): Promise<PinChild | null> {
    this.validateUUID(childId, 'childId')
    this.logOperation('updateChildPin', { childId, updates })

    // Add timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const result = await this.safeOperation(
      async () => await this.supabase
        .from('pin_children')
        .update(updateData)
        .eq('child_id', childId)
        .select()
        .single(),
      'updateChildPin',
      'pin_children'
    )

    // If status changed, recompute parent aggregates
    if (updates.status_child) {
      const { data: child } = await this.supabase
        .from('pin_children')
        .select('pin_id')
        .eq('child_id', childId)
        .single()
      
      if (child) {
        await this.recomputeParentAggregates(child.pin_id)
      }
    }

    return result
  }

  /**
   * Delete child pin
   */
  async deleteChildPin(childId: string): Promise<void> {
    this.validateUUID(childId, 'childId')
    this.logOperation('deleteChildPin', { childId })

    // Get parent pin ID first
    const { data: child } = await this.supabase
      .from('pin_children')
      .select('pin_id')
      .eq('child_id', childId)
      .single()

    if (!child) {
      throw new ValidationError('Child pin not found', 'childId', childId)
    }

    await this.safeOperation(
      async () => await this.supabase
        .from('pin_children')
        .delete()
        .eq('child_id', childId),
      'deleteChildPin',
      'pin_children'
    )

    // Recompute parent aggregates
    await this.recomputeParentAggregates(child.pin_id)
  }

  /**
   * Get pin statistics for roof
   */
  async getRoofPinStatistics(roofId: string): Promise<PinStatistics> {
    this.validateUUID(roofId, 'roofId')
    this.logOperation('getRoofPinStatistics', { roofId })

    const pins = await this.safeArrayOperation(
      async () => await this.supabase
        .from('pins')
        .select('status')
        .eq('roof_id', roofId),
      'getRoofPinStatistics',
      'pins'
    )

    const stats = pins.reduce(
      (acc, pin) => {
        acc.total++
        switch (pin.status) {
          case 'Open':
            acc.open++
            break
          case 'ReadyForInspection':
            acc.ready++
            break
          case 'Closed':
            acc.closed++
            break
        }
        return acc
      },
      { total: 0, open: 0, ready: 0, closed: 0, completion_percentage: 0 }
    )

    stats.completion_percentage = stats.total > 0 
      ? Math.round((stats.closed / stats.total) * 100) 
      : 0

    return stats
  }

  /**
   * Validate pin closure requirements
   */
  async validatePinClosure(pinId: string): Promise<{ canClose: boolean; reason?: string }> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('validatePinClosure', { pinId })

    const { data, error } = await this.supabase.rpc('validate_pin_closure', {
      pin_uuid: pinId
    })

    if (error) {
      this.handleError(error, 'validatePinClosure')
    }

    return data as { canClose: boolean; reason?: string }
  }

  /**
   * Close pin atomically with validation
   */
  async closePin(pinId: string): Promise<Pin> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('closePin', { pinId })

    // Validate closure requirements
    const validation = await this.validatePinClosure(pinId)
    if (!validation.canClose) {
      throw new ValidationError(
        validation.reason || 'Cannot close pin',
        'pin_closure',
        pinId
      )
    }

    return this.updatePin(pinId, {
      status: 'Closed',
      status_parent_manual: 'Closed'
    })
  }

  /**
   * Recompute parent pin aggregates
   */
  private async recomputeParentAggregates(pinId: string): Promise<void> {
    const { error } = await this.supabase.rpc('recompute_parent_aggregates', {
      p_pin: pinId
    })

    if (error) {
      console.warn('Failed to recompute parent aggregates:', error)
      // Don't throw - this is a background operation
    }
  }

  /**
   * Get pins with real-time subscription
   */
  subscribeToRoofPins(
    roofId: string,
    callback: (pins: PinWithRelations[]) => void
  ) {
    this.validateUUID(roofId, 'roofId')
    
    return this.supabase
      .channel(`roof-pins-${roofId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pins',
          filter: `roof_id=eq.${roofId}`
        },
        async () => {
          // Refetch pins on any change
          try {
            const pins = await this.getPinsForRoof(roofId)
            callback(pins)
          } catch (error) {
            console.error('Error refetching pins:', error)
          }
        }
      )
      .subscribe()
  }
}
