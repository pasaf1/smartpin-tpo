import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('🔍 Roof plan upload request received')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return NextResponse.json({ error: 'Session error: ' + sessionError.message }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ No session found')
      return NextResponse.json({ error: 'No active session - please login again' }, { status: 401 })
    }
    
    console.log('✅ Session found for user:', session.user.email)
    
    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
    } else {
      console.log('👤 User profile:', userProfile)
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: image' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Create a unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExt = file.name.split('.').pop()
    const fileName = `roof-plan-${timestamp}.${fileExt}`
    const storagePath = `roof-plans/${fileName}`

    console.log('📤 Attempting upload to storage path:', storagePath)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('pin-photos') // Reuse the existing bucket
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload failed:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      // Return more specific error based on the error type
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Storage authorization failed - please check your permissions' },
          { status: 401 }
        )
      } else if (error.message.includes('policies') || error.message.includes('403') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Storage policy violation - insufficient permissions for this operation' },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: `Storage upload failed: ${error.message}` },
          { status: 500 }
        )
      }
    }
    
    console.log('✅ Upload successful:', data)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pin-photos')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath
    })

  } catch (error) {
    console.error('Roof plan upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}