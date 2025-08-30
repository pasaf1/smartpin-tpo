import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

// Mobile-optimized hook for roofs
export function useRoofs() {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['roofs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roofs')
        .select(`
          *,
          organization:organizations(name),
          creator:profiles!created_by(full_name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for mobile performance
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  })
}

// Layers hook with mobile optimization
export function useLayers(roofId: string) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['layers', roofId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('layers')
        .select('*')
        .eq('roof_id', roofId)
        .order('z_index')
      
      if (error) throw error
      return data
    },
    enabled: !!roofId,
    staleTime: 2 * 60 * 1000, // 2 minutes for layer changes
  })
}

// Parent pins with mobile viewport optimization
export function useParentPins(roofId: string, viewport?: {
  minX: number
  maxX: number
  minY: number 
  maxY: number
}) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['parent_pins', roofId, viewport],
    queryFn: async () => {
      if (viewport) {
        // Use viewport culling for mobile performance
        const { data, error } = await supabase.rpc('get_pins_in_viewport', {
          p_roof_id: roofId,
          p_min_x: viewport.minX,
          p_max_x: viewport.maxX,
          p_min_y: viewport.minY,
          p_max_y: viewport.maxY
        })
        
        if (error) throw error
        return data
      } else {
        // Load all pins for desktop
        const { data, error } = await supabase
          .from('parent_pins')
          .select(`
            *,
            layer:layers(name, type),
            creator:profiles!created_by(full_name),
            assigned:profiles!assigned_to(full_name),
            children:child_pins(*)
          `)
          .eq('roof_id', roofId)
          .order('seq')
        
        if (error) throw error
        return data
      }
    },
    enabled: !!roofId,
    staleTime: 30 * 1000, // 30 seconds for real-time feel
  })
}

// Child pins for a specific parent
export function useChildPins(parentId: string) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['child_pins', parentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('child_pins')
        .select(`
          *,
          creator:profiles!created_by(full_name)
        `)
        .eq('parent_id', parentId)
        .order('seq')
      
      if (error) throw error
      return data
    },
    enabled: !!parentId,
    staleTime: 30 * 1000,
  })
}

// Create pin mutation with optimistic updates
export function useCreatePin() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      type: 'parent' | 'child'
      roofId: string
      layerId: string
      x: number
      y: number
      parentId?: string
      title?: string
      description?: string
    }) => {
      const { data, error } = await supabase.rpc('secure_create_pin', {
        p_type: params.type,
        p_roof_id: params.roofId,
        p_layer_id: params.layerId,
        p_x: params.x,
        p_y: params.y,
        p_parent_id: params.parentId,
        p_title: params.title,
        p_description: params.description
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries for real-time updates
      queryClient.invalidateQueries({ 
        queryKey: ['parent_pins', variables.roofId] 
      })
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['child_pins', variables.parentId]
        })
      }
    }
  })
}

// Update pin status with batch support
export function useUpdatePinStatus() {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: {
      pinIds: string[]
      newStatus: 'Open' | 'ReadyForReview' | 'Closed'
      isParent?: boolean
      roofId: string
    }) => {
      const { data, error } = await supabase.rpc('update_pin_status', {
        p_pin_ids: params.pinIds,
        p_new_status: params.newStatus,
        p_is_parent: params.isParent ?? true
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Optimistic update for mobile responsiveness
      queryClient.invalidateQueries({
        queryKey: ['parent_pins', variables.roofId]
      })
    }
  })
}

// Available tools at point for mobile tool restriction
export function useToolsAtPoint(roofId: string, x: number, y: number) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['tools', roofId, x, y],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tools_at_point', {
        p_roof_id: roofId,
        p_x: x,
        p_y: y
      })
      
      if (error) throw error
      return data
    },
    enabled: !!roofId && x >= 0 && y >= 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - tool regions don't change often
  })
}

// Search pins with mobile-optimized results
export function useSearchPins(roofId: string, searchTerm: string) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['search_pins', roofId, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_pins', {
        p_roof_id: roofId,
        p_search_term: searchTerm,
        p_limit: 20 // Mobile-friendly limit
      })
      
      if (error) throw error
      return data
    },
    enabled: !!roofId && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Annotations for a roof
export function useAnnotations(roofId: string, layerId?: string) {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['annotations', roofId, layerId],
    queryFn: async () => {
      let query = supabase
        .from('annotations')
        .select(`
          *,
          creator:profiles!created_by(full_name)
        `)
        .eq('roof_id', roofId)
      
      if (layerId) {
        query = query.eq('layer_id', layerId)
      }
      
      const { data, error } = await query.order('created_at')
      
      if (error) throw error
      return data
    },
    enabled: !!roofId,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Mobile connection status
export function useConnectionStatus() {
  const supabase = useSupabaseClient<Database>()
  
  return useQuery({
    queryKey: ['connection_status'],
    queryFn: async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1)
        return !error
      } catch {
        return false
      }
    },
    refetchInterval: 10 * 1000, // Check every 10 seconds on mobile
    staleTime: 0, // Always check fresh
    retry: 1, // Quick retry for mobile
  })
}