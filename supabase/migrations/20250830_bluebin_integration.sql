-- BLUEBIN Integration Migration for SmartPin TPO
-- Enhance existing schema with BLUEBIN layer system and spatial features

-- Enable PostGIS for spatial validation
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for text search

-- Add layer system to existing SmartPin TPO schema
CREATE TABLE IF NOT EXISTS public.layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Quality Control',
  type TEXT NOT NULL DEFAULT 'pins' CHECK (type IN ('base', 'pins', 'annotations', 'qa', 'measurements')),
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  z_index INTEGER NOT NULL DEFAULT 1,
  opacity NUMERIC(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  write_roles TEXT[] DEFAULT ARRAY['Admin', 'QA_Manager'],
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(roof_id, z_index)
);

-- Add layer_id to existing pins table (backwards compatible)
ALTER TABLE public.pins 
ADD COLUMN IF NOT EXISTS layer_id UUID REFERENCES public.layers(id) DEFAULT NULL;

-- Create default "Quality Control" layer for existing roofs
INSERT INTO public.layers (roof_id, name, type, z_index, write_roles)
SELECT DISTINCT r.id, 'Quality Control', 'pins', 1, ARRAY['Admin', 'QA_Manager']
FROM public.roofs r
WHERE NOT EXISTS (
  SELECT 1 FROM public.layers l WHERE l.roof_id = r.id
);

-- Update existing pins to use the default Quality Control layer
UPDATE public.pins 
SET layer_id = (
  SELECT l.id FROM public.layers l 
  WHERE l.roof_id = pins.roof_id 
  AND l.name = 'Quality Control' 
  LIMIT 1
)
WHERE layer_id IS NULL;

-- Make layer_id NOT NULL after data migration
ALTER TABLE public.pins 
ALTER COLUMN layer_id SET NOT NULL;

-- Plan regions for spatial tool gating (BLUEBIN feature)
CREATE TABLE IF NOT EXISTS public.plan_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Full Roof Access',
  polygon GEOMETRY(POLYGON, 4326),
  allowed_tools TEXT[] NOT NULL DEFAULT ARRAY['pin', 'annotation'],
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create default full-roof region for existing roofs (allows all tools everywhere)
INSERT INTO public.plan_regions (roof_id, name, polygon, allowed_tools)
SELECT DISTINCT r.id, 'Full Roof Access', 
  ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 4326),
  ARRAY['pin', 'annotation', 'measurement', 'text']
FROM public.roofs r
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_regions pr WHERE pr.roof_id = r.id
);

-- Child pins table (enhance existing parent/child system)
CREATE TABLE IF NOT EXISTS public.child_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  seq TEXT NOT NULL, -- "1.1", "1.2", etc based on parent seq_number
  x NUMERIC(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
  y NUMERIC(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  status public.pin_status NOT NULL DEFAULT 'Open',
  zone TEXT,
  defect_layer public.defect_layer,
  severity public.severity DEFAULT 'Medium',
  title TEXT,
  description TEXT,
  open_pic_url TEXT,
  close_pic_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, seq)
);

-- Annotations table for BLUEBIN drawing features
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow')),
  data JSONB NOT NULL, -- Shape coordinates, text content, styling
  style JSONB DEFAULT '{}', -- Color, stroke, mobile touch targets
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced indexes for BLUEBIN performance
CREATE INDEX IF NOT EXISTS idx_layers_roof_visible ON public.layers(roof_id, visible, z_index) WHERE visible = true;
CREATE INDEX IF NOT EXISTS idx_child_pins_parent ON public.child_pins(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_pins_status ON public.child_pins(status) WHERE status != 'Closed';
CREATE INDEX IF NOT EXISTS idx_plan_regions_polygon ON public.plan_regions USING GIST(polygon);
CREATE INDEX IF NOT EXISTS idx_annotations_roof_layer ON public.annotations(roof_id, layer_id);

-- RLS Policies for BLUEBIN integration
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Layers policies
CREATE POLICY "Users can view layers in accessible roofs" ON public.layers
  FOR SELECT USING (
    roof_id IN (
      SELECT r.id FROM public.roofs r 
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  );

-- Child pins policies (inherit from parent pins access)
CREATE POLICY "Users can view child pins via parent access" ON public.child_pins
  FOR SELECT USING (
    parent_id IN (
      SELECT pins.id FROM public.pins 
      JOIN public.roofs r ON r.id = pins.roof_id
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  );

CREATE POLICY "Users can create child pins with parent access" ON public.child_pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pins pin
      JOIN public.roofs r ON r.id = pin.roof_id
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE pin.id = parent_id AND (
        p.created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
      )
    )
  );

-- Plan regions policies
CREATE POLICY "Users can view plan regions in accessible roofs" ON public.plan_regions
  FOR SELECT USING (
    roof_id IN (
      SELECT r.id FROM public.roofs r 
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  );

-- Annotations policies
CREATE POLICY "Users can view annotations in accessible roofs" ON public.annotations
  FOR SELECT USING (
    roof_id IN (
      SELECT r.id FROM public.roofs r 
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  );