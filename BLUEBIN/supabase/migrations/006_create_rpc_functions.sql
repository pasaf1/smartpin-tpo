-- Secure RPC functions for SmartPin TPO
-- Server-side validation with PostGIS spatial checks

-- Secure pin creation with spatial validation
CREATE OR REPLACE FUNCTION secure_create_pin(
  p_type text,
  p_roof_id uuid,
  p_layer_id uuid,
  p_x numeric,
  p_y numeric,
  p_parent_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_point geometry;
  v_new_id uuid;
  v_seq integer;
  v_child_seq text;
  v_user_role user_role;
  v_user_profile record;
BEGIN
  -- Get user profile with role
  SELECT role, organization_id INTO v_user_profile
  FROM profiles WHERE id = auth.uid();
  
  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check layer write permission
  IF NOT EXISTS (
    SELECT 1 FROM layers 
    WHERE id = p_layer_id 
    AND v_user_profile.role = ANY(write_roles)
  ) THEN
    RAISE EXCEPTION 'No write permission for this layer';
  END IF;
  
  -- Create point for spatial validation
  v_point := ST_SetSRID(ST_Point(p_x, p_y), 4326);
  
  -- Check if location is in allowed region
  IF NOT EXISTS (
    SELECT 1 FROM plan_regions
    WHERE roof_id = p_roof_id
    AND ST_Contains(polygon, v_point)
    AND 'pin' = ANY(allowed_tools)
  ) THEN
    RAISE EXCEPTION 'Pin creation not allowed at this location';
  END IF;
  
  -- Validate roof belongs to user's organization
  IF NOT EXISTS (
    SELECT 1 FROM roofs 
    WHERE id = p_roof_id 
    AND organization_id = v_user_profile.organization_id
  ) THEN
    RAISE EXCEPTION 'Roof not accessible to user organization';
  END IF;
  
  IF p_type = 'parent' THEN
    -- Calculate next sequence number
    SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq
    FROM parent_pins WHERE roof_id = p_roof_id;
    
    -- Insert parent pin
    INSERT INTO parent_pins (
      roof_id, layer_id, seq, x, y, 
      title, description, created_by, status
    ) VALUES (
      p_roof_id, p_layer_id, v_seq, p_x, p_y,
      COALESCE(p_title, 'Pin ' || v_seq), p_description, auth.uid(), 'Open'
    ) RETURNING id INTO v_new_id;
    
  ELSIF p_type = 'child' THEN
    -- Validate parent pin exists and user has access
    IF NOT EXISTS (
      SELECT 1 FROM parent_pins 
      WHERE id = p_parent_id 
      AND (
        created_by = auth.uid() OR 
        assigned_to = auth.uid() OR
        v_user_profile.role IN ('admin', 'qa_manager')
      )
    ) THEN
      RAISE EXCEPTION 'Parent pin not accessible or not found';
    END IF;
    
    -- Calculate child sequence
    SELECT COALESCE(MAX(
      CAST(split_part(seq, '.', 2) AS integer)
    ), 0) + 1 INTO v_seq
    FROM child_pins WHERE parent_id = p_parent_id;
    
    -- Build child sequence (e.g., "3.1", "3.2")
    SELECT pp.seq || '.' || v_seq INTO v_child_seq
    FROM parent_pins pp WHERE id = p_parent_id;
    
    -- Insert child pin
    INSERT INTO child_pins (
      parent_id, seq, x, y,
      title, description, created_by, status
    ) VALUES (
      p_parent_id, v_child_seq, p_x, p_y,
      COALESCE(p_title, 'Sub-pin ' || v_child_seq), p_description, auth.uid(), 'Open'
    ) RETURNING id INTO v_new_id;
  ELSE
    RAISE EXCEPTION 'Invalid pin type. Must be "parent" or "child"';
  END IF;
  
  -- Log activity for audit trail
  INSERT INTO activity_logs (
    roof_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    p_roof_id, auth.uid(), 'created', p_type || '_pin', v_new_id,
    jsonb_build_object('coordinates', jsonb_build_object('x', p_x, 'y', p_y))
  );
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available tools at a specific point (mobile tool restriction)
CREATE OR REPLACE FUNCTION get_tools_at_point(
  p_roof_id uuid,
  p_x numeric,
  p_y numeric
) RETURNS text[] AS $$
DECLARE
  v_point geometry;
  v_tools text[];
BEGIN
  v_point := ST_SetSRID(ST_Point(p_x, p_y), 4326);
  
  SELECT array_agg(DISTINCT tool)
  INTO v_tools
  FROM (
    SELECT unnest(allowed_tools) as tool
    FROM plan_regions
    WHERE roof_id = p_roof_id
    AND ST_Contains(polygon, v_point)
  ) t;
  
  RETURN COALESCE(v_tools, ARRAY[]::text[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch update pin status (mobile bulk operations)
CREATE OR REPLACE FUNCTION update_pin_status(
  p_pin_ids uuid[],
  p_new_status pin_status,
  p_is_parent boolean DEFAULT true
) RETURNS integer AS $$
DECLARE
  v_updated integer;
  v_roof_id uuid;
  v_user_profile record;
BEGIN
  -- Get user profile
  SELECT role, organization_id INTO v_user_profile
  FROM profiles WHERE id = auth.uid();
  
  IF v_user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Update parent pins or child pins based on parameter
  IF p_is_parent THEN
    UPDATE parent_pins
    SET status = p_new_status,
        updated_at = now()
    WHERE id = ANY(p_pin_ids)
    AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      v_user_profile.role IN ('admin', 'qa_manager') OR
      EXISTS (
        SELECT 1 FROM layers
        WHERE id = parent_pins.layer_id
        AND v_user_profile.role = ANY(write_roles)
      )
    );
  ELSE
    UPDATE child_pins
    SET status = p_new_status,
        updated_at = now()
    WHERE id = ANY(p_pin_ids)
    AND (
      created_by = auth.uid() OR
      v_user_profile.role IN ('admin', 'qa_manager') OR
      EXISTS (
        SELECT 1 FROM parent_pins pp
        JOIN layers l ON l.id = pp.layer_id
        WHERE pp.id = child_pins.parent_id
        AND (pp.created_by = auth.uid() OR pp.assigned_to = auth.uid())
        AND v_user_profile.role = ANY(l.write_roles)
      )
    );
  END IF;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Get roof_id for logging
  IF p_is_parent AND v_updated > 0 THEN
    SELECT roof_id INTO v_roof_id FROM parent_pins WHERE id = p_pin_ids[1];
  ELSIF NOT p_is_parent AND v_updated > 0 THEN
    SELECT pp.roof_id INTO v_roof_id 
    FROM child_pins cp 
    JOIN parent_pins pp ON pp.id = cp.parent_id 
    WHERE cp.id = p_pin_ids[1];
  END IF;
  
  -- Log batch activity
  IF v_updated > 0 AND v_roof_id IS NOT NULL THEN
    INSERT INTO activity_logs (roof_id, user_id, action, entity_type, details)
    VALUES (
      v_roof_id, auth.uid(), 'batch_status_update', 
      CASE WHEN p_is_parent THEN 'parent_pins' ELSE 'child_pins' END,
      jsonb_build_object(
        'count', v_updated, 
        'status', p_new_status,
        'pin_ids', p_pin_ids
      )
    );
  END IF;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pins in viewport for mobile performance (viewport culling)
CREATE OR REPLACE FUNCTION get_pins_in_viewport(
  p_roof_id uuid,
  p_min_x numeric DEFAULT 0,
  p_max_x numeric DEFAULT 1,
  p_min_y numeric DEFAULT 0,
  p_max_y numeric DEFAULT 1
) RETURNS TABLE(
  id uuid,
  seq integer,
  x numeric,
  y numeric,
  status pin_status,
  title text,
  layer_name text,
  child_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.seq,
    pp.x,
    pp.y,
    pp.status,
    pp.title,
    l.name as layer_name,
    COALESCE(child_counts.count, 0) as child_count
  FROM parent_pins pp
  JOIN layers l ON l.id = pp.layer_id
  LEFT JOIN (
    SELECT parent_id, count(*) as count
    FROM child_pins
    GROUP BY parent_id
  ) child_counts ON child_counts.parent_id = pp.id
  WHERE pp.roof_id = p_roof_id
  AND pp.x >= p_min_x AND pp.x <= p_max_x
  AND pp.y >= p_min_y AND pp.y <= p_max_y
  ORDER BY pp.seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search pins with text (mobile search functionality)
CREATE OR REPLACE FUNCTION search_pins(
  p_roof_id uuid,
  p_search_term text,
  p_limit integer DEFAULT 20
) RETURNS TABLE(
  id uuid,
  type text,
  seq text,
  title text,
  description text,
  status pin_status,
  similarity real
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      pp.id,
      'parent'::text as type,
      pp.seq::text,
      pp.title,
      pp.description,
      pp.status,
      GREATEST(
        similarity(pp.title, p_search_term),
        similarity(COALESCE(pp.description, ''), p_search_term)
      ) as similarity
    FROM parent_pins pp
    WHERE pp.roof_id = p_roof_id
    AND (
      pp.title % p_search_term OR
      COALESCE(pp.description, '') % p_search_term
    )
  )
  UNION ALL
  (
    SELECT 
      cp.id,
      'child'::text as type,
      cp.seq,
      cp.title,
      cp.description,
      cp.status,
      GREATEST(
        similarity(cp.title, p_search_term),
        similarity(COALESCE(cp.description, ''), p_search_term)
      ) as similarity
    FROM child_pins cp
    JOIN parent_pins pp ON pp.id = cp.parent_id
    WHERE pp.roof_id = p_roof_id
    AND (
      cp.title % p_search_term OR
      COALESCE(cp.description, '') % p_search_term
    )
  )
  ORDER BY similarity DESC, type, seq
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;