-- SmartPin TPO Database Functions and Views
-- Functions for business logic and data aggregation

-- Function to recompute parent pin aggregates
CREATE OR REPLACE FUNCTION public.recompute_parent_aggregates(p_pin UUID)
RETURNS void AS $$
DECLARE
    total_children INTEGER;
    open_children INTEGER;
    ready_children INTEGER;
    closed_children INTEGER;
    mix_state TEXT;
BEGIN
    -- Count children by status
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status_child = 'Open'),
        COUNT(*) FILTER (WHERE status_child = 'ReadyForInspection'),
        COUNT(*) FILTER (WHERE status_child = 'Closed')
    INTO total_children, open_children, ready_children, closed_children
    FROM public.pin_children
    WHERE pin_id = p_pin;

    -- Determine mix state
    IF total_children = 0 THEN
        mix_state := NULL;
    ELSIF closed_children = total_children THEN
        mix_state := 'ALL_CLOSED';
    ELSIF open_children = total_children THEN
        mix_state := 'ALL_OPEN';
    ELSE
        mix_state := 'MIXED';
    END IF;

    -- Update parent pin aggregates
    UPDATE public.pins
    SET 
        children_total = total_children,
        children_open = open_children,
        children_ready = ready_children,
        children_closed = closed_children,
        parent_mix_state = mix_state,
        last_activity_at = now()
    WHERE id = p_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate parent pin status based on children
CREATE OR REPLACE FUNCTION public.calculate_parent_pin_status(child_pins JSONB)
RETURNS public.pin_status AS $$
DECLARE
    total_count INTEGER;
    open_count INTEGER;
    ready_count INTEGER;
    closed_count INTEGER;
BEGIN
    -- Extract counts from JSONB parameter
    total_count := (child_pins->>'total')::INTEGER;
    open_count := (child_pins->>'open')::INTEGER;
    ready_count := (child_pins->>'ready')::INTEGER;
    closed_count := (child_pins->>'closed')::INTEGER;

    -- Apply business rules
    IF total_count = 0 OR total_count = open_count THEN
        RETURN 'Open';
    ELSIF total_count = closed_count THEN
        RETURN 'Closed';
    ELSE
        RETURN 'ReadyForInspection';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate pin closure requirements
CREATE OR REPLACE FUNCTION public.validate_pin_closure(pin_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    open_children INTEGER;
    missing_photos INTEGER;
    validation_errors TEXT[];
BEGIN
    -- Check for open children
    SELECT COUNT(*)
    INTO open_children
    FROM public.pin_children
    WHERE pin_id = pin_uuid AND status_child = 'Open';

    -- Check for missing closure photos
    SELECT COUNT(*)
    INTO missing_photos
    FROM public.pin_children pc
    LEFT JOIN public.photos p ON pc.closurepic_id = p.photo_id
    WHERE pc.pin_id = pin_uuid 
    AND pc.status_child = 'Closed' 
    AND p.photo_id IS NULL;

    -- Build validation result
    IF open_children > 0 THEN
        validation_errors := array_append(validation_errors, 
            format('Cannot close pin: %s open children remain', open_children));
    END IF;

    IF missing_photos > 0 THEN
        validation_errors := array_append(validation_errors, 
            format('Cannot close pin: %s closed items missing closure photos', missing_photos));
    END IF;

    result := jsonb_build_object(
        'can_close', (validation_errors IS NULL OR array_length(validation_errors, 1) = 0),
        'errors', COALESCE(validation_errors, ARRAY[]::TEXT[]),
        'open_children', open_children,
        'missing_closure_photos', missing_photos
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get risk matrix data for analytics
CREATE OR REPLACE FUNCTION public.get_risk_matrix_data(
    roof_id_param UUID DEFAULT NULL,
    filters JSONB DEFAULT NULL
)
RETURNS TABLE (
    defect_layer TEXT,
    severity TEXT,
    occurrence_count BIGINT,
    risk_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pc.defect_type, 'Unknown') as defect_layer,
        pc.severity::TEXT,
        COUNT(*) as occurrence_count,
        -- Simple risk scoring: Critical=4, High=3, Medium=2, Low=1
        COUNT(*) * (CASE 
            WHEN pc.severity = 'Critical' THEN 4
            WHEN pc.severity = 'High' THEN 3
            WHEN pc.severity = 'Medium' THEN 2
            WHEN pc.severity = 'Low' THEN 1
            ELSE 1
        END) as risk_score
    FROM public.pin_children pc
    JOIN public.pins p ON pc.pin_id = p.id
    JOIN public.roofs r ON p.roof_id = r.id
    WHERE 
        (roof_id_param IS NULL OR r.id = roof_id_param)
        AND pc.status_child IN ('Open', 'ReadyForInspection')
    GROUP BY pc.defect_type, pc.severity
    ORDER BY risk_score DESC, occurrence_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create database views for common queries

-- View: Latest activity per pin
CREATE OR REPLACE VIEW public.v_pins_latest_activity AS
SELECT 
    p.id as pin_id,
    GREATEST(
        p.last_activity_at,
        COALESCE(MAX(pc.updated_at), p.opened_at)
    ) as latest_activity
FROM public.pins p
LEFT JOIN public.pin_children pc ON p.id = pc.pin_id
GROUP BY p.id, p.last_activity_at, p.opened_at;

-- View: Pin items with parent information (legacy compatibility)
CREATE OR REPLACE VIEW public.v_pin_items_with_parent AS
SELECT 
    pi.id,
    pi.pin_id,
    pi.seq_suffix,
    pi.status,
    pi.severity,
    pi.defect_type,
    pi.defect_layer,
    pi.description,
    pi.cause,
    pi.corrective_action,
    pi.preventive_action,
    pi.contractor,
    pi.foreman,
    pi.opened_by,
    pi.opened_at,
    pi.sla_due_date,
    pi.closed_at,
    pi.last_activity_at,
    p.seq_number as parent_seq_number,
    p.roof_id,
    p.zone as pin_zone,
    p.x as pin_x,
    p.y as pin_y,
    r.code as roof_code,
    r.name as roof_name,
    r.building,
    CONCAT(r.code, '-', p.seq_number, '.', pi.seq_suffix) as display_id
FROM public.pin_items pi
JOIN public.pins p ON pi.pin_id = p.id
JOIN public.roofs r ON p.roof_id = r.id;

-- View: Parent pin status summary
CREATE OR REPLACE VIEW public.v_parent_pin_status_summary AS
SELECT 
    p.id as pin_id,
    p.children_total,
    p.children_open,
    p.children_ready,
    p.children_closed,
    CASE 
        WHEN p.children_total = 0 THEN 0
        ELSE ROUND((p.children_closed::DECIMAL / p.children_total::DECIMAL) * 100, 1)
    END as completion_percentage,
    (p.children_open = 0 AND p.children_ready = 0) as can_be_closed
FROM public.pins p;

-- Triggers to automatically update parent aggregates when children change
CREATE OR REPLACE FUNCTION public.trigger_update_parent_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.recompute_parent_aggregates(NEW.pin_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.recompute_parent_aggregates(OLD.pin_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to pin_children table
DROP TRIGGER IF EXISTS trigger_pin_children_update_parent ON public.pin_children;
CREATE TRIGGER trigger_pin_children_update_parent
    AFTER INSERT OR UPDATE OR DELETE ON public.pin_children
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_parent_aggregates();

-- Trigger to update last_activity_at on pins when children are modified
CREATE OR REPLACE FUNCTION public.trigger_update_pin_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.pins 
        SET last_activity_at = now() 
        WHERE id = NEW.pin_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.pins 
        SET last_activity_at = now() 
        WHERE id = OLD.pin_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pin_children_activity ON public.pin_children;
CREATE TRIGGER trigger_pin_children_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.pin_children
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_pin_activity();