// src/lib/layers/db-helpers.ts
// Helper functions for pin layers using existing schema structure
import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import type { Pin, PinChild, Photo } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type PinRow = Tables['pins']['Row']
type PinChildRow = Tables['pin_children']['Row']
type PhotoRow = Tables['photos']['Row']

export type LayerKind = 'Issues' | 'RFIs' | 'Details' | 'Notes'
type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

// Using existing defect_layer enum as layer system
const DEFAULT_LAYERS: { name: string; defect_layer: string; color: string; icon: string }[] = [
  { name: 'Issues', defect_layer: 'TPO_Membrane', color: '#ef4444', icon: 'AlertTriangle' },
  { name: 'RFIs', defect_layer: 'Seams', color: '#f59e0b', icon: 'HelpCircle' },
  { name: 'Details', defect_layer: 'Flashing', color: '#3b82f6', icon: 'FileText' },
  { name: 'Notes', defect_layer: 'Drains', color: '#10b981', icon: 'MessageSquare' },
]

const ensure01 = (v: number) => Math.max(0, Math.min(1, v))

/** יצירת פין עם pin_children (מטמיע שכבות דרך defect_layer) */
export async function createEnhancedPin(input: {
  roof_id: string
  layer_name: LayerKind
  seq_number?: number
  x: number // normalized 0..1
  y: number // normalized 0..1
  zone?: string | null
  priority?: Priority
  defect_type?: string
  description?: string
}) {
  const supabase = getSupabase()

  const x = ensure01(input.x)
  const y = ensure01(input.y)

  // מציאת defect_layer לפי layer_name
  const layerInfo = DEFAULT_LAYERS.find(l => l.name === input.layer_name)
  const defect_layer = layerInfo?.defect_layer || 'TPO_Membrane'

  // חישוב seq_number חדש אם לא סופק
  let seq = input.seq_number
  if (seq == null) {
    const { data: maxSeq, error: maxErr } = await supabase
      .from('pins')
      .select('seq_number')
      .eq('roof_id', input.roof_id)
      .order('seq_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (maxErr) return { success: false as const, error: maxErr }
    seq = (maxSeq?.seq_number ?? 0) + 1
  }

  // יצירת pin ראשי
  const { data: pin, error: pinErr } = await supabase
    .from('pins')
    .insert({
      roof_id: input.roof_id,
      seq_number: seq,
      x, y,
      zone: input.zone ?? null,
      status: 'Open',
      status_parent_manual: 'Open',
    })
    .select()
    .single()

  if (pinErr) return { success: false as const, error: pinErr }

  // יצירת pin_child ראשון
  const { data: child, error: childErr } = await supabase
    .from('pin_children')
    .insert({
      pin_id: pin.id,
      child_code: `${seq}.1`,
      defect_type: input.defect_type ?? 'General',
      notes: input.description ?? '',
      severity: input.priority ?? 'Medium',
      status_child: 'Open',
    })
    .select()
    .single()

  if (childErr) {
    // פיצוי: מחיקת הפין שנוצר
    await supabase.from('pins').delete().eq('id', pin.id)
    return { success: false as const, error: childErr }
  }

  return { success: true as const, pin: pin as PinRow, child: child as PinChildRow }
}

/** שליפת פינים עם ילדים לרעף (מקובץ בלופים לפי שכבות) */
export async function getEnhancedPinsForRoof(roofId: string) {
  const supabase = getSupabase()

  // שליפת כל הפינים ברעף
  const { data: pins, error: pErr } = await supabase
    .from('pins')
    .select('*')
    .eq('roof_id', roofId)
    .order('seq_number')

  if (pErr) return { success: false as const, error: pErr }

  const pinIds = (pins ?? []).map(p => p.id)
  if (pinIds.length === 0) return { success: true as const, pins: [] }

  // שליפת ילדים
  const { data: children, error: cErr } = await supabase
    .from('pin_children')
    .select('*')
    .in('pin_id', pinIds)
    .order('seq_suffix')

  if (cErr) return { success: false as const, error: cErr }

  // שליפת תמונות
  const { data: photos, error: phErr } = await supabase
    .from('photos')
    .select('*')
    .in('pin_id', pinIds)

  if (phErr) return { success: false as const, error: phErr }

  // איחוד הנתונים
  const childrenByPin = new Map<string, PinChildRow[]>()
  const photosByPin = new Map<string, PhotoRow[]>()

  children?.forEach(c => {
    if (!childrenByPin.has(c.pin_id)) childrenByPin.set(c.pin_id, [])
    childrenByPin.get(c.pin_id)!.push(c)
  })

  photos?.forEach(p => {
    if (p.pin_id && !photosByPin.has(p.pin_id)) photosByPin.set(p.pin_id, [])
    if (p.pin_id) photosByPin.get(p.pin_id)!.push(p)
  })

  const enhanced = pins.map(pin => {
    const pinChildren = childrenByPin.get(pin.id) || []
    const pinPhotos = photosByPin.get(pin.id) || []
    
    // שכבה מהילד הראשון (נשתמש ב-defect_type כמחליף לשכבה)
    const primaryChild = pinChildren[0]
    const layer = primaryChild ? DEFAULT_LAYERS.find(l => l.defect_layer === primaryChild.defect_type) : null

    return {
      pin,
      children: pinChildren,
      photos: pinPhotos,
      layer: layer ? {
        name: layer.name,
        defect_layer: layer.defect_layer,
        color: layer.color,
        icon: layer.icon
      } : null
    }
  })

  return { success: true as const, pins: enhanced }
}

/** עדכון pin_child (תחליף ל-metadata) */
export async function updatePinChild(childId: string, updates: Partial<Pick<PinChildRow,
  'defect_type' | 'notes' | 'severity' | 'status_child'
>>) {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('pin_children')
    .update(updates)
    .eq('child_id', childId)
    .select()
    .single()

  if (error) return { success: false as const, error }
  return { success: true as const, child: data as PinChildRow }
}

/** הוספת תמונה לפין */
export async function addPinPhoto(input: {
  pin_id: string
  child_id?: string
  type: 'OpenPIC' | 'ClosurePIC'
  url: string
  uploaded_by: string
  metadata?: Record<string, any>
}) {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('photos')
    .insert({
      pin_id: input.pin_id,
      child_id: input.child_id ?? null,
      type: input.type,
      file_url_public: input.url,
      uploaded_by: input.uploaded_by,
      metadata: input.metadata ?? {}
    })
    .select()
    .single()

  if (error) return { success: false as const, error }
  return { success: true as const, photo: data as PhotoRow }
}

/** שליפת שכבות זמינות (קבוע) */
export async function getAvailableLayers() {
  return {
    success: true as const,
    layers: DEFAULT_LAYERS.map((layer, index) => ({
      id: layer.defect_layer,
      name: layer.name,
      color: layer.color,
      icon: layer.icon,
      order_index: index + 1,
      status: 'active' as const
    }))
  }
}

/** סטטיסטיקות פינים לפי שכבות */
export async function getLayerStatistics(roofId: string) {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('v_pin_items_with_parent')
    .select('defect_layer, status')
    .eq('roof_id', roofId)

  if (error) return { success: false as const, error }

  const stats = DEFAULT_LAYERS.map(layer => {
    const layerPins = data?.filter(p => p.defect_layer === layer.defect_layer) || []
    return {
      layer: layer.name,
      defect_layer: layer.defect_layer,
      color: layer.color,
      total: layerPins.length,
      open: layerPins.filter(p => p.status === 'Open').length,
      ready: layerPins.filter(p => p.status === 'ReadyForInspection').length,
      closed: layerPins.filter(p => p.status === 'Closed').length,
    }
  })

  return { success: true as const, stats }
}
