import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

let sharedClient: SupabaseClient<Database> | null = null
let sharedAdmin: SupabaseClient<Database> | null = null

function buildSafeProxy(): SupabaseClient<Database> {
  return new Proxy({} as SupabaseClient<Database>, {
    get(_t, prop) {
      const msg = 'Supabase not configured: missing env vars.'
      if (prop === Symbol.toStringTag || prop === 'toString') return () => '[SupabaseClient:unconfigured]'
      throw new Error(msg)
    },
  })
}

export function getSupabase(): SupabaseClient<Database> {
  if (sharedClient) return sharedClient
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  if (!url || !anon) return buildSafeProxy()
  
  // Use SSR-compatible browser client
  if (typeof window !== 'undefined') {
    sharedClient = createBrowserClient<Database>(url, anon)
  } else {
    // Fallback for server-side (should use createServerClient in actual server contexts)
    sharedClient = createClient<Database>(url, anon, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
    console.log('🚀 SmartPin TPO connected to Supabase:', url)
  }
  return sharedClient
}

export const supabase = getSupabase()

// Admin client for server-side operations (optional; returns proxy if missing)
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (sharedAdmin) return sharedAdmin
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const service = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !service) return buildSafeProxy()
  sharedAdmin = createClient<Database>(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return sharedAdmin
}

export const supabaseAdmin = getSupabaseAdmin()

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await getSupabase().auth.getUser()
  if (error) throw error
  return user
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await getSupabase().auth.getSession()
  return !!session
}