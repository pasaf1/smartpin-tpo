-- SmartPin TPO Database Schema Setup
-- Execute this SQL in your Supabase SQL Editor

-- Create layers table for organizing pins and annotations
CREATE TABLE IF NOT EXISTS layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID REFERENCES roofs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('pins', 'annotations', 'custom', 'notes', 'markup')),
  visible BOOLEAN DEFAULT true,
  z_index INTEGER DEFAULT 1,
  opacity DECIMAL(3,2) DEFAULT 1.0 CHECK (opacity >= 0.0 AND opacity <= 1.0),
  locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create annotations table for drawing tools and markups
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID REFERENCES layers(id) ON DELETE CASCADE,
  roof_id UUID REFERENCES roofs(id) ON DELETE CASCADE,
  x DECIMAL(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
  y DECIMAL(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  text TEXT,
  annotation_type TEXT CHECK (annotation_type IN ('note', 'arrow', 'circle', 'rectangle', 'line', 'freehand')),
  style JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_layers_roof_id ON layers(roof_id);
CREATE INDEX IF NOT EXISTS idx_layers_created_by ON layers(created_by);
CREATE INDEX IF NOT EXISTS idx_annotations_layer_id ON annotations(layer_id);
CREATE INDEX IF NOT EXISTS idx_annotations_roof_id ON annotations(roof_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created_by ON annotations(created_by);

-- Add RLS policies for security
ALTER TABLE layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view layers for roofs they have access to
CREATE POLICY "Users can view layers" ON layers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roofs r
      WHERE r.id = layers.roof_id
      AND r.project_id IN (
        SELECT p.id FROM projects p
        WHERE p.owner_id = auth.uid()
        OR p.id IN (
          SELECT pm.project_id FROM project_members pm
          WHERE pm.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Users can insert layers for their roofs
CREATE POLICY "Users can create layers" ON layers
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roofs r
      WHERE r.id = layers.roof_id
      AND r.project_id IN (
        SELECT p.id FROM projects p
        WHERE p.owner_id = auth.uid()
        OR p.id IN (
          SELECT pm.project_id FROM project_members pm
          WHERE pm.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Users can update their own layers
CREATE POLICY "Users can update own layers" ON layers
  FOR UPDATE USING (created_by = auth.uid());

-- Policy: Users can delete their own layers
CREATE POLICY "Users can delete own layers" ON layers
  FOR DELETE USING (created_by = auth.uid());

-- Similar policies for annotations
CREATE POLICY "Users can view annotations" ON annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roofs r
      WHERE r.id = annotations.roof_id
      AND r.project_id IN (
        SELECT p.id FROM projects p
        WHERE p.owner_id = auth.uid()
        OR p.id IN (
          SELECT pm.project_id FROM project_members pm
          WHERE pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create annotations" ON annotations
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM roofs r
      WHERE r.id = annotations.roof_id
      AND r.project_id IN (
        SELECT p.id FROM projects p
        WHERE p.owner_id = auth.uid()
        OR p.id IN (
          SELECT pm.project_id FROM project_members pm
          WHERE pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own annotations" ON annotations
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own annotations" ON annotations
  FOR DELETE USING (created_by = auth.uid());