# Layer System Migration Guide

## Overview
מדריך ליישום מערכת השכבות המשופרת עם תיקוני הביקורת הקריטיים.

## Critical Issues Fixed

### 1. Schema Issues
- ✅ Fixed inline INDEX syntax (moved to separate CREATE INDEX statements)
- ✅ Added roof_id association to pin_layers
- ✅ Fixed UNIQUE constraints to be per-roof instead of global
- ✅ Replaced problematic FK to users(role) with CHECK constraint
- ✅ Fixed created_by to reference auth.users instead of public.users
- ✅ Added HEX color validation
- ✅ Replaced dependencies array with normalized pin_dependencies table

### 2. Performance Improvements
- ✅ Added missing indexes for optimal query performance
- ✅ Added JSONB GIN indexes for metadata queries
- ✅ Proper index placement outside table definitions

### 3. Security & RLS
- ✅ Enhanced RLS policies with proper auth.uid() checks
- ✅ Layer-based permissions with role validation
- ✅ Roof-based access control

### 4. Data Integrity
- ✅ Added trigger to enforce layer consistency between pins and metadata
- ✅ Proper foreign key constraints
- ✅ CHECK constraints for data validation

## Migration Process

### Step 1: Backup Existing Data
```sql
-- Export existing pins if you have them
CREATE TABLE pins_backup AS SELECT * FROM pins;
```

### Step 2: Run the Fixed Migration
Execute the migration file: `20241221_fix_layer_system_schema.sql`

### Step 3: Add Layer_id to Existing Pins
```sql
-- If you have existing pins, you'll need to assign them to layers
-- Example: Assign all existing pins to a default "Issues" layer
DO $$
DECLARE
  default_layer_id UUID;
  roof_record RECORD;
BEGIN
  -- For each roof, create default layers and assign pins
  FOR roof_record IN SELECT id FROM roofs LOOP
    -- Create default layers for this roof
    SELECT create_default_layers_for_roof(roof_record.id);
    
    -- Get the Issues layer ID
    SELECT id INTO default_layer_id 
    FROM pin_layers 
    WHERE roof_id = roof_record.id AND name = 'Issues';
    
    -- Assign existing pins to this layer
    UPDATE pins 
    SET layer_id = default_layer_id 
    WHERE roof_id = roof_record.id AND layer_id IS NULL;
  END LOOP;
END $$;
```

### Step 4: Verify Migration
```sql
-- Check layer creation
SELECT COUNT(*) FROM pin_layers;

-- Check pin assignments
SELECT 
  l.name as layer_name,
  COUNT(p.id) as pin_count
FROM pin_layers l
LEFT JOIN pins p ON p.layer_id = l.id
GROUP BY l.id, l.name;

-- Test permissions
SELECT * FROM pin_layer_permissions LIMIT 5;
```

## Application Code Updates

### 1. TypeScript Interfaces Updated
- ✅ `EnhancedPin` interface now extends database `Pin` type
- ✅ Added required `layerId` field
- ✅ Flattened metadata fields into main interface
- ✅ Fixed import references to use Database types

### 2. Store Architecture Simplified
- ✅ Removed complex features for MVP focus
- ✅ Added feature flags for future enhancements
- ✅ Simplified state management with Zustand + Immer

### 3. Factory Service Updated
- ✅ Fixed `pin-factory.ts` to use new interface structure
- ✅ Removed deprecated metadata wrapper
- ✅ Updated imports and type references

## Feature Flags System

The new system includes feature flags for gradual rollout:

```typescript
featureFlags: {
  enableMinimap: false,        // Advanced navigation
  enableClustering: false,     // Performance optimization  
  enableVirtualization: false, // Large dataset handling
  enableHistory: false,        // Undo/redo functionality
  enableEvents: false          // Real-time updates
}
```

Enable features when ready:
```typescript
const { toggleFeature } = useCanvasStore()
toggleFeature('enableMinimap')
```

## Database Schema Summary

### Core Tables
1. **pin_layers** - Layer definitions per roof
2. **pin_layer_permissions** - Role-based layer access
3. **pin_enhanced_metadata** - Extended pin properties
4. **pin_attachments** - File attachments for pins
5. **pin_dependencies** - Pin relationships (normalized)
6. **pin_*_data** - Layer-specific data (issue, rfi, detail, note)

### Key Relationships
```
roofs (1) ──→ (n) pin_layers ──→ (n) pins
pins (1) ──→ (1) pin_enhanced_metadata
pins (1) ──→ (n) pin_attachments
pins (n) ──→ (n) pin_dependencies
```

### Indexes for Performance
- All FK relationships indexed
- JSONB fields with GIN indexes
- Composite unique indexes per roof
- Query-optimized indexes for common filters

## Next Steps

1. **Test in Development**
   - Run migration on development database
   - Test pin creation and layer management
   - Verify permission system

2. **Production Deployment**
   - Schedule maintenance window
   - Run migration with backups
   - Monitor performance post-deployment

3. **Feature Rollout**
   - Start with basic layer functionality
   - Gradually enable advanced features via flags
   - Monitor user adoption and performance

## Helper Functions

The migration includes utility functions:

### create_default_layers_for_roof(roof_uuid)
Creates the standard 4 layers (Issues, RFIs, Details, Notes) for a roof with appropriate permissions.

### Usage Example
```sql
-- Create layers for a new roof
SELECT create_default_layers_for_roof('roof-uuid-here');
```

## Performance Considerations

- **Large Datasets**: Enable clustering when >1000 pins per roof
- **Real-time Updates**: Enable events for collaborative editing
- **Mobile Performance**: Start with basic rendering, add optimizations as needed

## Security Notes

- All tables have RLS enabled
- Policies check roof membership for data access
- Role-based permissions enforced at layer level
- Auth references point to Supabase auth.users
