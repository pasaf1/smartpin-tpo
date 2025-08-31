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

// Project types
type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']

// Demo data removed - using real database data only

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
      return data || []
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
      return data || []
    },
    enabled: !!projectId,
  })
}

export function useRoof(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.roof(id),
    queryFn: async (): Promise<Roof> => {
      const { data, error } = await supabase
        .from('roofs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
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
      const { data, error } = await supabase
        .from('roofs')
        .insert(roof)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofs })
    },
  })
}

export function useUpdateRoof() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoofUpdate }): Promise<Roof> => {
      const { data, error } = await supabase
        .from('roofs')
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

// Additional hooks for compatibility
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      console.log('🔄 Fetching projects from database...')
      
      // Add timeout to prevent hanging
      const projectsPromise = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Projects fetch timeout after 15 seconds')), 15000)
      })
      
      const { data, error } = await Promise.race([projectsPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Failed to fetch projects:', error)
        throw error
      }
      
      console.log('✅ Projects fetched successfully:', data?.length || 0)
      return data || []
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (project: { name: string; description?: string }): Promise<Project> => {
      const projectData: ProjectInsert = {
        name: project.name,
        status: 'Open',
        contractor: null,
        created_by: null,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      // First delete all associated roofs (cascade delete)
      const { data: deletedRoofs, error: roofsError } = await supabase
        .from('roofs')
        .delete()
        .eq('project_id', projectId)
        .select()
      
      if (roofsError) {
        console.error('❌ Failed to delete roofs:', roofsError)
        throw roofsError
      }

      // Then delete the project
      const { data: deletedProject, error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('project_id', projectId)
        .select()

      if (projectError) {
        console.error('❌ Failed to delete project:', projectError)
        throw projectError
      }
    },
    onSuccess: () => {
      console.log('🔄 Project deleted successfully, invalidating cache...')
      
      // Aggressively invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roofs })
      
      // Force immediate refetch with exact option
      queryClient.refetchQueries({ 
        queryKey: ['projects'], 
        exact: true 
      })
      
      // Also remove any cached project data to ensure fresh fetch
      queryClient.removeQueries({ queryKey: ['projects'] })
      
      console.log('✅ Cache invalidated and queries refetched')
    }
  })
}