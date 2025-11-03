# SmartPin TPO - Master Specification (Single Source of Truth)
**Version:** 2.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready

---

## 📌 Document Purpose
This is the **single source of truth** for SmartPin TPO. All other documentation, code, and database schemas MUST align with this specification. Any conflicts should be resolved by updating the conflicting document to match THIS specification.

---

## 🎯 System Overview

### Core Description
SmartPin TPO is a mobile-first Progressive Web Application for construction quality control, specifically designed for roof inspection management in industrial construction projects. The system enables real-time collaborative tracking, documentation, and resolution of construction issues through a visual pin-based interface.

### Key Capabilities
- **Hierarchical Issue Tracking**: Parent pins (1, 2, 3) with children (1.1, 1.2, 1.3)
- **Real-time Collaboration**: WebSocket-based instant updates across all connected clients
- **Visual Documentation**: Dual-photo evidence system (opening + closing photos)
- **Automated Workflows**: Status transitions triggered by photo uploads
- **Mobile-First**: PWA with offline capabilities and touch gestures
- **Canvas-based UI**: Interactive roof plan visualization with Konva
- **Export System**: PDF reports and CSV data exports
- **MTTR Tracking**: Automated Mean Time To Repair calculations

---

## 🔐 Hard Rules (Non-Negotiable)

### 1. TypeScript Nullability Rules
```typescript
// ✅ CORRECT: DB nullable fields remain T | null
type User = {
  email: string | null      // ✅ from DB nullable field
  name: string             // ✅ from DB non-null field
}

// ❌ WRONG: Do NOT use optional (?)
type User = {
  email?: string           // ❌ NEVER use ? for DB nullables
}

// ❌ WRONG: Do NOT inject undefined
const user: User = {
  email: undefined         // ❌ NEVER - use null or S() function
}

// ❌ WRONG: No any, no non-null assertion (!)
const name = user.name!    // ❌ NEVER use !
const data: any = {}       // ❌ NEVER use any
```

**Enforcement:**
- `exactOptionalPropertyTypes: true` in tsconfig.json
- `strictNullChecks: true` in tsconfig.json
- ESLint rule: `@typescript-eslint/no-explicit-any`
- ESLint rule: `@typescript-eslint/no-non-null-assertion`

### 2. Normalization API (Mandatory)
**Location:** `src/lib/typing/normalize.ts`

```typescript
// Core normalization functions
export const S = (v: string | null | undefined, fallback = ''): string => 
  v ?? fallback

export const N = (v: number | null | undefined, fallback = 0): number => 
  v ?? fallback

export const B = (v: boolean | null | undefined, fallback = false): boolean => 
  v ?? fallback

export const A = <T>(v: T[] | null | undefined, fallback: T[] = []): T[] => 
  v ?? fallback

export const D = (v: string | null | undefined): string | null => 
  v ?? null
```

**Usage Rules:**
1. **S()**: Use for all string fields from DB when UI expects string
2. **D()**: Use for date/timestamp fields when UI accepts null
3. **N()**: Use for numeric fields with default fallback
4. **B()**: Use for boolean fields with default fallback
5. **A()**: Use for array fields with empty array fallback

**Example - DB to UI Mapping:**
```typescript
import { S, D, N } from '@/lib/typing/normalize'
import type { Database } from '@/lib/database.types'

type DbUser = Database['public']['Tables']['users']['Row']

export type UiUser = {
  id: string
  name: string                    // always string (normalized)
  email: string                   // always string (normalized)
  role: UserRole
  created_at: string | null       // preserves null
  last_login_at: string | null    // preserves null
}

export function toUiUser(dbUser: DbUser): UiUser {
  return {
    id: dbUser.id,
    name: S(dbUser.full_name).trim() || S(dbUser.email, 'User'),
    email: S(dbUser.email),
    role: dbUser.role as UserRole,
    created_at: D(dbUser.created_at),
    last_login_at: D(dbUser.last_login_at),
  }
}
```

### 3. React Hooks Rules
```typescript
// ✅ CORRECT: Dependencies are explicit and complete
useEffect(() => {
  fetchData(userId, projectId)
}, [userId, projectId])

// ✅ CORRECT: Stable references with useCallback
const handleClick = useCallback(() => {
  doSomething(value)
}, [value])

// ❌ WRONG: No hooks in conditionals
if (condition) {
  useEffect(() => {})  // ❌ NEVER
}

// ❌ WRONG: No hooks in loops
items.forEach(() => {
  useEffect(() => {})  // ❌ NEVER
})

// ❌ WRONG: No setState during render
function Component() {
  setState(value)      // ❌ NEVER - use useEffect
}
```

**Enforcement:**
- ESLint plugin: `eslint-plugin-react-hooks`
- Rule: `react-hooks/rules-of-hooks: error`
- Rule: `react-hooks/exhaustive-deps: error`

### 4. Next.js Image & Accessibility
```tsx
// ✅ CORRECT: Use next/image with alt
import Image from 'next/image'

<Image 
  src="/photo.jpg" 
  alt="Inspector examining roof membrane" 
  width={800} 
  height={600} 
/>

// ✅ CORRECT: Decorative images
<Image 
  src="/decoration.png" 
  alt="" 
  width={100} 
  height={100} 
/>

// ❌ WRONG: Never use <img>
<img src="/photo.jpg" />  // ❌ NEVER

// ❌ WRONG: Missing alt
<Image src="/photo.jpg" width={800} height={600} />  // ❌ NEVER
```

**Remote Images Configuration:**
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vhtbinssqbzcjmbgkseo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

### 5. Code Change Policy
**Minimal Changes Only:**
- ✅ Bug fixes within existing architecture
- ✅ Type corrections that don't change DB schema
- ✅ UI improvements without API changes
- ❌ Breaking changes to public APIs
- ❌ Changes to `database.types.ts` (DB schema file)
- ❌ Architectural refactoring without approval

**STOP Format:**
When a change violates rules or requires decision:
```
STOP: Rule Violation: <rule_name>
File: <path>[:line]
Blocked Action: <description>
Options:
  A) Conservative fix: <description>
  B) Temporary workaround with comment: <description>
  C) Cancel change: <description>
```

---

## 🗄️ Database Schema (PostgreSQL 15 + PostGIS)

### Schema Principles
1. **Normalization**: 3NF minimum
2. **Audit Trail**: `created_at`, `updated_at`, `created_by` on all tables
3. **Soft Deletes**: Use `deleted_at` instead of hard deletes (where applicable)
4. **UUIDs**: All primary keys are UUID v4
5. **RLS**: Row Level Security enabled on all tables
6. **Timestamps**: All use `TIMESTAMPTZ` (with timezone)

---

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (
    role IN (
      'Admin',
      'QA_Manager',
      'Inspector',
      'Contractor',
      'PM',
      'CEO',
      'OM',
      'CM',
      'Site_Manager'
    )
  ),
  phone TEXT,
  company_id UUID REFERENCES companies(id),
  avatar_url TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_same_company" ON users
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );
```

---

### Table: `companies`
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_code ON companies(code);
```

---

### Table: `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  
  -- Dates
  start_date DATE,
  actual_start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  
  -- Relationships
  contractor_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  
  -- Stakeholders (array of user IDs)
  stakeholders UUID[] DEFAULT '{}',
  
  -- Settings
  notification_settings JSONB DEFAULT '{
    "email_on_pin_create": true,
    "email_on_status_change": true,
    "email_on_photo_upload": true
  }',
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_projects_contractor ON projects(contractor_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_stakeholders ON projects USING GIN(stakeholders);
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_stakeholder" ON projects
  FOR SELECT USING (
    auth.uid() = ANY(stakeholders) OR
    auth.uid() = created_by OR
    auth.uid() = contractor_id OR
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "projects_insert_admin_qa" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Admin', 'QA_Manager')
    )
  );
```

---

### Table: `roofs`
```sql
CREATE TABLE roofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Roof identification
  name TEXT NOT NULL,
  code TEXT,
  building_number TEXT,
  
  -- Plan image
  plan_image_url TEXT NOT NULL,
  plan_image_width INTEGER,
  plan_image_height INTEGER,
  
  -- Metadata
  area_sqm NUMERIC(10, 2),
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(project_id, code)
);

-- Indexes
CREATE INDEX idx_roofs_project ON roofs(project_id);
CREATE INDEX idx_roofs_deleted ON roofs(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE roofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roofs_select_via_project" ON roofs
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects
      -- Projects RLS will handle access
    )
  );
```

---

### Table: `pins` (Parent Issues)
**CRITICAL:** This is the authoritative schema. All code must align with this.

```sql
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ⚠️ IMPORTANT: roof_id is the correct foreign key (NOT project_id)
  roof_id UUID NOT NULL REFERENCES roofs(id) ON DELETE CASCADE,
  
  -- Sequence number (auto-increment per roof)
  seq_number INTEGER NOT NULL,
  
  -- Position (normalized 0-1 coordinates)
  x_position NUMERIC(6, 4) CHECK (x_position >= 0 AND x_position <= 1),
  y_position NUMERIC(6, 4) CHECK (y_position >= 0 AND y_position <= 1),
  
  -- Issue classification
  issue_type TEXT CHECK (issue_type IN (
    'INC',              -- Incomplete work
    'COR',              -- Correction required
    'TradeDamage',      -- Damage by another trade
    'QualityControl'    -- QC observation
  )),
  
  defect_type TEXT,     -- Free text or predefined categories
  
  defect_layer TEXT CHECK (defect_layer IN (
    'DENSDECK',
    'INSULATION',
    'SURFACE_PREP',     -- ⚠️ IMPORTANT: underscore, not space
    'TPO',
    'VB'                -- Vapor Barrier
  )),
  
  -- ⚠️ IMPORTANT: severity is TEXT (not INTEGER)
  severity TEXT CHECK (severity IN (
    'Critical',
    'High',
    'Medium',
    'Low'
  )),
  
  -- ⚠️ IMPORTANT: Status values (exact spelling matters)
  status TEXT DEFAULT 'Open' CHECK (status IN (
    'Open',
    'ReadyForInspection',  -- ⚠️ NOT "ReadyToInspect"
    'Closed',
    'InDispute'
  )),
  
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES users(id),
  
  -- Photos (both full size and thumbnails)
  opening_photo_url TEXT,
  opening_photo_thumb TEXT,      -- ⚠️ IMPORTANT: thumbnail URLs
  closing_photo_url TEXT,
  closing_photo_thumb TEXT,      -- ⚠️ IMPORTANT: thumbnail URLs
  
  -- Description and notes
  description TEXT,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  
  -- MTTR (Mean Time To Repair) - auto-calculated
  mttr_hours NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE
      WHEN closed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600
      ELSE NULL
    END
  ) STORED,
  
  UNIQUE(roof_id, seq_number)
);

-- Indexes
CREATE INDEX idx_pins_roof ON pins(roof_id);
CREATE INDEX idx_pins_roof_status ON pins(roof_id, status);
CREATE INDEX idx_pins_status ON pins(status);
CREATE INDEX idx_pins_severity ON pins(severity);
CREATE INDEX idx_pins_created_at ON pins(created_at DESC);
CREATE INDEX idx_pins_deleted ON pins(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_pins_position ON pins(x_position, y_position);

-- RLS Policies
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pins_select_via_roof" ON pins
  FOR SELECT USING (
    roof_id IN (SELECT id FROM roofs)
  );

CREATE POLICY "pins_insert_inspector_plus" ON pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Admin', 'QA_Manager', 'Inspector')
    )
  );

CREATE POLICY "pins_update_inspector_plus" ON pins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('Admin', 'QA_Manager', 'Inspector', 'Contractor')
    )
  );
```

---

### Table: `pin_children` (Child Issues)
```sql
CREATE TABLE pin_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  parent_pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  
  -- Child sequence (e.g., "1.1", "1.2", "2.1")
  child_seq TEXT NOT NULL,
  
  -- Position (normalized 0-1 coordinates)
  x_position NUMERIC(6, 4) CHECK (x_position >= 0 AND x_position <= 1),
  y_position NUMERIC(6, 4) CHECK (y_position >= 0 AND y_position <= 1),
  
  -- Status (same enum as parent)
  status TEXT DEFAULT 'Open' CHECK (status IN (
    'Open',
    'ReadyForInspection',
    'Closed',
    'InDispute'
  )),
  
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES users(id),
  
  -- Photos
  opening_photo_url TEXT,
  opening_photo_thumb TEXT,
  closing_photo_url TEXT,
  closing_photo_thumb TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  
  -- MTTR for child
  mttr_hours NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE
      WHEN closed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600
      ELSE NULL
    END
  ) STORED,
  
  UNIQUE(parent_pin_id, child_seq)
);

-- Indexes
CREATE INDEX idx_pin_children_parent ON pin_children(parent_pin_id);
CREATE INDEX idx_pin_children_status ON pin_children(status);
CREATE INDEX idx_pin_children_created_at ON pin_children(created_at DESC);
CREATE INDEX idx_pin_children_deleted ON pin_children(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE pin_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pin_children_select_via_parent" ON pin_children
  FOR SELECT USING (
    parent_pin_id IN (SELECT id FROM pins)
  );
```

---

### Table: `photos`
Additional photo storage beyond opening/closing photos.

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Can belong to pin or pin_child
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  pin_child_id UUID REFERENCES pin_children(id) ON DELETE CASCADE,
  
  -- Photo details
  url TEXT NOT NULL,
  thumb_url TEXT,
  caption TEXT,
  photo_type TEXT CHECK (photo_type IN (
    'opening',
    'closing',
    'progress',
    'detail',
    'context'
  )),
  
  -- Metadata
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  
  -- Audit
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CHECK (
    (pin_id IS NOT NULL AND pin_child_id IS NULL) OR
    (pin_id IS NULL AND pin_child_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_photos_pin ON photos(pin_id);
CREATE INDEX idx_photos_pin_child ON photos(pin_child_id);
CREATE INDEX idx_photos_deleted ON photos(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select_via_pin" ON photos
  FOR SELECT USING (
    pin_id IN (SELECT id FROM pins) OR
    pin_child_id IN (SELECT id FROM pin_children)
  );
```

---

### Table: `activity_logs`
Audit trail and chat integration.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  pin_child_id UUID REFERENCES pin_children(id) ON DELETE CASCADE,
  
  -- Activity details
  action TEXT NOT NULL CHECK (action IN (
    'pin_created',
    'pin_updated',
    'status_changed',
    'photo_uploaded',
    'photo_deleted',
    'child_added',
    'child_updated',
    'child_deleted',
    'comment_added',
    'user_mentioned',
    'pin_closed',
    'pin_reopened',
    'dispute_opened',
    'dispute_resolved'
  )),
  
  -- Structured details (JSON)
  details JSONB NOT NULL DEFAULT '{}',
  
  -- User context
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,  -- Denormalized for performance
  user_role TEXT,            -- Denormalized
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (
    pin_id IS NOT NULL OR pin_child_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_activity_logs_pin ON activity_logs(pin_id, created_at DESC);
CREATE INDEX idx_activity_logs_pin_child ON activity_logs(pin_child_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- GIN index for JSONB queries
CREATE INDEX idx_activity_logs_details ON activity_logs USING GIN(details);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_via_pin" ON activity_logs
  FOR SELECT USING (
    pin_id IN (SELECT id FROM pins) OR
    pin_child_id IN (SELECT id FROM pin_children)
  );
```

**Example Activity Log Entries:**
```json
// Status change
{
  "action": "status_changed",
  "details": {
    "from_status": "Open",
    "to_status": "ReadyForInspection",
    "reason": "Closing photo uploaded",
    "pin_sequence": "1.2"
  },
  "user_name": "John Inspector",
  "user_role": "Inspector"
}

// Photo uploaded
{
  "action": "photo_uploaded",
  "details": {
    "photo_type": "closing",
    "pin_sequence": "3.1",
    "file_name": "IMG_20240115_143022.jpg",
    "file_size": 2457600
  }
}

// Child added
{
  "action": "child_added",
  "details": {
    "parent_seq": "1",
    "child_seq": "1.3",
    "position": {"x": 0.4567, "y": 0.3421}
  }
}
```

---

### Table: `canvas_layers`
For future advanced layer management.

```sql
CREATE TABLE canvas_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID NOT NULL REFERENCES roofs(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  layer_type TEXT CHECK (layer_type IN (
    'issues',
    'notes',
    'measurements',
    'custom'
  )),
  
  visible BOOLEAN DEFAULT true,
  opacity NUMERIC(3, 2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  locked BOOLEAN DEFAULT false,
  z_index INTEGER DEFAULT 0,
  
  settings JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(roof_id, name)
);

CREATE INDEX idx_canvas_layers_roof ON canvas_layers(roof_id);
CREATE INDEX idx_canvas_layers_z_index ON canvas_layers(roof_id, z_index);
```

---

### Database Functions

#### Auto-increment seq_number for pins
```sql
CREATE OR REPLACE FUNCTION get_next_pin_seq(p_roof_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(seq_number), 0) + 1
  INTO next_seq
  FROM pins
  WHERE roof_id = p_roof_id
    AND deleted_at IS NULL;
  
  RETURN next_seq;
END;
$$ LANGUAGE plpgsql;
```

#### Trigger to update parent status when all children are closed
```sql
CREATE OR REPLACE FUNCTION update_parent_status_on_child_close()
RETURNS TRIGGER AS $$
BEGIN
  -- If child is being closed
  IF NEW.status = 'Closed' AND OLD.status != 'Closed' THEN
    -- Check if all siblings are closed
    IF NOT EXISTS (
      SELECT 1
      FROM pin_children
      WHERE parent_pin_id = NEW.parent_pin_id
        AND status != 'Closed'
        AND deleted_at IS NULL
        AND id != NEW.id
    ) THEN
      -- All children closed, update parent to Closed
      UPDATE pins
      SET 
        status = 'Closed',
        status_changed_at = NOW(),
        status_changed_by = NEW.status_changed_by,
        closed_at = NOW(),
        closed_by = NEW.closed_by
      WHERE id = NEW.parent_pin_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parent_on_child_close
AFTER UPDATE OF status ON pin_children
FOR EACH ROW
EXECUTE FUNCTION update_parent_status_on_child_close();
```

#### Trigger to log activity automatically
```sql
CREATE OR REPLACE FUNCTION log_pin_activity()
RETURNS TRIGGER AS $$
DECLARE
  current_user_name TEXT;
  current_user_role TEXT;
BEGIN
  -- Get user details
  SELECT full_name, role INTO current_user_name, current_user_role
  FROM users
  WHERE id = auth.uid();
  
  -- Log the activity
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (pin_id, action, details, user_id, user_name, user_role)
    VALUES (
      NEW.id,
      'pin_created',
      jsonb_build_object(
        'seq_number', NEW.seq_number,
        'issue_type', NEW.issue_type,
        'severity', NEW.severity
      ),
      auth.uid(),
      current_user_name,
      current_user_role
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changed
    IF NEW.status != OLD.status THEN
      INSERT INTO activity_logs (pin_id, action, details, user_id, user_name, user_role)
      VALUES (
        NEW.id,
        'status_changed',
        jsonb_build_object(
          'from_status', OLD.status,
          'to_status', NEW.status,
          'seq_number', NEW.seq_number
        ),
        auth.uid(),
        current_user_name,
        current_user_role
      );
    END IF;
    
    -- Closing photo added
    IF NEW.closing_photo_url IS NOT NULL AND OLD.closing_photo_url IS NULL THEN
      INSERT INTO activity_logs (pin_id, action, details, user_id, user_name, user_role)
      VALUES (
        NEW.id,
        'photo_uploaded',
        jsonb_build_object(
          'photo_type', 'closing',
          'seq_number', NEW.seq_number
        ),
        auth.uid(),
        current_user_name,
        current_user_role
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_pin_activity
AFTER INSERT OR UPDATE ON pins
FOR EACH ROW
EXECUTE FUNCTION log_pin_activity();
```

---

## 📐 Type Definitions (TypeScript)

### Database Types
**File:** `src/lib/database.types.ts`
**⚠️ NEVER EDIT THIS FILE MANUALLY** - Generated by Supabase CLI

```bash
# Generate types from Supabase
npx supabase gen types typescript --project-id vhtbinssqbzcjmbgkseo > src/lib/database.types.ts
```

### UI Types
**File:** `src/lib/types/index.ts`

```typescript
// ============================================================================
// ENUMS (Must match DB exactly)
// ============================================================================

export type UserRole =
  | 'Admin'
  | 'QA_Manager'
  | 'Inspector'
  | 'Contractor'
  | 'PM'
  | 'CEO'
  | 'OM'
  | 'CM'
  | 'Site_Manager'

export type PinStatus =
  | 'Open'
  | 'ReadyForInspection'
  | 'Closed'
  | 'InDispute'

export type Severity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'

export type IssueType =
  | 'INC'
  | 'COR'
  | 'TradeDamage'
  | 'QualityControl'

export type DefectLayer =
  | 'DENSDECK'
  | 'INSULATION'
  | 'SURFACE_PREP'
  | 'TPO'
  | 'VB'

export type ActivityAction =
  | 'pin_created'
  | 'pin_updated'
  | 'status_changed'
  | 'photo_uploaded'
  | 'photo_deleted'
  | 'child_added'
  | 'child_updated'
  | 'child_deleted'
  | 'comment_added'
  | 'user_mentioned'
  | 'pin_closed'
  | 'pin_reopened'
  | 'dispute_opened'
  | 'dispute_resolved'

// ============================================================================
// UI MODELS (After normalization)
// ============================================================================

export type UiUser = {
  id: string
  email: string
  name: string
  role: UserRole
  phone: string
  companyId: string | null
  avatarUrl: string | null
  permissions: Record<string, boolean>
  createdAt: string | null
  lastLoginAt: string | null
}

export type UiProject = {
  id: string
  name: string
  code: string
  description: string
  startDate: string | null
  actualStartDate: string | null
  endDate: string | null
  actualEndDate: string | null
  contractorId: string | null
  companyId: string | null
  stakeholders: string[]
  notificationSettings: {
    emailOnPinCreate: boolean
    emailOnStatusChange: boolean
    emailOnPhotoUpload: boolean
  }
  createdBy: string | null
  createdAt: string | null
}

export type UiRoof = {
  id: string
  projectId: string
  name: string
  code: string
  buildingNumber: string
  planImageUrl: string
  planImageWidth: number | null
  planImageHeight: number | null
  areaSqm: number | null
  notes: string
  createdBy: string | null
  createdAt: string | null
}

export type UiPin = {
  id: string
  roofId: string
  seqNumber: number
  xPosition: number
  yPosition: number
  issueType: IssueType | null
  defectType: string
  defectLayer: DefectLayer | null
  severity: Severity | null
  status: PinStatus
  statusChangedAt: string | null
  statusChangedBy: string | null
  openingPhotoUrl: string | null
  openingPhotoThumb: string | null
  closingPhotoUrl: string | null
  closingPhotoThumb: string | null
  description: string
  resolutionNotes: string
  createdAt: string | null
  createdBy: string | null
  closedAt: string | null
  closedBy: string | null
  mttrHours: number | null
}

export type UiPinChild = {
  id: string
  parentPinId: string
  childSeq: string
  xPosition: number
  yPosition: number
  status: PinStatus
  statusChangedAt: string | null
  statusChangedBy: string | null
  openingPhotoUrl: string | null
  openingPhotoThumb: string | null
  closingPhotoUrl: string | null
  closingPhotoThumb: string | null
  notes: string
  createdAt: string | null
  createdBy: string | null
  closedAt: string | null
  closedBy: string | null
  mttrHours: number | null
}

export type UiActivityLog = {
  id: string
  pinId: string | null
  pinChildId: string | null
  action: ActivityAction
  details: Record<string, any>
  userId: string | null
  userName: string
  userRole: string | null
  createdAt: string | null
}

// ============================================================================
// HELPERS
// ============================================================================

export type PinWithChildren = UiPin & {
  children: UiPinChild[]
  childrenCount: number
  openChildrenCount: number
  closedChildrenCount: number
}

export type RoofWithStats = UiRoof & {
  totalPins: number
  openPins: number
  readyPins: number
  closedPins: number
  disputedPins: number
}
```

### Mappers (DB → UI)
**File:** `src/lib/mappers/pin.mappers.ts`

```typescript
import { S, D, N, B } from '@/lib/typing/normalize'
import type { Database } from '@/lib/database.types'
import type { UiPin, UiPinChild } from '@/lib/types'

type DbPin = Database['public']['Tables']['pins']['Row']
type DbPinChild = Database['public']['Tables']['pin_children']['Row']

export function toUiPin(dbPin: DbPin): UiPin {
  return {
    id: dbPin.id,
    roofId: dbPin.roof_id,
    seqNumber: N(dbPin.seq_number),
    xPosition: N(dbPin.x_position),
    yPosition: N(dbPin.y_position),
    issueType: dbPin.issue_type as UiPin['issueType'],
    defectType: S(dbPin.defect_type),
    defectLayer: dbPin.defect_layer as UiPin['defectLayer'],
    severity: dbPin.severity as UiPin['severity'],
    status: dbPin.status as UiPin['status'],
    statusChangedAt: D(dbPin.status_changed_at),
    statusChangedBy: dbPin.status_changed_by ?? null,
    openingPhotoUrl: dbPin.opening_photo_url ?? null,
    openingPhotoThumb: dbPin.opening_photo_thumb ?? null,
    closingPhotoUrl: dbPin.closing_photo_url ?? null,
    closingPhotoThumb: dbPin.closing_photo_thumb ?? null,
    description: S(dbPin.description),
    resolutionNotes: S(dbPin.resolution_notes),
    createdAt: D(dbPin.created_at),
    createdBy: dbPin.created_by ?? null,
    closedAt: D(dbPin.closed_at),
    closedBy: dbPin.closed_by ?? null,
    mttrHours: dbPin.mttr_hours ?? null,
  }
}

export function toUiPinChild(dbChild: DbPinChild): UiPinChild {
  return {
    id: dbChild.id,
    parentPinId: dbChild.parent_pin_id,
    childSeq: S(dbChild.child_seq),
    xPosition: N(dbChild.x_position),
    yPosition: N(dbChild.y_position),
    status: dbChild.status as UiPinChild['status'],
    statusChangedAt: D(dbChild.status_changed_at),
    statusChangedBy: dbChild.status_changed_by ?? null,
    openingPhotoUrl: dbChild.opening_photo_url ?? null,
    openingPhotoThumb: dbChild.opening_photo_thumb ?? null,
    closingPhotoUrl: dbChild.closing_photo_url ?? null,
    closingPhotoThumb: dbChild.closing_photo_thumb ?? null,
    notes: S(dbChild.notes),
    createdAt: D(dbChild.created_at),
    createdBy: dbChild.created_by ?? null,
    closedAt: D(dbChild.closed_at),
    closedBy: dbChild.closed_by ?? null,
    mttrHours: dbChild.mttr_hours ?? null,
  }
}
```

---

## 🎨 UI Constants & Styling

### Status Colors
```typescript
// File: src/lib/constants/colors.ts

export const STATUS_COLORS = {
  Open: '#ef4444',              // red-500
  ReadyForInspection: '#f59e0b', // amber-500
  Closed: '#10b981',            // green-500
  InDispute: '#fb923c',         // orange-400
} as const

export const SEVERITY_COLORS = {
  Critical: '#dc2626',          // red-600
  High: '#f59e0b',              // amber-500
  Medium: '#eab308',            // yellow-500
  Low: '#22c55e',               // green-500
} as const
```

---

## 🖼️ Canvas Implementation (Konva)

### Coordinate System
**CRITICAL:** All pin positions are stored as normalized coordinates (0-1).

```typescript
// File: src/lib/utils/coordinates.ts

export class PinCoordinates {
  /**
   * Convert canvas pixel coordinates to normalized (0-1)
   */
  static toNormalized(
    pixelX: number,
    pixelY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(1, pixelX / canvasWidth)),
      y: Math.max(0, Math.min(1, pixelY / canvasHeight)),
    }
  }

  /**
   * Convert normalized coordinates to canvas pixels
   */
  static toPixels(
    normalizedX: number,
    normalizedY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    return {
      x: normalizedX * canvasWidth,
      y: normalizedY * canvasHeight,
    }
  }

  /**
   * Snap to grid (for precision)
   */
  static snapToGrid(
    x: number,
    y: number,
    gridSize: number = 1
  ): { x: number; y: number } {
    return {
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
    }
  }
}
```

### Pin Marker Component
```tsx
// File: src/components/canvas/PinMarker.tsx

import { Group, Circle, Text } from 'react-konva'
import { STATUS_COLORS } from '@/lib/constants/colors'
import type { UiPin, PinStatus } from '@/lib/types'

type PinMarkerProps = {
  pin: UiPin
  stageWidth: number
  stageHeight: number
  scale: number
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PinMarker({
  pin,
  stageWidth,
  stageHeight,
  scale,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PinMarkerProps) {
  const pixelPos = {
    x: pin.xPosition * stageWidth,
    y: pin.yPosition * stageHeight,
  }

  const radius = 15 / scale
  const fontSize = 12 / scale
  const strokeWidth = 2 / scale

  return (
    <Group
      x={pixelPos.x}
      y={pixelPos.y}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Pin circle */}
      <Circle
        radius={radius}
        fill={STATUS_COLORS[pin.status]}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />

      {/* Pin number */}
      <Text
        text={String(pin.seqNumber)}
        fontSize={fontSize}
        fill="white"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
      />
    </Group>
  )
}
```

### Thumbnail Hover
```tsx
// File: src/components/canvas/PinThumbnailTooltip.tsx

import { Group, Rect, Image as KonvaImage } from 'react-konva'
import { useState, useEffect } from 'react'

type TooltipProps = {
  thumbUrl: string
  x: number
  y: number
}

export function PinThumbnailTooltip({ thumbUrl, x, y }: TooltipProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = thumbUrl
    img.onload = () => setImage(img)
  }, [thumbUrl])

  if (!image) return null

  const tooltipWidth = 150
  const tooltipHeight = 150

  return (
    <Group x={x + 20} y={y - tooltipHeight - 10}>
      {/* White background with shadow */}
      <Rect
        width={tooltipWidth}
        height={tooltipHeight}
        fill="white"
        stroke="#e5e7eb"
        strokeWidth={1}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.2}
      />

      {/* Thumbnail image */}
      <KonvaImage
        image={image}
        width={tooltipWidth}
        height={tooltipHeight}
      />
    </Group>
  )
}
```

---

## ⚡ Real-time Collaboration

### Supabase Realtime Channels
```typescript
// File: src/lib/realtime/channels.ts

import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type ChannelType = 'project' | 'roof' | 'pin' | 'presence'

export function getChannelName(type: ChannelType, id: string): string {
  return `${type}:${id}`
}

export function subscribeToRoof(
  roofId: string,
  callbacks: {
    onPinInsert?: (payload: any) => void
    onPinUpdate?: (payload: any) => void
    onPinDelete?: (payload: any) => void
  }
): RealtimeChannel {
  const channel = supabase.channel(getChannelName('roof', roofId))

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pins',
        filter: `roof_id=eq.${roofId}`,
      },
      (payload) => callbacks.onPinInsert?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pins',
        filter: `roof_id=eq.${roofId}`,
      },
      (payload) => callbacks.onPinUpdate?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'pins',
        filter: `roof_id=eq.${roofId}`,
      },
      (payload) => callbacks.onPinDelete?.(payload)
    )
    .subscribe()

  return channel
}

export function unsubscribeFromRoof(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}
```

### Activity Broadcasting
```typescript
// File: src/lib/realtime/activity.ts

import { supabase } from '@/lib/supabase/client'
import type { ActivityAction } from '@/lib/types'

export async function broadcastActivity(
  pinId: string,
  action: ActivityAction,
  details: Record<string, any>
): Promise<void> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return

  // 1. Insert to database (triggers log automatically)
  const { error } = await supabase.from('activity_logs').insert({
    pin_id: pinId,
    action,
    details,
    user_id: user.user.id,
    user_name: user.user.user_metadata.full_name || user.user.email,
    user_role: user.user.user_metadata.role,
  })

  if (error) {
    console.error('Failed to log activity:', error)
    return
  }

  // 2. Broadcast to channel
  const channel = supabase.channel(`pin:${pinId}`)
  await channel.send({
    type: 'broadcast',
    event: 'activity',
    payload: {
      action,
      details,
      timestamp: new Date().toISOString(),
    },
  })
}
```

---

## 📤 Export System

### PDF Export
```typescript
// File: src/lib/export/pdf.ts

import jsPDF from 'jspdf'
import type { UiPin, UiPinChild } from '@/lib/types'

export async function generatePinPDF(
  pin: UiPin,
  children: UiPinChild[],
  options: {
    companyLogoUrl?: string
    roofPlanSnapshotUrl?: string
  }
): Promise<void> {
  const doc = new jsPDF()

  // Page 1: Header and details
  doc.setFontSize(20)
  doc.text('SmartPin TPO - Issue Report', 20, 20)

  // Company logo
  if (options.companyLogoUrl) {
    const logoImg = await loadImageAsDataURL(options.companyLogoUrl)
    doc.addImage(logoImg, 'PNG', 150, 10, 40, 20)
  }

  // Issue details
  doc.setFontSize(12)
  doc.text(`Issue ID: ${pin.id}`, 20, 40)
  doc.text(`Sequence: ${pin.seqNumber}`, 20, 50)
  doc.text(`Status: ${pin.status}`, 20, 60)
  doc.text(`Severity: ${pin.severity || 'N/A'}`, 20, 70)
  doc.text(`Created: ${formatDate(pin.createdAt)}`, 20, 80)
  
  if (pin.closedAt) {
    doc.text(`Closed: ${formatDate(pin.closedAt)}`, 20, 90)
    doc.text(`MTTR: ${pin.mttrHours?.toFixed(2)} hours`, 20, 100)
  }

  // Roof plan snapshot
  if (options.roofPlanSnapshotUrl) {
    const mapImg = await loadImageAsDataURL(options.roofPlanSnapshotUrl)
    doc.addImage(mapImg, 'PNG', 20, 110, 170, 100)
  }

  // Pages 2+: Child pins with photos
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    doc.addPage()

    doc.setFontSize(16)
    doc.text(`Pin ${child.childSeq}`, 20, 20)

    doc.setFontSize(12)
    doc.text(`Status: ${child.status}`, 20, 30)

    // Opening photo (left side)
    if (child.openingPhotoUrl) {
      const openImg = await loadImageAsDataURL(child.openingPhotoUrl)
      doc.addImage(openImg, 'JPEG', 20, 40, 80, 80)
      doc.text('Opening Photo', 20, 125)
    }

    // Closing photo (right side)
    if (child.closingPhotoUrl) {
      const closeImg = await loadImageAsDataURL(child.closingPhotoUrl)
      doc.addImage(closeImg, 'JPEG', 110, 40, 80, 80)
      doc.text('Closing Photo', 110, 125)
    }

    // Notes
    if (child.notes) {
      doc.setFontSize(10)
      doc.text(`Notes: ${child.notes}`, 20, 135, { maxWidth: 170 })
    }
  }

  // Save
  doc.save(`Issue_${pin.seqNumber}_${Date.now()}.pdf`)
}

async function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function formatDate(isoString: string | null): string {
  if (!isoString) return 'N/A'
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
```

### CSV Export
```typescript
// File: src/lib/export/csv.ts

import type { UiPin } from '@/lib/types'

export function exportPinsToCSV(pins: UiPin[]): void {
  const headers = [
    'ID',
    'Sequence',
    'Status',
    'Issue Type',
    'Defect Type',
    'Defect Layer',
    'Severity',
    'Created',
    'Closed',
    'MTTR (hours)',
  ]

  const rows = pins.map((pin) => [
    pin.id,
    pin.seqNumber.toString(),
    pin.status,
    pin.issueType || '',
    pin.defectType,
    pin.defectLayer || '',
    pin.severity || '',
    formatDate(pin.createdAt),
    formatDate(pin.closedAt),
    pin.mttrHours?.toFixed(2) || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `pins_export_${Date.now()}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

function formatDate(isoString: string | null): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-US')
}
```

---

## 🔄 Status Automation Rules

### Rule 1: Child Closing Photo Upload
**Trigger:** Closing photo uploaded to child pin  
**Action:** Change child status to `ReadyForInspection`

```typescript
// File: src/lib/services/pin.service.ts

export async function uploadChildClosingPhoto(
  childId: string,
  photoFile: File
): Promise<void> {
  const { data: child } = await supabase
    .from('pin_children')
    .select('*')
    .eq('id', childId)
    .single()

  if (!child) throw new Error('Child not found')

  // Upload photo
  const { photoUrl, thumbUrl } = await uploadPhotoWithThumbnail(
    photoFile,
    `pins/${child.parent_pin_id}/children/${childId}`
  )

  // Update child with photo and status
  await supabase
    .from('pin_children')
    .update({
      closing_photo_url: photoUrl,
      closing_photo_thumb: thumbUrl,
      status: 'ReadyForInspection',
      status_changed_at: new Date().toISOString(),
      status_changed_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', childId)

  // Log activity
  await broadcastActivity(child.parent_pin_id, 'photo_uploaded', {
    photo_type: 'closing',
    child_seq: child.child_seq,
  })
}
```

### Rule 2: All Children Closed
**Trigger:** Last child of parent changes to `Closed`  
**Action:** Change parent status to `Closed`  
**Implementation:** Database trigger (see DB schema section)

### Rule 3: Parent Cannot Close If Children Open
**Validation:** Prevent parent from closing if any children are not `Closed`

```typescript
export async function validateParentClose(parentPinId: string): Promise<boolean> {
  const { count } = await supabase
    .from('pin_children')
    .select('*', { count: 'exact', head: true })
    .eq('parent_pin_id', parentPinId)
    .neq('status', 'Closed')
    .is('deleted_at', null)

  return count === 0
}
```

---

## 📱 Mobile & PWA

### Service Worker Configuration
```javascript
// File: public/sw.js (generated by next-pwa)

// Cache strategies
const CACHE_NAME = 'smartpin-v1'
const ROUTES_CACHE = 'routes-v1'
const IMAGES_CACHE = 'images-v1'

// Routes to cache
const CACHED_ROUTES = [
  '/',
  '/dashboard',
  '/projects',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_ROUTES)
    })
  )
})

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Supabase images - cache first
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(IMAGES_CACHE).then((cache) => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
    return
  }

  // Default: network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return caches.open(ROUTES_CACHE).then((cache) => {
          cache.put(event.request, response.clone())
          return response
        })
      })
      .catch(() => caches.match(event.request))
  )
})
```

### Touch Gestures
```typescript
// File: src/lib/utils/touch.ts

export class TouchGestureHandler {
  private lastDistance = 0
  private isPinching = false

  attachToStage(stage: Konva.Stage, callbacks: {
    onPinch?: (scale: number) => void
    onTap?: (pos: { x: number; y: number }) => void
  }): void {
    // Pinch to zoom
    stage.on('touchmove', (e) => {
      const touches = e.evt.touches

      if (touches.length === 2) {
        e.evt.preventDefault()

        const touch1 = touches[0]
        const touch2 = touches[1]

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        if (this.lastDistance > 0) {
          const scale = stage.scaleX() * (distance / this.lastDistance)
          const clampedScale = Math.min(Math.max(scale, 0.5), 3)
          
          callbacks.onPinch?.(clampedScale)
        }

        this.lastDistance = distance
        this.isPinching = true
      }
    })

    // Reset on touch end
    stage.on('touchend', () => {
      this.lastDistance = 0
      this.isPinching = false
    })

    // Single tap
    stage.on('tap', (e) => {
      if (!this.isPinching) {
        const pos = stage.getPointerPosition()
        if (pos) callbacks.onTap?.(pos)
      }
    })
  }
}
```

---

## 🚀 Deployment

### Environment Variables
```bash
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=https://vhtbinssqbzcjmbgkseo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_MAX_PHOTO_SIZE=20971520  # 20MB
NEXT_PUBLIC_MAX_CHILD_PINS=50
```

### Build Commands
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "db:types": "npx supabase gen types typescript --project-id vhtbinssqbzcjmbgkseo > src/lib/database.types.ts"
  }
}
```

### Quality Gates (CI/CD)
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
```

---

## ✅ Verification Checklist

Before deploying or merging code, verify:

### Database
- [ ] All tables use `roof_id` (not `project_id`)
- [ ] `severity` is TEXT enum
- [ ] Status enum uses `ReadyForInspection`
- [ ] `SURFACE_PREP` uses underscore
- [ ] Thumbnail columns exist in pins and pin_children
- [ ] All RLS policies are enabled
- [ ] All triggers are created

### TypeScript
- [ ] No `any` types
- [ ] No `!` (non-null assertions)
- [ ] All DB → UI mappings use S(), D(), N(), A()
- [ ] Optional `?` is NOT used for nullable DB fields
- [ ] `database.types.ts` is up to date

### React
- [ ] All hooks have correct dependencies
- [ ] No hooks in conditionals or loops
- [ ] No setState during render

### Images
- [ ] All `<img>` replaced with `<Image />`
- [ ] All images have `alt` attributes
- [ ] Remote patterns configured in next.config.js

### Build
- [ ] `pnpm type-check` passes (0 errors)
- [ ] `pnpm lint` passes (0 warnings)
- [ ] `pnpm build` succeeds

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Konva Docs:** https://konvajs.org/docs/
- **React Query:** https://tanstack.com/query/latest/docs/react/overview

---

## 🔄 Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-01-08 | Initial unified specification - resolved all conflicts |

---

**END OF MASTER SPECIFICATION**
