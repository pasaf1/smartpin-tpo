import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fix user auth endpoint called')
    
    // Get current authenticated user
    const authSupabase = await createSupabaseServerClient()
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'No active session. Please sign in first.',
        instruction: 'Try signing in with Google OAuth first, then call this endpoint.'
      }, { status: 401 })
    }
    
    const authUserId = session.user.id
    const userEmail = session.user.email
    
    if (!userEmail) {
      return NextResponse.json({ 
        error: 'User email not found in session. Cannot fix auth.',
        instruction: 'User session must include email address.'
      }, { status: 400 })
    }
    
    console.log('✅ Authenticated user:', { authUserId, userEmail })
    
    // Use service role to update the user record
    const serviceSupabase = createSupabaseServiceClient()
    
    // Find user by email and update auth_user_id
    const { data: existingUser, error: findError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (findError) {
      console.error('❌ Error finding user:', findError)
      return NextResponse.json({ 
        error: 'User not found in database',
        details: findError.message 
      }, { status: 404 })
    }
    
    console.log('📋 Found existing user:', existingUser)
    
    // Update the auth_user_id to match the current session
    const { data: updatedUser, error: updateError } = await serviceSupabase
      .from('users')
      .update({ 
        auth_user_id: authUserId,
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user record',
        details: updateError.message 
      }, { status: 500 })
    }
    
    console.log('✅ User auth_user_id updated successfully:', updatedUser)
    
    return NextResponse.json({
      success: true,
      message: 'User authentication fixed successfully!',
      user: {
        email: updatedUser.email,
        name: updatedUser.full_name,
        role: updatedUser.role,
        oldAuthId: existingUser.auth_user_id,
        newAuthId: authUserId,
        updated: true
      },
      nextSteps: [
        'Your Google OAuth should now work properly',
        'Try refreshing the page and signing in',
        'You should be able to access the dashboard'
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Fix user auth error:', error)
    return NextResponse.json({
      error: 'Failed to fix user authentication',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}