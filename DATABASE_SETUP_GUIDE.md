# SmartPin TPO Database Setup Guide

This guide provides step-by-step instructions to set up the complete Supabase database for SmartPin TPO, aligned with all frontend requirements.

## 🎯 Overview

The SmartPin TPO database setup includes:
- **Complete schema** with all tables, relationships, and constraints
- **Row Level Security (RLS)** policies for proper access control
- **Storage buckets** for file uploads with secure policies
- **Database functions** for business logic and analytics
- **TypeScript type generation** with fallback mechanisms
- **Seed data** for development and testing
- **Performance optimizations** with proper indexing

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **Supabase CLI** installed globally:
   ```bash
   npm install -g supabase
   ```
3. **Git** for version control
4. **A Supabase project** (local or cloud)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

Run the automated deployment script:

```bash
# For local development
./scripts/deploy-database.sh local

# For production
./scripts/deploy-database.sh production
```

### Option 2: Manual Step-by-Step Setup

Follow the detailed steps below for manual setup.

## 📁 File Structure

```
supabase/
├── config.toml                           # Supabase configuration
├── migrations/                           # Database migrations
│   ├── 20240826_initial_schema.sql      # Core schema (existing)
│   ├── 20250830_bluebin_integration.sql # BLUEBIN features (existing)
│   ├── 20250831_optimize_schema.sql     # Performance optimizations (new)
│   ├── 20250831_enhanced_rls_policies.sql # Security policies (new)
│   ├── 20250831_storage_configuration.sql # File storage setup (new)
│   ├── 20250831_database_functions.sql   # Business logic functions (new)
│   └── 20250831_seed_data.sql            # Initial data (new)
scripts/
├── deploy-database.sh                   # Automated deployment
├── test-database.js                     # Comprehensive testing
└── generate-types-safe.js               # Enhanced type generation
```

## 🔧 Step-by-Step Setup

### Step 1: Initialize Local Supabase (Development)

```bash
# Start local Supabase
supabase start

# Check status
supabase status
```

### Step 2: Apply Database Migrations

The migrations are designed to run in sequence. Apply them in order:

```bash
# Apply all migrations
supabase db push

# Or apply individual migrations
supabase db push --include-all
```

### Step 3: Generate TypeScript Types

```bash
# Generate types (with fallbacks)
npm run generate-types:safe

# For local development
npm run generate-types:local-safe
```

### Step 4: Test the Setup

```bash
# Run comprehensive tests
node scripts/test-database.js

# Check database health
supabase db query "SELECT get_system_health();"
```

## 🗃️ Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User management | RLS, role-based access |
| `projects` | Project organization | Hierarchical structure |
| `roofs` | Roof management | JSONB for zones/stakeholders |
| `pins` | Parent pin groups | Automatic sequencing |
| `pin_children` | Individual defects | Status tracking |
| `photos` | File attachments | Storage integration |
| `chats` | Messaging system | Scoped conversations |
| `layers` | BLUEBIN layer system | Visual organization |
| `audit_log` | Change tracking | Compliance & debugging |

### Enums & Types

```sql
-- User roles
CREATE TYPE role AS ENUM ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Viewer');

-- Pin statuses
CREATE TYPE pin_status AS ENUM ('Open', 'ReadyForInspection', 'Closed');

-- Severity levels
CREATE TYPE severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Defect layers
CREATE TYPE defect_layer AS ENUM (
  'VaporBarrier', 'InsulationBoards', 'DensDeck', 
  'TPO_Membrane', 'Seams', 'Flashing', 'Drains', 'Curbs'
);
```

## 🔐 Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with policies that:

- **Users** can access their own data and shared projects
- **Admins** have full access to all resources
- **Project owners** control access to their projects
- **Role-based permissions** enforce business rules

### Key Security Features

1. **Project-based access control**
2. **Role hierarchy enforcement** 
3. **Secure function execution**
4. **Storage bucket policies**
5. **Audit logging** for compliance

## 📁 Storage Configuration

Three storage buckets are configured:

### `pin-photos` (Public)
- **Purpose**: Pin and defect photos
- **Size limit**: 50MB per file
- **Formats**: JPEG, PNG, WebP, HEIC
- **Access**: Project members only

### `roof-plans` (Public)
- **Purpose**: Roof plan images and PDFs
- **Size limit**: 100MB per file
- **Formats**: JPEG, PNG, PDF
- **Access**: Project members only

### `project-documents` (Private)
- **Purpose**: Sensitive project documents
- **Size limit**: 100MB per file
- **Formats**: PDF, DOC, images, text
- **Access**: Project owners and admins only

## ⚡ Performance Features

### Indexes

Comprehensive indexing strategy for:
- **Frequent queries** (status, dates, relationships)
- **JSONB fields** (GIN indexes for metadata)
- **Composite indexes** for complex queries
- **Partial indexes** for filtered data

### Materialized Views

- **Dashboard statistics** for quick analytics
- **Automatic refresh** via triggers
- **Performance monitoring** functions

### Query Optimization

- **Proper constraints** and data validation
- **Efficient triggers** for data consistency
- **Connection pooling** configuration
- **Query performance monitoring**

## 🔧 Database Functions

### Pin Management
```sql
-- Create pin with automatic sequencing
SELECT create_pin(roof_id, x, y, zone, layer_id);

-- Update pin status with cascading logic
SELECT update_pin_status(pin_id, new_status);

-- Create pin child with validation
SELECT create_pin_child(pin_id, defect_type, severity);
```

### Analytics & Reporting
```sql
-- Get project dashboard statistics
SELECT get_project_dashboard_stats(project_id);

-- Get activity timeline
SELECT get_roof_activity_timeline(roof_id, limit, offset);
```

### System Health
```sql
-- Check system health
SELECT get_system_health();

-- Validate database setup
SELECT validate_database_setup();

-- Run maintenance tasks
SELECT run_maintenance_tasks();
```

## 🧪 Testing

### Automated Testing

The test suite validates:

1. **Database connectivity**
2. **Schema integrity**
3. **RLS policies**
4. **CRUD operations**
5. **Function execution**
6. **Storage configuration**
7. **Performance benchmarks**
8. **Real-time functionality**

### Running Tests

```bash
# Run all tests
node scripts/test-database.js

# View test reports
ls test-reports/
```

### Test Results

Tests generate detailed JSON reports with:
- **Pass/fail status** for each test
- **Performance metrics**
- **Error details** for debugging
- **Recommendations** for issues

## 🌍 Environment Configuration

### Local Development

```bash
# Environment variables for local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

### Production Deployment

```bash
# Required environment variables
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```sql
-- Check system status
SELECT get_system_health();

-- View recent activity
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;

-- Check storage usage
SELECT SUM(file_size) as total_bytes FROM photos;
```

### Regular Maintenance

```sql
-- Run maintenance tasks (automated)
SELECT run_maintenance_tasks();

-- Manual cleanup (if needed)
SELECT cleanup_orphaned_records();

-- Update statistics
ANALYZE;
```

### Performance Monitoring

- **Query performance** via `pg_stat_statements`
- **Connection monitoring** via dashboard
- **Storage usage** tracking
- **Error rate** monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Migration Failures**
   ```bash
   # Reset local database
   supabase db reset
   
   # Reapply migrations
   supabase db push
   ```

2. **Type Generation Issues**
   ```bash
   # Use safe type generation
   npm run generate-types:safe
   
   # Manual fallback
   node scripts/generate-types-safe.js
   ```

3. **RLS Policy Errors**
   ```sql
   -- Check policy status
   SELECT schemaname, tablename, policyname, roles 
   FROM pg_policies WHERE schemaname = 'public';
   ```

4. **Storage Issues**
   ```bash
   # Check bucket policies
   supabase storage list-buckets
   ```

### Getting Help

- **Database validation**: Run `SELECT validate_database_setup();`
- **System health**: Run `SELECT get_system_health();`
- **Test suite**: Run `node scripts/test-database.js`
- **Logs**: Check `supabase logs`

## 🔄 Updates & Migrations

### Adding New Migrations

1. Create new migration file:
   ```bash
   supabase migration new your_migration_name
   ```

2. Add SQL changes to the file
3. Test locally:
   ```bash
   supabase db reset
   supabase db push
   ```

4. Deploy to production:
   ```bash
   ./scripts/deploy-database.sh production
   ```

### Version Control

- **All migrations** are version controlled
- **Rollback capability** via Git history
- **Environment parity** maintained
- **Change documentation** in commit messages

## ✅ Verification Checklist

After setup, verify:

- [ ] All tables exist and are accessible
- [ ] RLS policies are active and working
- [ ] Storage buckets are configured
- [ ] TypeScript types are generated
- [ ] Functions execute without errors
- [ ] Test suite passes completely
- [ ] Performance meets requirements
- [ ] Security policies are enforced

## 📈 Next Steps

1. **Deploy frontend application**
2. **Configure monitoring alerts**
3. **Set up backup schedules**
4. **Document API endpoints**
5. **Train team on database usage**
6. **Plan capacity scaling**

---

## 📞 Support

For issues or questions:

1. **Check the troubleshooting section** above
2. **Run the test suite** to identify problems
3. **Review database logs** for error details
4. **Consult Supabase documentation** for platform-specific issues

This setup provides a production-ready database that scales with your SmartPin TPO application needs.