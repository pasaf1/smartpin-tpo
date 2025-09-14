import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 OAuth Debug endpoint called')
    
    // Check environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    }

    // Test Supabase connection
    const supabase = await createSupabaseServerClient()
    
    // Test auth
    let authTest = null
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      authTest = {
        hasSession: !!session,
        sessionError: error?.message || null,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null
      }
    } catch (error: any) {
      authTest = { error: error.message }
    }

    // Test users table access
    let usersTableTest = null
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1)
      
      usersTableTest = {
        canAccess: !error,
        error: error?.message || null,
        hint: error?.hint || null,
        code: error?.code || null
      }
    } catch (error: any) {
      usersTableTest = { error: error.message }
    }

    // Check for specific user
    let userCheck = null
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'asaf6peer@gmail.com')
        .limit(1)
      
      userCheck = {
        userExists: data && data.length > 0,
        userData: data || null,
        error: error?.message || null,
        code: error?.code || null
      }
    } catch (error: any) {
      userCheck = { error: error.message }
    }

    // Test Google OAuth URL
    let googleOAuthTest = null
    try {
      // Get the current request URL to determine the correct redirect URL
      const requestUrl = new URL(request.url)
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          skipBrowserRedirect: true
        }
      })
      
      googleOAuthTest = {
        success: !error,
        hasUrl: !!data?.url,
        error: error?.message || null,
        urlPreview: data?.url ? data.url.substring(0, 100) + '...' : null
      }
    } catch (error: any) {
      googleOAuthTest = { error: error.message }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      authTest,
      usersTableTest,
      userCheck,
      googleOAuthTest,
      troubleshooting: {
        commonIssues: [
          'Missing environment variables',
          'RLS policies blocking user table access',
          'Google OAuth not configured in Supabase dashboard',
          'Redirect URL mismatch',
          'User profile creation failing after OAuth'
        ],
        nextSteps: [
          'Check Supabase Auth > Providers > Google settings',
          'Verify redirect URLs include your domain',
          'Check RLS policies on users table',
          'Run database-policies.sql in SQL Editor'
        ]
      }
    })
    
  } catch (error: any) {
    console.error('❌ OAuth debug error:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}