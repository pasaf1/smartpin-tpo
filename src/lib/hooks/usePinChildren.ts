import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database, PinChild, Photo, Pin } from '@/lib/database.types'

type PinRow = Database['public']['Tables']['pins']['Row']
type PinChildRow = Database['public']['Tables']['pin_children']['Row']
type PinChildInsert = Database['public']['Tables']['pin_children']['Insert']
type PinChildUpdate = Database['public']['Tables']['pin_children']['Update']
type PhotoInsert = Database['public']['Tables']['photos']['Insert']

const QK = {
  pinWithChildren: (pinId: string) => ['pin', pinId, 'with-children'] as const,
  childPhotos: (childId: string) => ['pin-child', childId, 'photos'] as const,
}

export function usePinWithChildren(pinId: string) {
  return useQuery({
    queryKey: QK.pinWithChildren(pinId),
    queryFn: async (): Promise<(PinRow & { children: PinChildRow[] }) | null> => {
      const { data: pin, error: pinError } = await supabase
        .from('pins')
        .select('*')
        .eq('id', pinId)
        .single()

      if (pinError) throw pinError

      const { data: children, error: childErr } = await supabase
        .from('pin_children')
        .select('*')
        .eq('pin_id', pinId)
        .order('child_code')

      if (childErr) throw childErr

      return pin ? { ...pin, children: children || [] } : null
    },
    enabled: !!pinId,
  })
}

export function useCreatePinChild(pinId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (init?: Partial<PinChildInsert>): Promise<PinChildRow> => {
      // Load parent and existing children to compute next child_code
      const [{ data: parent }, { data: children } ] = await Promise.all([
        supabase.from('pins').select('id, seq_number').eq('id', pinId).single(),
        supabase.from('pin_children').select('child_code').eq('pin_id', pinId).order('child_code')
      ])

      const parentSeq = parent?.seq_number ?? 0
      const nextIndex = (children?.length ?? 0) + 1
      const child_code = `${parentSeq}.${nextIndex}`

      const payload: PinChildInsert = {
        pin_id: pinId,
        child_code,
        status_child: 'Open',
        open_date: new Date().toISOString(),
        severity: 'Medium',
        ...init,
      }

      const { data, error } = await supabase
        .from('pin_children')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error

      // Call recompute function via RPC to keep aggregates in sync
      await supabase.rpc('recompute_parent_aggregates', { p_pin: pinId })

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.pinWithChildren(pinId) })
    }
  })
}

export function useUpdatePinChildStatus(pinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ childId, status }: { childId: string; status: PinChild['status_child'] }): Promise<PinChildRow> => {
      // Guard: if trying to close, ensure closure image exists
      if (status === 'Closed') {
        const { data: photos } = await supabase
          .from('photos')
          .select('photo_id, type')
          .eq('child_id', childId)
          .eq('type', 'ClosurePIC')
          .limit(1)
        if (!photos || photos.length === 0) {
          throw new Error('Cannot close without a closure photo')
        }
      }

      const { data, error } = await supabase
        .from('pin_children')
        .update({
          status_child: status,
          closed_date: status === 'Closed' ? new Date().toISOString() : null,
        } satisfies PinChildUpdate)
        .eq('child_id', childId)
        .select('*')
        .single()

      if (error) throw error

      await supabase.rpc('recompute_parent_aggregates', { p_pin: pinId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.pinWithChildren(pinId) })
    }
  })
}

export function useChildPhotos(childId: string) {
  return useQuery({
    queryKey: QK.childPhotos(childId),
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('child_id', childId)
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      return (data || []) as Photo[]
    },
    enabled: !!childId,
  })
}

export function useAttachChildPhoto(pinId: string, childId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      publicUrl,
      type,
      uploadedBy,
    }: { publicUrl: string; type: 'OpenPIC' | 'ClosurePIC'; uploadedBy?: string | null }): Promise<void> => {
      const payload: PhotoInsert = {
        type,
        file_url_public: publicUrl,
        uploaded_by: uploadedBy ?? null,
        pin_id: pinId,
        child_id: childId,
      }
      const { error } = await supabase.from('photos').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.childPhotos(childId) })
      qc.invalidateQueries({ queryKey: QK.pinWithChildren(pinId) })
    }
  })
}

// Variant that accepts childId at call-time, useful when UI picks a target dynamically
export function useAttachChildPhotoDynamic(pinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      childId,
      publicUrl,
      type,
      uploadedBy,
    }: { childId: string; publicUrl: string; type: 'OpenPIC' | 'ClosurePIC'; uploadedBy?: string | null }): Promise<void> => {
      const payload: PhotoInsert = {
        type,
        file_url_public: publicUrl,
        uploaded_by: uploadedBy ?? null,
        pin_id: pinId,
        child_id: childId,
      }
      const { error } = await supabase.from('photos').insert(payload)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: QK.childPhotos(variables.childId) })
      qc.invalidateQueries({ queryKey: QK.pinWithChildren(pinId) })
    },
  })
}
