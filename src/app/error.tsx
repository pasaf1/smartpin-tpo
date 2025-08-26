'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console for quick diagnostics; a real app could report to monitoring here
    console.error('GlobalError boundary caught:', error)
  }, [error])

  const isSupabaseEnvError = /Supabase client not configured|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY/i.test(
    String(error?.message || '')
  )

  return (
    <html>
      <body>
        <div style={{ maxWidth: 720, margin: '10vh auto', padding: 24, border: '1px solid #eee', borderRadius: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          {isSupabaseEnvError ? (
            <div>
              <p style={{ margin: '8px 0' }}>
                Supabase client isnt configured for this deployment. Please set the following environment variables and redeploy:
              </p>
              <ul style={{ margin: '8px 0 12px 20px' }}>
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
              <p style={{ margin: '8px 0' }}>
                Tip: After updating variables in Vercel, use Redeploy with "Ignore Build Cache". You can verify via <code>/api/env-check</code>.
              </p>
            </div>
          ) : (
            <p style={{ margin: '8px 0' }}>{String(error?.message || 'Unknown error')}</p>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => reset()} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
              Try again
            </button>
            <a href="/api/env-check" target="_blank" rel="noreferrer" style={{ padding: '8px 12px' }}>Check env</a>
          </div>
        </div>
      </body>
    </html>
  )
}
