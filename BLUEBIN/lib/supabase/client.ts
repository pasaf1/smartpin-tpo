import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Create Supabase client for client-side operations
// Optimized for mobile and real-time features
export const createClient = () => createClientComponentClient<Database>()

// Default client instance
export const supabase = createClient()

// Mobile-optimized configuration for real-time channels
export const createRealtimeClient = () => {
  const client = createClient()
  
  // Configure for mobile performance
  client.realtime.setAuth(client.auth.session()?.access_token)
  
  return client
}

// Connection health check for mobile offline detection
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}