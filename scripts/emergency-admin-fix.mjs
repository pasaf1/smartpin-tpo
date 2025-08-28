#!/usr/bin/env node
// Quick fix script to upgrade the first user to Admin if no admins exist
// This is useful when you're locked out due to permissions
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/emergency-admin-fix.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Set these in your .env.local file or as environment variables.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('🚨 SmartPin TPO - Emergency Admin Fix\n')
  
  // Check if any admins exist
  const { data: admins, error: adminError } = await admin
    .from('users')
    .select('*')
    .in('role', ['Admin', 'QA_Manager', 'Supervisor'])
    .order('created_at', { ascending: true })

  if (adminError) {
    console.error('Error checking for admins:', adminError)
    process.exit(1)
  }

  if (admins && admins.length > 0) {
    console.log(`✅ Found ${admins.length} user(s) with project creation permissions:`)
    admins.forEach(admin => {
      console.log(`   ${admin.full_name} (${admin.email}) - ${admin.role}`)
    })
    console.log('\nNo emergency fix needed. Users can already create projects.')
    return
  }

  console.log('⚠️  No users found with project creation permissions!')
  
  // Get the first user (usually the one who signed up first)
  const { data: allUsers, error: usersError } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)

  if (usersError) {
    console.error('Error fetching users:', usersError)
    process.exit(1)
  }

  if (!allUsers || allUsers.length === 0) {
    console.log('❌ No users found in the system. Create a user first.')
    return
  }

  const firstUser = allUsers[0]
  console.log(`\n🔧 Upgrading first user to Admin:`)
  console.log(`   User: ${firstUser.full_name} (${firstUser.email})`)
  console.log(`   Current role: ${firstUser.role}`)
  console.log(`   New role: Admin`)

  // Update to Admin role
  const { error: updateError } = await admin
    .from('users')
    .update({ 
      role: 'Admin',
      updated_at: new Date().toISOString()
    })
    .eq('id', firstUser.id)

  if (updateError) {
    console.error('❌ Error updating user role:', updateError)
    process.exit(1)
  }

  // Update auth metadata if possible
  if (firstUser.auth_user_id) {
    try {
      await admin.auth.admin.updateUserById(
        firstUser.auth_user_id,
        {
          user_metadata: {
            full_name: firstUser.full_name,
            role: 'Admin'
          }
        }
      )
      console.log('✅ Auth metadata updated.')
    } catch (authError) {
      console.warn('⚠️  Could not update auth metadata:', authError.message)
    }
  }

  console.log(`\n✅ SUCCESS! ${firstUser.email} is now an Admin.`)
  console.log('🔄 The user should log out and log back in to see the changes.')
  console.log('📝 They can now create projects and manage the system.')
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
