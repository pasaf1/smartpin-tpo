// src/lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export const createClient = () => {
  const store = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => store.get(name)?.value,
        set: (name, value, options) => store.set({ name, value, ...options }),
        remove: (name, options) => store.set({ name, value: '', maxAge: 0, ...options }),
      },
    }
  )
}
