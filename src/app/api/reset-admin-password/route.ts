import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Reset admin password endpoint called')
    
    const { email, newPassword } = await request.json()
    
    if (!email || !newPassword) {
      return NextResponse.json({ 
        error: 'Email and newPassword are required',
        usage: 'POST /api/reset-admin-password with { email, newPassword }'
      }, { status: 400 })
    }
    
    // Use service role client
    const serviceSupabase = createSupabaseServiceClient()
    
    console.log('✅ Resetting password for user:', email)
    
    // Get user by email first
    const { data: users, error: listError } = await serviceSupabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return NextResponse.json({ 
        error: 'Failed to list users',
        details: listError.message 
      }, { status: 500 })
    }
    
    const targetUser = users.users.find(user => user.email === email)
    
    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found',
        details: `No user found with email: ${email}` 
      }, { status: 404 })
    }
    
    // Update user password
    const { data: updatedUser, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: newPassword,
        email_confirm: true
      }
    )
    
    if (updateError) {
      console.error('❌ Password update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update password',
        details: updateError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Password updated for user:', { id: targetUser.id, email })
    
    // Also ensure the user profile exists and has Admin role
    const { data: profileData, error: profileError } = await serviceSupabase
      .from('users')
      .upsert({
        auth_user_id: targetUser.id,
        email: email,
        full_name: 'Asaf Peer',
        role: 'Admin'
      }, { onConflict: 'email' })
      .select()
    
    if (profileError) {
      console.warn('⚠️ Profile update warning:', profileError)
    } else {
      console.log('✅ User profile ensured:', profileData)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully!',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: 'Admin'
      },
      nextSteps: [
        'You can now sign in with the new password',
        'Email: ' + email,
        'Password: [REDACTED]',
        'User has Admin permissions'
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json({
      error: 'Failed to reset password',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}