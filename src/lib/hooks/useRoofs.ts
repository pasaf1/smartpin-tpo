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

// Demo data for roofs
const DEMO_ROOFS: Roof[] = [
  {
    id: 'roof-e1-demo',
    project_id: 'demo-project-1',
    code: 'E1',
    name: 'E1 Demo Roof',
    building: 'Demo Building A',
    plan_image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop',
    roof_plan_url: null,
    zones: {},
    stakeholders: {},
    origin_lat: null,
    origin_lng: null,
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    total_pins: 28,
    open_defects: 15,
    critical_defects: 3,
    last_activity: '2024-08-24T14:20:00Z',
    completion_percentage: 68
  },
  {
    id: 'roof-building-a',
    project_id: 'demo-project-2',
    code: 'BA',
    name: 'Building A - North Wing',
    building: 'Building A',
    plan_image_url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&h=800&fit=crop',
    roof_plan_url: null,
    zones: {},
    stakeholders: {},
    origin_lat: null,
    origin_lng: null,
    is_active: true,
    created_at: '2024-02-01T09:15:00Z',
    total_pins: 42,
    open_defects: 8,
    critical_defects: 1,
    last_activity: '2024-08-23T16:45:00Z',
    completion_percentage: 85
  },
  {
    id: 'roof-warehouse-12',
    project_id: 'demo-project-3',
    code: 'W12',
    name: 'Warehouse 12',
    building: 'Warehouse 12',
    plan_image_url: 'https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=1200&h=800&fit=crop',
    roof_plan_url: null,
    zones: {},
    stakeholders: {},
    origin_lat: null,
    origin_lng: null,
    is_active: true,
    created_at: '2024-03-10T07:30:00Z',
    total_pins: 67,
    open_defects: 23,
    critical_defects: 5,
    last_activity: '2024-08-22T11:20:00Z',
    completion_percentage: 45
  },
  {
    id: 'roof-school-east',
    project_id: 'demo-project-4',
    code: 'ESE',
    name: 'East Elementary School',
    building: 'East Elementary',
    plan_image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=800&fit=crop',
    roof_plan_url: null,
    zones: {},
    stakeholders: {},
    origin_lat: null,
    origin_lng: null,
    is_active: true,
    created_at: '2024-04-05T10:00:00Z',
    total_pins: 19,
    open_defects: 4,
    critical_defects: 0,
    last_activity: '2024-08-21T09:15:00Z',
    completion_percentage: 92
  },
  {
    id: 'roof-medical-center',
    project_id: 'demo-project-5',
    code: 'RMC',
    name: 'Regional Medical Center',
    building: 'Medical Center',
    plan_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop',
    roof_plan_url: null,
    zones: {},
    stakeholders: {},
    origin_lat: null,
    origin_lng: null,
    is_active: true,
    created_at: '2024-05-20T08:45:00Z',
    total_pins: 31,
    open_defects: 12,
    critical_defects: 2,
    last_activity: '2024-08-24T13:30:00Z',
    completion_percentage: 72
  }
]

const QUERY_KEYS = {
  roofs: ['roofs'] as const,
  roof: (id: string) => ['roofs', id] as const,
  roofStats: (id: string) => ['roofs', id, 'stats'] as const,
}

export function useRoofs() {
  return useQuery({
    queryKey: QUERY_KEYS.roofs,
    queryFn: async (): Promise<Roof[]> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading roofs list')
        return DEMO_ROOFS
      }

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
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading roofs for project:', projectId)
        return DEMO_ROOFS.filter(r => r.project_id === projectId)
      }

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
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading roof details for:', id)
        const roof = DEMO_ROOFS.find(r => r.id === id)
        if (!roof) throw new Error('Roof not found')
        return roof
      }

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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
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