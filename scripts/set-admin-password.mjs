#!/usr/bin/env node
// Set a Supabase user's password using the service role key.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/set-admin-password.mjs <email> <newPassword>

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.argv[2]
const NEW_PASSWORD = process.argv[3]

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}
if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/set-admin-password.mjs <email> <newPassword>')
  process.exit(1)
}
if (!NEW_PASSWORD || NEW_PASSWORD.length < 8) {
  console.error('Provide a strong <newPassword> (min 8 chars).')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function findUserByEmail(email) {
  // Paginate through users to find by email (admin API does not provide direct email lookup)
  const perPage = 200
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users || []
    const match = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (match) return match
    if (users.length < perPage) break
  }
  return null
}

async function main() {
  console.log(`Locating user: ${EMAIL} ...`)
  const user = await findUserByEmail(EMAIL)
  if (!user) {
    console.error('User not found:', EMAIL)
    process.exit(1)
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: NEW_PASSWORD })
  if (updErr) {
    console.error('updateUserById error:', updErr)
    process.exit(1)
  }
  console.log('Password updated successfully for', EMAIL)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
