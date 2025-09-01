-- Seed Data for SmartPin TPO Production Environment
-- Initialize the database with essential reference data and sample data

-- ==========================================
-- REFERENCE DATA SETUP
-- ==========================================

-- Insert default defect types and categories
INSERT INTO public.defect_categories (id, name, description, severity_default, color) VALUES 
  ('vapor-barrier', 'Vapor Barrier', 'Issues with vapor barrier installation or integrity', 'Medium', '#FFB800'),
  ('insulation', 'Insulation', 'Insulation board placement, gaps, or damage', 'Medium', '#FF6B35'),
  ('membrane', 'TPO Membrane', 'TPO membrane installation, seams, or damage', 'High', '#DC143C'),
  ('flashing', 'Flashing', 'Flashing installation or sealing issues', 'High', '#8B0000'),
  ('drains', 'Drains', 'Drain installation, sealing, or functionality', 'Critical', '#4B0082'),
  ('curbs', 'Curbs', 'Equipment curb installation or sealing', 'Medium', '#228B22')
ON CONFLICT (id) DO NOTHING;

-- Insert standard zones that are commonly used
INSERT INTO public.zones (id, name, description, color) VALUES
  ('zone-a', 'Zone A', 'Primary roof section', '#3B82F6'),
  ('zone-b', 'Zone B', 'Secondary roof section', '#10B981'),
  ('zone-c', 'Zone C', 'Tertiary roof section', '#F59E0B'),
  ('zone-d', 'Zone D', 'Equipment area', '#EF4444'),
  ('perimeter', 'Perimeter', 'Roof edge and parapet areas', '#8B5CF6'),
  ('penetrations', 'Penetrations', 'Areas around roof penetrations', '#F97316')
ON CONFLICT (id) DO NOTHING;

-- Create these reference tables if they don't exist
CREATE TABLE IF NOT EXISTS public.defect_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  severity_default public.severity DEFAULT 'Medium',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SAMPLE DATA (for development/testing)
-- ==========================================

-- Create a demo admin user (if not exists)
DO $$
DECLARE
  demo_user_id UUID;
  demo_auth_id UUID := gen_random_uuid();
BEGIN
  -- Check if demo user already exists
  SELECT id INTO demo_user_id FROM public.users WHERE email = 'demo@smartpintpo.com';
  
  IF demo_user_id IS NULL THEN
    -- Create demo user
    INSERT INTO public.users (
      id, auth_user_id, email, full_name, role, created_at
    ) VALUES (
      gen_random_uuid(), 
      demo_auth_id,
      'demo@smartpintpo.com', 
      'Demo Administrator', 
      'Admin', 
      NOW()
    ) RETURNING id INTO demo_user_id;
    
    -- Create sample project
    WITH demo_project AS (
      INSERT INTO public.projects (
        project_id, name, status, contractor, created_by, created_at
      ) VALUES (
        gen_random_uuid(),
        'Demo Construction Project',
        'InProgress',
        'ABC Roofing Contractors',
        demo_user_id,
        NOW()
      ) RETURNING project_id
    ),
    demo_roof AS (
      INSERT INTO public.roofs (
        id, project_id, code, name, building, 
        zones, stakeholders, is_active, created_at
      ) 
      SELECT 
        gen_random_uuid(),
        dp.project_id,
        'E1',
        'East Building Roof',
        'East Manufacturing Building',
        jsonb_build_array(
          jsonb_build_object('id', 'zone-a', 'name', 'Zone A', 'color', '#3B82F6'),
          jsonb_build_object('id', 'zone-b', 'name', 'Zone B', 'color', '#10B981')
        ),
        jsonb_build_array(
          jsonb_build_object('name', 'John Smith', 'role', 'Project Manager', 'email', 'john@abc-roofing.com'),
          jsonb_build_object('name', 'Jane Doe', 'role', 'QA Manager', 'email', 'jane@abc-roofing.com')
        ),
        TRUE,
        NOW()
      FROM demo_project dp
      RETURNING id, project_id
    )
    -- Create default Quality Control layer for the demo roof
    INSERT INTO public.layers (
      id, roof_id, name, type, visible, locked, z_index, 
      opacity, write_roles, settings, created_at
    )
    SELECT 
      gen_random_uuid(),
      dr.id,
      'Quality Control',
      'pins',
      TRUE,
      FALSE,
      1,
      1.0,
      ARRAY['Admin', 'QA_Manager'],
      jsonb_build_object(
        'pinColor', '#DC143C',
        'pinSize', 'medium',
        'showLabels', true
      ),
      NOW()
    FROM demo_roof dr;
    
    RAISE NOTICE 'Created demo data with user ID: %', demo_user_id;
  ELSE
    RAISE NOTICE 'Demo user already exists with ID: %', demo_user_id;
  END IF;
END $$;

-- ==========================================
-- SYSTEM CONFIGURATION
-- ==========================================

-- Insert system configuration settings
INSERT INTO public.system_config (key, value, description) VALUES
  ('max_file_size_mb', '50', 'Maximum file upload size in megabytes'),
  ('supported_image_formats', '["image/jpeg","image/png","image/webp","image/heic"]', 'Supported image formats for uploads'),
  ('auto_backup_enabled', 'true', 'Enable automatic database backups'),
  ('notification_retention_days', '30', 'Days to retain notification records'),
  ('audit_log_retention_days', '90', 'Days to retain audit log records'),
  ('session_timeout_minutes', '480', 'User session timeout in minutes (8 hours)'),
  ('pin_auto_numbering', 'true', 'Enable automatic pin sequence numbering'),
  ('realtime_updates_enabled', 'true', 'Enable real-time updates via websockets'),
  ('photo_compression_quality', '0.8', 'JPEG compression quality for photo uploads (0.1-1.0)'),
  ('thumbnail_size', '200', 'Thumbnail size in pixels (square)'),
  ('max_pins_per_roof', '1000', 'Maximum number of pins allowed per roof'),
  ('default_pin_status', 'Open', 'Default status for new pins'),
  ('require_photos_for_closure', 'true', 'Require closure photos when closing pins')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create system_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify system config
CREATE POLICY "Only admins can access system config" ON public.system_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'Admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND role = 'Admin')
  );

-- ==========================================
-- PERFORMANCE OPTIMIZATION
-- ==========================================

-- Create additional indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_layer_status ON public.pins(layer_id, status) WHERE status != 'Closed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pin_children_due_date_status ON public.pin_children(due_date, status_child) WHERE due_date IS NOT NULL AND status_child != 'Closed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_uploaded_at_type ON public.photos(uploaded_at DESC, type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_scope_created_at ON public.chats(scope, created_at DESC);

-- Create indexes on JSONB fields for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roofs_zones_search ON public.roofs USING gin((zones -> 'name')) WHERE zones IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_metadata_search ON public.photos USING gin(metadata) WHERE metadata IS NOT NULL;

-- ==========================================
-- INITIAL DATA VALIDATION
-- ==========================================

-- Function to validate database setup
CREATE OR REPLACE FUNCTION validate_database_setup()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  result := jsonb_build_object(
    'tables', table_count,
    'indexes', index_count,
    'rls_policies', policy_count,
    'validation_time', NOW(),
    'status', CASE 
      WHEN table_count >= 15 AND index_count >= 30 AND policy_count >= 20 
      THEN 'healthy'
      ELSE 'needs_attention'
    END
  );
  
  -- Check for required tables
  result := result || jsonb_build_object('required_tables', jsonb_build_object(
    'users', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users'),
    'projects', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'projects'),
    'roofs', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'roofs'),
    'pins', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pins'),
    'pin_children', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'pin_children'),
    'photos', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'photos'),
    'layers', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'layers'),
    'chats', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'chats')
  ));
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_database_setup() TO authenticated;

-- Run validation
SELECT validate_database_setup() as database_validation;

-- ==========================================
-- CLEANUP AND MAINTENANCE
-- ==========================================

-- Create a maintenance function that can be called periodically
CREATE OR REPLACE FUNCTION run_maintenance_tasks()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  cleaned_audit INTEGER;
  cleaned_storage INTEGER;
  updated_stats INTEGER;
BEGIN
  -- Clean up old audit logs (keep last 90 days)
  DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS cleaned_audit = ROW_COUNT;
  
  -- Clean up orphaned storage objects
  SELECT cleanup_orphaned_storage_objects() INTO cleaned_storage;
  
  -- Refresh materialized views if they exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
    updated_stats := 1;
  EXCEPTION
    WHEN undefined_table THEN
      updated_stats := 0;
  END;
  
  -- Update table statistics
  ANALYZE;
  
  result := jsonb_build_object(
    'cleaned_audit_logs', cleaned_audit,
    'cleaned_storage_objects', cleaned_storage,
    'updated_dashboard_stats', updated_stats > 0,
    'maintenance_completed_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION run_maintenance_tasks() TO service_role;

-- Create a function to get system health status
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  total_users INTEGER;
  total_projects INTEGER;
  total_pins INTEGER;
  storage_usage BIGINT;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO total_projects FROM public.projects;
  SELECT COUNT(*) INTO total_pins FROM public.pins;
  
  -- Get approximate storage usage (from photos table)
  SELECT COALESCE(SUM(file_size), 0) INTO storage_usage FROM public.photos;
  
  result := jsonb_build_object(
    'users', total_users,
    'projects', total_projects, 
    'pins', total_pins,
    'storage_usage_bytes', storage_usage,
    'storage_usage_mb', ROUND(storage_usage / 1024.0 / 1024.0, 2),
    'last_check', NOW(),
    'status', 'operational'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_system_health() TO authenticated;

RAISE NOTICE 'SmartPin TPO database initialization completed successfully!';
RAISE NOTICE 'Run SELECT validate_database_setup(); to verify the setup';
RAISE NOTICE 'Run SELECT get_system_health(); to check system status';