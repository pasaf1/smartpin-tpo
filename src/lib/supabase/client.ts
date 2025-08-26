import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

let browserClient: SupabaseClient<Database> | null = null

function createBuildSafeProxy(): SupabaseClient<Database> {
	// During build/SSR without env vars, expose a proxy that throws on actual use
	return new Proxy({} as SupabaseClient<Database>, {
		get(_target, prop) {
			const message =
				'Supabase client not configured: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are missing. ' +
				'Ensure these env vars are set in Vercel Project Settings (Environment Variables).'
			// Allow accessing inspect utilities safely
			if (prop === Symbol.toStringTag || prop === 'toString') return () => '[SupabaseClient:unconfigured]'
			throw new Error(message)
		},
	})
}

export function getSupabaseClient(): SupabaseClient<Database> {
	if (browserClient) return browserClient

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!url || !key) {
		// On the server/build, return a proxy to avoid crashing the build.
		if (typeof window === 'undefined') return createBuildSafeProxy()
		// In the browser at runtime, fail fast to surface misconfiguration.
		throw new Error('Supabase client not configured: missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY')
	}

	browserClient = createClient<Database>(url, key)
	return browserClient
}

// Export a default instance that is safe during build/SSR and initialized lazily in the browser.
export const supabase: SupabaseClient<Database> =
	typeof window === 'undefined' ? createBuildSafeProxy() : getSupabaseClient()

// Re-export factory for advanced use cases
export { createClient }