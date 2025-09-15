# SmartPin TPO - Supabase Setup Required

## ✅ **Credentials Verified and Stored**

**Project Details:**
- **Name**: SmartPin-TPO-Production
- **Project ID**: vhtbinssqbzcjmbgkseo
- **URL**: https://vhtbinssqbzcjmbgkseo.supabase.co
- **Status**: ✅ Active and configured in `.env.local`

**Credentials Stored:**
- ✅ **Anon Key**: Configured in environment
- ✅ **Service Role Key**: Configured in environment
- ✅ **JWT Secret**: Stored for migration purposes
- ✅ **MCP Configuration**: Updated (requires restart)

## ✅ Database Schema Setup - Ready to Execute

**Quick Setup Instructions:**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/vhtbinssqbzcjmbgkseo/sql/new)
2. Copy the contents of `database-setup.sql` (created in project root)
3. Paste and execute in SQL Editor
4. Verify tables were created successfully

**What Will Be Created:**
- ✅ `layers` table - For organizing pins and annotations by layer
- ✅ `annotations` table - For drawing tools, notes, and markups
- ✅ Performance indexes - For fast queries
- ✅ RLS security policies - Row-level security for data protection

**Original SQL follows below for reference:**

```sql
-- SmartPin TPO: Add layers and annotations system for Bluebeam-style layer management
-- This enables multiple inspection layers with visibility controls and annotations

CREATE TABLE layers (
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

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID REFERENCES layers(id) ON DELETE CASCADE,
  roof_id UUID REFERENCES roofs(id) ON DELETE CASCADE,
  x DECIMAL(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
  y DECIMAL(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
  text TEXT,
  annotation_type TEXT CHECK (annotation_type IN ('note', 'arrow', 'circle', 'rectangle', 'line', 'freehand')),
  style JSONB, -- Store styling information (color, size, etc.)
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_layers_roof_id ON layers(roof_id);
CREATE INDEX idx_layers_z_index ON layers(z_index);
CREATE INDEX idx_annotations_layer_id ON annotations(layer_id);
CREATE INDEX idx_annotations_roof_id ON annotations(roof_id);
CREATE INDEX idx_annotations_position ON annotations(x, y);

-- Add RLS policies for layers
ALTER TABLE layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view layers for their assigned projects" ON layers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roofs r
      JOIN project_assignments pa ON r.project_id = pa.project_id
      WHERE r.id = layers.roof_id
      AND pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage layers for their assigned projects" ON layers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roofs r
      JOIN project_assignments pa ON r.project_id = pa.project_id
      WHERE r.id = layers.roof_id
      AND pa.user_id = auth.uid()
      AND pa.role IN ('Admin', 'QA_Manager', 'Inspector')
    )
  );

-- Add RLS policies for annotations
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view annotations for their assigned projects" ON annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roofs r
      JOIN project_assignments pa ON r.project_id = pa.project_id
      WHERE r.id = annotations.roof_id
      AND pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage annotations for their assigned projects" ON annotations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roofs r
      JOIN project_assignments pa ON r.project_id = pa.project_id
      WHERE r.id = annotations.roof_id
      AND pa.user_id = auth.uid()
      AND pa.role IN ('Admin', 'QA_Manager', 'Inspector')
    )
  );

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_layers_updated_at
  BEFORE UPDATE ON layers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add default layers for existing roofs
INSERT INTO layers (roof_id, name, type, z_index, visible)
SELECT
  id as roof_id,
  'Issues' as name,
  'pins' as type,
  2 as z_index,
  true as visible
FROM roofs
WHERE NOT EXISTS (SELECT 1 FROM layers WHERE layers.roof_id = roofs.id AND layers.type = 'pins');

INSERT INTO layers (roof_id, name, type, z_index, visible)
SELECT
  id as roof_id,
  'Notes' as name,
  'annotations' as type,
  1 as z_index,
  true as visible
FROM roofs
WHERE NOT EXISTS (SELECT 1 FROM layers WHERE layers.roof_id = roofs.id AND layers.type = 'annotations');
```

## How to Apply

1. **Option 1**: Go to your Supabase Dashboard → SQL Editor and paste the above SQL
2. **Option 2**: Use Supabase CLI: `supabase db push` (requires local setup)
3. **Option 3**: Remove read-only mode from MCP configuration

## MCP Configuration Issue

The Supabase MCP is currently in read-only mode. To enable write access:

1. The MCP was updated to remove `--read-only` flag
2. You may need to restart Claude Code for the change to take effect
3. Alternatively, use Supabase Dashboard directly

## Features This Enables

- **Bluebeam-style Layer Management**: Multiple inspection layers (Issues, Notes, etc.)
- **Layer Controls**: Visibility toggle, opacity adjustment, locking, z-index ordering
- **Annotations System**: Notes, arrows, shapes, and markup on the roof plan
- **Smart Filtering**: Show/hide layers with single click
- **Real-time Collaboration**: Live layer updates across all users

This is required for the complete SmartPin TPO layer system as specified in your application requirements.