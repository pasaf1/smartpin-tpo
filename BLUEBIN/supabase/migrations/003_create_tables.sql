-- Create core tables for SmartPin TPO
-- Translated from Hebrew, optimized for mobile performance

-- User roles enum for type safety
CREATE TYPE user_role AS ENUM ('admin', 'qa_manager', 'inspector', 'contractor', 'viewer');

-- Pin status enum for workflow management
CREATE TYPE pin_status AS ENUM ('Open', 'ReadyForReview', 'Closed');

-- Organizations table for multi-tenancy
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles with roles (extends Supabase auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id),
  email text UNIQUE NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects/Roofs - main workspace entities
CREATE TABLE roofs (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  name text NOT NULL,
  description text,
  plan_url text,
  plan_metadata jsonb DEFAULT '{}', -- Mobile optimization settings, zoom levels, etc
  bounds geometry(POLYGON, 4326), -- Geographic boundaries using PostGIS
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Layer system for Bluebeam-style layer management
CREATE TABLE layers (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  roof_id uuid REFERENCES roofs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('base', 'pins', 'annotations', 'qa', 'measurements')),
  visible boolean DEFAULT true,
  locked boolean DEFAULT false,
  z_index integer NOT NULL,
  opacity numeric(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  write_roles user_role[] DEFAULT ARRAY['admin', 'qa_manager']::user_role[],
  settings jsonb DEFAULT '{}', -- Layer-specific settings, mobile optimizations
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(roof_id, z_index)
);

-- Plan regions for tool gating and spatial validation
CREATE TABLE plan_regions (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  roof_id uuid REFERENCES roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id uuid REFERENCES layers(id) ON DELETE CASCADE,
  name text NOT NULL,
  polygon geometry(POLYGON, 4326) NOT NULL, -- PostGIS polygon for spatial queries
  allowed_tools text[] NOT NULL DEFAULT ARRAY['pin', 'annotation'],
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Parent pins - main inspection points
CREATE TABLE parent_pins (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  roof_id uuid REFERENCES roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id uuid REFERENCES layers(id) ON DELETE CASCADE NOT NULL,
  seq integer NOT NULL, -- Sequential numbering for display
  x numeric(6,4) NOT NULL CHECK (x >= 0 AND x <= 1), -- Normalized coordinates (0-1)
  y numeric(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  status pin_status NOT NULL DEFAULT 'Open',
  title text,
  description text,
  open_pic_url text, -- Photo when opened
  close_pic_url text, -- Photo when closed
  metadata jsonb DEFAULT '{}', -- Mobile-specific data, touch targets, etc
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(roof_id, seq)
);

-- Child pins - detailed sub-inspections under parent pins
CREATE TABLE child_pins (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  parent_id uuid REFERENCES parent_pins(id) ON DELETE CASCADE NOT NULL,
  seq text NOT NULL, -- Format: "1.1", "1.2", etc
  x numeric(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
  y numeric(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  status pin_status NOT NULL DEFAULT 'Open',
  title text,
  description text,
  open_pic_url text,
  close_pic_url text,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, seq)
);

-- Annotations - shapes, text, measurements on the canvas
CREATE TABLE annotations (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  roof_id uuid REFERENCES roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id uuid REFERENCES layers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow')),
  data jsonb NOT NULL, -- Shape coordinates, text content, styling
  style jsonb DEFAULT '{}', -- Color, stroke, mobile touch targets
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments on pins for collaboration
CREATE TABLE pin_comments (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  parent_pin_id uuid REFERENCES parent_pins(id) ON DELETE CASCADE,
  child_pin_id uuid REFERENCES child_pins(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CHECK (
    (parent_pin_id IS NOT NULL AND child_pin_id IS NULL) OR
    (parent_pin_id IS NULL AND child_pin_id IS NOT NULL)
  )
);

-- Activity log for audit trail and mobile sync
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_v7(),
  roof_id uuid REFERENCES roofs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);