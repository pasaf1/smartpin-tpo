import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test upload endpoint - bypassing auth temporarily')
    
    // Create Supabase client with service role (bypass auth)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to bypass RLS
      {
        cookies: {
          get(name: string) {
            const cookieStore = cookies()
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No-op for service role
          },
          remove(name: string, options: any) {
            // No-op for service role
          },
        },
      }
    )

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: image' },
        { status: 400 }
      )
    }

    console.log('📤 Test upload - File received:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    // Create a unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExt = file.name.split('.').pop()
    const fileName = `test-upload-${timestamp}.${fileExt}`
    const storagePath = `test-uploads/${fileName}`

    console.log('📤 Attempting test upload to storage path:', storagePath)
    
    // Upload to Supabase Storage (with service role, should bypass RLS)
    const { data, error } = await supabase.storage
      .from('roof-plans') // Use the correct bucket name
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Test upload failed:', error)
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Test upload successful:', data)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('roof-plans')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      message: 'Test upload successful - auth bypassed with service role',
      url: publicUrl,
      path: storagePath,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}