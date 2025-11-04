import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Database } from '../database.types'

type PinItem = Database['public']['Tables']['pin_items']['Row']
type PinItemInsert = Database['public']['Tables']['pin_items']['Insert']
type PinItemUpdate = Database['public']['Tables']['pin_items']['Update']

// Demo mode removed

const QUERY_KEYS = {
  pinItems: (pinId: string) => ['pin-items', pinId] as const,
  allPinItems: ['pin-items'] as const,
}

export function usePinItems(pinId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pinItems(pinId),
    queryFn: async (): Promise<PinItem[]> => {
      const { data, error } = await supabase
        .from('pin_items')
        .select('*')
  .eq('pin_id', pinId)
  .order('seq_suffix')

      if (error) throw error
      return data
    },
    enabled: !!pinId,
  })
}

export function useAllPinItems(roofId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allPinItems, roofId],
    queryFn: async (): Promise<PinItem[]> => {
      let query = supabase
        .from('pin_items')
        .select(`
          *,
          pin:pins(roof_id, status)
        `)
        .order('opened_at', { ascending: false })

      if (roofId) {
        query = query.eq('pin.roof_id', roofId)
      }

      const { data, error } = await query

  if (error) throw error
  return data as PinItem[]
    },
  })
}

export function useCreatePinItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: PinItemInsert): Promise<PinItem> => {
      const { data, error } = await supabase
        .from('pin_items')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinItems(data.pin_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allPinItems })
    },
  })
}

export function useUpdatePinItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PinItemUpdate }): Promise<PinItem> => {
      const { data, error } = await supabase
        .from('pin_items')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinItems(data.pin_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allPinItems })
    },
  })
}

export function useUpdatePinItemStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PinItem['status'] }): Promise<PinItem> => {
      const updates: PinItemUpdate = {
        status,
        last_activity_at: new Date().toISOString(),
      }

      // closed_at is updated via DB trigger/business logic; skip here

      const { data, error } = await supabase
        .from('pin_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinItems(data.pin_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allPinItems })
    },
  })
}

export function useDeletePinItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ pinId: string }> => {
      const { data: item } = await supabase
        .from('pin_items')
        .select('pin_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('pin_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { pinId: item?.pin_id || '' }
    },
    onSuccess: ({ pinId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinItems(pinId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allPinItems })
    },
  })
}