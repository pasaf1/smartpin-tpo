import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating admin user endpoint called')
    
    const { email, password, fullName } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required',
        usage: 'POST /api/create-admin-user with { email, password, fullName }'
      }, { status: 400 })
    }
    
    // Use service role client to create user
    const serviceSupabase = createSupabaseServiceClient()
    
    console.log('✅ Creating user with service role:', { email, fullName })
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || 'Admin User',
        role: 'Admin'
      }
    })
    
    if (authError) {
      console.error('❌ Auth user creation error:', authError)
      return NextResponse.json({ 
        error: 'Failed to create auth user',
        details: authError.message 
      }, { status: 500 })
    }
    
    const authUserId = authData.user?.id
    if (!authUserId) {
      return NextResponse.json({ 
        error: 'User created but no ID returned' 
      }, { status: 500 })
    }
    
    console.log('✅ Auth user created:', { authUserId, email })
    
    // Check if user profile already exists
    const { data: existingUser, error: findError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existingUser && !findError) {
      // Update existing user with new auth_user_id
      const { data: updatedUser, error: updateError } = await serviceSupabase
        .from('users')
        .update({ 
          auth_user_id: authUserId,
          role: 'Admin',
          full_name: fullName || existingUser.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ User profile update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update user profile',
          details: updateError.message 
        }, { status: 500 })
      }
      
      console.log('✅ User profile updated:', updatedUser)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully!',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          role: updatedUser.role,
          authUserId: updatedUser.auth_user_id,
          action: 'updated'
        }
      })
    } else {
      // Create new user profile
      const { data: newUser, error: insertError } = await serviceSupabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: email,
          full_name: fullName || 'Admin User',
          role: 'Admin'
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ User profile creation error:', insertError)
        return NextResponse.json({ 
          error: 'Failed to create user profile',
          details: insertError.message 
        }, { status: 500 })
      }
      
      console.log('✅ User profile created:', newUser)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully!',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
          authUserId: newUser.auth_user_id,
          action: 'created'
        },
        nextSteps: [
          'You can now sign in with email/password',
          'Google OAuth should also work for this user',
          'User has full Admin permissions'
        ]
      })
    }
    
  } catch (error: any) {
    console.error('❌ Create admin user error:', error)
    return NextResponse.json({
      error: 'Failed to create admin user',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}