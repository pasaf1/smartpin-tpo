import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const completeBluebinSQL = `-- BLUEBIN Integration - Complete SQL Migration
-- Copy and paste this entire SQL block into Supabase SQL Editor
-- This will create all missing tables and set up the BLUEBIN system

BEGIN;

-- Step 1: Create layers table
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

-- Step 2: Create child_pins table  
CREATE TABLE IF NOT EXISTS public.child_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  seq TEXT NOT NULL,
  x NUMERIC(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
  y NUMERIC(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'ReadyForInspection', 'Closed')),
  zone TEXT,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
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

-- Step 3: Create annotations table
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
  layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow')),
  data JSONB NOT NULL,
  style JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Create default layers for existing roofs
INSERT INTO public.layers (roof_id, name, type, z_index, write_roles)
SELECT DISTINCT r.id, 'Quality Control', 'pins', 1, ARRAY['Admin', 'QA_Manager']
FROM public.roofs r
WHERE NOT EXISTS (
  SELECT 1 FROM public.layers l WHERE l.roof_id = r.id
);

-- Step 5: Add layer_id column to pins table (if it doesn't exist)
ALTER TABLE public.pins 
ADD COLUMN IF NOT EXISTS layer_id UUID REFERENCES public.layers(id);

-- Step 6: Update existing pins with layer_id
UPDATE public.pins 
SET layer_id = (
  SELECT l.id FROM public.layers l 
  WHERE l.roof_id = pins.roof_id 
  AND l.name = 'Quality Control' 
  LIMIT 1
)
WHERE layer_id IS NULL;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_layers_roof_visible ON public.layers(roof_id, visible, z_index) WHERE visible = true;
CREATE INDEX IF NOT EXISTS idx_child_pins_parent ON public.child_pins(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_pins_status ON public.child_pins(status) WHERE status != 'Closed';
CREATE INDEX IF NOT EXISTS idx_annotations_roof_layer ON public.annotations(roof_id, layer_id);

-- Step 8: Enable RLS on new tables
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_pins ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Step 9: Add RLS policies
CREATE POLICY "Users can view layers in accessible roofs" ON public.layers
  FOR SELECT USING (
    roof_id IN (
      SELECT r.id FROM public.roofs r 
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  );

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

CREATE POLICY "Users can view annotations in accessible roofs" ON public.annotations
  FOR SELECT USING (
    roof_id IN (
      SELECT r.id FROM public.roofs r 
      JOIN public.projects p ON p.project_id = r.project_id
      WHERE p.created_by = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
      )
    );

COMMIT;

-- Final verification query
SELECT 
  'layers' as table_name, COUNT(*) as row_count 
FROM public.layers
UNION ALL
SELECT 
  'child_pins' as table_name, COUNT(*) as row_count 
FROM public.child_pins  
UNION ALL
SELECT 
  'annotations' as table_name, COUNT(*) as row_count 
FROM public.annotations;

-- Success message
SELECT 'BLUEBIN tables created successfully! You can now see pins on the interactive roof map.' as result;
`

    return NextResponse.json({
      success: true,
      message: 'Complete BLUEBIN SQL generated',
      sql: completeBluebinSQL,
      instructions: [
        '1. Copy the SQL code above',
        '2. Go to your Supabase Dashboard → SQL Editor',
        '3. Paste the SQL code',
        '4. Click "Run" to execute',
        '5. Check that all tables are created successfully',
        '6. Test the interactive roof map - pins should now be visible!'
      ],
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to generate BLUEBIN SQL',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}