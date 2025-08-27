import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ enabled: false, error: 'NEXT_PUBLIC_SUPABASE_URL not set' }, { status: 500 })
  }

  // Try to call the Supabase authorize endpoint for Google. If provider is disabled
  // Supabase returns a 400 with a message like "Unsupported provider: provider is not enabled"
  try {
    const redirectTo = 'http://localhost:3000/'
    const checkUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
      redirectTo
    )}`

    const res = await fetch(checkUrl, { method: 'GET' })
    const text = await res.text()

    let parsed
    try { parsed = JSON.parse(text) } catch (e) { parsed = null }

    if (res.ok) {
      // Unexpected: an OK response likely means provider is enabled and a redirect would happen
      return NextResponse.json({ enabled: true, status: res.status, detail: parsed || text })
    }

    // If body contains 'Unsupported provider' mark as disabled
    const bodyStr = typeof parsed === 'object' ? JSON.stringify(parsed) : text
    if (/unsupported provider|provider is not enabled/i.test(bodyStr)) {
      return NextResponse.json({ enabled: false, status: res.status, detail: parsed || text })
    }

    // Fallback: report the raw response
    return NextResponse.json({ enabled: false, status: res.status, detail: parsed || text })
  } catch (error: any) {
    return NextResponse.json({ enabled: false, error: String(error) }, { status: 500 })
  }
}
