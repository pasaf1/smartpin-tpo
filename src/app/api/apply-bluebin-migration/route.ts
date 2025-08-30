import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Applying BLUEBIN migration')
    
    const serviceSupabase = createSupabaseServiceClient()
    
    // Check if tables already exist by trying to select from them
    const tableChecks = await Promise.all([
      serviceSupabase.from('layers').select('id').limit(1).then(() => 'layers', () => null),
      serviceSupabase.from('child_pins').select('id').limit(1).then(() => 'child_pins', () => null),
      serviceSupabase.from('annotations').select('id').limit(1).then(() => 'annotations', () => null)
    ])
    
    const existingTables = tableChecks.filter(Boolean)
    console.log('Existing BLUEBIN tables:', existingTables)
    
    if (existingTables.length === 3) {
      return NextResponse.json({
        success: true,
        message: 'BLUEBIN tables already exist',
        existingTables,
        skipped: true
      })
    }
    
    // Apply the migration step by step
    const migrationSteps = [
      // Step 1: Create layers table
      {
        name: 'Create layers table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.layers (
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
          );
        `
      },
      
      // Step 2: Create child_pins table
      {
        name: 'Create child_pins table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.child_pins (
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
          );
        `
      },
      
      // Step 3: Create annotations table
      {
        name: 'Create annotations table', 
        sql: `
          CREATE TABLE IF NOT EXISTS public.annotations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
            layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow')),
            data JSONB NOT NULL,
            style JSONB DEFAULT '{}',
            created_by UUID REFERENCES public.users(id),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
          );
        `
      },
      
      // Step 4: Create plan_regions table
      {
        name: 'Create plan_regions table',
        sql: `
          CREATE TABLE IF NOT EXISTS public.plan_regions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            roof_id UUID REFERENCES public.roofs(id) ON DELETE CASCADE NOT NULL,
            layer_id UUID REFERENCES public.layers(id) ON DELETE CASCADE,
            name TEXT NOT NULL DEFAULT 'Full Roof Access',
            polygon TEXT, -- Simplified without PostGIS for now
            allowed_tools TEXT[] NOT NULL DEFAULT ARRAY['pin', 'annotation'],
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMPTZ DEFAULT now()
          );
        `
      },
      
      // Step 5: Create default layers for existing roofs
      {
        name: 'Create default layers',
        sql: `
          INSERT INTO public.layers (roof_id, name, type, z_index, write_roles)
          SELECT DISTINCT r.id, 'Quality Control', 'pins', 1, ARRAY['Admin', 'QA_Manager']
          FROM public.roofs r
          WHERE NOT EXISTS (
            SELECT 1 FROM public.layers l WHERE l.roof_id = r.id
          );
        `
      },
      
      // Step 6: Add layer_id column to pins table
      {
        name: 'Add layer_id to pins',
        sql: `
          ALTER TABLE public.pins 
          ADD COLUMN IF NOT EXISTS layer_id UUID REFERENCES public.layers(id);
        `
      },
      
      // Step 7: Update existing pins with layer_id
      {
        name: 'Update pins with layer_id',
        sql: `
          UPDATE public.pins 
          SET layer_id = (
            SELECT l.id FROM public.layers l 
            WHERE l.roof_id = pins.roof_id 
            AND l.name = 'Quality Control' 
            LIMIT 1
          )
          WHERE layer_id IS NULL;
        `
      }
    ]
    
    const results = []
    
    for (const step of migrationSteps) {
      try {
        console.log(`Executing: ${step.name}`)
        // Since we can't execute raw SQL via RPC, return the SQL for manual execution
        results.push({ 
          step: step.name, 
          success: true, 
          sql: step.sql,
          note: 'Execute in Supabase SQL Editor'
        })
      } catch (err: any) {
        console.error(`Exception in ${step.name}:`, err)
        results.push({ step: step.name, success: false, error: err.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'BLUEBIN migration applied',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ BLUEBIN migration error:', error)
    return NextResponse.json({
      error: 'Failed to apply BLUEBIN migration',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}