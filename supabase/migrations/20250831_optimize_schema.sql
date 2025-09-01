-- SmartPin TPO Schema Optimization Migration
-- Optimize existing schema for production performance and consistency

-- Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_contractor ON public.projects(contractor);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roofs_project_id ON public.roofs(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roofs_is_active ON public.roofs(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_opened_by ON public.pins(opened_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_last_activity ON public.pins(last_activity_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pin_children_status_child ON public.pin_children(status_child);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pin_children_severity ON public.pin_children(severity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pin_children_due_date ON public.pin_children(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_type ON public.photos(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_uploaded_at ON public.photos(uploaded_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_roof_status ON public.pins(roof_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pin_children_pin_status ON public.pin_children(pin_id, status_child);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_pin_type ON public.photos(pin_id, type) WHERE pin_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_scope_created ON public.chats(scope, scope_id, created_at DESC);

-- Optimize JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roofs_zones_gin ON public.roofs USING gin(zones);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roofs_stakeholders_gin ON public.roofs USING gin(stakeholders);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_metadata_gin ON public.photos USING gin(metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_prefs_filter_gin ON public.user_prefs USING gin(filter_settings);

-- Add constraints for data integrity
ALTER TABLE public.pins 
ADD CONSTRAINT chk_pins_coordinates CHECK (x >= 0 AND x <= 1 AND y >= 0 AND y <= 1);

ALTER TABLE public.pin_children
ADD CONSTRAINT chk_pin_children_dates CHECK (
    (closed_date IS NULL AND status_child != 'Closed') OR
    (closed_date IS NOT NULL AND status_child = 'Closed') OR
    (closed_date >= open_date)
);

ALTER TABLE public.photos
ADD CONSTRAINT chk_photos_file_size CHECK (file_size > 0 AND file_size <= 50000000); -- 50MB max

-- Add NOT NULL constraints where appropriate (after data cleanup)
-- These would be added in a subsequent migration after data validation
-- ALTER TABLE public.pins ALTER COLUMN opened_by SET NOT NULL;
-- ALTER TABLE public.projects ALTER COLUMN created_by SET NOT NULL;

-- Update trigger functions for better performance
CREATE OR REPLACE FUNCTION update_pin_children_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent pin counts when child status changes
    IF TG_OP = 'UPDATE' AND OLD.status_child != NEW.status_child THEN
        UPDATE public.pins 
        SET 
            children_open = (SELECT COUNT(*) FROM public.pin_children WHERE pin_id = NEW.pin_id AND status_child = 'Open'),
            children_ready = (SELECT COUNT(*) FROM public.pin_children WHERE pin_id = NEW.pin_id AND status_child = 'ReadyForInspection'),
            children_closed = (SELECT COUNT(*) FROM public.pin_children WHERE pin_id = NEW.pin_id AND status_child = 'Closed'),
            last_activity_at = NOW()
        WHERE id = NEW.pin_id;
        
        -- Update parent mix state
        UPDATE public.pins 
        SET parent_mix_state = (
            CASE 
                WHEN children_open = 0 AND children_ready = 0 THEN 'ALL_CLOSED'
                WHEN children_closed = 0 THEN 'ALL_OPEN'
                ELSE 'MIXED'
            END
        )
        WHERE id = NEW.pin_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pin children count updates
DROP TRIGGER IF EXISTS trigger_update_pin_children_counts ON public.pin_children;
CREATE TRIGGER trigger_update_pin_children_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.pin_children
    FOR EACH ROW
    EXECUTE FUNCTION update_pin_children_counts();

-- Create function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at for pins when any related data changes
    IF TG_TABLE_NAME = 'pin_children' THEN
        UPDATE public.pins SET last_activity_at = NOW() WHERE id = NEW.pin_id;
    ELSIF TG_TABLE_NAME = 'photos' AND NEW.pin_id IS NOT NULL THEN
        UPDATE public.pins SET last_activity_at = NOW() WHERE id = NEW.pin_id;
    ELSIF TG_TABLE_NAME = 'chats' AND NEW.scope = 'pin' AND NEW.scope_id IS NOT NULL THEN
        UPDATE public.pins SET last_activity_at = NOW() WHERE id = NEW.scope_id::uuid;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity tracking
DROP TRIGGER IF EXISTS trigger_pin_children_activity ON public.pin_children;
CREATE TRIGGER trigger_pin_children_activity
    AFTER INSERT OR UPDATE ON public.pin_children
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

DROP TRIGGER IF EXISTS trigger_photos_activity ON public.photos;
CREATE TRIGGER trigger_photos_activity
    AFTER INSERT ON public.photos
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

DROP TRIGGER IF EXISTS trigger_chats_activity ON public.chats;
CREATE TRIGGER trigger_chats_activity
    AFTER INSERT ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

-- Add comments for documentation
COMMENT ON TABLE public.pins IS 'Parent pins representing groups of related issues on a roof';
COMMENT ON TABLE public.pin_children IS 'Individual defects/issues within a parent pin group';
COMMENT ON TABLE public.layers IS 'BLUEBIN layer system for organizing different types of annotations';
COMMENT ON TABLE public.plan_regions IS 'Spatial regions defining tool permissions on roof plans';
COMMENT ON TABLE public.annotations IS 'Drawing annotations and markup on roof plans';
COMMENT ON TABLE public.photos IS 'Photo attachments for pins and issues with metadata';
COMMENT ON TABLE public.chats IS 'Messaging system for global, roof, and pin-specific communications';
COMMENT ON TABLE public.audit_log IS 'Audit trail for all system changes and user actions';

-- Create materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT 
    p.project_id,
    proj.name as project_name,
    COUNT(DISTINCT r.id) as total_roofs,
    COUNT(DISTINCT pins.id) as total_pins,
    COUNT(DISTINCT pc.child_id) as total_issues,
    COUNT(CASE WHEN pins.status = 'Open' THEN 1 END) as open_pins,
    COUNT(CASE WHEN pins.status = 'ReadyForInspection' THEN 1 END) as ready_pins,
    COUNT(CASE WHEN pins.status = 'Closed' THEN 1 END) as closed_pins,
    COUNT(CASE WHEN pc.status_child = 'Open' THEN 1 END) as open_issues,
    COUNT(CASE WHEN pc.status_child = 'ReadyForInspection' THEN 1 END) as ready_issues,
    COUNT(CASE WHEN pc.status_child = 'Closed' THEN 1 END) as closed_issues,
    COUNT(CASE WHEN pc.severity = 'Critical' THEN 1 END) as critical_issues,
    COUNT(CASE WHEN pc.severity = 'High' THEN 1 END) as high_issues,
    COUNT(CASE WHEN pc.severity = 'Medium' THEN 1 END) as medium_issues,
    COUNT(CASE WHEN pc.severity = 'Low' THEN 1 END) as low_issues,
    MAX(pins.last_activity_at) as last_activity
FROM public.projects proj
LEFT JOIN public.roofs r ON r.project_id = proj.project_id
LEFT JOIN public.pins pins ON pins.roof_id = r.id
LEFT JOIN public.pin_children pc ON pc.pin_id = pins.id
WHERE r.is_active = true
GROUP BY p.project_id, proj.name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_project ON public.dashboard_stats(project_id);

-- Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule dashboard stats refresh (would be set up with pg_cron in production)
-- SELECT cron.schedule('refresh-dashboard', '*/5 * * * *', 'SELECT refresh_dashboard_stats();');

ANALYZE; -- Update table statistics for query planner