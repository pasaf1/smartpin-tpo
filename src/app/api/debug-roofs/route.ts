import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    console.log('🔍 Getting all roofs for debugging')
    
    // Get all roofs
    const { data: roofs, error: roofsError } = await supabase
      .from('roofs')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Get pin counts for each roof
    const roofsWithPinCounts = await Promise.all(
      (roofs || []).map(async (roof) => {
        const { data: pins, error } = await supabase
          .from('pins')
          .select('id')
          .eq('roof_id', roof.id)
        
        return {
          ...roof,
          pinCount: pins?.length || 0,
          pinCountError: error?.message
        }
      })
    )
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      roofs: {
        data: roofsWithPinCounts,
        error: roofsError?.message,
        count: roofs?.length || 0
      },
      usage: 'Use roof IDs from this list to test: /api/debug-pins?roofId=YOUR_ROOF_ID'
    }, { status: 200 })
    
  } catch (error: any) {
    console.error('❌ Debug roofs error:', error)
    return NextResponse.json({
      error: 'Failed to debug roofs',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}