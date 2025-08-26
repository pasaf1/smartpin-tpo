-- SmartPin TPO Production Database Schema
-- Initial migration to create all tables, relationships, and functions

-- Create custom types/enums
DO $$ BEGIN
    CREATE TYPE public.role AS ENUM ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.pin_status AS ENUM ('Open', 'ReadyForInspection', 'Closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.severity AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.image_kind AS ENUM ('Open', 'Close', 'Extra');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.defect_layer AS ENUM ('VaporBarrier', 'InsulationBoards', 'DensDeck', 'TPO_Membrane', 'Seams', 'Flashing', 'Drains', 'Curbs');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role public.role DEFAULT 'Viewer',
    address TEXT,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'InProgress', 'Completed')),
    contractor TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Roofs table
CREATE TABLE IF NOT EXISTS public.roofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    building TEXT,
    plan_image_url TEXT,
    roof_plan_url TEXT,
    zones JSONB DEFAULT '[]'::jsonb,
    stakeholders JSONB DEFAULT '[]'::jsonb,
    origin_lat DECIMAL,
    origin_lng DECIMAL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pins table (parent pins)
CREATE TABLE IF NOT EXISTS public.pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roof_id UUID NOT NULL REFERENCES public.roofs(id) ON DELETE CASCADE,
    seq_number INTEGER NOT NULL,
    zone TEXT,
    x DECIMAL NOT NULL,
    y DECIMAL NOT NULL,
    status public.pin_status DEFAULT 'Open',
    status_parent_manual public.pin_status DEFAULT 'Open',
    group_count INTEGER DEFAULT 0,
    children_total INTEGER DEFAULT 0,
    children_open INTEGER DEFAULT 0,
    children_ready INTEGER DEFAULT 0,
    children_closed INTEGER DEFAULT 0,
    parent_mix_state TEXT CHECK (parent_mix_state IN ('ALL_OPEN', 'MIXED', 'ALL_CLOSED')),
    opened_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT now(),
    last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Pin children table (individual issues)
CREATE TABLE IF NOT EXISTS public.pin_children (
    child_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    child_code TEXT NOT NULL,
    zone TEXT,
    defect_type TEXT,
    severity public.severity DEFAULT 'Medium',
    status_child public.pin_status DEFAULT 'Open',
    due_date TIMESTAMPTZ,
    open_date TIMESTAMPTZ DEFAULT now(),
    closed_date TIMESTAMPTZ,
    openpic_id UUID,
    closurepic_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('OpenPIC', 'ClosurePIC')),
    file_url_public TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    project_id UUID REFERENCES public.projects(project_id) ON DELETE SET NULL,
    roof_id UUID REFERENCES public.roofs(id) ON DELETE SET NULL,
    pin_id UUID REFERENCES public.pins(id) ON DELETE SET NULL,
    child_id UUID REFERENCES public.pin_children(child_id) ON DELETE SET NULL,
    file_name TEXT,
    file_size BIGINT,
    upload_type TEXT,
    thumbnail_url TEXT,
    mime_type TEXT,
    uploader JSONB,
    metadata JSONB
);

-- Add foreign key constraints for photos
ALTER TABLE public.pin_children 
ADD CONSTRAINT fk_pin_children_openpic 
FOREIGN KEY (openpic_id) REFERENCES public.photos(photo_id) ON DELETE SET NULL;

ALTER TABLE public.pin_children 
ADD CONSTRAINT fk_pin_children_closurepic 
FOREIGN KEY (closurepic_id) REFERENCES public.photos(photo_id) ON DELETE SET NULL;

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL CHECK (scope IN ('global', 'roof', 'pin')),
    scope_id UUID,
    text TEXT,
    mentions TEXT[],
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    diff JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filter_settings JSONB DEFAULT '{}'::jsonb,
    table_columns JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legacy tables (for backward compatibility)
CREATE TABLE IF NOT EXISTS public.pin_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    seq_suffix INTEGER NOT NULL,
    status public.pin_status DEFAULT 'Open',
    severity public.severity DEFAULT 'Medium',
    defect_type TEXT,
    defect_layer TEXT,
    description TEXT,
    cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    contractor TEXT,
    foreman TEXT,
    opened_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT now(),
    sla_due_date TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pin_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_item_id UUID NOT NULL REFERENCES public.pin_items(id) ON DELETE CASCADE,
    kind public.image_kind NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.pin_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_item_id UUID NOT NULL REFERENCES public.pin_items(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT,
    mentions JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pins_roof_id ON public.pins(roof_id);
CREATE INDEX IF NOT EXISTS idx_pins_status ON public.pins(status);
CREATE INDEX IF NOT EXISTS idx_pin_children_pin_id ON public.pin_children(pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_children_status ON public.pin_children(status_child);
CREATE INDEX IF NOT EXISTS idx_photos_pin_id ON public.photos(pin_id);
CREATE INDEX IF NOT EXISTS idx_photos_child_id ON public.photos(child_id);
CREATE INDEX IF NOT EXISTS idx_chats_scope ON public.chats(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_pins_roof_seq ON public.pins(roof_id, seq_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roofs_project_code ON public.roofs(project_id, code);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.projects;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON public.pin_children;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.pin_children
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON public.user_prefs;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.user_prefs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_chat ENABLE ROW LEVEL SECURITY;