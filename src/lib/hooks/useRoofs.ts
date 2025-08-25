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

// Demo data for roofs
const DEMO_ROOFS: Roof[] = [
  {
    id: 'roof-e1-demo',
    name: 'E1 Demo Roof',
    description: 'Main demonstration roof with sample defects and pins',
    project_name: 'SmartPin Demo Project',
    project_number: 'SPT-2024-001',
    location: 'Demo Site, Construction City',
    base_map_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop',
    base_map_width: 1200,
    base_map_height: 800,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-08-24T10:30:00Z',
    created_by: 'demo-admin',
    total_pins: 28,
    open_defects: 15,
    critical_defects: 3,
    last_activity: '2024-08-24T14:20:00Z',
    completion_percentage: 68,
    pin_count: 28,
    open_pins: 15,
    ready_pins: 8,
    closed_pins: 5,
    critical_pins: 3
  },
  {
    id: 'roof-building-a',
    name: 'Building A - North Wing',
    description: 'North wing TPO membrane installation and inspection',
    project_name: 'Metro Office Complex',
    project_number: 'MOC-2024-102',
    location: 'Metro City, Downtown',
    base_map_url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&h=800&fit=crop',
    base_map_width: 1200,
    base_map_height: 800,
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-08-23T16:45:00Z',
    created_by: 'demo-admin',
    total_pins: 42,
    open_defects: 8,
    critical_defects: 1,
    last_activity: '2024-08-23T16:45:00Z',
    completion_percentage: 85,
    pin_count: 42,
    open_pins: 8,
    ready_pins: 12,
    closed_pins: 22,
    critical_pins: 1
  },
  {
    id: 'roof-warehouse-12',
    name: 'Warehouse 12',
    description: 'Large industrial warehouse TPO replacement project',
    project_name: 'Industrial Park Phase 2',
    project_number: 'IPP2-2024-305',
    location: 'Industrial District',
    base_map_url: 'https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=1200&h=800&fit=crop',
    base_map_width: 1200,
    base_map_height: 800,
    created_at: '2024-03-10T07:30:00Z',
    updated_at: '2024-08-22T11:20:00Z',
    created_by: 'demo-admin',
    total_pins: 67,
    open_defects: 23,
    critical_defects: 5,
    last_activity: '2024-08-22T11:20:00Z',
    completion_percentage: 45,
    pin_count: 67,
    open_pins: 23,
    ready_pins: 18,
    closed_pins: 26,
    critical_pins: 5
  },
  {
    id: 'roof-school-east',
    name: 'East Elementary School',
    description: 'School roof renovation with membrane repair focus',
    project_name: 'Education Facilities Upgrade',
    project_number: 'EFU-2024-207',
    location: 'School District 5',
    base_map_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=800&fit=crop',
    base_map_width: 1200,
    base_map_height: 800,
    created_at: '2024-04-05T10:00:00Z',
    updated_at: '2024-08-21T09:15:00Z',
    created_by: 'demo-admin',
    total_pins: 19,
    open_defects: 4,
    critical_defects: 0,
    last_activity: '2024-08-21T09:15:00Z',
    completion_percentage: 92,
    pin_count: 19,
    open_pins: 4,
    ready_pins: 3,
    closed_pins: 12,
    critical_pins: 0
  },
  {
    id: 'roof-medical-center',
    name: 'Regional Medical Center',
    description: 'Critical facility roof with strict quality requirements',
    project_name: 'Healthcare Infrastructure',
    project_number: 'HCI-2024-410',
    location: 'Medical District',
    base_map_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=800&fit=crop',
    base_map_width: 1200,
    base_map_height: 800,
    created_at: '2024-05-20T08:45:00Z',
    updated_at: '2024-08-24T13:30:00Z',
    created_by: 'demo-admin',
    total_pins: 31,
    open_defects: 12,
    critical_defects: 2,
    last_activity: '2024-08-24T13:30:00Z',
    completion_percentage: 72,
    pin_count: 31,
    open_pins: 12,
    ready_pins: 8,
    closed_pins: 11,
    critical_pins: 2
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