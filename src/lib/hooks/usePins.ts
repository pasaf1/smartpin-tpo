import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Database, Severity } from '../database.types'
import type { PinStatus } from '../database.types'

type Pin = Database['public']['Tables']['pins']['Row']
type PinInsert = Database['public']['Tables']['pins']['Insert']
type PinUpdate = Database['public']['Tables']['pins']['Update']

export interface PinWithRelations extends Pin {
  // Optional UI-only fields previously used in demo/legacy
  title?: string | null
  description?: string | null
  severity?: Severity | null
  pin_children?: any[]
  photos?: any[]
}

const QUERY_KEYS = {
  pins: ['pins'] as const,
  pin: (id: string) => ['pins', id] as const,
  roofPins: (roofId: string) => ['pins', 'roof', roofId] as const,
  pinChildren: (parentId: string) => ['pins', parentId, 'children'] as const,
  pinItems: (pinId: string) => ['pins', pinId, 'items'] as const,
}

export function usePins(roofId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.roofPins(roofId),
    queryFn: async (): Promise<PinWithRelations[]> => {
      // Removed demo mode check

      const { data, error } = await supabase
        .from('pins')
        .select(`*`)
        .eq('roof_id', roofId)
        .order('seq_number')

      if (error) throw error
      // Map production coordinates (x,y) to UI fields if components expect x_position/y_position
      return (data || []).map(p => ({
        ...p,
        // legacy optional fields left undefined
      })) as PinWithRelations[]
    },
    enabled: !!roofId,
  })
}

export function usePin(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pin(id),
    queryFn: async (): Promise<PinWithRelations> => {
      const { data, error } = await supabase
        .from('pins')
        .select(`*`)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as PinWithRelations
    },
    enabled: !!id,
  })
}

export function useParentPins(roofId: string) {
  return useQuery({
    queryKey: ['pins', 'parents', roofId],
    queryFn: async (): Promise<PinWithRelations[]> => {
      const { data, error } = await supabase
        .from('pins')
        .select(`*`)
        .eq('roof_id', roofId)
        .order('seq_number')

      if (error) throw error
      return data as PinWithRelations[]
    },
    enabled: !!roofId,
  })
}

export function usePinChildren(parentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pinChildren(parentId),
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('pin_children')
        .select('*')
        .eq('pin_id', parentId)
        .order('child_code')

      if (error) throw error
      return data || []
    },
    enabled: !!parentId,
  })
}

type CreatePinInput = Omit<PinInsert, 'seq_number'>

export function useCreatePin() {
  const queryClient = useQueryClient()

  return useMutation({
  mutationFn: async (pin: CreatePinInput): Promise<Pin> => {
      // Removed demo mode creation logic

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
          ...(pin as any),
          seq_number: nextSeqNumber,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(data.roof_id) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', data.roof_id] })
      // No parent relation invalidation needed in production schema
    },
  })
}

export function useUpdatePin() {
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin(data.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(data.roof_id) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', data.roof_id] })
      // No parent relation invalidation needed in production schema
    },
  })
}

export function useUpdatePinStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PinStatus }): Promise<Pin> => {
  const updates: PinUpdate = { status }

      const { data, error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin(data.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(data.roof_id) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', data.roof_id] })
    },
  })
}

export function useDeletePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ roofId: string }> => {
      // Get pin info before deletion
      const { data: pin } = await supabase
        .from('pins')
  .select('roof_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { roofId: pin?.roof_id || '' }
    },
    onSuccess: ({ roofId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', roofId] })
    },
  })
}

// Real-time subscription hook
export function usePinSubscription(roofId: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['pins', 'subscription', roofId],
    queryFn: () => null,
    enabled: false,
    // Set up real-time subscription
    meta: {
      subscription: () => {
        const subscription = supabase
          .channel(`pins-${roofId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pins',
              filter: `roof_id=eq.${roofId}`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(roofId) })
              queryClient.invalidateQueries({ queryKey: ['pins', 'parents', roofId] })
            }
          )
          .subscribe()

        return () => subscription.unsubscribe()
      },
    },
  })
}