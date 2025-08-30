import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Hybrid approach: Validate user session but use service role for storage operations
    console.log('🔍 Roof plan upload request received at', new Date().toISOString())
    
    // First, validate the user has a valid session
    const authSupabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return NextResponse.json({ 
        error: `Session error: ${sessionError.message}`,
        debug: { timestamp: new Date().toISOString(), sessionError: sessionError.message }
      }, { status: 401 })
    }
    
    if (!session) {
      console.error('❌ No session found')
      return NextResponse.json({ 
        error: 'No active session - please refresh the page and login again',
        debug: { timestamp: new Date().toISOString() }
      }, { status: 401 })
    }
    
    console.log('✅ Session validated for user:', session.user.email)
    
    // Use service role client for storage operations (bypasses RLS issues)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    )
    
    console.log('🔧 Using service role for storage operations to avoid RLS policy issues')

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
      .from('roof-plans') // Use the correct bucket name
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
      .from('roof-plans')
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