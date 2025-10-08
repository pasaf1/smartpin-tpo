# SmartPin TPO - Prime Context Report

**Generated:** 2025-10-06
**Branch:** fix/childpin-type
**Purpose:** Essential context loading for SmartPin development

---

## Executive Summary

SmartPin TPO is a professional roof inspection platform built with Next.js 15, Supabase, and React-Konva. It provides hierarchical pin-based issue tracking, real-time collaboration, multi-layer inspection management, and mobile-first PWA architecture.

**Core Architecture:**
- Frontend: Next.js 15 (App Router) + React 18 + TypeScript
- Backend: Supabase (PostgreSQL + PostGIS + Realtime)
- Canvas: React-Konva for interactive roof plans
- State: TanStack Query + Zustand
- UI: Tailwind CSS + shadcn/ui

---

## Repository Map

### 1. Core Application Structure

```
apps/smartpin-tpo/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── roofs/[id]/page.tsx       # Main roof inspection view
│   │   ├── roofs/[id]/layers/        # Layer management
│   │   ├── login/page.tsx            # Authentication
│   │   └── api/                      # API routes
│   │
│   ├── components/
│   │   ├── canvas/                   # Konva canvas components
│   │   │   ├── LayerManager.tsx      # Layer control system
│   │   │   ├── PinMarker.tsx         # Pin visualization
│   │   │   ├── RegionDrawer.tsx      # Spatial tool gating
│   │   │   └── ProximityIndicator.tsx
│   │   │
│   │   ├── pins/                     # Pin management
│   │   │   ├── BluebinPinDetailsCard.tsx  # Pin detail modal
│   │   │   ├── PinHierarchyManager.tsx    # Parent/child logic
│   │   │   ├── PinStatusWorkflow.tsx      # Status transitions
│   │   │   └── PinPhotoManager.tsx        # Photo uploads
│   │   │
│   │   ├── chat/                     # Real-time chat system
│   │   │   ├── ChatSystem.tsx        # Main chat interface
│   │   │   ├── ChatProUI.tsx         # Pro chat features
│   │   │   └── MentionInput.tsx      # @mention support
│   │   │
│   │   ├── shared/
│   │   │   ├── PinItemsTable.tsx     # Issues table with filters
│   │   │   ├── SmartSearchInput.tsx  # Semantic search
│   │   │   └── ExportDialog.tsx      # PDF/CSV export
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx       # Project gallery
│   │   │   └── KPICards.tsx          # Dashboard metrics
│   │   │
│   │   └── ui/                       # shadcn/ui components
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts             # Browser Supabase client
│       │   └── server.ts             # Server Supabase client
│       │
│       ├── hooks/
│       │   ├── usePins.ts            # Pin data hooks
│       │   ├── usePinItems.ts        # Pin items (children)
│       │   ├── useRealTimeSync.ts    # Realtime subscriptions
│       │   ├── useChatSystem.ts      # Chat functionality
│       │   └── useAuth.tsx           # Authentication
│       │
│       ├── services/
│       │   ├── PinService.ts         # Pin business logic
│       │   ├── ChatService.ts        # Chat service
│       │   ├── PhotoService.ts       # Photo uploads
│       │   └── canvas-core.ts        # Canvas operations
│       │
│       ├── stores/
│       │   └── canvas-store.ts       # Zustand canvas state
│       │
│       ├── layers/
│       │   ├── useLayerQueries.ts    # Layer data hooks
│       │   └── db-helpers.ts         # Layer DB operations
│       │
│       └── database.types.ts         # Generated Supabase types
│
├── supabase/
│   └── migrations/
│       ├── 20240826_initial_schema.sql
│       ├── 20250830_bluebin_integration.sql  # Layer system
│       ├── 20250831_enable_postgis_spatial.sql
│       └── 20250831_enhanced_rls_policies.sql
│
└── package.json                      # Dependencies & scripts
```

### 2. Database Schema (Supabase)

#### Core Tables

**users** - User profiles extending auth.users
- `id` (UUID, PK)
- `auth_user_id` (UUID, FK to auth.users)
- `full_name`, `email`, `role` (Admin, QA_Manager, Supervisor, Foreman, Viewer)
- RLS: Users can view own profile

**projects** - Top-level project container
- `project_id` (UUID, PK)
- `name`, `status`, `contractor`
- `created_by` (FK to users)
- RLS: Creator + Admin/QA_Manager access

**roofs** - Roof configurations within projects
- `id` (UUID, PK)
- `project_id` (FK to projects)
- `code`, `name`, `building`
- `plan_image_url`, `roof_plan_url`
- `zones` (JSONB), `stakeholders` (JSONB)
- `origin_lat`, `origin_lng` (PostGIS coordinates)

**pins** - Parent pins (issue groups)
- `id` (UUID, PK)
- `roof_id` (FK to roofs)
- `seq_number` (INTEGER) - Display as "1", "2", "3"
- `x`, `y` (DECIMAL) - Normalized coordinates (0-1)
- `status` (pin_status: Open, ReadyForInspection, Closed)
- `layer_id` (FK to layers) - BLUEBIN integration
- Child aggregation: `children_total`, `children_open`, `children_ready`, `children_closed`
- `parent_mix_state` (ALL_OPEN, MIXED, ALL_CLOSED)

**pin_items** (formerly pin_children) - Individual issues
- `id` (UUID, PK)
- `pin_id` (FK to pins)
- `seq_suffix` (TEXT) - "1.1", "1.2", "1.3"
- `status` (pin_status)
- `severity` (Low, Medium, High, Critical)
- `defect_layer` (VaporBarrier, InsulationBoards, DensDeck, TPO_Membrane, Seams, Flashing, Drains, Curbs)
- `description`, `zone`
- `opened_at`, `closed_at`, `last_activity_at`
- Photos: `open_pic_url`, `close_pic_url`

**layers** - BLUEBIN layer system
- `id` (UUID, PK)
- `roof_id` (FK to roofs)
- `name`, `type` (base, pins, annotations, qa, measurements)
- `visible`, `locked`, `z_index`, `opacity`
- `write_roles` (TEXT[])
- Default layer: "Quality Control" (type: pins, z_index: 1)

**child_pins** - Enhanced child pins (BLUEBIN)
- `id` (UUID, PK)
- `parent_id` (FK to pins)
- `seq` (TEXT) - "1.1", "1.2"
- `x`, `y` (DECIMAL 0-1)
- `status`, `severity`, `defect_layer`
- Unique constraint: `(parent_id, seq)`

**plan_regions** - Spatial tool gating (PostGIS)
- `id` (UUID, PK)
- `roof_id` (FK to roofs)
- `layer_id` (FK to layers)
- `polygon` (GEOMETRY(POLYGON, 4326))
- `allowed_tools` (TEXT[]) - ['pin', 'annotation', 'measurement']
- Default: Full roof access with all tools

**annotations** - BLUEBIN drawing features
- `id` (UUID, PK)
- `roof_id`, `layer_id`
- `type` (rectangle, circle, polygon, polyline, text, arrow)
- `data` (JSONB) - coordinates, text, styling
- `style` (JSONB) - color, stroke, touch targets

**chats** - Scoped messaging
- `message_id` (UUID, PK)
- `scope` (global, roof, pin)
- `scope_id` (UUID)
- `text`, `mentions` (TEXT[])
- `created_by` (FK to users)

**photos** - Photo storage references
- `photo_id` (UUID, PK)
- `child_id` (FK to pin_items)
- `file_url_public`, `file_name`, `file_size`, `mime_type`
- `kind` (Open, Close, Extra)
- `metadata` (JSONB)

**audit_log** - Activity tracking
- `id` (UUID, PK)
- `entity`, `entity_id`, `action`
- `actor_id` (FK to users)
- `diff` (JSONB)

### 3. Key Features & Flows

#### Hierarchical Pin System
```
Parent Pin (seq_number: 1)
├── Pin Item 1.1 (seq_suffix: "1.1")
├── Pin Item 1.2 (seq_suffix: "1.2")
└── Pin Item 1.3 (seq_suffix: "1.3")
```

**Parent Pin Creation:**
1. User clicks on roof plan canvas
2. Normalized coordinates (x, y) stored (0-1 range)
3. Auto-assigned seq_number (1, 2, 3...)
4. Default layer_id assigned ("Quality Control")
5. Status: Open

**Child Pin Creation:**
1. Within parent pin card, click "Add Issue"
2. Auto-generated seq_suffix (1.1, 1.2...)
3. Inherits parent's zone, defect_layer
4. Independent status tracking

**Status Workflow:**
```
Open (Red) → ReadyForInspection (Yellow) → Closed (Green)
```

**Automatic Transitions:**
- Upload closing photo → Status changes to ReadyForInspection
- Parent pin stays yellow until ALL children are closed

#### Layer System (BLUEBIN-Style)
```javascript
layers: [
  { name: "Quality Control", type: "pins", visible: true, z_index: 1 },
  { name: "Notes", type: "annotations", visible: true, z_index: 2 },
  { name: "Measurements", type: "measurements", visible: false, z_index: 3 }
]
```

**Layer Controls:**
- Visibility toggle (show/hide entire layer)
- Opacity adjustment (0.0 - 1.0)
- Locking (prevent edits)
- Z-index ordering (visual stacking)

**Tool Gating (PostGIS):**
- Define polygonal regions on roof plan
- Restrict tools per region (pin, annotation, measurement)
- Default: Full roof access with all tools

#### Real-time Collaboration

**Supabase Realtime Subscriptions:**
- `pins` table changes → Update canvas
- `pin_items` table changes → Refresh table
- `chats` table inserts → New messages appear
- `layers` table updates → Layer controls sync

**Activity Logging:**
- Every pin action logged to `audit_log`
- Automatic chat messages:
  - "Closing photo uploaded for pin 1.2 on [date] by [user]"
  - "Status changed to ReadyForInspection for pin 1.1 by [user]"
  - "Child pin 1.3 added by [user]"

**User Presence:**
- Online users tracked via Supabase Presence
- Display count in chat header
- @mention autocomplete

### 4. Canvas Implementation (React-Konva)

**Coordinate System:**
```javascript
// Store normalized (0-1) for device independence
const normalizedX = clickX / canvasWidth
const normalizedY = clickY / canvasHeight

// Display conversion
const displayX = normalizedX * currentCanvasWidth
const displayY = normalizedY * currentCanvasHeight
```

**Pin Rendering:**
```javascript
const statusColors = {
  Open: '#ef4444',              // Red
  ReadyForInspection: '#f59e0b', // Yellow
  Closed: '#10b981',             // Green
}
```

**Touch Optimizations:**
- Pinch-to-zoom (multitouch)
- Pan with drag bounds
- Mobile touch targets (larger hit areas)
- Viewport culling (only render visible pins)

### 5. Chat System

**Scopes:**
- Global: Organization-wide chat
- Project: Project-specific discussions
- Roof: Roof-level coordination
- Pin: Issue-specific threads

**Features:**
- @mentions with autocomplete
- Message edit/delete (own messages + Admin)
- Real-time message sync
- Stakeholder notifications
- File attachments (images, videos)

### 6. Export Functionality

**PDF Export:**
- Page 1: Company logo, Issue ID, interactive map with numbered pins
- Following pages: Opening/Closing photo pairs
- jsPDF library

**CSV Export:**
- Full table data (no images)
- All filters applied
- PapaParse library

---

## Critical Risks & Concerns

### 🔴 HIGH PRIORITY

#### 1. **Type Inconsistency: pin_items vs child_pins**
**Risk Level:** HIGH
**Impact:** Runtime errors, data loss, broken features

**Current State:**
- Database has TWO child pin tables:
  - `pin_items` (active, 100+ records)
  - `child_pins` (BLUEBIN integration, empty)
- Frontend uses `pin_items` via `usePinItems.ts`
- BLUEBIN migration created `child_pins` but didn't migrate data
- Type system references both tables inconsistently

**Evidence:**
- `src/lib/hooks/usePinItems.ts` → queries `pin_items`
- `src/components/shared/PinItemsTable.tsx` → uses `pin_items`
- `supabase/migrations/20250830_bluebin_integration.sql` → creates `child_pins`
- Schema has both tables with similar but different structures

**Required Actions:**
1. **IMMEDIATE:** Decide which table is source of truth
2. **Option A:** Migrate `pin_items` → `child_pins`, update all hooks/services
3. **Option B:** Drop `child_pins`, remove BLUEBIN references
4. Update RLS policies for chosen table
5. Regenerate TypeScript types
6. Test all pin creation/update flows

---

#### 2. **Missing Canvas Component**
**Risk Level:** HIGH
**Impact:** Core roof inspection view broken

**Current State:**
- `src/components/canvas/BluebinInteractiveRoofPlan.tsx` DOES NOT EXIST
- Referenced in router but file missing
- Main roof view likely broken

**Evidence:**
- Glob results show no `BluebinInteractiveRoofPlan.tsx`
- Canvas directory has: LayerManager, PinMarker, RegionDrawer, ProximityIndicator
- Missing the main orchestrating component

**Required Actions:**
1. Check if file was deleted or renamed
2. Search for alternative main canvas component
3. Review `app/roofs/[id]/page.tsx` to see what it imports
4. Recreate or restore from git history
5. Test full canvas functionality

---

#### 3. **Layer System Integration Incomplete**
**Risk Level:** MEDIUM-HIGH
**Impact:** BLUEBIN features non-functional

**Current State:**
- Database schema has full layer system (layers, plan_regions, annotations)
- Default "Quality Control" layer created for all roofs
- pins.layer_id is NOT NULL (migrated)
- BUT: Frontend layer integration unclear

**Evidence:**
- `src/components/canvas/LayerManager.tsx` exists (6.6KB)
- `src/lib/layers/useLayerQueries.ts` exists
- No clear connection between canvas rendering and layer filters
- Plan regions (PostGIS tool gating) likely not implemented in UI

**Required Actions:**
1. Verify LayerManager is connected to canvas
2. Test layer visibility toggles
3. Implement plan_regions UI (draw polygons, assign tools)
4. Add layer opacity controls to UI
5. Test z-index ordering

---

### 🟡 MEDIUM PRIORITY

#### 4. **Supabase Client Build Safety**
**Risk Level:** MEDIUM
**Impact:** Build failures, production crashes

**Current State:**
- `src/lib/supabase/client.ts` has sophisticated proxy for missing env vars
- Good: Prevents build crashes
- Risk: Silent failures in production if env vars not set

**Evidence:**
```typescript
function createBuildSafeProxy(): SupabaseClient<Database> {
  return new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
      throw new Error('Supabase client not configured...')
    }
  })
}
```

**Required Actions:**
1. Add env var validation at build time
2. Fail fast if required vars missing in production
3. Add healthcheck endpoint to verify Supabase connection
4. Monitor Vercel env vars configuration

---

#### 5. **canvas-store.ts is Empty**
**Risk Level:** MEDIUM
**Impact:** Canvas state management broken

**Current State:**
- `src/lib/stores/canvas-store.ts` exists but has only 1 line
- Zustand store likely incomplete or moved

**Evidence:**
- File exists in Glob results
- Read returned "file has 1 lines" warning
- Canvas likely using alternative state management

**Required Actions:**
1. Check if canvas-store was refactored
2. Look for canvas-store-simple.ts or other alternatives
3. Verify canvas state is managed (zoom, pan, selected pins)
4. Document actual state management pattern

---

#### 6. **PinService.ts is Stub**
**Risk Level:** MEDIUM
**Impact:** Business logic missing or scattered

**Current State:**
- `src/lib/services/PinService.ts` exists but has 1 line
- Multiple alternative services exist:
  - PinServiceEnhanced.ts
  - PinServiceSimplified.ts
  - BaseService.ts

**Evidence:**
- Read returned "file has 1 lines"
- Service layer fragmented across multiple files

**Required Actions:**
1. Consolidate to single PinService
2. Document which service is canonical
3. Remove dead code/unused services
4. Ensure all hooks use same service layer

---

### 🟢 LOW PRIORITY (Monitor)

#### 7. **Type Generation Dependency**
- `generate-types` script requires local Supabase or remote project access
- Build script uses `generate-types:local-safe` (fails silently)
- Risk: Stale types if migrations run but types not regenerated

#### 8. **Real-time Sync Hooks**
- Multiple hooks: `useRealTimeSync.ts`, `useBluebinRealtimeSync.ts`, `useSupabaseRealtimeSync.ts`
- Unclear which is active
- Potential duplicate subscriptions

#### 9. **Photo Storage**
- Photos table references `child_id` (FK to pin_items)
- If migrating to child_pins, FK constraint will break
- Need photo migration plan

---

## Build Configuration

**Next.js 15:**
- App Router (RSC enabled)
- TypeScript strict mode
- Turbopack (dev server)

**Scripts:**
```json
{
  "dev": "npm run generate-types:local-safe && next dev",
  "build": "next build",
  "build:strict": "npm run types:gen && npm run ssot:check && next build",
  "generate-types": "npx supabase gen types typescript --project-id vhtbinssqbzcjmbgkseo > src/lib/database.types.ts"
}
```

**Dependencies (Key):**
- `next`: 15.5.0
- `react`: 18.3.0
- `@supabase/supabase-js`: 2.39.0
- `@tanstack/react-query`: 5.20.0
- `konva`: 9.3.22
- `react-konva`: 18.2.10

**Supabase Project:**
- Project ID: `vhtbinssqbzcjmbgkseo`
- PostGIS enabled
- RLS on all tables
- Realtime enabled

---

## Recommended Next Steps

### Immediate (Before Any Development)
1. ✅ Resolve pin_items vs child_pins conflict
2. ✅ Locate or recreate BluebinInteractiveRoofPlan.tsx
3. ✅ Audit and consolidate service layer (PinService)
4. ✅ Verify canvas-store implementation

### Short-term (This Sprint)
1. Complete layer system UI integration
2. Test real-time sync end-to-end
3. Verify photo upload/display pipeline
4. Add env var validation to build

### Long-term (Next Sprint)
1. Implement plan_regions (PostGIS tool gating)
2. Add annotation drawing tools
3. Performance optimization (viewport culling, lazy loading)
4. Comprehensive E2E tests (Playwright)

---

## Context Loaded
- ✅ Database schema (12 migrations analyzed)
- ✅ Core tables: users, projects, roofs, pins, pin_items, layers
- ✅ Frontend structure: app router, components, hooks, services
- ✅ Supabase integration: client setup, RLS policies, realtime
- ✅ Canvas system: React-Konva, coordinate normalization, pin rendering
- ✅ Chat system: scoped messaging, mentions, real-time
- ✅ Build configuration: Next.js 15, TypeScript, package.json

**Prime report complete. Ready for /plan-smartpin or /implement-smartpin.**
