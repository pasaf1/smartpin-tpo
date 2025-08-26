// src/lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export const createClient = async () => {
  const store = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options))
        },
      },
    }
  )
}
