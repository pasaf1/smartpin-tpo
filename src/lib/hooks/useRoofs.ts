import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Database } from '../database.types'

type Roof = Database['public']['Tables']['roofs']['Row'] & {
  total_pins?: number
  open_defects?: number
  critical_defects?: number
  last_activity?: string
  completion_percentage?: number
}
type RoofInsert = Database['public']['Tables']['roofs']['Insert']
type RoofUpdate = Database['public']['Tables']['roofs']['Update']

const QUERY_KEYS = {
  roofs: ['roofs'] as const,
  roof: (id: string) => ['roofs', id] as const,
  roofStats: (id: string) => ['roofs', id, 'stats'] as const,
}

export function useRoofs() {
  return useQuery({
    queryKey: QUERY_KEYS.roofs,
    queryFn: async (): Promise<Roof[]> => {
      const { data, error } = await supabase
        .from('roofs')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
  })
}

export function useRoofsByProject(projectId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.roofs, 'project', projectId],
    queryFn: async (): Promise<Roof[]> => {
      const { data, error } = await supabase
        .from('roofs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at')

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useRoof(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.roof(id),
    queryFn: async (): Promise<Roof> => {
      console.log('Loading roof details for:', id)
      
      const { data, error } = await supabase
        .from('roofs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error loading roof:', error)
        throw error
      }
      
      console.log('Loaded roof:', data?.name)
      return data
    },
    enabled: !!id,
  })
}

export function useRoofStats(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.roofStats(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roofs')
        .select(`
          completion_percentage,
          pin_count,
          open_pins,
          ready_pins,
          closed_pins,
          critical_pins
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateRoof() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roof: RoofInsert): Promise<Roof> => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout after 10 seconds')), 10000)
      )
      
      const operation = async () => {
        const { data, error } = await supabase
          .from('roofs')
          .insert(roof)
          .select()
          .single()

        if (error) throw error
        return data
      }

      return Promise.race([operation(), timeoutPromise]) as Promise<Roof>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofs })
    },
    onError: (error) => {
      console.error('Failed to create roof:', error)
    }
  })
}

export function useUpdateRoof() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoofUpdate }): Promise<Roof> => {
      console.log('Updating roof:', id, updates)

      const { data, error } = await supabase
        .from('roofs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating roof:', error)
        throw error
      }
      
      console.log('Roof updated successfully:', data?.name)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofs })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roof(data.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofStats(data.id) })
    },
  })
}

export function useDeleteRoof() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('roofs')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofs })
    },
  })
}