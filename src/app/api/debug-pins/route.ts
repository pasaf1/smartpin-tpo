import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roofId = searchParams.get('roofId')
    
    if (!roofId) {
      return NextResponse.json({ 
        error: 'roofId parameter is required',
        usage: 'GET /api/debug-pins?roofId=your-roof-id'
      }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()
    
    console.log('🔍 Debugging pins for roof:', roofId)
    
    // Get all pins for this roof
    const { data: pins, error: pinsError } = await supabase
      .from('pins')
      .select('*')
      .eq('roof_id', roofId)
      .order('seq_number')
    
    // Get roof info
    const { data: roof, error: roofError } = await supabase
      .from('roofs')
      .select('*')
      .eq('id', roofId)
      .single()
    
    // Skip child_pins and layers queries since tables don't exist in types yet
    // This debug endpoint will be updated after BLUEBIN migration is applied
    const childPins: any[] = []
    const layers: any[] = []
    const childError = null
    const layersError = null
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      roofId,
      roof: {
        data: roof,
        error: roofError?.message,
        exists: !!roof
      },
      pins: {
        data: pins || [],
        error: pinsError?.message,
        count: pins?.length || 0,
        hasCoordinates: pins?.filter(p => p.x !== null && p.y !== null).length || 0,
        statuses: pins?.reduce((acc, p) => {
          const status = p.status ?? 'null'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      },
      childPins: {
        data: childPins || [],
        error: childError,
        count: childPins?.length || 0
      },
      layers: {
        data: layers || [],
        error: layersError,
        count: layers?.length || 0
      },
      troubleshooting: {
        commonIssues: [
          'Pins created but coordinates are null/0',
          'Pins exist but not showing due to layer filtering',
          'Pins created with wrong roof_id',
          'Component not refreshing after pin creation',
          'Real-time subscription not working'
        ],
        recommendations: [] as string[]
      }
    }
    
    // Add specific recommendations
    if (debugInfo.pins.count === 0) {
      debugInfo.troubleshooting.recommendations.push('No pins found for this roof - check pin creation process')
    }
    
    if (debugInfo.pins.hasCoordinates === 0 && debugInfo.pins.count > 0) {
      debugInfo.troubleshooting.recommendations.push('Pins exist but have no coordinates (x,y) - check pin creation coordinates')
    }
    
    if (!debugInfo.roof.exists) {
      debugInfo.troubleshooting.recommendations.push('Roof not found - verify roofId parameter')
    }
    
    if (debugInfo.layers.count === 0) {
      debugInfo.troubleshooting.recommendations.push('No layers found - pins might not be visible due to missing layer configuration')
    }
    
    return NextResponse.json(debugInfo, { status: 200 })
    
  } catch (error: any) {
    console.error('❌ Debug pins error:', error)
    return NextResponse.json({
      error: 'Failed to debug pins',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}