'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from './usePins'

// Define Pin types locally (must match database schema)
type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed'

// Database schema for insert - matches database.types exactly
interface PinInsert {
  roof_id: string
  layer_id: string          // Required
  seq_number: number        // Required
  x: number                 // Required
  y: number                 // Required
  children_closed?: number | null
  children_open?: number | null
  children_ready?: number | null
  children_total?: number | null
  group_count?: number | null
  id?: string
  last_activity_at?: string | null
  opened_at?: string | null
  opened_by?: string | null
  parent_mix_state?: string | null
  status?: PinStatus | null
  status_parent_manual?: PinStatus | null
  zone?: string | null
}

// Database schema for update - matches database.types exactly
interface PinUpdate {
  children_closed?: number | null
  children_open?: number | null
  children_ready?: number | null
  children_total?: number | null
  group_count?: number | null
  id?: string
  last_activity_at?: string | null
  opened_at?: string | null
  opened_by?: string | null
  parent_mix_state?: string | null
  roof_id?: string
  seq_number?: number          // Optional but NOT null
  status?: PinStatus | null
  status_parent_manual?: PinStatus | null
  x?: number                   // Optional but NOT null
  y?: number                   // Optional but NOT null
  zone?: string | null
}

// For reading from database - matches Row type from database.types
interface Pin {
  id: string
  roof_id: string
  layer_id: string
  seq_number: number
  x: number
  y: number
  children_closed: number | null
  children_open: number | null
  children_ready: number | null
  children_total: number | null
  group_count: number | null
  last_activity_at: string | null
  opened_at: string | null
  opened_by: string | null
  parent_mix_state: string | null
  status: PinStatus | null
  status_parent_manual: PinStatus | null
  zone: string | null
}

// 2025 Enhancement: Optimistic Updates for Pin Mutations

export function useCreatePinOptimistic(roofId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pinData: PinInsert): Promise<Pin> => {
      const { data, error } = await supabase
        .from('pins')
        .insert(pinData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // 2025 Enhancement: Optimistic updates
    onMutate: async (newPin) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })

      // Snapshot the previous value
      const previousPins = queryClient.getQueryData<Pin[]>(QUERY_KEYS.roofPins(roofId))

      // Optimistically update to the new value
      if (previousPins) {
        const optimisticPin: Pin = {
          id: `temp-${Date.now()}`, // Temporary ID
          roof_id: roofId,
          layer_id: newPin.layer_id,  // Required field
          seq_number: newPin.seq_number,  // Required field
          zone: newPin.zone ?? 'A',
          x: newPin.x,  // Required field
          y: newPin.y,  // Required field
          status: newPin.status ?? 'Open',
          status_parent_manual: newPin.status_parent_manual ?? 'Open',
          group_count: newPin.group_count ?? 0,
          children_total: newPin.children_total ?? 0,
          children_open: newPin.children_open ?? 0,
          children_ready: newPin.children_ready ?? 0,
          children_closed: newPin.children_closed ?? 0,
          parent_mix_state: newPin.parent_mix_state ?? null,
          opened_by: newPin.opened_by ?? null,
          opened_at: newPin.opened_at ?? new Date().toISOString(),
          last_activity_at: newPin.last_activity_at ?? new Date().toISOString(),
        }

        queryClient.setQueryData<Pin[]>(
          QUERY_KEYS.roofPins(roofId),
          (old) => [...(old || []), optimisticPin]
        )
      }

      // Return a context object with the snapshotted value
      return { previousPins }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newPin, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), context.previousPins)
      }
      console.error('🚨 Optimistic pin creation failed:', err)
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
    },
    onSuccess: (data, variables) => {
      console.log('✅ Pin created successfully with optimistic updates:', data.id)
      // Trigger real-time notification
      queryClient.invalidateQueries({ queryKey: ['pin-status-summary', roofId] })
    }
  })
}

export function useUpdatePinOptimistic(roofId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PinUpdate }): Promise<Pin> => {
      const { data, error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // 2025 Enhancement: Optimistic updates for pin updates
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })

      const previousPins = queryClient.getQueryData<Pin[]>(QUERY_KEYS.roofPins(roofId))

      if (previousPins) {
        const optimisticPins = previousPins.map(pin => 
          pin.id === id 
            ? { 
                ...pin, 
                ...updates,
                last_activity_at: new Date().toISOString()
              } 
            : pin
        )

        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), optimisticPins)
      }

      return { previousPins }
    },
    onError: (err, variables, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), context.previousPins)
      }
      console.error('🚨 Optimistic pin update failed:', err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
    },
    onSuccess: (data, variables) => {
      console.log('✅ Pin updated successfully with optimistic updates:', data.id)
      queryClient.invalidateQueries({ queryKey: ['pin-status-summary', roofId] })
    }
  })
}

export function useDeletePinOptimistic(roofId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pinId: string): Promise<void> => {
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', pinId)

      if (error) throw error
    },
    // 2025 Enhancement: Optimistic deletion
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })

      const previousPins = queryClient.getQueryData<Pin[]>(QUERY_KEYS.roofPins(roofId))

      if (previousPins) {
        const optimisticPins = previousPins.filter(pin => pin.id !== pinId)
        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), optimisticPins)
      }

      return { previousPins }
    },
    onError: (err, pinId, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), context.previousPins)
      }
      console.error('🚨 Optimistic pin deletion failed:', err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
    },
    onSuccess: (data, pinId) => {
      console.log('✅ Pin deleted successfully with optimistic updates:', pinId)
      queryClient.invalidateQueries({ queryKey: ['pin-status-summary', roofId] })
    }
  })
}

// 2025 Enhancement: Batch operations with optimistic updates
export function useBatchPinUpdate(roofId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; updates: PinUpdate }>): Promise<Pin[]> => {
      const promises = updates.map(({ id, updates: updateData }) =>
        supabase
          .from('pins')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
      )

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error).map(r => r.error)
      
      if (errors.length > 0) {
        throw new Error(`Batch update failed: ${errors.map(e => e!.message).join(', ')}`)
      }

      return results.map(r => r.data).filter(Boolean) as Pin[]
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })

      const previousPins = queryClient.getQueryData<Pin[]>(QUERY_KEYS.roofPins(roofId))

      if (previousPins) {
        const optimisticPins = previousPins.map(pin => {
          const update = updates.find(u => u.id === pin.id)
          return update 
            ? { 
                ...pin, 
                ...update.updates,
                last_activity_at: new Date().toISOString()
              }
            : pin
        })

        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), optimisticPins)
      }

      return { previousPins }
    },
    onError: (err, updates, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(QUERY_KEYS.roofPins(roofId), context.previousPins)
      }
      console.error('🚨 Batch pin update failed:', err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
    },
    onSuccess: (data, updates) => {
      console.log(`✅ Batch updated ${data.length} pins successfully with optimistic updates`)
      queryClient.invalidateQueries({ queryKey: ['pin-status-summary', roofId] })
    }
  })
}