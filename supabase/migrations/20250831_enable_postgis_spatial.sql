-- Enable PostGIS for SmartPin TPO spatial features
-- This migration adds spatial capabilities to existing schema

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Add spatial columns to existing tables
ALTER TABLE public.roofs 
ADD COLUMN IF NOT EXISTS plan_regions geometry(MULTIPOLYGON, 4326),
ADD COLUMN IF NOT EXISTS roof_boundary geometry(POLYGON, 4326),
ADD COLUMN IF NOT EXISTS plan_dimensions JSONB DEFAULT '{"width": 1, "height": 1}'::jsonb;

-- Add spatial index for roof regions
CREATE INDEX IF NOT EXISTS idx_roofs_plan_regions ON public.roofs USING GIST (plan_regions);
CREATE INDEX IF NOT EXISTS idx_roofs_boundary ON public.roofs USING GIST (roof_boundary);

-- Convert pin coordinates to proper geometry points
ALTER TABLE public.pins 
ADD COLUMN IF NOT EXISTS location geometry(POINT, 4326) 
GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(x, y), 4326)) STORED;

-- Add spatial index for pin locations
CREATE INDEX IF NOT EXISTS idx_pins_location ON public.pins USING GIST (location);

-- Add pin children spatial support
ALTER TABLE public.pin_children 
ADD COLUMN IF NOT EXISTS x DECIMAL,
ADD COLUMN IF NOT EXISTS y DECIMAL,
ADD COLUMN IF NOT EXISTS location geometry(POINT, 4326) 
GENERATED ALWAYS AS (
  CASE 
    WHEN x IS NOT NULL AND y IS NOT NULL 
    THEN ST_SetSRID(ST_MakePoint(x, y), 4326) 
    ELSE NULL 
  END
) STORED;

CREATE INDEX IF NOT EXISTS idx_pin_children_location ON public.pin_children USING GIST (location);

-- Create spatial validation function
CREATE OR REPLACE FUNCTION validate_pin_location(
  p_roof_id UUID,
  p_x DECIMAL,
  p_y DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  point_geom geometry;
  valid_region BOOLEAN := FALSE;
BEGIN
  -- Create point geometry
  point_geom := ST_SetSRID(ST_MakePoint(p_x, p_y), 4326);
  
  -- Check if point is within any allowed region
  SELECT EXISTS (
    SELECT 1 
    FROM roofs r 
    WHERE r.id = p_roof_id
    AND (
      r.plan_regions IS NULL 
      OR ST_Within(point_geom, r.plan_regions)
      OR ST_Within(point_geom, r.roof_boundary)
    )
  ) INTO valid_region;
  
  RETURN valid_region;
END;
$$ LANGUAGE plpgsql;

-- Enhanced pin creation function with spatial validation
CREATE OR REPLACE FUNCTION create_pin_with_spatial_validation(
  p_roof_id UUID,
  p_x DECIMAL,
  p_y DECIMAL,
  p_seq_number INTEGER DEFAULT NULL,
  p_zone TEXT DEFAULT NULL,
  p_defect_type TEXT DEFAULT NULL,
  p_severity public.severity DEFAULT 'Medium'
) RETURNS public.pins AS $$
DECLARE
  new_pin public.pins;
  next_seq INTEGER;
BEGIN
  -- Validate spatial location
  IF NOT validate_pin_location(p_roof_id, p_x, p_y) THEN
    RAISE EXCEPTION 'Pin location (%, %) is outside allowed regions for roof %', p_x, p_y, p_roof_id;
  END IF;
  
  -- Get next sequence number if not provided
  IF p_seq_number IS NULL THEN
    SELECT COALESCE(MAX(seq_number), 0) + 1 
    INTO next_seq 
    FROM pins 
    WHERE roof_id = p_roof_id;
  ELSE
    next_seq := p_seq_number;
  END IF;
  
  -- Insert the pin
  INSERT INTO pins (
    roof_id, seq_number, x, y, zone, 
    opened_by, opened_at
  ) VALUES (
    p_roof_id, next_seq, p_x, p_y, p_zone,
    auth.uid(), NOW()
  ) RETURNING * INTO new_pin;
  
  -- Log the creation
  INSERT INTO audit_log (entity, entity_id, action, actor_id, diff)
  VALUES (
    'pin', 
    new_pin.id, 
    'create', 
    auth.uid(), 
    jsonb_build_object(
      'seq_number', new_pin.seq_number,
      'location', jsonb_build_object('x', p_x, 'y', p_y),
      'zone', p_zone
    )
  );
  
  RETURN new_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Proximity search function
CREATE OR REPLACE FUNCTION find_nearby_pins(
  p_roof_id UUID,
  p_x DECIMAL,
  p_y DECIMAL,
  p_radius_meters DECIMAL DEFAULT 10
) RETURNS TABLE (
  pin_id UUID,
  seq_number INTEGER,
  distance_meters DECIMAL,
  x DECIMAL,
  y DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.seq_number,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p_x, p_y), 4326)::geography,
      p.location::geography
    )::DECIMAL as distance_meters,
    p.x,
    p.y
  FROM pins p
  WHERE p.roof_id = p_roof_id
  AND ST_DWithin(
    ST_SetSRID(ST_MakePoint(p_x, p_y), 4326)::geography,
    p.location::geography,
    p_radius_meters
  )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Region statistics function
CREATE OR REPLACE FUNCTION get_region_statistics(p_roof_id UUID)
RETURNS TABLE (
  total_pins INTEGER,
  pins_per_zone JSONB,
  pin_density DECIMAL,
  coverage_area DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_pins,
    jsonb_object_agg(
      COALESCE(p.zone, 'unassigned'), 
      COUNT(*)
    ) as pins_per_zone,
    (COUNT(*) / NULLIF(ST_Area(r.roof_boundary::geography), 0))::DECIMAL as pin_density,
    ST_Area(r.roof_boundary::geography)::DECIMAL as coverage_area
  FROM pins p
  JOIN roofs r ON p.roof_id = r.id
  WHERE p.roof_id = p_roof_id
  GROUP BY r.roof_boundary;
END;
$$ LANGUAGE plpgsql;

-- Update existing pins to have default locations (if x,y exist)
UPDATE public.pins 
SET x = COALESCE(x, 0.5), y = COALESCE(y, 0.5)
WHERE x IS NULL OR y IS NULL;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION validate_pin_location TO authenticated;
GRANT EXECUTE ON FUNCTION create_pin_with_spatial_validation TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_pins TO authenticated;
GRANT EXECUTE ON FUNCTION get_region_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION validate_pin_location IS 'Validates if a pin location is within allowed roof regions';
COMMENT ON FUNCTION create_pin_with_spatial_validation IS 'Creates a new pin with spatial validation and logging';
COMMENT ON FUNCTION find_nearby_pins IS 'Finds pins within a specified radius of a location';
COMMENT ON FUNCTION get_region_statistics IS 'Returns spatial statistics for a roof including pin density';

-- Create materialized view for performance (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS pin_spatial_summary AS
SELECT 
  r.id as roof_id,
  r.name as roof_name,
  COUNT(p.id) as total_pins,
  COUNT(CASE WHEN p.status = 'Open' THEN 1 END) as open_pins,
  COUNT(CASE WHEN p.status = 'Closed' THEN 1 END) as closed_pins,
  ST_Extent(p.location) as pins_bbox,
  AVG(ST_X(p.location)) as center_x,
  AVG(ST_Y(p.location)) as center_y
FROM roofs r
LEFT JOIN pins p ON r.id = p.roof_id
GROUP BY r.id, r.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pin_spatial_summary_roof_id ON pin_spatial_summary(roof_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_pin_spatial_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW pin_spatial_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view on pin changes
CREATE OR REPLACE FUNCTION trigger_refresh_spatial_summary()
RETURNS trigger AS $$
BEGIN
  -- Refresh in background (async)
  PERFORM refresh_pin_spatial_summary();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pins_spatial_refresh ON public.pins;
CREATE TRIGGER pins_spatial_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.pins
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_spatial_summary();