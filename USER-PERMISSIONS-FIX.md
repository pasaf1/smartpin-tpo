# User Permissions Fix Guide

If you see "New Project (Access Denied)" on the dashboard, this means your user account doesn't have the right permissions to create projects.

## Quick Fix

### Option 1: Emergency Admin Fix (Recommended)
If no one can create projects, run this script to promote the first user to Admin:

```bash
# Windows PowerShell
$env:SUPABASE_URL="your-supabase-url"; $env:SUPABASE_SERVICE_ROLE_KEY="your-service-key"; node scripts/emergency-admin-fix.mjs

# OR load from .env.local
node scripts/emergency-admin-fix.mjs
```

### Option 2: Check Current Users
See who has what permissions:

```bash
node scripts/list-users.mjs
```

### Option 3: Update Specific User Role
Promote a specific user:

```bash
node scripts/update-user-role.mjs --email=user@example.com --role=Admin
```

## User Roles and Permissions

| Role | Can Create Projects | Description |
|------|-------------------|-------------|
| **Admin** | ✅ Yes | Full system access |
| **QA_Manager** | ✅ Yes | Quality management |  
| **Supervisor** | ✅ Yes | Project supervision |
| **Foreman** | ❌ No | Pin management only |
| **Viewer** | ❌ No | Read-only access |

## Environment Variables

Make sure these are set in your `.env.local` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## After Fixing

1. The user needs to **log out and log back in** to see the changes
2. The "New Project" button should now work normally
3. They can create new projects and manage the system

## Common Issues

### "Access Denied" button still shows
- User needs to refresh the page or log out/in
- Check that the role was actually updated using `list-users.mjs`

### Scripts don't work
- Make sure environment variables are set correctly
- Check that you have the service role key (not the anon key)
- Verify your Supabase URL is correct

### Database permission errors
- Make sure Row Level Security policies allow the operations
- Check that the service role key has sufficient permissions
