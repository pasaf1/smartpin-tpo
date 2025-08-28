#!/usr/bin/env node
// Update a user's role in the SmartPin TPO system
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-user-role.mjs --email=user@example.com --role=QA_Manager

import { createClient } from '@supabase/supabase-js'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=')
      args[k] = v ?? argv[++i]
    }
  }
  return args
}

const { email, role } = parseArgs(process.argv)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Set these in your .env.local file or environment.')
  process.exit(1)
}

if (!email || !email.includes('@')) {
  console.error('Provide a valid --email=user@example.com')
  process.exit(1)
}

const allowedRoles = ['Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Viewer']
if (!role || !allowedRoles.includes(role)) {
  console.error(`Provide a valid --role. Allowed: ${allowedRoles.join(', ')}`)
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log(`Looking for user with email: ${email}...`)
  
  // First, find the user by email
  const { data: users, error: findError } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1)

  if (findError) {
    console.error('Error finding user:', findError)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.error(`User with email ${email} not found.`)
    console.log('Available users:')
    
    const { data: allUsers } = await admin
      .from('users')
      .select('email, full_name, role')
      .order('email')
    
    if (allUsers) {
      allUsers.forEach(u => {
        console.log(`  ${u.email} (${u.full_name}) - ${u.role}`)
      })
    }
    process.exit(1)
  }

  const user = users[0]
  console.log(`Found user: ${user.full_name} (${user.email}) - Current role: ${user.role}`)

  if (user.role === role) {
    console.log(`User already has role ${role}. No changes needed.`)
    return
  }

  // Update the user's role
  const { error: updateError } = await admin
    .from('users')
    .update({ 
      role
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating user role:', updateError)
    process.exit(1)
  }

  // Also update the auth user metadata if possible
  if (user.auth_user_id) {
    try {
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(
        user.auth_user_id,
        {
          user_metadata: {
            full_name: user.full_name,
            role: role
          }
        }
      )
      
      if (authUpdateError) {
        console.warn('Warning: Could not update auth metadata:', authUpdateError.message)
      } else {
        console.log('Auth user metadata updated successfully.')
      }
    } catch (authError) {
      console.warn('Warning: Could not update auth metadata:', authError.message)
    }
  }

  console.log(`✅ Success! User ${email} role updated from ${user.role} to ${role}`)
  console.log('The user will need to log out and log back in to see the changes.')
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
