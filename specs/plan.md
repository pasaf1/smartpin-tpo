# SmartPin TPO - Implementation Plan

**Generated:** 2025-10-07
**Status:** Active Development
**Branch:** fix/childpin-type
**Last Updated:** 2025-10-07

---

## Executive Summary

This plan provides **small, ordered, measurable steps** for completing SmartPin TPO, a professional roof inspection platform. Each step includes specific file changes, validation commands, and test scenarios.

**Core Objectives:**
- ✅ Fix critical type safety issues (parent_id → pin_id)
- 🔄 Complete hierarchical pin system implementation
- 🔄 Implement photo upload with auto-status workflow
- 🔄 Build real-time collaboration features
- ⏳ Create comprehensive test coverage

**Current Status:**
- TypeScript compilation: ❌ Errors present (child pin type mismatches)
- Database schema: ✅ Complete and migrated
- Real-time sync: ✅ BLUEBIN manager implemented
- Component structure: ✅ All major components exist

---

## Phase 1: Critical Type Safety Fixes (IMMEDIATE - Day 1)

### Step 1.1: Generate Fresh Database Types

**Priority:** 🔴 CRITICAL
**Estimated Time:** 5 minutes

**Files Modified:**
- `src/lib/database.types.ts` (auto-generated)

**Actions:**
```bash
# Generate types from remote Supabase
pnpm generate-types

# OR from local Supabase
pnpm generate-types:local
```

**Validation:**
```bash
# Check for TypeScript errors
pnpm build

# Verify enum consistency
pnpm ssot:check
```

**Expected Outcome:**
- ✅ `src/lib/database.types.ts` updated with latest schema
- ✅ All database enums match TypeScript types
- ✅ No type generation errors

**Test Scenario:**
1. Run `pnpm generate-types`
2. Open `src/lib/database.types.ts`
3. Verify `pin_children` table has `pin_id: string` (NOT `parent_id`)
4. Verify enums: `pin_status`, `severity`, `image_kind` exist

---

### Step 1.2: Fix Child Pin Type References

**Priority:** 🔴 CRITICAL
**Estimated Time:** 30 minutes

**Problem:**
Code references `pin_children.parent_id`, but database schema uses `pin_id` as the foreign key to parent pins.

**Files Modified:**
1. `src/components/dashboard/BluebinInteractiveRoofPlan.tsx`
2. `src/components/pins/BluebinPinDetailsCard.tsx`
3. `src/lib/hooks/usePinChildren.ts`
4. `src/lib/database.types.ts` (verify ChildPinWithUIFields)

**Actions:**

**File 1:** `src/components/dashboard/BluebinInteractiveRoofPlan.tsx`
```typescript
// FIND (around line 300-400)
childPins.filter(cp => cp.parent_id === pin.id)

// REPLACE WITH
childPins.filter(cp => cp.pin_id === pin.id)
```

**File 2:** `src/components/pins/BluebinPinDetailsCard.tsx`
```typescript
// FIND (around line 79-86)
childPin.id || childPin.child_id || childPin.child_id

// REPLACE WITH
childPin.child_id

// FIND (usage of parent_id in queries)
pin_id: childPin.parent_id

// REPLACE WITH
pin_id: childPin.pin_id
```

**File 3:** `src/lib/hooks/usePinChildren.ts`
```typescript
// FIND all references to parent_id
.eq('parent_id', parentPinId)

// REPLACE WITH
.eq('pin_id', parentPinId)
```

**File 4:** `src/lib/database.types.ts`
Verify `ChildPinWithUIFields` interface includes:
```typescript
export interface ChildPinWithUIFields {
  child_id: string
  pin_id: string  // NOT parent_id
  child_code: string
  status_child: 'Open' | 'ReadyForInspection' | 'Closed'
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  defect_type?: string
  zone?: string
  openpic_id?: string | null
  closurepic_id?: string | null
  open_date?: string
  closed_date?: string
  notes?: string
}
```

**Validation:**
```bash
# Strict lint check
pnpm lint:strict

# Build check
pnpm build

# Should show ZERO errors
```

**Test Scenario:**
1. Open `src/components/pins/BluebinPinDetailsCard.tsx`
2. Hover over `childPin.pin_id` - should show type `string`
3. No red squiggles in IDE
4. `pnpm build` completes successfully

---

### Step 1.3: Verify Supabase Connection

**Priority:** 🔴 CRITICAL
**Estimated Time:** 10 minutes

**Files Modified:**
- `.env.local` (verify configuration)
- `src/lib/supabase/client.ts` (verify export)

**Actions:**

**Check Environment Variables:**
```bash
# Verify .env.local contains:
NEXT_PUBLIC_SUPABASE_URL=https://vhtbinssqbzcjmbgkseo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

**Test Connection:**
Create temporary test file `src/app/api/test-db/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.from('roofs').select('id').limit(1)

  return NextResponse.json({
    connected: !error,
    error: error?.message,
    recordCount: data?.length
  })
}
```

**Validation:**
```bash
# Start dev server
pnpm dev

# Visit http://localhost:3000/api/test-db
# Should return: {"connected": true, "recordCount": 0 or more}
```

**Expected Outcome:**
- ✅ Connection succeeds
- ✅ No authentication errors
- ✅ Can query database tables

---

## Phase 2: Core Pin System Implementation (Day 2-3)

### Step 2.1: Parent Pin Creation Flow

**Priority:** 🟠 HIGH
**Estimated Time:** 2 hours

**Files Modified:**
1. `src/app/roofs/[id]/page.tsx`
2. `src/components/dashboard/BluebinInteractiveRoofPlan.tsx`
3. `src/lib/hooks/usePins.ts`

**Actions:**

**File 1:** `src/app/roofs/[id]/page.tsx` (around line 103-114)
```typescript
const handlePinCreate = async (x: number, y: number) => {
  try {
    // Get next sequence number
    const nextSeq = pins.length > 0
      ? Math.max(...pins.map(p => p.seq_number)) + 1
      : 1

    await createPinMutation.mutateAsync({
      roof_id: roofId,
      x: x,  // Already normalized 0-1
      y: y,  // Already normalized 0-1
      seq_number: nextSeq,
      status: 'Open' as const,
      opened_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create pin:', error)
    // Show error toast
  }
}
```

**File 2:** `src/components/dashboard/BluebinInteractiveRoofPlan.tsx` (around line 250)
```typescript
const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
  if (selectedTool !== 'pin' || !onAddPin || !selectedLayerId) return

  const stage = stageRef.current
  if (!stage) return

  // Get click position relative to stage
  const pointerPosition = stage.getPointerPosition()
  if (!pointerPosition) return

  // Normalize to 0-1 range (device independent)
  const normalizedX = pointerPosition.x / dimensions.width
  const normalizedY = pointerPosition.y / dimensions.height

  // Ensure coordinates are within bounds
  const clampedX = Math.max(0, Math.min(1, normalizedX))
  const clampedY = Math.max(0, Math.min(1, normalizedY))

  onAddPin(clampedX, clampedY, selectedLayerId)
}
```

**File 3:** `src/lib/hooks/usePins.ts`
```typescript
export function useCreatePin() {
  const queryClient = useQueryClient()
  const supabase = getSupabase()

  return useMutation({
    mutationFn: async (pinData: {
      roof_id: string
      x: number
      y: number
      seq_number: number
      status: 'Open' | 'ReadyForInspection' | 'Closed'
      opened_at: string
    }) => {
      const { data, error } = await supabase
        .from('pins')
        .insert([pinData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch pins
      queryClient.invalidateQueries({ queryKey: ['pins', variables.roof_id] })
    }
  })
}
```

**Validation:**
```bash
pnpm dev
# Navigate to /roofs/[id]
# Click canvas → Pin appears
# Refresh page → Pin persists
```

**Test Scenarios:**
- [ ] Click canvas at (400, 300) → Pin created with seq_number = 1
- [ ] Click again at (500, 400) → Pin created with seq_number = 2
- [ ] Refresh page → Both pins visible at exact positions
- [ ] Check database: `select * from pins` → 2 records exist
- [ ] Verify coordinates are 0-1 normalized (e.g., x=0.5, y=0.5)

---

### Step 2.2: Child Pin Creation System

**Priority:** 🟠 HIGH
**Estimated Time:** 3 hours

**Files Modified:**
1. `src/components/pins/BluebinPinDetailsCard.tsx`
2. `src/lib/hooks/usePinChildren.ts`
3. `src/app/roofs/[id]/page.tsx`

**Actions:**

**File 1:** `src/components/pins/BluebinPinDetailsCard.tsx`

Add "Add Child Pin" button in overview tab:
```typescript
// Inside the overview tab (around line 150)
<div className="flex items-center justify-between">
  <h3 className="text-lg font-semibold">Child Issues</h3>
  <button
    onClick={handleAddChildPin}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    disabled={isUpdating}
  >
    + Add Child Issue
  </button>
</div>

<div className="space-y-2 mt-4">
  {childPins.map((child, index) => (
    <div key={child.child_id} className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono">{child.child_code}</span>
        <span className={cn('px-2 py-1 rounded text-xs', getStatusColor(child.status_child))}>
          {child.status_child}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Severity: {child.severity || 'Not set'}
      </div>
    </div>
  ))}
</div>
```

Add handler function:
```typescript
const handleAddChildPin = async () => {
  setIsUpdating(true)

  try {
    // Calculate next child code (1.1, 1.2, 1.3...)
    const childCodes = childPins.map(cp => cp.child_code)
    const childNumbers = childCodes
      .map(code => parseInt(code.split('.')[1] || '0'))
      .filter(num => !isNaN(num))
    const nextChildNum = childNumbers.length > 0
      ? Math.max(...childNumbers) + 1
      : 1
    const newChildCode = `${pin.seq_number}.${nextChildNum}`

    await onAddChildPin(pin.id, {
      child_code: newChildCode,
      pin_id: pin.id,
      status_child: 'Open',
      severity: 'Medium',
      zone: pin.zone || null,
      open_date: new Date().toISOString()
    })

    // Broadcast to other users
    broadcastChildPinOperation('create', {
      parentPinId: pin.id,
      childCode: newChildCode
    })
  } catch (error) {
    console.error('Failed to add child pin:', error)
  } finally {
    setIsUpdating(false)
  }
}
```

**File 2:** `src/lib/hooks/usePinChildren.ts`
```typescript
export function useCreateChildPin() {
  const queryClient = useQueryClient()
  const supabase = getSupabase()

  return useMutation({
    mutationFn: async (childData: {
      pin_id: string
      child_code: string
      status_child: 'Open' | 'ReadyForInspection' | 'Closed'
      severity: 'Low' | 'Medium' | 'High' | 'Critical'
      zone?: string | null
      defect_type?: string | null
      open_date: string
    }) => {
      // Insert child pin
      const { data: child, error: childError } = await supabase
        .from('pin_children')
        .insert([childData])
        .select()
        .single()

      if (childError) throw childError

      // Update parent pin counters
      const { error: updateError } = await supabase.rpc('increment_child_count', {
        parent_pin_id: childData.pin_id,
        count_type: 'total'
      })

      if (updateError) console.error('Failed to update parent counters:', updateError)

      return child
    },
    onSuccess: (data, variables) => {
      // Invalidate child pins query
      queryClient.invalidateQueries({ queryKey: ['pin_children', variables.pin_id] })
      queryClient.invalidateQueries({ queryKey: ['pins'] })
    }
  })
}
```

**Database Function:**
Create migration `supabase/migrations/20251007_child_pin_functions.sql`:
```sql
CREATE OR REPLACE FUNCTION increment_child_count(
  parent_pin_id UUID,
  count_type TEXT
) RETURNS VOID AS $$
BEGIN
  IF count_type = 'total' THEN
    UPDATE pins
    SET children_total = children_total + 1
    WHERE id = parent_pin_id;
  ELSIF count_type = 'open' THEN
    UPDATE pins
    SET children_open = children_open + 1
    WHERE id = parent_pin_id;
  ELSIF count_type = 'ready' THEN
    UPDATE pins
    SET children_ready = children_ready + 1
    WHERE id = parent_pin_id;
  ELSIF count_type = 'closed' THEN
    UPDATE pins
    SET children_closed = children_closed + 1
    WHERE id = parent_pin_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Validation:**
```bash
pnpm dev
# Navigate to roof, click parent pin #1
# Click "Add Child Issue"
# Verify child appears with code "1.1"
# Add another → code "1.2"
```

**Test Scenarios:**
- [ ] Parent pin #1 → Add child → Gets code "1.1"
- [ ] Add 3 more children → Codes are "1.2", "1.3", "1.4"
- [ ] Delete child "1.2" → Next child is "1.5" (no renumbering)
- [ ] Parent pin shows children_total = 4
- [ ] Query DB: `select * from pin_children where pin_id = '...'`

---

### Step 2.3: Pin Status Workflow & Auto-Transitions

**Priority:** 🟠 HIGH
**Estimated Time:** 2 hours

**Files Modified:**
1. `src/lib/hooks/usePinStatusManager.ts`
2. `src/lib/pin-status-manager.ts`
3. `src/components/pins/BluebinPinDetailsCard.tsx`

**Actions:**

**File 1:** `src/lib/hooks/usePinStatusManager.ts`
```typescript
export function usePinStatusManager() {
  const supabase = getSupabase()

  const updateChildPinStatus = async (
    childId: string,
    newStatus: 'Open' | 'ReadyForInspection' | 'Closed',
    options?: { autoTransition?: boolean }
  ) => {
    const updates: any = { status_child: newStatus }

    if (newStatus === 'Closed') {
      updates.closed_date = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('pin_children')
      .update(updates)
      .eq('child_id', childId)
      .select()
      .single()

    if (error) throw error

    // Update parent counters
    await recalculateParentStatus(data.pin_id)

    return data
  }

  const recalculateParentStatus = async (parentPinId: string) => {
    // Get all children
    const { data: children, error } = await supabase
      .from('pin_children')
      .select('status_child')
      .eq('pin_id', parentPinId)

    if (error) throw error

    // Count statuses
    const counts = {
      open: children.filter(c => c.status_child === 'Open').length,
      ready: children.filter(c => c.status_child === 'ReadyForInspection').length,
      closed: children.filter(c => c.status_child === 'Closed').length,
      total: children.length
    }

    // Update parent
    await supabase
      .from('pins')
      .update({
        children_total: counts.total,
        children_open: counts.open,
        children_ready: counts.ready,
        children_closed: counts.closed,
        // Auto-update parent status if all children closed
        status: counts.closed === counts.total ? 'ReadyForInspection' : 'Open'
      })
      .eq('id', parentPinId)
  }

  return { updateChildPinStatus, recalculateParentStatus }
}
```

**File 2:** `src/lib/pin-status-manager.ts`
```typescript
export const PIN_STATUS_RULES = {
  // Closing photo upload triggers RTI
  onClosingPhotoUpload: (childPin: any) => {
    return 'ReadyForInspection' as const
  },

  // Parent can only close if all children closed
  canParentClose: (childStatuses: string[]) => {
    return childStatuses.every(status => status === 'Closed')
  },

  // Parent status based on children
  calculateParentStatus: (childStatuses: string[]) => {
    if (childStatuses.length === 0) return 'Open'
    if (childStatuses.every(s => s === 'Closed')) return 'Closed'
    if (childStatuses.some(s => s === 'ReadyForInspection')) return 'ReadyForInspection'
    return 'Open'
  }
}
```

**Validation:**
```bash
pnpm build && pnpm dev
# Create parent pin with 3 children
# Close child 1.1 → Parent stays Open
# Close child 1.2 → Parent stays Open
# Close child 1.3 → Parent changes to ReadyForInspection
```

**Test Scenarios:**
- [ ] Close all 3 children → Parent auto-updates to RTI
- [ ] Reopen child 1.2 → Parent reverts to Open
- [ ] Manual override: Admin sets parent to Closed → Succeeds
- [ ] Inspector tries manual override → Permission denied (RLS)

---

## Phase 3: Photo Upload & Auto-Status (Day 4-5)

### Step 3.1: Opening Photo Upload

**Priority:** 🟠 HIGH
**Estimated Time:** 3 hours

**Files Modified:**
1. `src/components/photos/PhotoUploadZone.tsx`
2. `src/lib/storage/photoStorage.ts`
3. `src/components/pins/BluebinPinDetailsCard.tsx`

**Actions:**

**File 1:** `src/components/photos/PhotoUploadZone.tsx`
```typescript
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { compressImage } from '@/lib/utils/imageOptimization'

interface PhotoUploadZoneProps {
  pinId: string
  childId?: string
  photoType: 'opening' | 'closing'
  onUploadComplete: (photoUrl: string, photoId: string) => void
  onUploadError: (error: Error) => void
}

export function PhotoUploadZone({
  pinId,
  childId,
  photoType,
  onUploadComplete,
  onUploadError
}: PhotoUploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setProgress(0)

    try {
      // 1. Compress image
      setProgress(20)
      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920
      })

      // 2. Generate storage path
      setProgress(40)
      const filename = `${Date.now()}_${file.name}`
      const path = childId
        ? `${pinId}/${childId}/${photoType}/${filename}`
        : `${pinId}/${photoType}/${filename}`

      // 3. Upload to Supabase Storage
      setProgress(60)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('smartpin-photos')
        .upload(path, compressed)

      if (uploadError) throw uploadError

      // 4. Get public URL
      setProgress(80)
      const { data: { publicUrl } } = supabase.storage
        .from('smartpin-photos')
        .getPublicUrl(path)

      // 5. Create photo record
      setProgress(90)
      const { data: photoRecord, error: photoError } = await supabase
        .from('photos')
        .insert([{
          type: photoType === 'opening' ? 'OpenPIC' : 'ClosurePIC',
          file_url_public: publicUrl,
          pin_id: pinId,
          child_id: childId || null,
          uploaded_at: new Date().toISOString(),
          file_name: file.name,
          file_size: compressed.size,
          mime_type: file.type
        }])
        .select()
        .single()

      if (photoError) throw photoError

      setProgress(100)
      onUploadComplete(publicUrl, photoRecord.photo_id)
    } catch (error) {
      console.error('Upload failed:', error)
      onUploadError(error as Error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [pinId, childId, photoType, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
        uploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploading... {progress}%</div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-sm text-gray-600">
            {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
          </div>
        </div>
      )}
    </div>
  )
}
```

**File 2:** `src/lib/storage/photoStorage.ts`
```typescript
import { getSupabase } from '@/lib/supabase'

export async function uploadPhoto(
  file: File,
  pinId: string,
  childId: string | undefined,
  photoType: 'opening' | 'closing'
): Promise<{ url: string; photoId: string }> {
  const supabase = getSupabase()

  // Generate path
  const filename = `${Date.now()}_${file.name}`
  const path = childId
    ? `${pinId}/${childId}/${photoType}/${filename}`
    : `${pinId}/${photoType}/${filename}`

  // Upload file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('smartpin-photos')
    .upload(path, file)

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('smartpin-photos')
    .getPublicUrl(path)

  // Create photo record
  const { data: photoRecord, error: photoError } = await supabase
    .from('photos')
    .insert([{
      type: photoType === 'opening' ? 'OpenPIC' : 'ClosurePIC',
      file_url_public: publicUrl,
      pin_id: pinId,
      child_id: childId || null,
      uploaded_at: new Date().toISOString(),
      file_name: file.name,
      file_size: file.size
    }])
    .select()
    .single()

  if (photoError) throw photoError

  return { url: publicUrl, photoId: photoRecord.photo_id }
}
```

**Validation:**
```bash
pnpm dev
# Click child pin
# Upload photo
# Check Supabase Storage → File exists
# Check photos table → Record created
```

**Test Scenarios:**
- [ ] Upload 5MB JPEG → Compressed to < 500KB
- [ ] Upload PNG → Converted and compressed
- [ ] Upload invalid file (`.txt`) → Error shown
- [ ] Check storage bucket: File visible in Supabase dashboard

---

### Step 3.2: Closing Photo Upload & Auto-Status Transition

**Priority:** 🟠 HIGH
**Estimated Time:** 2 hours

**Files Modified:**
1. `src/components/pins/BluebinPinDetailsCard.tsx`
2. `src/lib/hooks/usePinStatusManager.ts`
3. `src/lib/hooks/useChatSystem.ts`

**Actions:**

**File 1:** `src/components/pins/BluebinPinDetailsCard.tsx`
```typescript
const handleClosingPhotoUpload = async (childId: string, photoUrl: string, photoId: string) => {
  setIsUpdating(true)

  try {
    // 1. Update child pin with closing photo
    const { error: updateError } = await supabase
      .from('pin_children')
      .update({
        closurepic_id: photoId,
        status_child: 'ReadyForInspection',  // Auto-transition
        closed_date: new Date().toISOString()
      })
      .eq('child_id', childId)

    if (updateError) throw updateError

    // 2. Log activity
    await supabase
      .from('audit_log')
      .insert([{
        entity: 'pin_children',
        entity_id: childId,
        action: 'closing_photo_uploaded',
        diff: { photo_id: photoId, new_status: 'ReadyForInspection' }
      }])

    // 3. Broadcast to chat
    broadcastChildPinOperation('photo_uploaded', {
      childPinId: childId,
      parentPinId: pin.id,
      photoType: 'closing',
      childCode: childPins.find(cp => cp.child_id === childId)?.child_code
    })

    // 4. Recalculate parent status
    await recalculateParentStatus(pin.id)
  } catch (error) {
    console.error('Failed to process closing photo:', error)
  } finally {
    setIsUpdating(false)
  }
}
```

**File 2:** Create activity log helper in `src/lib/hooks/useChatSystem.ts`
```typescript
export function createActivityMessage(action: string, details: any): string {
  const timestamp = new Date().toLocaleString()
  const user = details.user || 'System'

  switch (action) {
    case 'closing_photo_uploaded':
      return `Closing photo uploaded for pin ${details.childCode} on ${timestamp} by ${user}`

    case 'status_changed':
      return `Pin ${details.childCode} status changed to ${details.newStatus} by ${user}`

    case 'child_added':
      return `Child pin ${details.childCode} added by ${user} on ${timestamp}`

    default:
      return `Pin updated by ${user}`
  }
}
```

**Validation:**
```bash
pnpm dev
# Upload closing photo to child pin 1.1
# Verify: Status auto-changes to "Ready for Inspection"
# Check chat: Activity message appears
# Check parent pin: children_ready count increased
```

**Test Scenarios:**
- [ ] Upload closing photo → Status = ReadyForInspection
- [ ] Activity log entry created in `audit_log` table
- [ ] Parent pin `children_ready` incremented
- [ ] Chat shows: "Closing photo uploaded for pin 1.2 by John Doe"
- [ ] Real-time: Other users see update < 1 second

---

## Phase 4: Real-Time Collaboration (Day 6-7)

### Step 4.1: Activity Log Integration

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours

**Files Modified:**
1. `src/components/chat/ChatInterface.tsx`
2. `src/lib/hooks/useChatSystem.ts`

**Actions:**

**File 1:** `src/components/chat/ChatInterface.tsx`
```typescript
export function ChatInterface({ roofId, pinId }: { roofId: string; pinId?: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'chat' | 'activity'>('all')

  useEffect(() => {
    const supabase = getSupabase()

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel(`chat:${roofId}${pinId ? ':' + pinId : ''}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: pinId ? `scope_id=eq.${pinId}` : `scope=eq.roof`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    // Subscribe to activity log
    const activityChannel = supabase
      .channel(`activity:${roofId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_log'
      }, (payload) => {
        setActivities(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      chatChannel.unsubscribe()
      activityChannel.unsubscribe()
    }
  }, [roofId, pinId])

  const combinedFeed = [
    ...messages.map(m => ({ ...m, type: 'chat' })),
    ...activities.map(a => ({ ...a, type: 'activity' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredFeed = filter === 'all'
    ? combinedFeed
    : combinedFeed.filter(item => item.type === filter)

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setFilter('all')}
          className={cn('px-4 py-2', filter === 'all' && 'border-b-2 border-blue-600')}
        >
          All
        </button>
        <button
          onClick={() => setFilter('chat')}
          className={cn('px-4 py-2', filter === 'chat' && 'border-b-2 border-blue-600')}
        >
          Chat
        </button>
        <button
          onClick={() => setFilter('activity')}
          className={cn('px-4 py-2', filter === 'activity' && 'border-b-2 border-blue-600')}
        >
          Activity
        </button>
      </div>

      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredFeed.map((item, index) => (
          <div key={index} className={cn(
            'p-3 rounded-lg',
            item.type === 'chat' ? 'bg-white border' : 'bg-blue-50 border-blue-200'
          )}>
            {item.type === 'chat' ? (
              <div>
                <div className="font-semibold text-sm">{item.created_by}</div>
                <div className="text-sm">{item.text}</div>
              </div>
            ) : (
              <div className="text-sm text-blue-800">
                {createActivityMessage(item.action, item.diff)}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Validation:**
```bash
pnpm dev
# Perform actions: create pin, upload photo, change status
# Check chat: All activities logged
# Filter by "activity" → Only system messages shown
# Filter by "chat" → Only user messages shown
```

**Test Scenarios:**
- [ ] Create pin → Activity appears in feed
- [ ] Upload photo → Activity logged
- [ ] Send chat message → Appears in chat filter
- [ ] Click activity → Opens related pin (future enhancement)

---

## Phase 5: Testing & Validation (Day 8-10)

### Step 5.1: Unit Tests for Critical Hooks

**Priority:** 🟡 MEDIUM
**Estimated Time:** 4 hours

**Files Created:**
1. `src/lib/hooks/__tests__/usePins.test.ts`
2. `src/lib/hooks/__tests__/usePinChildren.test.ts`
3. `src/lib/hooks/__tests__/usePinStatusManager.test.ts`

**Actions:**

**File 1:** `src/lib/hooks/__tests__/usePins.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePins, useCreatePin } from '../usePins'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('usePins', () => {
  it('fetches pins for a roof', async () => {
    const { result } = renderHook(() => usePins('test-roof-id'), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('creates a new pin', async () => {
    const { result } = renderHook(() => useCreatePin(), {
      wrapper: createWrapper()
    })

    const newPin = {
      roof_id: 'test-roof-id',
      x: 0.5,
      y: 0.5,
      seq_number: 1,
      status: 'Open' as const,
      opened_at: new Date().toISOString()
    }

    await waitFor(() => {
      result.current.mutate(newPin)
    })

    expect(result.current.isSuccess).toBe(true)
  })
})
```

**File 2:** `src/lib/hooks/__tests__/usePinChildren.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateChildPin } from '../usePinChildren'

describe('usePinChildren', () => {
  it('creates child pin with correct code', async () => {
    const { result } = renderHook(() => useCreateChildPin(), {
      wrapper: createWrapper()
    })

    const childData = {
      pin_id: 'parent-pin-id',
      child_code: '1.1',
      status_child: 'Open' as const,
      severity: 'Medium' as const,
      open_date: new Date().toISOString()
    }

    await waitFor(() => {
      result.current.mutate(childData)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.child_code).toBe('1.1')
  })
})
```

**Validation:**
```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Expected: > 80% coverage for hooks
```

**Test Scenarios:**
- [ ] Write 20+ unit tests for all hooks
- [ ] Test edge cases (empty data, null values)
- [ ] Test error handling (network failures)
- [ ] Achieve > 80% code coverage

---

### Step 5.2: E2E Tests with Playwright

**Priority:** 🟡 MEDIUM
**Estimated Time:** 6 hours

**Files Created:**
1. `tests/e2e/pin-creation.spec.ts`
2. `tests/e2e/photo-upload.spec.ts`
3. `tests/e2e/realtime-sync.spec.ts`
4. `playwright.config.ts`

**Actions:**

**File 1:** `tests/e2e/pin-creation.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test.describe('Pin Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roofs/test-roof-id')
    await page.waitForLoadState('networkidle')
  })

  test('creates parent pin via canvas click', async ({ page }) => {
    // Click on canvas
    const canvas = page.locator('canvas').first()
    await canvas.click({ position: { x: 400, y: 300 } })

    // Wait for pin to appear
    await page.waitForSelector('text=Pin #1', { timeout: 5000 })

    // Verify pin visible
    const pinMarker = page.locator('text=Pin #1')
    await expect(pinMarker).toBeVisible()
  })

  test('creates child pin from parent card', async ({ page }) => {
    // Click existing parent pin
    await page.click('text=Pin #1')

    // Wait for modal
    await page.waitForSelector('text=Add Child Issue')

    // Click add child button
    await page.click('text=Add Child Issue')

    // Verify child appeared
    await expect(page.locator('text=1.1')).toBeVisible()
  })
})
```

**File 2:** `tests/e2e/photo-upload.spec.ts`
```typescript
import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Photo Upload', () => {
  test('uploads opening photo and displays it', async ({ page }) => {
    await page.goto('/roofs/test-roof-id')

    // Click pin
    await page.click('text=Pin #1')

    // Upload photo
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-photo.jpg'))

    // Wait for upload to complete
    await page.waitForSelector('text=Upload complete', { timeout: 10000 })

    // Verify photo displayed
    const photo = page.locator('img[alt*="Opening photo"]')
    await expect(photo).toBeVisible()
  })

  test('closing photo triggers status change', async ({ page }) => {
    await page.goto('/roofs/test-roof-id')
    await page.click('text=Pin #1')

    // Upload closing photo
    const closingInput = page.locator('input[type="file"]').last()
    await closingInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-photo.jpg'))

    // Verify status changed to Ready for Inspection
    await expect(page.locator('text=Ready for Inspection')).toBeVisible({ timeout: 5000 })
  })
})
```

**File 3:** `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Validation:**
```bash
# Install Playwright browsers
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Expected: All tests pass in 3 browsers
```

**Test Scenarios:**
- [ ] Pin creation works in Chrome, Firefox, Safari
- [ ] Photo upload works on desktop and mobile viewports
- [ ] Realtime sync works with 2 browser tabs open
- [ ] Screenshots captured for visual regression

---

## Validation Checklist

### Build & Type Safety ✅
- [ ] `pnpm generate-types` succeeds
- [ ] `pnpm ssot:check` passes (enum consistency)
- [ ] `pnpm lint:strict` zero warnings
- [ ] `pnpm build` succeeds with zero errors
- [ ] No TypeScript errors in VS Code

### Core Functionality ✅
- [ ] Create parent pin via canvas click
- [ ] Parent pin displays with correct seq_number
- [ ] Create child pins with codes (1.1, 1.2, 1.3...)
- [ ] Upload opening photo → Photo visible
- [ ] Upload closing photo → Auto status change to RTI
- [ ] Close all children → Parent eligible for closure
- [ ] Activity log tracks all operations
- [ ] Realtime sync works across multiple tabs/users

### Database Integrity ✅
- [ ] All pins stored with normalized coords (0-1)
- [ ] Child pins reference parent via `pin_id` (not parent_id)
- [ ] Parent counters update correctly
- [ ] Photos stored in correct bucket path
- [ ] RLS policies allow/deny correctly

### Performance ✅
- [ ] Load 100+ pins < 2 seconds
- [ ] Canvas zoom/pan smooth (60fps)
- [ ] Photo upload < 5 seconds for 5MB image
- [ ] Bundle size < 500KB gzipped
- [ ] Lighthouse score > 90

---

## Success Metrics

### Technical Metrics
- **Build Time:** < 2 minutes
- **Bundle Size:** < 500KB (gzipped)
- **Lighthouse Score:** > 90 (Performance, Accessibility, Best Practices)
- **Test Coverage:** > 80%
- **Type Safety:** 100% (zero `any` types)

### User Experience Metrics
- **Pin Creation:** < 2 seconds (click → visible)
- **Photo Upload:** < 5 seconds (5MB image)
- **Realtime Sync:** < 1 second latency
- **Mobile Load:** < 3 seconds on 3G

### Business Metrics
- **Pin Completion Rate:** Track % of pins closed
- **Average MTTR:** Mean time to repair per issue
- **User Adoption:** Daily active users
- **Error Rate:** < 0.1% of user actions

---

## Risk Mitigation

### High Risk Items

1. **Type Mismatch: parent_id vs pin_id** 🔴
   - **Status:** Active fix in progress
   - **Mitigation:** Global find/replace, validation tests
   - **Timeline:** Immediate (Day 1)

2. **Realtime Performance with 100+ Users** 🟡
   - **Mitigation:** Connection pooling, rate limiting
   - **Fallback:** Polling every 5s if WebSocket fails
   - **Timeline:** Monitor in production

3. **Large Photo Uploads (20MB+)** 🟡
   - **Mitigation:** Client-side compression (< 500KB)
   - **Fallback:** Reject files > 10MB
   - **Timeline:** Implemented in Step 3.1

4. **Mobile Browser Compatibility** 🟢
   - **Mitigation:** Test on real devices (iOS Safari, Android Chrome)
   - **Fallback:** "Desktop mode" link for old browsers
   - **Timeline:** E2E tests cover mobile

---

## Next Steps (Immediate Action Plan)

### Week 1 (Days 1-3)
1. ✅ Run `pnpm generate-types`
2. ✅ Fix all `parent_id` → `pin_id` references
3. ✅ Verify `pnpm build` succeeds
4. ✅ Implement parent pin creation flow
5. ✅ Implement child pin creation system

### Week 2 (Days 4-7)
6. ⏳ Implement photo upload (opening + closing)
7. ⏳ Add auto-status transition on closing photo
8. ⏳ Integrate activity log with chat
9. ⏳ Test realtime sync with multiple users

### Week 3 (Days 8-10)
10. ⏳ Write unit tests (> 80% coverage)
11. ⏳ Write E2E tests (Playwright)
12. ⏳ Performance optimization (lazy loading, virtualization)
13. ⏳ Production deployment prep

---

## Appendix: File Change Summary

### Critical Files (Fix Immediately)
```
src/lib/database.types.ts              [VERIFY]
src/components/dashboard/BluebinInteractiveRoofPlan.tsx  [EDIT]
src/components/pins/BluebinPinDetailsCard.tsx            [EDIT]
src/lib/hooks/usePinChildren.ts                          [EDIT]
src/app/roofs/[id]/page.tsx                              [EDIT]
```

### New Files to Create
```
src/components/photos/PhotoUploadZone.tsx       [CREATE]
src/lib/storage/photoStorage.ts                 [CREATE]
src/lib/hooks/usePinStatusManager.ts            [CREATE]
src/lib/hooks/__tests__/usePins.test.ts         [CREATE]
tests/e2e/pin-creation.spec.ts                  [CREATE]
playwright.config.ts                            [CREATE]
supabase/migrations/20251007_child_pin_functions.sql [CREATE]
```

### Configuration Files
```
package.json                    [VERIFY scripts]
.env.local                      [VERIFY keys]
next.config.js                  [OPTIMIZE for production]
tsconfig.json                   [VERIFY strict mode]
```

---

**Plan Status:** ACTIVE
**Confidence Level:** HIGH
**Estimated Completion:** 10 working days
**Next Review:** After Step 1.2 completion
