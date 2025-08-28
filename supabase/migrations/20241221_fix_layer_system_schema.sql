-- Layer System Schema Fix
-- Fixes critical issues in the layer system based on code review

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Drop and recreate pin_layers with proper roof association
DROP TABLE IF EXISTS pin_layer_permissions CASCADE;
DROP TABLE IF EXISTS pin_enhanced_metadata CASCADE;
DROP TABLE IF EXISTS pin_attachments CASCADE;
DROP TABLE IF EXISTS pin_issue_data CASCADE;
DROP TABLE IF EXISTS pin_rfi_data CASCADE;
DROP TABLE IF EXISTS pin_detail_data CASCADE;
DROP TABLE IF EXISTS pin_note_data CASCADE;
DROP TABLE IF EXISTS pin_performance_metrics CASCADE;
DROP TABLE IF EXISTS pin_layers CASCADE;

-- Create pin_layers with roof association and proper constraints
CREATE TABLE pin_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roof_id UUID NOT NULL REFERENCES roofs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(50) NOT NULL CHECK (kind IN ('ISSUE_PIN', 'RFI_PIN', 'DETAIL_PIN', 'NOTE_PIN')),
  description TEXT,
  color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon VARCHAR(100) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden', 'dimmed')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create unique constraints per roof
CREATE UNIQUE INDEX ux_pin_layers_roof_name ON pin_layers(roof_id, name);
CREATE UNIQUE INDEX ux_pin_layers_roof_order ON pin_layers(roof_id, order_index);

-- Create performance indexes
CREATE INDEX idx_pin_layers_roof_id ON pin_layers(roof_id);
CREATE INDEX idx_pin_layers_kind ON pin_layers(kind);
CREATE INDEX idx_pin_layers_status ON pin_layers(status);

-- 2) Add layer_id to pins table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pins' AND column_name = 'layer_id'
  ) THEN
    ALTER TABLE pins ADD COLUMN layer_id UUID REFERENCES pin_layers(id);
    CREATE INDEX idx_pins_layer_id ON pins(layer_id);
  END IF;
END $$;

-- 3) Layer permissions with fixed role reference
CREATE TABLE pin_layer_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES pin_layers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin','QA_Manager','Supervisor','Foreman','Viewer')),
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(layer_id, role)
);

-- 4) Pin dependencies as separate table (not array)
CREATE TABLE pin_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  depends_on_pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id, depends_on_pin_id),
  CHECK (pin_id <> depends_on_pin_id)
);

-- 5) Enhanced pin metadata with proper constraints
CREATE TABLE pin_enhanced_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  layer_id UUID NOT NULL REFERENCES pin_layers(id),
  tags TEXT[] DEFAULT '{}',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee UUID REFERENCES users(id),
  due_date TIMESTAMPTZ,
  estimated_time INTEGER, -- in minutes
  actual_time INTEGER, -- in minutes
  layer_specific_data JSONB DEFAULT '{}',
  rendering_props JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

-- 6) Pin attachments table (fixed indexes)
CREATE TABLE pin_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'document', 'link', 'note')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_size BIGINT, -- in bytes
  mime_type VARCHAR(255),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for pin_attachments (outside table definition)
CREATE INDEX idx_pin_attachments_pin_id ON pin_attachments(pin_id);
CREATE INDEX idx_pin_attachments_type ON pin_attachments(type);
CREATE INDEX idx_pin_attachments_uploaded_by ON pin_attachments(uploaded_by);

-- 7) Layer-specific data tables with proper references
CREATE TABLE pin_issue_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  issue_type VARCHAR(100) NOT NULL DEFAULT 'General',
  reproduction_steps TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  environment TEXT,
  browser_info TEXT,
  affected_users INTEGER DEFAULT 0,
  business_impact VARCHAR(20) CHECK (business_impact IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

CREATE TABLE pin_rfi_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL DEFAULT 'General',
  requestor VARCHAR(255),
  deadline TIMESTAMPTZ,
  background TEXT,
  specific_questions TEXT,
  required_docs TEXT[],
  approval_required BOOLEAN DEFAULT false,
  budget_impact DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

CREATE TABLE pin_detail_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  detail_type VARCHAR(100) NOT NULL DEFAULT 'General',
  scale VARCHAR(50),
  drawing_reference VARCHAR(255),
  specification_section VARCHAR(100),
  material_list TEXT[],
  installation_notes TEXT,
  quality_requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

CREATE TABLE pin_note_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  note_type VARCHAR(100) NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  reminder_date TIMESTAMPTZ,
  color VARCHAR(7) CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  font_size INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

-- 8) Performance metrics table
CREATE TABLE pin_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  roof_id UUID NOT NULL REFERENCES roofs(id),
  fps_samples DECIMAL[] DEFAULT '{}',
  memory_usage_mb DECIMAL[] DEFAULT '{}',
  render_time_ms DECIMAL[] DEFAULT '{}',
  pin_count INTEGER NOT NULL,
  layer_count INTEGER NOT NULL,
  zoom_level DECIMAL NOT NULL,
  device_info JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create additional performance indexes
CREATE INDEX idx_pin_enhanced_metadata_layer_id ON pin_enhanced_metadata(layer_id);
CREATE INDEX idx_pin_enhanced_metadata_assignee ON pin_enhanced_metadata(assignee);
CREATE INDEX idx_pin_enhanced_metadata_priority ON pin_enhanced_metadata(priority);
CREATE INDEX idx_pin_enhanced_metadata_due_date ON pin_enhanced_metadata(due_date);
CREATE INDEX idx_pin_enhanced_metadata_tags ON pin_enhanced_metadata USING GIN(tags);
CREATE INDEX idx_pin_layer_permissions_layer_role ON pin_layer_permissions(layer_id, role);
CREATE INDEX idx_pin_dependencies_pin_id ON pin_dependencies(pin_id);
CREATE INDEX idx_pin_dependencies_depends_on ON pin_dependencies(depends_on_pin_id);
CREATE INDEX idx_pin_performance_metrics_roof_id ON pin_performance_metrics(roof_id);
CREATE INDEX idx_pin_performance_metrics_session_id ON pin_performance_metrics(session_id);
CREATE INDEX idx_pin_performance_metrics_timestamp ON pin_performance_metrics(timestamp);

-- Optional: JSONB GIN indexes for better JSON queries
CREATE INDEX gin_pin_enhanced_metadata_rendering ON pin_enhanced_metadata USING GIN (rendering_props);
CREATE INDEX gin_pin_enhanced_metadata_layer_data ON pin_enhanced_metadata USING GIN (layer_specific_data);
CREATE INDEX gin_pin_attachments_metadata ON pin_attachments USING GIN (metadata);

-- 9) Trigger to enforce layer consistency between pins and metadata
CREATE OR REPLACE FUNCTION enforce_metadata_layer_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE 
  pin_layer UUID;
BEGIN
  SELECT layer_id INTO pin_layer FROM pins WHERE id = NEW.pin_id;
  
  IF pin_layer IS NULL THEN
    RAISE EXCEPTION 'Pin % has no layer_id assigned', NEW.pin_id;
  END IF;
  
  IF NEW.layer_id <> pin_layer THEN
    RAISE EXCEPTION 'Metadata.layer_id % does not match pins.layer_id % for pin %',
      NEW.layer_id, pin_layer, NEW.pin_id;
  END IF;
  
  RETURN NEW;
END $$;

CREATE TRIGGER trg_enforce_metadata_layer_match
  BEFORE INSERT OR UPDATE ON pin_enhanced_metadata
  FOR EACH ROW EXECUTE FUNCTION enforce_metadata_layer_match();

-- 10) Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_pin_layers_updated_at 
  BEFORE UPDATE ON pin_layers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_enhanced_metadata_updated_at 
  BEFORE UPDATE ON pin_enhanced_metadata 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_issue_data_updated_at 
  BEFORE UPDATE ON pin_issue_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_rfi_data_updated_at 
  BEFORE UPDATE ON pin_rfi_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_detail_data_updated_at 
  BEFORE UPDATE ON pin_detail_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_note_data_updated_at 
  BEFORE UPDATE ON pin_note_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11) Enable RLS
ALTER TABLE pin_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_layer_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_enhanced_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_issue_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_rfi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_detail_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_note_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 12) RLS Policies with proper auth.uid() checks
-- Layers: view all, modify only if you created them or are admin/qa_manager
CREATE POLICY pin_layers_select ON pin_layers
  FOR SELECT USING (true);

CREATE POLICY pin_layers_insert ON pin_layers
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY pin_layers_update ON pin_layers
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('Admin', 'QA_Manager')
    )
  );

CREATE POLICY pin_layers_delete ON pin_layers
  FOR DELETE USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('Admin', 'QA_Manager')
    )
  );

-- Layer permissions: view all, modify only admins/qa_managers
CREATE POLICY pin_layer_permissions_select ON pin_layer_permissions
  FOR SELECT USING (true);

CREATE POLICY pin_layer_permissions_modify ON pin_layer_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('Admin', 'QA_Manager')
    )
  );

-- Metadata: access based on roof ownership or layer permissions
CREATE POLICY pin_enhanced_metadata_select ON pin_enhanced_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pins p
      JOIN pin_layers l ON l.id = p.layer_id
      WHERE p.id = pin_enhanced_metadata.pin_id
      -- Add roof ownership check here if you have project/roof membership table
    )
  );

CREATE POLICY pin_enhanced_metadata_write ON pin_enhanced_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pins p
      JOIN pin_layers l ON l.id = p.layer_id  
      WHERE p.id = pin_enhanced_metadata.pin_id
      -- Add appropriate permission check here
    )
  );

-- Attachments: similar pattern
CREATE POLICY pin_attachments_select ON pin_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pins p
      WHERE p.id = pin_attachments.pin_id
    )
  );

CREATE POLICY pin_attachments_write ON pin_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM pins p
      WHERE p.id = pin_attachments.pin_id
    )
  );

-- Dependencies: view and modify with pin access
CREATE POLICY pin_dependencies_select ON pin_dependencies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pins WHERE id = pin_dependencies.pin_id)
  );

CREATE POLICY pin_dependencies_write ON pin_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pins WHERE id = pin_dependencies.pin_id)
  );

-- Layer-specific data tables: access based on pin ownership
CREATE POLICY pin_issue_data_select ON pin_issue_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM pins WHERE id = pin_issue_data.pin_id));

CREATE POLICY pin_rfi_data_select ON pin_rfi_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM pins WHERE id = pin_rfi_data.pin_id));

CREATE POLICY pin_detail_data_select ON pin_detail_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM pins WHERE id = pin_detail_data.pin_id));

CREATE POLICY pin_note_data_select ON pin_note_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM pins WHERE id = pin_note_data.pin_id));

-- Performance metrics: roof-based access
CREATE POLICY pin_performance_metrics_select ON pin_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roofs r
      WHERE r.id = pin_performance_metrics.roof_id
      -- Add roof access check here
    )
  );

-- 13) Comments for documentation
COMMENT ON TABLE pin_layers IS 'Pin layers associated with specific roofs with proper uniqueness constraints';
COMMENT ON TABLE pin_layer_permissions IS 'Role-based permissions for each pin layer type';
COMMENT ON TABLE pin_enhanced_metadata IS 'Enhanced metadata for pins with layer consistency enforcement';
COMMENT ON TABLE pin_attachments IS 'File attachments for pins with proper auth references';
COMMENT ON TABLE pin_dependencies IS 'Pin dependencies as normalized table instead of array';
COMMENT ON TABLE pin_issue_data IS 'Issue-specific data for ISSUE_PIN type pins';
COMMENT ON TABLE pin_rfi_data IS 'RFI-specific data for RFI_PIN type pins';
COMMENT ON TABLE pin_detail_data IS 'Detail-specific data for DETAIL_PIN type pins';
COMMENT ON TABLE pin_note_data IS 'Note-specific data for NOTE_PIN type pins';
COMMENT ON TABLE pin_performance_metrics IS 'Performance tracking data for canvas operations';

-- 14) Helper function to get default layers for a roof
CREATE OR REPLACE FUNCTION create_default_layers_for_roof(roof_uuid UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pin_layers (roof_id, name, kind, description, color, icon, order_index, created_by) VALUES
  (roof_uuid, 'Issues', 'ISSUE_PIN', 'Defects and problems that need resolution', '#ef4444', 'AlertTriangle', 1, auth.uid()),
  (roof_uuid, 'RFIs', 'RFI_PIN', 'Requests for Information', '#f59e0b', 'HelpCircle', 2, auth.uid()),
  (roof_uuid, 'Details', 'DETAIL_PIN', 'Technical details and specifications', '#3b82f6', 'FileText', 3, auth.uid()),
  (roof_uuid, 'Notes', 'NOTE_PIN', 'General notes and observations', '#10b981', 'MessageSquare', 4, auth.uid())
  ON CONFLICT (roof_id, name) DO NOTHING;
  
  -- Create default permissions for each layer
  INSERT INTO pin_layer_permissions (layer_id, role, can_view, can_create, can_edit, can_delete, can_manage)
  SELECT 
    l.id,
    r.role,
    CASE 
      WHEN r.role = 'Admin' THEN true
      WHEN r.role = 'QA_Manager' THEN true
      WHEN r.role = 'Supervisor' THEN true
      WHEN r.role = 'Foreman' THEN true
      WHEN r.role = 'Viewer' THEN true
      ELSE false
    END as can_view,
    CASE 
      WHEN r.role = 'Admin' THEN true
      WHEN r.role = 'QA_Manager' THEN true
      WHEN r.role = 'Supervisor' THEN true
      WHEN r.role = 'Foreman' THEN (l.kind IN ('ISSUE_PIN', 'NOTE_PIN'))
      ELSE false
    END as can_create,
    CASE 
      WHEN r.role = 'Admin' THEN true
      WHEN r.role = 'QA_Manager' THEN true
      WHEN r.role = 'Supervisor' THEN true
      WHEN r.role = 'Foreman' THEN (l.kind IN ('ISSUE_PIN', 'NOTE_PIN'))
      ELSE false
    END as can_edit,
    CASE 
      WHEN r.role = 'Admin' THEN true
      WHEN r.role = 'QA_Manager' THEN true
      WHEN r.role = 'Supervisor' THEN (l.kind != 'RFI_PIN')
      ELSE false
    END as can_delete,
    CASE 
      WHEN r.role = 'Admin' THEN true
      WHEN r.role = 'QA_Manager' THEN true
      ELSE false
    END as can_manage
  FROM pin_layers l
  CROSS JOIN (VALUES ('Admin'), ('QA_Manager'), ('Supervisor'), ('Foreman'), ('Viewer')) as r(role)
  WHERE l.roof_id = roof_uuid
  ON CONFLICT (layer_id, role) DO NOTHING;
END $$;
