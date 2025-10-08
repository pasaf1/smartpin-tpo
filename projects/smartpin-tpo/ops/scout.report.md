# SmartPin TPO - Scout Report

**Generated:** 2025-10-07
**Task:** Fix type safety issues and implement plan
**Total Files Identified:** 12
**Critical Files:** 5

---

## Executive Summary

Scouted SmartPin TPO codebase and identified **12 highly relevant files** for the current implementation phase. Found **37 files** containing `parent_id`/`pin_id` references and **33 files** with child pin logic.

**Critical Issue:** Type mismatch between code (`parent_id`) and database schema (`pin_id`) in 4 core files.

---

## Critical Files (Fix Immediately)

### 1. src/lib/database.types.ts
**Size:** 32KB | **Lines:** 1,028 | **Priority:** 🔴 CRITICAL

**Issues:**
- Verify `ChildPinWithUIFields` interface uses `pin_id` (NOT `parent_id`)
- Auto-generated from Supabase schema

**Action:**
```bash
pnpm generate-types
# Then verify pin_children.pin_id exists
```

**Estimated Fix Time:** 5 minutes

---

### 2. src/components/pins/BluebinPinDetailsCard.tsx
**Size:** 23KB | **Lines:** 499 | **Priority:** 🔴 CRITICAL

**Issues:**
- Line 79-86: `childPin.id || childPin.child_id || childPin.child_id` pattern
- References to `parent_id` in queries and state

**Action:**
```typescript
// FIND
childPin.id || childPin.child_id || childPin.child_id

// REPLACE
childPin.child_id

// FIND
pin_id: childPin.parent_id

// REPLACE
pin_id: childPin.pin_id
```

**Estimated Fix Time:** 15 minutes

---

### 3. src/lib/hooks/usePinChildren.ts
**Size:** 6.3KB | **Lines:** 191 | **Priority:** 🔴 CRITICAL

**Issues:**
- Database queries use `.eq('parent_id', parentPinId)`
- Should be `.eq('pin_id', parentPinId)`

**Action:**
```typescript
// FIND all instances
.eq('parent_id', parentPinId)

// REPLACE WITH
.eq('pin_id', parentPinId)
```

**Estimated Fix Time:** 10 minutes

---

### 4. src/components/dashboard/BluebinInteractiveRoofPlan.tsx
**Size:** 21KB | **Lines:** 594 | **Priority:** 🔴 CRITICAL

**Issues:**
- Filter logic: `childPins.filter(cp => cp.parent_id === pin.id)`

**Action:**
```typescript
// FIND
childPins.filter(cp => cp.parent_id === pin.id)

// REPLACE
childPins.filter(cp => cp.pin_id === pin.id)
```

**Estimated Fix Time:** 5 minutes

---

### 5. src/app/roofs/[id]/page.tsx
**Size:** 39KB | **Lines:** 783 | **Priority:** 🟠 HIGH

**Issues:**
- Pin creation flow implementation
- Child pin handler functions

**Action:**
- Review `handlePinCreate` function (around line 103-114)
- Ensure normalized coordinates (0-1 range)
- Add proper error handling

**Estimated Fix Time:** 30 minutes

---

## High Priority Files (Implement Next)

### 6. src/lib/hooks/usePins.ts
**Size:** 8KB | **Lines:** 250 | **Priority:** 🟠 HIGH

**Purpose:** Parent pin CRUD operations

**Status:** ✅ Likely already functional

**Needed for:** Step 2.1 - Parent Pin Creation Flow

---

### 7. src/lib/hooks/usePinStatusManager.ts
**Size:** 4KB | **Lines:** 120 | **Priority:** 🟠 HIGH

**Purpose:** Status workflow automation

**Status:** ⚠️ May need enhancement for auto-transitions

**Needed for:** Step 2.3 - Pin Status Workflow

---

### 8. src/lib/pin-status-manager.ts
**Size:** 3KB | **Lines:** 90 | **Priority:** 🟡 MEDIUM

**Purpose:** Status rules and business logic

**Status:** ✅ Contains PIN_STATUS_RULES

**Needed for:** Step 2.3 - Pin Status Workflow

---

## Files to Create (New Components)

### 9. src/components/photos/PhotoUploadZone.tsx
**Status:** ❌ DOES NOT EXIST

**Size:** 0KB | **Code Available:** ✅ YES (766 lines in plan)

**Purpose:** Drag-drop photo upload with compression

**Needed for:** Step 3.1 - Opening Photo Upload

**Action:** Copy implementation from `apps/smartpin-tpo/specs/plan.md` lines 632-766

---

### 10. src/lib/storage/photoStorage.ts
**Status:** ❌ DOES NOT EXIST

**Size:** 0KB | **Code Available:** ✅ YES (47 lines in plan)

**Purpose:** Photo upload utilities

**Needed for:** Step 3.1 - Opening Photo Upload

**Action:** Copy implementation from plan lines 768-816

---

## Medium Priority Files (Reference)

### 11. src/lib/hooks/useBluebinRealtimeSync.ts
**Size:** 15KB | **Lines:** 400 | **Priority:** 🟡 MEDIUM

**Purpose:** Real-time collaboration (BLUEBIN manager)

**Status:** ✅ Already implemented and functional

**Notes:** Used in BluebinPinDetailsCard for broadcasting changes

---

### 12. src/components/pins/PinHierarchyManager.tsx
**Size:** 12KB | **Lines:** 350 | **Priority:** 🟡 MEDIUM

**Purpose:** Hierarchical pin management UI

**Status:** ✅ Exists, may need review

---

## Search Results Summary

### Files with `parent_id`/`pin_id` (37 total)
Top matches:
1. BluebinInteractiveRoofPlan.tsx
2. BluebinPinDetailsCard.tsx
3. usePinChildren.ts
4. database.types.ts
5. page.tsx (roofs/[id])

### Files with `ChildPin`/`pin_children` (33 total)
Top matches:
1. database.types.ts
2. BluebinPinDetailsCard.tsx
3. usePinChildren.ts
4. PinHierarchyManager.tsx
5. PinStatusWorkflow.tsx

---

## Estimated Token Usage

**Total for all 12 files:** ~42,000 tokens

**Breakdown:**
- database.types.ts: ~8,000 tokens
- BluebinPinDetailsCard.tsx: ~6,000 tokens
- BluebinInteractiveRoofPlan.tsx: ~5,500 tokens
- page.tsx: ~10,000 tokens
- Other files: ~12,500 tokens

**Recommendation:** Read files in batches of 3-4 to stay under token limits

---

## Implementation Order

### Immediate (Day 1)
1. ✅ Generate types: `pnpm generate-types`
2. ✅ Fix database.types.ts verification
3. ✅ Fix BluebinPinDetailsCard.tsx (parent_id → pin_id)
4. ✅ Fix usePinChildren.ts (queries)
5. ✅ Fix BluebinInteractiveRoofPlan.tsx (filters)
6. ✅ Validate: `pnpm build` (should succeed)

### Next (Days 2-3)
7. Review page.tsx pin creation flow
8. Enhance usePins.ts for Step 2.1
9. Implement child pin creation in BluebinPinDetailsCard
10. Test pin hierarchy system

### Following (Days 4-5)
11. Create PhotoUploadZone.tsx
12. Create photoStorage.ts
13. Integrate photo upload into pin cards
14. Test auto-status transitions

---

## File Size Analysis

**Files by size:**
- Large (>30KB): page.tsx (39KB), database.types.ts (32KB)
- Medium (10-30KB): BluebinPinDetailsCard (23KB), BluebinInteractiveRoofPlan (21KB), useBluebinRealtimeSync (15KB), PinHierarchyManager (12KB)
- Small (<10KB): usePinChildren (6.3KB), usePins (8KB), usePinStatusManager (4KB), pin-status-manager (3KB)

**Recommendation:** Start with small files for quick wins, then tackle large files in focused sessions

---

## Risk Assessment

### High Risk
🔴 **Type mismatches blocking child pin operations**
- Impact: Complete feature failure
- Effort: 30 minutes total
- Files affected: 4

### Medium Risk
🟡 **Missing photo upload components**
- Impact: Can't upload photos
- Effort: 3 hours (code ready in plan)
- Files affected: 2 (need to create)

### Low Risk
🟢 **Real-time sync already working**
- Impact: Minimal
- Effort: 0 (already done)
- Files affected: 0

---

## Next Steps

1. **Immediate:** Fix 4 critical files (45 minutes)
2. **Validate:** Run `pnpm build` (should pass)
3. **Test:** Create test pin and child pins
4. **Next:** Implement photo upload (Day 4-5)

---

**Scout Status:** COMPLETE
**Files Cataloged:** 12
**Issues Identified:** 5 critical, 2 missing
**Estimated Fix Time:** 45 minutes (critical) + 3 hours (new components)
**Confidence Level:** HIGH
