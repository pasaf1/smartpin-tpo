-- Row Level Security policies for SmartPin TPO
-- Secure access control for mobile and web clients

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND organization_id = organizations.id
    )
  );

-- Profiles policies (public read for collaboration features)
CREATE POLICY "Public profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Roofs policies
CREATE POLICY "Users can view roofs in their organization" ON roofs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and QA managers can create roofs" ON roofs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'qa_manager')
      AND organization_id = roofs.organization_id
    )
  );

CREATE POLICY "Creators and admins can update roofs" ON roofs
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'qa_manager')
      AND organization_id = roofs.organization_id
    )
  );

-- Layers policies  
CREATE POLICY "Users can view layers in accessible roofs" ON layers
  FOR SELECT USING (
    roof_id IN (
      SELECT id FROM roofs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Layer write based on write_roles" ON layers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(write_roles)
    )
  );

CREATE POLICY "Layer update based on write_roles" ON layers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = ANY(write_roles)
    )
  );

-- Plan regions policies
CREATE POLICY "Users can view plan regions in accessible roofs" ON plan_regions
  FOR SELECT USING (
    roof_id IN (
      SELECT id FROM roofs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Parent pins policies
CREATE POLICY "Users can view pins in accessible roofs" ON parent_pins
  FOR SELECT USING (
    roof_id IN (
      SELECT id FROM roofs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create pins with layer permission" ON parent_pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM layers 
      WHERE id = layer_id 
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = ANY(layers.write_roles)
      )
    )
  );

CREATE POLICY "Users can update pins with layer permission or own pins" ON parent_pins
  FOR UPDATE USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'qa_manager')
    ) OR
    EXISTS (
      SELECT 1 FROM layers 
      WHERE id = layer_id 
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = ANY(layers.write_roles)
      )
    )
  );

-- Child pins policies (inherit from parent)
CREATE POLICY "Users can view child pins via parent access" ON child_pins
  FOR SELECT USING (
    parent_id IN (
      SELECT id FROM parent_pins WHERE roof_id IN (
        SELECT id FROM roofs WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create child pins with parent access" ON child_pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_pins 
      WHERE id = parent_id 
      AND (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'qa_manager', 'inspector')
        )
      )
    )
  );

CREATE POLICY "Users can update child pins with parent access" ON child_pins
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM parent_pins 
      WHERE id = parent_id 
      AND (
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'qa_manager', 'inspector')
        )
      )
    )
  );

-- Annotations policies
CREATE POLICY "Users can view annotations in accessible roofs" ON annotations
  FOR SELECT USING (
    roof_id IN (
      SELECT id FROM roofs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create annotations with layer permission" ON annotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM layers 
      WHERE id = layer_id 
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = ANY(layers.write_roles)
      )
    )
  );

-- Pin comments policies
CREATE POLICY "Users can view comments on accessible pins" ON pin_comments
  FOR SELECT USING (
    (parent_pin_id IS NOT NULL AND parent_pin_id IN (
      SELECT id FROM parent_pins WHERE roof_id IN (
        SELECT id FROM roofs WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      )
    )) OR
    (child_pin_id IS NOT NULL AND child_pin_id IN (
      SELECT id FROM child_pins WHERE parent_id IN (
        SELECT id FROM parent_pins WHERE roof_id IN (
          SELECT id FROM roofs WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        )
      )
    ))
  );

CREATE POLICY "Authenticated users can create comments" ON pin_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON pin_comments
  FOR UPDATE USING (created_by = auth.uid());

-- Activity logs policies (read-only for users, insert for system)
CREATE POLICY "Users can view activity in accessible roofs" ON activity_logs
  FOR SELECT USING (
    roof_id IN (
      SELECT id FROM roofs WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);