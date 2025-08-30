import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Executing BLUEBIN SQL migration directly')
    
    const serviceSupabase = createSupabaseServiceClient()
    
    // Execute each SQL statement individually using supabase-js client
    const sqlStatements = [
      // Create layers table
      `CREATE TABLE IF NOT EXISTS public.layers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL DEFAULT 'Quality Control',
        type TEXT NOT NULL DEFAULT 'pins' CHECK (type IN ('base', 'pins', 'annotations', 'qa', 'measurements')),
        visible BOOLEAN DEFAULT true,
        locked BOOLEAN DEFAULT false,
        z_index INTEGER NOT NULL DEFAULT 1,
        opacity NUMERIC(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
        write_roles TEXT[] DEFAULT ARRAY['Admin', 'QA_Manager'],
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(roof_id, z_index)
      );`,
      
      // Create child_pins table
      `CREATE TABLE IF NOT EXISTS public.child_pins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
        seq TEXT NOT NULL,
        x NUMERIC(6,4) NOT NULL CHECK (x >= 0 AND x <= 1),
        y NUMERIC(6,4) NOT NULL CHECK (y >= 0 AND y <= 1),
        status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'ReadyForInspection', 'Closed')),
        zone TEXT,
        severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
        title TEXT,
        description TEXT,
        open_pic_url TEXT,
        close_pic_url TEXT,
        metadata JSONB DEFAULT '{}',
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(parent_id, seq)
      );`,
      
      // Create annotations table
      `CREATE TABLE IF NOT EXISTS public.annotations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
        layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow')),
        data JSONB NOT NULL,
        style JSONB DEFAULT '{}',
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );`
    ]
    
    const results = []
    
    for (const [index, sql] of sqlStatements.entries()) {
      try {
        console.log(`Executing SQL statement ${index + 1}`)
        
        // Use a simple query that should work with service role
        const result = await serviceSupabase
          .from('roofs') // Use existing table to test connection
          .select('count', { count: 'exact', head: true })
          .limit(1)
        
        if (result.error) {
          results.push({ 
            statement: index + 1, 
            success: false, 
            error: `Connection test failed: ${result.error.message}` 
          })
          continue
        }
        
        // Connection works, but we need to use direct SQL execution
        // For now, let's return the SQL that needs to be executed
        results.push({ 
          statement: index + 1, 
          success: true, 
          sql: sql,
          note: 'SQL ready for execution - needs to be run in Supabase SQL Editor'
        })
        
      } catch (err: any) {
        console.error(`Exception in SQL statement ${index + 1}:`, err)
        results.push({ 
          statement: index + 1, 
          success: false, 
          error: err.message 
        })
      }
    }
    
    // Also include the data insertion and migration steps
    const postCreateSteps = [
      `INSERT INTO public.layers (roof_id, name, type, z_index, write_roles)
       SELECT DISTINCT r.id, 'Quality Control', 'pins', 1, ARRAY['Admin', 'QA_Manager']
       FROM public.roofs r
       WHERE NOT EXISTS (
         SELECT 1 FROM public.layers l WHERE l.roof_id = r.id
       );`,
       
      `ALTER TABLE public.pins 
       ADD COLUMN IF NOT EXISTS layer_id UUID REFERENCES public.layers(id);`,
       
      `UPDATE public.pins 
       SET layer_id = (
         SELECT l.id FROM public.layers l 
         WHERE l.roof_id = pins.roof_id 
         AND l.name = 'Quality Control' 
         LIMIT 1
       )
       WHERE layer_id IS NULL;`
    ]
    
    return NextResponse.json({
      success: true,
      message: 'BLUEBIN SQL prepared for execution',
      tableCreationResults: results,
      postCreateSQL: postCreateSteps,
      instructions: 'Copy and paste the SQL statements into Supabase SQL Editor to create the missing tables',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ BLUEBIN SQL preparation error:', error)
    return NextResponse.json({
      error: 'Failed to prepare BLUEBIN SQL',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}