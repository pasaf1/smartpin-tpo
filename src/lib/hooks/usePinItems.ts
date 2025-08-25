import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../supabase'
import type { Database, PinStatus, Severity } from '../database.types'

type PinItem = Database['public']['Tables']['pin_items']['Row']
type PinItemInsert = Database['public']['Tables']['pin_items']['Insert']
type PinItemUpdate = Database['public']['Tables']['pin_items']['Update']

// Mock data for demo mode
const mockPinItems: PinItem[] = [
  {
    id: 'item-1',
    pin_id: 'demo-pin-1',
    seq_number: 1,
    title: 'Membrane separation at seam',
    description: 'Primary membrane showing 2-inch separation along welded seam near drain area',
    severity: 'High',
    status: 'Open',
    created_at: '2024-08-24T10:00:00Z',
    updated_at: '2024-08-24T10:00:00Z',
    created_by: 'demo-user',
    completed_at: null,
  },
  {
    id: 'item-2',
    pin_id: 'demo-pin-1',
    seq_number: 2,
    title: 'Standing water accumulation',
    description: 'Water pooling indicates inadequate drainage slope in affected area',
    severity: 'Medium',
    status: 'Open',
    created_at: '2024-08-24T10:15:00Z',
    updated_at: '2024-08-24T10:15:00Z',
    created_by: 'demo-user',
    completed_at: null,
  },
  {
    id: 'item-3',
    pin_id: 'demo-pin-1',
    seq_number: 3,
    title: 'Temporary patch assessment',
    description: 'Emergency patch applied - requires permanent repair within 48 hours',
    severity: 'Critical',
    status: 'ReadyForInspection',
    created_at: '2024-08-24T11:00:00Z',
    updated_at: '2024-08-24T13:00:00Z',
    created_by: 'demo-user',
    completed_at: null,
  },
  {
    id: 'item-4',
    pin_id: 'demo-pin-2',
    seq_number: 1,
    title: 'Flashing secure check',
    description: 'Metal flashing properly fastened and sealed with appropriate sealant',
    severity: 'Low',
    status: 'Closed',
    created_at: '2024-08-24T09:00:00Z',
    updated_at: '2024-08-24T14:00:00Z',
    created_by: 'demo-user',
    completed_at: '2024-08-24T14:00:00Z',
  },
  {
    id: 'item-5',
    pin_id: 'demo-pin-3',
    seq_number: 1,
    title: 'Welded seam inspection',
    description: 'Visual inspection of 50ft welded seam - checking for gaps or bubbles',
    severity: 'Critical',
    status: 'ReadyForInspection',
    created_at: '2024-08-24T11:00:00Z',
    updated_at: '2024-08-24T11:30:00Z',
    created_by: 'demo-user',
    completed_at: null,
  },
  {
    id: 'item-6',
    pin_id: 'demo-pin-3',
    seq_number: 2,
    title: 'Seam pressure test',
    description: 'Pneumatic testing required to verify seam integrity under load',
    severity: 'High',
    status: 'Open',
    created_at: '2024-08-24T11:15:00Z',
    updated_at: '2024-08-24T11:15:00Z',
    created_by: 'demo-user',
    completed_at: null,
  },
]

// Demo counter for new items
let nextItemId = 100
let nextItemSeqNumber = 10

const QUERY_KEYS = {
  pinItems: (pinId: string) => ['pin-items', pinId] as const,
  allPinItems: ['pin-items'] as const,
}

export function usePinItems(pinId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pinItems(pinId),
    queryFn: async (): Promise<PinItem[]> => {
      if (isDemoMode) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(mockPinItems.filter(item => item.pin_id === pinId))
          }, 100)
        })
      }

      const { data, error } = await supabase
        .from('pin_items')
        .select('*')
        .eq('pin_id', pinId)
        .order('seq_number')

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
      if (isDemoMode) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(mockPinItems)
          }, 150)
        })
      }

      let query = supabase
        .from('pin_items')
        .select(`
          *,
          pin:pins(roof_id, title, status)
        `)
        .order('created_at', { ascending: false })

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
      if (isDemoMode) {
        const newItem: PinItem = {
          id: `demo-item-${nextItemId++}`,
          pin_id: item.pin_id,
          seq_number: nextItemSeqNumber++,
          title: item.title,
          description: item.description || null,
          severity: item.severity,
          status: item.status || 'Open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: item.created_by || 'demo-user',
          completed_at: null,
        }

        mockPinItems.push(newItem)
        return new Promise(resolve => {
          setTimeout(() => resolve(newItem), 200)
        })
      }

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
      if (isDemoMode) {
        const itemIndex = mockPinItems.findIndex(item => item.id === id)
        if (itemIndex === -1) throw new Error('Item not found')

        const updatedItem = {
          ...mockPinItems[itemIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        }

        mockPinItems[itemIndex] = updatedItem
        return new Promise(resolve => {
          setTimeout(() => resolve(updatedItem), 150)
        })
      }

      const { data, error } = await supabase
        .from('pin_items')
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pinItems(data.pin_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allPinItems })
    },
  })
}

export function useUpdatePinItemStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PinStatus }): Promise<PinItem> => {
      const updates: PinItemUpdate = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'Closed') {
        updates.completed_at = new Date().toISOString()
      }

      if (isDemoMode) {
        const itemIndex = mockPinItems.findIndex(item => item.id === id)
        if (itemIndex === -1) throw new Error('Item not found')

        const updatedItem = {
          ...mockPinItems[itemIndex],
          ...updates,
        }

        mockPinItems[itemIndex] = updatedItem
        return new Promise(resolve => {
          setTimeout(() => resolve(updatedItem), 150)
        })
      }

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
      if (isDemoMode) {
        const itemIndex = mockPinItems.findIndex(item => item.id === id)
        if (itemIndex === -1) throw new Error('Item not found')

        const pinId = mockPinItems[itemIndex].pin_id
        mockPinItems.splice(itemIndex, 1)
        
        return new Promise(resolve => {
          setTimeout(() => resolve({ pinId }), 100)
        })
      }

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