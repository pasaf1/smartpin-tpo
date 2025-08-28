#!/usr/bin/env node
// Check all users and their roles in the SmartPin TPO system
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/list-users.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Set these in your .env.local file or environment.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('📋 SmartPin TPO - User List and Permissions\n')
  
  const { data: users, error } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('No users found in the system.')
    return
  }

  console.log(`Found ${users.length} user(s):\n`)
  
  const rolePermissions = {
    'Admin': '✅ Can create projects, manage all data',
    'QA_Manager': '✅ Can create projects, manage quality',
    'Supervisor': '✅ Can create projects, supervise work',
    'Foreman': '⚠️ Cannot create projects, can manage pins',
    'Viewer': '❌ Read-only access'
  }

  users.forEach((user, index) => {
    const permissions = rolePermissions[user.role] || '❓ Unknown role'
    console.log(`${index + 1}. ${user.full_name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Permissions: ${permissions}`)
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log('')
  })

  const canCreateProjects = users.filter(u => 
    ['Admin', 'QA_Manager', 'Supervisor'].includes(u.role)
  ).length

  console.log(`📊 Summary:`)
  console.log(`   Total users: ${users.length}`)
  console.log(`   Can create projects: ${canCreateProjects}`)
  console.log(`   Need elevated permissions: ${users.length - canCreateProjects}`)
  
  if (canCreateProjects === 0) {
    console.log('\n⚠️  WARNING: No users can create projects!')
    console.log('   Use update-user-role.mjs to promote a user to Admin, QA_Manager, or Supervisor.')
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
