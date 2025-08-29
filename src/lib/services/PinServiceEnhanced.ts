// Enhanced Pin Service with proper error handling and inheritance
import type { Pin, PinInsert, PinUpdate, PinChild, PinChildInsert, PinChildUpdate } from '../database.types'
import type { PinWithRelations, CreatePinForm, CreatePinChildForm, PinStatistics } from '../types/relations'
import { BaseService, SupabaseServiceError } from './BaseServiceNew'

export class PinService extends BaseService {
  /**
   * Get all pins for a roof with relations
   */
  async getPinsForRoof(roofId: string): Promise<PinWithRelations[]> {
    this.validateRequired({ roofId }, ['roofId'])

    try {
      const { data, error } = await this.supabase
        .from('pins')
        .select(`
          *,
          pin_children(*),
          photos(*)
        `)
        .eq('roof_id', roofId)
        .order('seq_number', { ascending: true })

      if (error) {
        throw this.handleSupabaseError(error)
      }

      return data as PinWithRelations[]
    } catch (error) {
      throw this.handleError(error, 'getPinsForRoof')
    }
  }

  /**
   * Get single pin by ID with relations
   */
  async getPinById(pinId: string): Promise<PinWithRelations> {
    this.validateRequired({ pinId }, ['pinId'])

    try {
      const { data, error } = await this.supabase
        .from('pins')
        .select(`
          *,
          pin_children(*),
          photos(*)
        `)
        .eq('id', pinId)
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      if (!data) {
        throw new SupabaseServiceError('הנקודה לא נמצאה', 'NOT_FOUND')
      }

      return data as PinWithRelations
    } catch (error) {
      throw this.handleError(error, 'getPinById')
    }
  }

  /**
   * Create new pin with auto-generated sequence number
   */
  async createPin(formData: CreatePinForm): Promise<Pin> {
    this.validateRequired(formData, ['roof_id', 'x', 'y'])

    try {
      // Get next sequence number
      const { data: maxSeq } = await this.supabase
        .from('pins')
        .select('seq_number')
        .eq('roof_id', formData.roof_id)
        .order('seq_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextSeqNumber = (maxSeq?.seq_number || 0) + 1

      const pinData: PinInsert = {
        roof_id: formData.roof_id,
        seq_number: nextSeqNumber,
        zone: formData.zone || null,
        x: formData.x,
        y: formData.y,
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

      const { data, error } = await this.supabase
        .from('pins')
        .insert(pinData)
        .select()
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      return data
    } catch (error) {
      throw this.handleError(error, 'createPin')
    }
  }

  /**
   * Update existing pin
   */
  async updatePin(pinId: string, updates: PinUpdate): Promise<Pin> {
    this.validateRequired({ pinId }, ['pinId'])

    try {
      const updateData = {
        ...updates,
        last_activity_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('pins')
        .update(updateData)
        .eq('id', pinId)
        .select()
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      return data
    } catch (error) {
      throw this.handleError(error, 'updatePin')
    }
  }

  /**
   * Delete pin and all related data (atomic operation)
   */
  async deletePin(pinId: string): Promise<void> {
    this.validateRequired({ pinId }, ['pinId'])

    try {
      // First delete all photos
      const { error: photosError } = await this.supabase
        .from('photos')
        .delete()
        .eq('pin_id', pinId)

      if (photosError) {
        throw this.handleSupabaseError(photosError)
      }

      // Then delete all children
      const { error: childrenError } = await this.supabase
        .from('pin_children')
        .delete()
        .eq('pin_id', pinId)

      if (childrenError) {
        throw this.handleSupabaseError(childrenError)
      }

      // Finally delete the pin
      const { error } = await this.supabase
        .from('pins')
        .delete()
        .eq('id', pinId)

      if (error) {
        throw this.handleSupabaseError(error)
      }
    } catch (error) {
      throw this.handleError(error, 'deletePin')
    }
  }

  /**
   * Close pin with validation
   */
  async closePin(pinId: string): Promise<Pin> {
    this.validateRequired({ pinId }, ['pinId'])

    try {
      // Validate that pin can be closed (has photos or all children are closed)
      const { data: children } = await this.supabase
        .from('pin_children')
        .select('status_child')
        .eq('pin_id', pinId)

      if (children && children.some(child => child.status_child !== 'Closed')) {
        throw new SupabaseServiceError('לא ניתן לסגור נקודה עם תת-נקודות פתוחות', 'VALIDATION_ERROR')
      }

      const { data: photos } = await this.supabase
        .from('photos')
        .select('id')
        .eq('pin_id', pinId)
        .limit(1)

      if (!photos || photos.length === 0) {
        throw new SupabaseServiceError('לא ניתן לסגור נקודה ללא תמונות', 'VALIDATION_ERROR')
      }

      return this.updatePin(pinId, {
        status: 'Closed',
        status_parent_manual: 'Closed'
      })
    } catch (error) {
      throw this.handleError(error, 'closePin')
    }
  }

  /**
   * Create child pin
   */
  async createChildPin(formData: CreatePinChildForm): Promise<PinChild> {
    this.validateRequired(formData, ['pin_id', 'child_code', 'severity'])

    try {
      const childData: PinChildInsert = {
        pin_id: formData.pin_id,
        child_code: formData.child_code,
        zone: formData.zone || null,
        defect_type: formData.defect_type || null,
        severity: formData.severity,
        status_child: 'Open',
        open_date: new Date().toISOString(),
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('pin_children')
        .insert(childData)
        .select()
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      // Recompute parent aggregates
      await this.recomputeParentAggregates(formData.pin_id)

      return data
    } catch (error) {
      throw this.handleError(error, 'createChildPin')
    }
  }

  /**
   * Update child pin
   */
  async updateChildPin(childId: string, updates: PinChildUpdate): Promise<PinChild> {
    this.validateRequired({ childId }, ['childId'])

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('pin_children')
        .update(updateData)
        .eq('child_id', childId)
        .select()
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      // Recompute parent aggregates if status changed
      if (updates.status_child) {
        await this.recomputeParentAggregates(data.pin_id)
      }

      return data
    } catch (error) {
      throw this.handleError(error, 'updateChildPin')
    }
  }

  /**
   * Get pin statistics for roof
   */
  async getRoofPinStatistics(roofId: string): Promise<PinStatistics> {
    this.validateRequired({ roofId }, ['roofId'])

    try {
      const { data, error } = await this.supabase
        .from('pins')
        .select('status')
        .eq('roof_id', roofId)

      if (error) {
        throw this.handleSupabaseError(error)
      }

      const stats = data.reduce((acc, pin) => {
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
      }, { total: 0, open: 0, ready: 0, closed: 0 })

      return {
        total: stats.total,
        open: stats.open,
        ready: stats.ready,
        closed: stats.closed,
        completion_percentage: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0
      }
    } catch (error) {
      throw this.handleError(error, 'getRoofPinStatistics')
    }
  }

  /**
   * Subscribe to real-time updates for roof pins
   */
  subscribeToRoofPins(roofId: string, callback: (pins: PinWithRelations[]) => void) {
    this.validateRequired({ roofId }, ['roofId'])
    
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
          try {
            const pins = await this.getPinsForRoof(roofId)
            callback(pins)
          } catch (error) {
            console.error('Error in real-time subscription:', error)
          }
        }
      )
      .subscribe()
  }

  /**
   * Recompute parent pin aggregates
   */
  private async recomputeParentAggregates(pinId: string): Promise<void> {
    try {
      await this.supabase.rpc('recompute_parent_aggregates', {
        p_pin: pinId
      })
    } catch (error) {
      console.warn('Failed to recompute parent aggregates:', error)
      // Don't throw - this is a background operation
    }
  }
}

// Create singleton instance
export const pinService = new PinService()
