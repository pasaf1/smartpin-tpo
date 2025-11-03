export async function GET() {
  const hasUrl = !!process.env['NEXT_PUBLIC_SUPABASE_URL']
  const hasAnon = !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  return new Response(JSON.stringify({ client_inlined: hasUrl && hasAnon }), {
    headers: { 'content-type': 'application/json' },
  })
}
