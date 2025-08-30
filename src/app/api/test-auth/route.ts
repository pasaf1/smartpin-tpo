import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('🔍 Testing authentication endpoint')
    
    // Test session retrieval
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Session error:', error)
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json({ 
        authenticated: false, 
        error: 'No active session',
        timestamp: new Date().toISOString()
      })
    }
    
    console.log('✅ Session found for user:', session.user.email)
    
    // Test user profile retrieval
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', session.user.id)
      .single()
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        profile: userProfile || null,
        profileError: profileError?.message || null
      },
      sessionInfo: {
        expiresAt: session.expires_at,
        tokenType: session.token_type
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}