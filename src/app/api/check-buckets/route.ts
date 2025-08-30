import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Supabase storage buckets...')
    
    // Create Supabase client with service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { 
            const cookieStore = cookies()
            return cookieStore.get(name)?.value 
          },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {},
        },
      }
    )

    // List all buckets
    console.log('📋 Listing storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return NextResponse.json({
        error: `Failed to list buckets: ${bucketsError.message}`,
        details: bucketsError
      }, { status: 500 })
    }

    console.log('✅ Buckets found:', buckets?.map(b => b.name))

    // Try to list files in pin-photos bucket specifically
    let pinPhotosStatus = 'not-tested'
    let pinPhotosFiles: any[] = []
    let pinPhotosError: any = null

    if (buckets?.some(b => b.name === 'pin-photos')) {
      console.log('📁 Testing pin-photos bucket access...')
      const { data: files, error } = await supabase.storage
        .from('pin-photos')
        .list('', { limit: 5 })
      
      if (error) {
        pinPhotosStatus = 'error'
        pinPhotosError = error
        console.error('❌ Error accessing pin-photos:', error)
      } else {
        pinPhotosStatus = 'accessible'
        pinPhotosFiles = files || []
        console.log('✅ pin-photos accessible, files:', files?.length)
      }
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => ({
        name: b.name,
        id: b.id,
        public: b.public,
        createdAt: b.created_at,
        updatedAt: b.updated_at
      })) || [],
      pinPhotosStatus,
      pinPhotosFiles,
      pinPhotosError,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Bucket check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check buckets',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}