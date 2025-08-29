// Simplified Pin Service with proper error handling
import type { Database, Pin, PinInsert, PinUpdate, PinChild, PinChildInsert, PinChildUpdate } from '../database.types'
import type { PinWithRelations, CreatePinForm, CreatePinChildForm, PinStatistics } from '../types/relations'
import { BaseService } from './BaseService'

export class PinService extends BaseService {

  /**
   * Handle Supabase errors with user-friendly messages
   */
  protected handleError(error: any, operation: string): never {
    console.error(`[PinService] ${operation} failed:`, error)

    // RLS Permission Errors
    if (['PGRST116', 'PGRST301', 'PGRST204'].includes(error.code)) {
      const messages = {
        PGRST116: 'אין הרשאה לצפות ברשומה זו',
        PGRST301: 'אין הרשאה לעדכן רשומה זו', 
        PGRST204: 'הרשומה לא נמצאה או שאין הרשאה לגשת אליה'
      }
      throw new Error(messages[error.code as keyof typeof messages] || 'שגיאת הרשאה')
    }

    // Validation Errors
    if (error.code === '23505') {
      throw new Error('הערך כבר קיים במערכת')
    }
    if (error.code === '23503') {
      throw new Error('לא ניתן למחוק רשומה המקושרת לרשומות אחרות')
    }
    if (error.code === '23502') {
      throw new Error('שדה חובה חסר')
    }

    // Generic error
    throw new Error(error.message || 'שגיאה לא ידועה')
  }

  /**
   * Get all pins for a roof with full relations
   */
  async getPinsForRoof(roofId: string): Promise<PinWithRelations[]> {
    if (!roofId) throw new Error('roofId הוא שדה חובה')

    const { data, error } = await this.supabase
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
      .order('seq_number', { ascending: true })

    if (error) this.handleError(error, 'getPinsForRoof')
    return (data as PinWithRelations[]) || []
  }

  /**
   * Get single pin with relations
   */
  async getPinById(pinId: string): Promise<PinWithRelations | null> {
    if (!pinId) throw new Error('pinId הוא שדה חובה')

    const { data, error } = await this.supabase
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
      .single()

    if (error && error.code !== 'PGRST116') {
      this.handleError(error, 'getPinById')
    }
    return data as PinWithRelations || null
  }

  /**
   * Create new pin atomically
   */
  async createPin(formData: CreatePinForm): Promise<Pin> {
    if (!formData.roof_id || !formData.x || !formData.y) {
      throw new Error('roof_id, x, y הם שדות חובה')
    }

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

    if (error) this.handleError(error, 'createPin')
    return data as Pin
  }

  /**
   * Update pin
   */
  async updatePin(pinId: string, updates: PinUpdate): Promise<Pin> {
    if (!pinId) throw new Error('pinId הוא שדה חובה')

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

    if (error) this.handleError(error, 'updatePin')
    return data as Pin
  }

  /**
   * Delete pin
   */
  async deletePin(pinId: string): Promise<void> {
    if (!pinId) throw new Error('pinId הוא שדה חובה')

    // First delete children
    const { error: childError } = await this.supabase
      .from('pin_children')
      .delete()
      .eq('pin_id', pinId)

    if (childError) this.handleError(childError, 'deletePin - children')

    // Then delete pin
    const { error } = await this.supabase
      .from('pins')
      .delete()
      .eq('id', pinId)

    if (error) this.handleError(error, 'deletePin')
  }

  /**
   * Create child pin
   */
  async createChildPin(formData: CreatePinChildForm): Promise<PinChild> {
    if (!formData.pin_id || !formData.child_code || !formData.severity) {
      throw new Error('pin_id, child_code, severity הם שדות חובה')
    }

    const childData: PinChildInsert = {
      pin_id: formData.pin_id,
      child_code: formData.child_code,
      zone: formData.zone || null,
      defect_type: formData.defect_type || null,
      severity: formData.severity,
      status_child: 'Open',
      open_date: new Date().toISOString(),
      notes: formData.notes || null
    }

    const { data, error } = await this.supabase
      .from('pin_children')
      .insert(childData)
      .select()
      .single()

    if (error) this.handleError(error, 'createChildPin')

    // Recompute parent aggregates
    await this.recomputeParentAggregates(formData.pin_id)

    return data as PinChild
  }

  /**
   * Update child pin
   */
  async updateChildPin(childId: string, updates: PinChildUpdate): Promise<PinChild> {
    if (!childId) throw new Error('childId הוא שדה חובה')

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

    if (error) this.handleError(error, 'updateChildPin')

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

    return data as PinChild
  }

  /**
   * Get pin statistics for roof
   */
  async getRoofPinStatistics(roofId: string): Promise<PinStatistics> {
    if (!roofId) throw new Error('roofId הוא שדה חובה')

    const { data: pins, error } = await this.supabase
      .from('pins')
      .select('status')
      .eq('roof_id', roofId)

    if (error) this.handleError(error, 'getRoofPinStatistics')

    const stats = (pins || []).reduce(
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
   * Close pin with validation
   */
  async closePin(pinId: string): Promise<Pin> {
    if (!pinId) throw new Error('pinId הוא שדה חובה')

    // Basic validation - check if all children are closed
    const { data: children } = await this.supabase
      .from('pin_children')
      .select('status_child')
      .eq('pin_id', pinId)

    if (children && children.some(child => child.status_child !== 'Closed')) {
      throw new Error('לא ניתן לסגור פין עם תת-פינים פתוחים')
    }

    return this.updatePin(pinId, {
      status: 'Closed',
      status_parent_manual: 'Closed'
    })
  }

  /**
   * Get single pin by ID with relations
   */
  async getPinById(pinId: string): Promise<PinWithRelations> {
    if (!pinId?.trim()) {
      throw new SupabaseServiceError('מזהה הנקודה חסר', 'VALIDATION_ERROR')
    }

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
   * Delete pin and all related data
   */
  async deletePin(pinId: string): Promise<void> {
    if (!pinId?.trim()) {
      throw new SupabaseServiceError('מזהה הנקודה חסר', 'VALIDATION_ERROR')
    }

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
   * Update child pin
   */
  async updateChildPin(childId: string, updates: PinChildUpdate): Promise<PinChild> {
    if (!childId?.trim()) {
      throw new SupabaseServiceError('מזהה תת-הנקודה חסר', 'VALIDATION_ERROR')
    }

    try {
      const { data, error } = await this.supabase
        .from('pin_children')
        .update(updates)
        .eq('id', childId)
        .select()
        .single()

      if (error) {
        throw this.handleSupabaseError(error)
      }

      return data
    } catch (error) {
      throw this.handleError(error, 'updateChildPin')
    }
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

  /**
   * Subscribe to real-time changes
   */
  subscribeToRoofPins(
    roofId: string,
    callback: (pins: PinWithRelations[]) => void
  ) {
    if (!roofId) throw new Error('roofId הוא שדה חובה')
    
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
            console.error('Error refetching pins:', error)
          }
        }
      )
      .subscribe()
  }
}

// Create singleton instance
export const pinService = new PinService()
