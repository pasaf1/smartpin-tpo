import { createServerComponentClient, createMiddlewareClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { NextRequest } from 'next/server'

// Server component client
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })

// Route handler client  
export const createRouteClient = () =>
  createRouteHandlerClient<Database>({ cookies })

// Middleware client
export const createMiddlewareSupabaseClient = (req: NextRequest) =>
  createMiddlewareClient<Database>({ req, res: new Response() })

// Service role client for admin operations
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createServerComponentClient<Database>({ 
    supabaseUrl,
    supabaseKey: serviceRoleKey,
    cookies 
  })
}