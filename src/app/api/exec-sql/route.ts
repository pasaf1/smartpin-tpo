import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL statement required' }, { status: 400 })
    }
    
    const serviceSupabase = createSupabaseServiceClient()
    
    // Execute SQL using the Supabase REST API directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql })
    })
    
    if (response.ok) {
      const result = await response.json()
      return NextResponse.json({ success: true, result })
    }
    
    // If that doesn't work, try alternative method
    const { data, error } = await serviceSupabase
      .from('roofs')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    if (error && !error.message.includes('No rows')) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    // Connection works, return SQL for manual execution
    return NextResponse.json({ 
      success: true, 
      message: 'SQL prepared for execution',
      sql,
      note: 'Execute this SQL in Supabase SQL Editor'
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}