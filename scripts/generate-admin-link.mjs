#!/usr/bin/env node
// Generate a password recovery link for a user via Supabase service role.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/generate-admin-link.mjs <email> [redirectTo]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.argv[2]
const REDIRECT_TO = process.argv[3] || process.env.SUPABASE_REDIRECT_TO || undefined

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}
if (!EMAIL || !EMAIL.includes('@')) {
  console.error('Usage: node scripts/generate-admin-link.mjs <email> [redirectTo]')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function main() {
  const params = { type: 'recovery', email: EMAIL }
  if (REDIRECT_TO) params.options = { redirectTo: REDIRECT_TO }

  const { data, error } = await admin.auth.admin.generateLink(params)
  if (error) {
    console.error('generateLink error:', error)
    process.exit(1)
  }
  const link = data?.properties?.action_link || data?.action_link
  if (!link) {
    console.error('No action link returned')
    process.exit(1)
  }
  console.log(link)
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
