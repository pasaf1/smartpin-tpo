import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../supabase'
import { getDemoPins, createDemoPin } from '../demo-data'
import type { Database, PinStatus, Severity } from '../database.types'

type Pin = Database['public']['Tables']['pins']['Row']
type PinInsert = Database['public']['Tables']['pins']['Insert']
type PinUpdate = Database['public']['Tables']['pins']['Update']

export interface PinWithRelations extends Pin {
  children?: Pin[]
  parent?: Pin
  items_count?: number
  images_count?: number
  chat_count?: number
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
      if (isDemoMode) {
        // Return demo data
        return new Promise(resolve => {
          setTimeout(() => resolve(getDemoPins(roofId)), 100)
        })
      }

      const { data, error } = await supabase
        .from('pins')
        .select(`
          *,
          children:pins!parent_pin_id(*),
          parent:pins!inner(*)
        `)
        .eq('roof_id', roofId)
        .order('seq_number')

      if (error) throw error
      return data as PinWithRelations[]
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
        .select(`
          *,
          children:pins!parent_pin_id(*),
          parent:pins!inner(*)
        `)
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
        .select(`
          *,
          children:pins!parent_pin_id(*)
        `)
        .eq('roof_id', roofId)
        .is('parent_pin_id', null)
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
    queryFn: async (): Promise<Pin[]> => {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('parent_pin_id', parentId)
        .order('seq_number')

      if (error) throw error
      return data
    },
    enabled: !!parentId,
  })
}

export function useCreatePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pin: PinInsert): Promise<Pin> => {
      if (isDemoMode) {
        // Create demo pin
        const demoPin = createDemoPin({
          roof_id: pin.roof_id,
          x_position: pin.x_position,
          y_position: pin.y_position,
          title: pin.title,
          description: pin.description || undefined,
          severity: pin.severity,
          status: pin.status,
          created_by: pin.created_by || 'demo-user'
        })
        
        return new Promise(resolve => {
          setTimeout(() => resolve(demoPin as Pin), 200)
        })
      }

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
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofPins(data.roof_id) })
      queryClient.invalidateQueries({ queryKey: ['pins', 'parents', data.roof_id] })
      if (data.parent_pin_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinChildren(data.parent_pin_id) })
      }
    },
  })
}

export function useUpdatePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PinUpdate }): Promise<Pin> => {
      const { data, error } = await supabase
        .from('pins')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
      if (data.parent_pin_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinChildren(data.parent_pin_id) })
      }
    },
  })
}

export function useUpdatePinStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PinStatus }): Promise<Pin> => {
      const updates: PinUpdate = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'Closed') {
        updates.completed_at = new Date().toISOString()
      }

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
        .select('roof_id, parent_pin_id')
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