-- Create indexes for SmartPin TPO performance optimization
-- Optimized for mobile queries and real-time updates

-- Core relationship indexes
CREATE INDEX idx_parent_pins_roof ON parent_pins(roof_id);
CREATE INDEX idx_child_pins_parent ON child_pins(parent_id);
CREATE INDEX idx_annotations_roof_layer ON annotations(roof_id, layer_id);

-- Spatial indexes using PostGIS GIST for fast geographic queries
CREATE INDEX idx_plan_regions_polygon ON plan_regions USING GIST(polygon);

-- Activity log performance (mobile sync queries)
CREATE INDEX idx_activity_logs_roof ON activity_logs(roof_id, created_at DESC);

-- Status-based queries (common on mobile dashboards)
CREATE INDEX idx_parent_pins_status ON parent_pins(status) WHERE status != 'Closed';
CREATE INDEX idx_child_pins_status ON child_pins(status) WHERE status != 'Closed';

-- Layer visibility queries (mobile layer panel)
CREATE INDEX idx_layers_visible ON layers(roof_id, visible, z_index) WHERE visible = true;

-- User assignment queries (mobile notifications)
CREATE INDEX idx_parent_pins_assigned ON parent_pins(assigned_to) WHERE assigned_to IS NOT NULL;

-- Time-based queries for mobile sync
CREATE INDEX idx_parent_pins_updated ON parent_pins(updated_at DESC);
CREATE INDEX idx_child_pins_updated ON child_pins(updated_at DESC);
CREATE INDEX idx_annotations_updated ON annotations(updated_at DESC);

-- Profile lookup optimization
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Text search for mobile search functionality
CREATE INDEX idx_parent_pins_title ON parent_pins USING GIN(title gin_trgm_ops) WHERE title IS NOT NULL;
CREATE INDEX idx_child_pins_title ON child_pins USING GIN(title gin_trgm_ops) WHERE title IS NOT NULL;