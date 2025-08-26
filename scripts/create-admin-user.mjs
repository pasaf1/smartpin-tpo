#!/usr/bin/env node
// Create a Supabase auth user and profile with Admin role using the service role key.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin-user.mjs --email=user@example.com --name="Full Name" --role=Admin

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

const { email, name, role = 'Admin' } = parseArgs(process.argv)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

if (!email || !email.includes('@')) {
  console.error('Provide a valid --email=user@example.com')
  process.exit(1)
}

if (!name) {
  console.error('Provide --name="Full Name"')
  process.exit(1)
}

const allowedRoles = ['Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Viewer']
if (!allowedRoles.includes(role)) {
  console.error(`Invalid --role. Allowed: ${allowedRoles.join(', ')}`)
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log(`Creating auth user for ${email} with role ${role}...`)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  })

  if (error) {
    console.error('Auth admin.createUser error:', error)
    process.exit(1)
  }

  const user = data.user
  if (!user) {
    console.error('No user returned from createUser')
    process.exit(1)
  }

  // Upsert into public.users so the app recognizes the profile by id === auth uid
  const profile = {
    id: user.id,
    auth_user_id: user.id,
    email,
    full_name: name,
    role,
    created_at: new Date().toISOString(),
  }

  const { error: upsertErr } = await admin.from('users').upsert([profile], { onConflict: 'id' })
  if (upsertErr) {
    console.error('Upsert into public.users failed:', upsertErr)
    process.exit(1)
  }

  console.log('Success! User created and profile upserted:', { id: user.id, email, role })
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
