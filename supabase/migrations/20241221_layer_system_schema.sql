-- Layer System Schema Extensions (DEPRECATED - USE 20241221_fix_layer_system_schema.sql)
-- This schema has critical issues that are fixed in the new migration:
--
-- CRITICAL ISSUES FOUND:
-- 1. Inline INDEX syntax not valid in PostgreSQL
-- 2. Missing roof_id association in pin_layers  
-- 3. UNIQUE constraints should be per roof, not global
-- 4. FK to users(role) is problematic - fixed with CHECK constraint
-- 5. created_by should reference auth.users, not public.users
-- 6. RLS policies too permissive (only SELECT)
-- 7. dependencies as UUID[] array instead of normalized table
-- 8. No layer consistency enforcement between pins and metadata
-- 9. Missing HEX color validation
-- 10. Missing performance indexes
--
-- USE FIXED VERSION: 20241221_fix_layer_system_schema.sql

-- ORIGINAL PROBLEMATIC SCHEMA (FOR REFERENCE ONLY):

-- Layer system tables
CREATE TABLE IF NOT EXISTS pin_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(50) NOT NULL CHECK (kind IN ('ISSUE_PIN', 'RFI_PIN', 'DETAIL_PIN', 'NOTE_PIN')),
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Hex color
  icon VARCHAR(100) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden', 'dimmed')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(name),
  UNIQUE(order_index)
);

-- Layer permissions table
CREATE TABLE IF NOT EXISTS pin_layer_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES pin_layers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL REFERENCES users(role),
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(layer_id, role)
);

-- Enhanced pin metadata table
CREATE TABLE IF NOT EXISTS pin_enhanced_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  layer_id UUID NOT NULL REFERENCES pin_layers(id),
  tags TEXT[] DEFAULT '{}',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee UUID REFERENCES users(id),
  due_date TIMESTAMPTZ,
  estimated_time INTEGER, -- in minutes
  actual_time INTEGER, -- in minutes
  dependencies UUID[] DEFAULT '{}', -- Array of pin IDs
  layer_specific_data JSONB DEFAULT '{}',
  rendering_props JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

-- Pin attachments table
CREATE TABLE IF NOT EXISTS pin_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'document', 'link', 'note')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_size BIGINT, -- in bytes
  mime_type VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  
  INDEX (pin_id),
  INDEX (type),
  INDEX (uploaded_by)
);

-- Layer-specific data tables

-- Issue pin specific data
CREATE TABLE IF NOT EXISTS pin_issue_data (
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

-- RFI pin specific data
CREATE TABLE IF NOT EXISTS pin_rfi_data (
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

-- Detail pin specific data
CREATE TABLE IF NOT EXISTS pin_detail_data (
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

-- Note pin specific data
CREATE TABLE IF NOT EXISTS pin_note_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  note_type VARCHAR(100) NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  reminder_date TIMESTAMPTZ,
  color VARCHAR(7), -- Hex color for note display
  font_size INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(pin_id)
);

-- Performance tracking table
CREATE TABLE IF NOT EXISTS pin_performance_metrics (
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
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  INDEX (roof_id),
  INDEX (session_id),
  INDEX (timestamp)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pin_enhanced_metadata_layer_id ON pin_enhanced_metadata(layer_id);
CREATE INDEX IF NOT EXISTS idx_pin_enhanced_metadata_assignee ON pin_enhanced_metadata(assignee);
CREATE INDEX IF NOT EXISTS idx_pin_enhanced_metadata_priority ON pin_enhanced_metadata(priority);
CREATE INDEX IF NOT EXISTS idx_pin_enhanced_metadata_due_date ON pin_enhanced_metadata(due_date);
CREATE INDEX IF NOT EXISTS idx_pin_enhanced_metadata_tags ON pin_enhanced_metadata USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_pin_layer_permissions_layer_role ON pin_layer_permissions(layer_id, role);
CREATE INDEX IF NOT EXISTS idx_pin_layers_kind ON pin_layers(kind);
CREATE INDEX IF NOT EXISTS idx_pin_layers_status ON pin_layers(status);

-- Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_pin_layers_updated_at BEFORE UPDATE ON pin_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_enhanced_metadata_updated_at BEFORE UPDATE ON pin_enhanced_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_issue_data_updated_at BEFORE UPDATE ON pin_issue_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_rfi_data_updated_at BEFORE UPDATE ON pin_rfi_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_detail_data_updated_at BEFORE UPDATE ON pin_detail_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pin_note_data_updated_at BEFORE UPDATE ON pin_note_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default layers
INSERT INTO pin_layers (name, kind, description, color, icon, order_index) VALUES
('Issues', 'ISSUE_PIN', 'Defects and problems that need resolution', '#ef4444', 'AlertTriangle', 1),
('RFIs', 'RFI_PIN', 'Requests for Information', '#f59e0b', 'HelpCircle', 2),
('Details', 'DETAIL_PIN', 'Technical details and specifications', '#3b82f6', 'FileText', 3),
('Notes', 'NOTE_PIN', 'General notes and observations', '#10b981', 'MessageSquare', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions for each role
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
ON CONFLICT (layer_id, role) DO NOTHING;

-- Add RLS (Row Level Security) policies
ALTER TABLE pin_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_layer_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_enhanced_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_issue_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_rfi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_detail_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_note_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be enhanced based on specific requirements)
CREATE POLICY "pin_layers_select_policy" ON pin_layers FOR SELECT USING (true);
CREATE POLICY "pin_layer_permissions_select_policy" ON pin_layer_permissions FOR SELECT USING (true);
CREATE POLICY "pin_enhanced_metadata_select_policy" ON pin_enhanced_metadata FOR SELECT USING (true);
CREATE POLICY "pin_attachments_select_policy" ON pin_attachments FOR SELECT USING (true);
CREATE POLICY "pin_issue_data_select_policy" ON pin_issue_data FOR SELECT USING (true);
CREATE POLICY "pin_rfi_data_select_policy" ON pin_rfi_data FOR SELECT USING (true);
CREATE POLICY "pin_detail_data_select_policy" ON pin_detail_data FOR SELECT USING (true);
CREATE POLICY "pin_note_data_select_policy" ON pin_note_data FOR SELECT USING (true);
CREATE POLICY "pin_performance_metrics_select_policy" ON pin_performance_metrics FOR SELECT USING (true);

-- Comment tables for documentation
COMMENT ON TABLE pin_layers IS 'Defines the different types of pin layers in the enhanced system';
COMMENT ON TABLE pin_layer_permissions IS 'Role-based permissions for each pin layer type';
COMMENT ON TABLE pin_enhanced_metadata IS 'Enhanced metadata for pins including layer information';
COMMENT ON TABLE pin_attachments IS 'File attachments associated with pins';
COMMENT ON TABLE pin_issue_data IS 'Issue-specific data for ISSUE_PIN type pins';
COMMENT ON TABLE pin_rfi_data IS 'RFI-specific data for RFI_PIN type pins';
COMMENT ON TABLE pin_detail_data IS 'Detail-specific data for DETAIL_PIN type pins';
COMMENT ON TABLE pin_note_data IS 'Note-specific data for NOTE_PIN type pins';
COMMENT ON TABLE pin_performance_metrics IS 'Performance tracking data for canvas operations';
