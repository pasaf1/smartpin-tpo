import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    console.log('🔍 Storage permissions check started')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ error: 'Session error', details: sessionError })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' })
    }
    
    // Check user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    // Check bucket existence
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    // Try a simple storage operation
    const testPath = `test-${Date.now()}.txt`
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pin-photos')
      .upload(`test/${testPath}`, testFile)
    
    // Clean up test file if successful
    if (uploadData) {
      await supabase.storage
        .from('pin-photos')
        .remove([`test/${testPath}`])
    }
    
    return NextResponse.json({
      session: {
        user_id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
      userProfile: profileError ? { error: profileError } : userProfile,
      buckets: bucketsError ? { error: bucketsError } : buckets,
      storageTest: {
        success: !uploadError,
        error: uploadError,
        uploadData: uploadData
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Storage check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}