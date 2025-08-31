'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePinActivityLogger } from '@/lib/activity/ActivityContext'
import { supabase } from '@/lib/supabase'
import type { Pin, PinInsert, PinUpdate, PinStatus } from '@/lib/database.types'
import { QUERY_KEYS } from './usePins'

type CreatePinInput = Omit<PinInsert, 'seq_number'>

// Enhanced pin creation hook with activity logging
export function useCreatePinWithActivity() {
  const queryClient = useQueryClient()
  const { logPinCreated } = usePinActivityLogger()

  return useMutation({
    mutationFn: async (pin: CreatePinInput): Promise<Pin> => {
      // Get next sequence number for the roof
      const { data: lastPin } = await supabase
        .from('pins')
        .select('seq_number')
        .eq('roof_id', pin.roof_id)
        .order('seq_number', { ascending: false })
        .limit(1)
        .single()

      const nextSeqNumber = (lastPin?.seq_number || 0) + 1

      const { data, error } = await supabase
        .from('pins')
        .insert({
          ...pin,
          seq_number: nextSeqNumber,
        })
        .select()
        .single()

      if (error) throw error

      // Log pin creation activity
      await logPinCreated({
        id: data.id,
        seq_number: data.seq_number,
        roof_id: data.roof_id,
        x_position: data.x || 0,
        y_position: data.y || 0,
        issue_type: (data as any).issue_type,
        defect_type: (data as any).defect_type,
        defect_layer: (data as any).defect_layer,
        severity: (data as any).severity
      })

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(data.roof_id) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', data.roof_id] })
    },
  })
}

// Enhanced pin update hook with activity logging
export function useUpdatePinWithActivity() {
  const queryClient = useQueryClient()
  const { logStatusChanged } = usePinActivityLogger()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      reason 
    }: { 
      id: string
      updates: PinUpdate
      reason?: string 
    }): Promise<{ oldPin: Pin; newPin: Pin }> => {
      // Get current pin data first
      const { data: oldPin, error: fetchError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Update the pin
      const { data: newPin, error: updateError } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Log status change if status was updated
      if (updates.status && oldPin.status !== updates.status) {
        await logStatusChanged(
          {
            id: newPin.id,
            seq_number: newPin.seq_number,
            roof_id: newPin.roof_id
          },
          oldPin.status,
          updates.status,
          reason
        )
      }

      return { oldPin, newPin }
    },
    onSuccess: ({ newPin }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin(newPin.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(newPin.roof_id) })
    },
  })
}

// Enhanced pin status update hook with activity logging
export function useUpdatePinStatusWithActivity() {
  const queryClient = useQueryClient()
  const { logStatusChanged } = usePinActivityLogger()

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      reason 
    }: { 
      id: string
      status: PinStatus
      reason?: string 
    }): Promise<{ oldPin: Pin; newPin: Pin }> => {
      // Get current pin data first
      const { data: oldPin, error: fetchError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Don't update if status is the same
      if (oldPin.status === status) {
        return { oldPin, newPin: oldPin }
      }

      // Update status with timestamp for closed pins
      const updates: PinUpdate = { 
        status,
        ...(status === 'Closed' && { updated_at: new Date().toISOString() })
      }

      const { data: newPin, error: updateError } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Log status change activity
      await logStatusChanged(
        {
          id: newPin.id,
          seq_number: newPin.seq_number,
          roof_id: newPin.roof_id
        },
        oldPin.status,
        status,
        reason
      )

      return { oldPin, newPin }
    },
    onSuccess: ({ newPin }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin(newPin.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(newPin.roof_id) })
    },
  })
}

// Photo upload hook with activity logging
export function useUploadPinPhotoWithActivity() {
  const queryClient = useQueryClient()
  const { logPhotoUploaded } = usePinActivityLogger()

  return useMutation({
    mutationFn: async ({
      pinId,
      file,
      type,
      path
    }: {
      pinId: string
      file: File
      type: 'opening' | 'closing'
      path: string
    }): Promise<{ pin: Pin; photoUrl: string }> => {
      // Get pin data
      const { data: pin, error: pinError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', pinId)
        .single()

      if (pinError) throw pinError

      // Upload photo to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pin-photos')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('pin-photos')
        .getPublicUrl(uploadData.path)

      const photoUrl = publicUrl.publicUrl

      // Update pin with photo URL
      const photoField = type === 'opening' ? 'opening_photo_url' : 'closing_photo_url'
      const { data: updatedPin, error: updateError } = await supabase
        .from('pins')
        .update({ [photoField]: photoUrl })
        .eq('id', pinId)
        .select()
        .single()

      if (updateError) throw updateError

      // Log photo upload activity
      await logPhotoUploaded(
        {
          id: pin.id,
          seq_number: pin.seq_number,
          roof_id: pin.roof_id
        },
        {
          type,
          url: photoUrl,
          file_name: file.name,
          file_size: file.size
        }
      )

      return { pin: updatedPin, photoUrl }
    },
    onSuccess: ({ pin }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin(pin.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(pin.roof_id) })
    },
  })
}

// Child pin creation hook with activity logging
export function useCreateChildPinWithActivity() {
  const queryClient = useQueryClient()
  const { logChildPinCreated } = usePinActivityLogger()

  return useMutation({
    mutationFn: async ({
      parentPinId,
      childData
    }: {
      parentPinId: string
      childData: {
        child_code?: string
        status?: string
        defect_type?: string
        opening_photo_url?: string
        closing_photo_url?: string
      }
    }): Promise<{ parentPin: Pin; childPin: any }> => {
      // Get parent pin data
      const { data: parentPin, error: parentError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', parentPinId)
        .single()

      if (parentError) throw parentError

      // Create child pin
      const { data: childPin, error: childError } = await supabase
        .from('pin_children')
        .insert({
          pin_id: parentPinId,
          child_code: 'AUTO',
          ...childData
        })
        .select()
        .single()

      if (childError) throw childError

      // Log child pin creation activity
      await logChildPinCreated(
        {
          id: parentPin.id,
          seq_number: parentPin.seq_number,
          roof_id: parentPin.roof_id
        },
        {
          id: childPin.child_id,
          child_seq: childData.child_code || `${parentPin.seq_number}.${childPin.child_id.slice(-2)}`,
          defect_type: childData.defect_type
        }
      )

      return { parentPin, childPin }
    },
    onSuccess: ({ parentPin }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinChildren(parentPin.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(parentPin.roof_id) })
    },
  })
}

// Comment/chat hook with activity logging
export function useAddPinCommentWithActivity() {
  const { logCommentAdded } = usePinActivityLogger()

  return useMutation({
    mutationFn: async ({
      pinId,
      comment,
      mentions = []
    }: {
      pinId: string
      comment: string
      mentions?: string[]
    }): Promise<{ pin: Pin }> => {
      // Get pin data
      const { data: pin, error: pinError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', pinId)
        .single()

      if (pinError) throw pinError

      // Here you would typically save the comment to a comments table
      // For now, we'll just log the activity

      // Log comment activity
      await logCommentAdded(
        {
          id: pin.id,
          seq_number: pin.seq_number,
          roof_id: pin.roof_id
        },
        {
          text: comment,
          mentions
        }
      )

      return { pin }
    }
  })
}