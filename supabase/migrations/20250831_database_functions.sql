-- Database Functions and Stored Procedures for SmartPin TPO
-- Business logic functions for complex operations

-- ==========================================
-- PIN MANAGEMENT FUNCTIONS
-- ==========================================

-- Function to create a new pin with automatic sequence numbering
CREATE OR REPLACE FUNCTION create_pin(
  p_roof_id UUID,
  p_x DECIMAL,
  p_y DECIMAL,
  p_zone TEXT DEFAULT NULL,
  p_layer_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_seq_number INTEGER;
  v_pin_id UUID;
  v_user_id UUID;
  v_default_layer_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get next sequence number for the roof
  SELECT COALESCE(MAX(seq_number), 0) + 1 INTO v_seq_number
  FROM public.pins 
  WHERE roof_id = p_roof_id;
  
  -- Get default layer if not provided
  IF p_layer_id IS NULL THEN
    SELECT id INTO v_default_layer_id
    FROM public.layers
    WHERE roof_id = p_roof_id AND name = 'Quality Control'
    ORDER BY z_index
    LIMIT 1;
    
    IF v_default_layer_id IS NULL THEN
      -- Create default layer if it doesn't exist
      INSERT INTO public.layers (roof_id, name, type, z_index)
      VALUES (p_roof_id, 'Quality Control', 'pins', 1)
      RETURNING id INTO v_default_layer_id;
    END IF;
    
    p_layer_id := v_default_layer_id;
  END IF;
  
  -- Create the pin
  INSERT INTO public.pins (
    roof_id, seq_number, x, y, zone, layer_id, opened_by, opened_at, last_activity_at
  ) VALUES (
    p_roof_id, v_seq_number, p_x, p_y, p_zone, p_layer_id, v_user_id, NOW(), NOW()
  ) RETURNING id INTO v_pin_id;
  
  -- Log the action
  INSERT INTO public.audit_log (entity, entity_id, action, actor_id, diff)
  VALUES ('pin', v_pin_id, 'CREATE', v_user_id, jsonb_build_object(
    'roof_id', p_roof_id,
    'seq_number', v_seq_number,
    'coordinates', jsonb_build_object('x', p_x, 'y', p_y)
  ));
  
  RETURN v_pin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a pin child with automatic sequence
CREATE OR REPLACE FUNCTION create_pin_child(
  p_pin_id UUID,
  p_defect_type TEXT,
  p_severity public.severity DEFAULT 'Medium',
  p_zone TEXT DEFAULT NULL,
  p_defect_layer public.defect_layer DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_child_id UUID;
  v_child_code TEXT;
  v_parent_seq INTEGER;
  v_child_seq INTEGER;
BEGIN
  -- Get parent pin sequence number
  SELECT seq_number INTO v_parent_seq FROM public.pins WHERE id = p_pin_id;
  IF v_parent_seq IS NULL THEN
    RAISE EXCEPTION 'Parent pin not found';
  END IF;
  
  -- Get next child sequence for this parent
  SELECT COALESCE(MAX(CAST(SUBSTRING(child_code FROM '\\.(\d+)$') AS INTEGER)), 0) + 1
  INTO v_child_seq
  FROM public.pin_children 
  WHERE pin_id = p_pin_id;
  
  -- Generate child code (e.g., "1.1", "1.2", etc.)
  v_child_code := v_parent_seq || '.' || v_child_seq;
  
  -- Create the pin child
  INSERT INTO public.pin_children (
    pin_id, child_code, zone, defect_type, severity, 
    status_child, due_date, notes, open_date
  ) VALUES (
    p_pin_id, v_child_code, COALESCE(p_zone, (SELECT zone FROM public.pins WHERE id = p_pin_id)),
    p_defect_type, p_severity, 'Open', p_due_date, p_notes, NOW()
  ) RETURNING child_id INTO v_child_id;
  
  -- Log the action
  INSERT INTO public.audit_log (entity, entity_id, action, actor_id, diff)
  VALUES ('pin_child', v_child_id, 'CREATE', 
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid()),
    jsonb_build_object(
      'parent_pin_id', p_pin_id,
      'child_code', v_child_code,
      'defect_type', p_defect_type,
      'severity', p_severity
    ));
  
  RETURN v_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update pin status with cascading logic
CREATE OR REPLACE FUNCTION update_pin_status(
  p_pin_id UUID,
  p_new_status public.pin_status
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_status public.pin_status;
  v_user_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = auth.uid();
  
  -- Get current status
  SELECT status INTO v_old_status FROM public.pins WHERE id = p_pin_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Pin not found';
  END IF;
  
  -- Update the pin status
  UPDATE public.pins 
  SET 
    status = p_new_status,
    status_parent_manual = p_new_status,
    last_activity_at = NOW()
  WHERE id = p_pin_id;
  
  -- If closing pin, close all open children
  IF p_new_status = 'Closed' AND v_old_status != 'Closed' THEN
    UPDATE public.pin_children 
    SET 
      status_child = 'Closed',
      closed_date = NOW(),
      updated_at = NOW()
    WHERE pin_id = p_pin_id AND status_child != 'Closed';
  END IF;
  
  -- If reopening pin, reopen all children that were auto-closed
  IF p_new_status = 'Open' AND v_old_status = 'Closed' THEN
    UPDATE public.pin_children 
    SET 
      status_child = 'Open',
      closed_date = NULL,
      updated_at = NOW()
    WHERE pin_id = p_pin_id AND status_child = 'Closed';
  END IF;
  
  -- Log the action
  INSERT INTO public.audit_log (entity, entity_id, action, actor_id, diff)
  VALUES ('pin', p_pin_id, 'STATUS_UPDATE', v_user_id, jsonb_build_object(
    'old_status', v_old_status,
    'new_status', p_new_status
  ));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ANALYTICS FUNCTIONS
-- ==========================================

-- Function to get project dashboard statistics
CREATE OR REPLACE FUNCTION get_project_dashboard_stats(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT r.id) as total_roofs,
      COUNT(DISTINCT p.id) as total_pins,
      COUNT(DISTINCT pc.child_id) as total_issues,
      COUNT(CASE WHEN p.status = 'Open' THEN 1 END) as open_pins,
      COUNT(CASE WHEN p.status = 'ReadyForInspection' THEN 1 END) as ready_pins,
      COUNT(CASE WHEN p.status = 'Closed' THEN 1 END) as closed_pins,
      COUNT(CASE WHEN pc.status_child = 'Open' THEN 1 END) as open_issues,
      COUNT(CASE WHEN pc.status_child = 'ReadyForInspection' THEN 1 END) as ready_issues,
      COUNT(CASE WHEN pc.status_child = 'Closed' THEN 1 END) as closed_issues,
      COUNT(CASE WHEN pc.severity = 'Critical' THEN 1 END) as critical_issues,
      COUNT(CASE WHEN pc.severity = 'High' THEN 1 END) as high_issues,
      COUNT(CASE WHEN pc.severity = 'Medium' THEN 1 END) as medium_issues,
      COUNT(CASE WHEN pc.severity = 'Low' THEN 1 END) as low_issues,
      MAX(p.last_activity_at) as last_activity,
      COUNT(DISTINCT ph.photo_id) as total_photos,
      COUNT(DISTINCT ch.message_id) as total_messages
    FROM public.projects proj
    LEFT JOIN public.roofs r ON r.project_id = proj.project_id
    LEFT JOIN public.pins p ON p.roof_id = r.id
    LEFT JOIN public.pin_children pc ON pc.pin_id = p.id
    LEFT JOIN public.photos ph ON ph.project_id = proj.project_id
    LEFT JOIN public.chats ch ON (ch.scope = 'roof' AND ch.scope_id = r.id::text) OR (ch.scope = 'pin' AND ch.scope_id = p.id::text)
    WHERE proj.project_id = p_project_id
      AND (r.is_active IS NULL OR r.is_active = true)
  )
  SELECT jsonb_build_object(
    'totalRoofs', total_roofs,
    'totalPins', total_pins,
    'totalIssues', total_issues,
    'pinStatus', jsonb_build_object(
      'open', open_pins,
      'ready', ready_pins,
      'closed', closed_pins
    ),
    'issueStatus', jsonb_build_object(
      'open', open_issues,
      'ready', ready_issues,
      'closed', closed_issues
    ),
    'severityBreakdown', jsonb_build_object(
      'critical', critical_issues,
      'high', high_issues,
      'medium', medium_issues,
      'low', low_issues
    ),
    'lastActivity', last_activity,
    'totalPhotos', total_photos,
    'totalMessages', total_messages,
    'completionRate', CASE 
      WHEN total_issues > 0 THEN ROUND((closed_issues::DECIMAL / total_issues::DECIMAL) * 100, 2)
      ELSE 0
    END
  ) INTO v_stats FROM stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get roof activity timeline
CREATE OR REPLACE FUNCTION get_roof_activity_timeline(
  p_roof_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_activities JSONB;
BEGIN
  WITH activities AS (
    -- Pin activities
    SELECT 
      'pin' as entity_type,
      p.id as entity_id,
      'Pin #' || p.seq_number as entity_name,
      al.action,
      al.created_at,
      al.actor_id,
      u.full_name as actor_name,
      al.diff
    FROM public.audit_log al
    JOIN public.pins p ON p.id = al.entity_id
    JOIN public.users u ON u.id = al.actor_id
    WHERE p.roof_id = p_roof_id
      AND al.entity = 'pin'
    
    UNION ALL
    
    -- Pin child activities
    SELECT 
      'pin_child' as entity_type,
      pc.child_id as entity_id,
      'Issue ' || pc.child_code as entity_name,
      al.action,
      al.created_at,
      al.actor_id,
      u.full_name as actor_name,
      al.diff
    FROM public.audit_log al
    JOIN public.pin_children pc ON pc.child_id = al.entity_id
    JOIN public.pins p ON p.id = pc.pin_id
    JOIN public.users u ON u.id = al.actor_id
    WHERE p.roof_id = p_roof_id
      AND al.entity = 'pin_child'
    
    UNION ALL
    
    -- Photo uploads
    SELECT 
      'photo' as entity_type,
      ph.photo_id as entity_id,
      'Photo uploaded' as entity_name,
      'UPLOAD' as action,
      ph.uploaded_at as created_at,
      ph.uploaded_by as actor_id,
      u.full_name as actor_name,
      jsonb_build_object('type', ph.type, 'file_name', ph.file_name) as diff
    FROM public.photos ph
    JOIN public.users u ON u.id = ph.uploaded_by
    WHERE ph.roof_id = p_roof_id
    
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'entityType', entity_type,
      'entityId', entity_id,
      'entityName', entity_name,
      'action', action,
      'createdAt', created_at,
      'actorId', actor_id,
      'actorName', actor_name,
      'details', diff
    ) ORDER BY created_at DESC
  ) INTO v_activities FROM activities;
  
  RETURN COALESCE(v_activities, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- NOTIFICATION FUNCTIONS
-- ==========================================

-- Function to send notification (integrates with external notification service)
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Create notification record (for future notification history)
  INSERT INTO public.notifications (
    user_id, type, title, message, data, created_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, NOW()
  ) RETURNING id INTO v_notification_id;
  
  -- Here you would integrate with external push notification service
  -- For now, we just return success
  RETURN TRUE;
EXCEPTION
  WHEN others THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ==========================================
-- SPATIAL FUNCTIONS (for BLUEBIN integration)
-- ==========================================

-- Function to check if coordinates are within allowed regions
CREATE OR REPLACE FUNCTION coordinates_allowed_for_tool(
  p_roof_id UUID,
  p_x DECIMAL,
  p_y DECIMAL,
  p_tool TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_allowed BOOLEAN := FALSE;
  v_point GEOMETRY;
BEGIN
  -- Convert normalized coordinates to geometry point
  v_point := ST_MakePoint(p_x, p_y);
  
  -- Check if point is within any region that allows this tool
  SELECT EXISTS (
    SELECT 1 FROM public.plan_regions pr
    WHERE pr.roof_id = p_roof_id
      AND p_tool = ANY(pr.allowed_tools)
      AND ST_Contains(pr.polygon, v_point)
  ) INTO v_allowed;
  
  RETURN v_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CLEANUP FUNCTIONS
-- ==========================================

-- Function to archive old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.audit_log
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS JSONB AS $$
DECLARE
  v_results JSONB := '{}';
  v_count INTEGER;
BEGIN
  -- Cleanup orphaned pin_children
  DELETE FROM public.pin_children WHERE pin_id NOT IN (SELECT id FROM public.pins);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_results := v_results || jsonb_build_object('orphaned_pin_children', v_count);
  
  -- Cleanup orphaned photos
  DELETE FROM public.photos 
  WHERE pin_id IS NOT NULL AND pin_id NOT IN (SELECT id FROM public.pins);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_results := v_results || jsonb_build_object('orphaned_pin_photos', v_count);
  
  DELETE FROM public.photos 
  WHERE child_id IS NOT NULL AND child_id NOT IN (SELECT child_id FROM public.pin_children);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_results := v_results || jsonb_build_object('orphaned_child_photos', v_count);
  
  -- Cleanup orphaned chats
  DELETE FROM public.chats 
  WHERE scope = 'pin' AND scope_id::uuid NOT IN (SELECT id FROM public.pins);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_results := v_results || jsonb_build_object('orphaned_pin_chats', v_count);
  
  DELETE FROM public.chats 
  WHERE scope = 'roof' AND scope_id::uuid NOT IN (SELECT id FROM public.roofs);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_results := v_results || jsonb_build_object('orphaned_roof_chats', v_count);
  
  -- Cleanup old audit logs
  SELECT archive_old_audit_logs() INTO v_count;
  v_results := v_results || jsonb_build_object('archived_audit_logs', v_count);
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to appropriate roles
GRANT EXECUTE ON FUNCTION create_pin(UUID, DECIMAL, DECIMAL, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_pin_child(UUID, TEXT, public.severity, TEXT, public.defect_layer, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION update_pin_status(UUID, public.pin_status) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_roof_activity_timeline(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION coordinates_allowed_for_tool(UUID, DECIMAL, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_records() TO service_role;
GRANT EXECUTE ON FUNCTION archive_old_audit_logs() TO service_role;