import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// WARNING: This endpoint will delete ALL data from the database
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    // Safety check
    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json({ 
        error: 'Confirmation required. Add ?confirm=DELETE_ALL_DATA to URL' 
      }, { status: 400 })
    }

    console.log('🗑️ Starting database cleanup...')

    // Delete in reverse dependency order to avoid foreign key constraints
    // Only include tables that actually exist and have data
    const cleanupSteps = [
      { table: 'pins', description: 'Pins' },
      { table: 'roofs', description: 'Roofs' },
      { table: 'projects', description: 'Projects' }
    ]

    const results = []

    for (const step of cleanupSteps) {
      try {
        console.log(`Deleting ${step.description}...`)
        
        // Get count before deletion
        const { count: beforeCount } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
        
        // Delete all records by getting all records first then deleting them
        let error = null
        
        // First get all records to find the actual primary key values
        const { data: records, error: selectError } = await supabase
          .from(step.table)
          .select('*')
        
        if (selectError) {
          error = selectError
        } else if (records && records.length > 0) {
          // For projects table, use project_id as primary key
          if (step.table === 'projects') {
            const ids = records.map(r => r.project_id).filter(Boolean)
            if (ids.length > 0) {
              const deleteResult = await supabase
                .from(step.table)
                .delete()
                .in('project_id', ids)
              error = deleteResult.error
            }
          }
          // For other tables, try to identify the primary key
          else {
            // Check if records have 'id' field
            if (records[0].id) {
              const ids = records.map(r => r.id).filter(Boolean)
              const deleteResult = await supabase
                .from(step.table)
                .delete()
                .in('id', ids)
              error = deleteResult.error
            } else {
              error = { message: 'Could not identify primary key for table ' + step.table }
            }
          }
        }
        
        if (error) {
          console.error(`Error deleting from ${step.table}:`, error)
          results.push({
            table: step.table,
            status: 'error',
            beforeCount,
            afterCount: beforeCount,
            error: error.message
          })
        } else {
          console.log(`✅ Deleted ${beforeCount || 0} records from ${step.table}`)
          results.push({
            table: step.table,
            status: 'success',
            beforeCount: beforeCount || 0,
            afterCount: 0,
            error: null
          })
        }
      } catch (err) {
        console.error(`Exception while cleaning ${step.table}:`, err)
        results.push({
          table: step.table,
          status: 'exception',
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    // Get final counts after a brief delay to ensure deletions are committed
    console.log('🔍 Verifying cleanup...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    
    const finalCounts = []
    
    for (const step of cleanupSteps) {
      try {
        const { count } = await supabase
          .from(step.table)
          .select('*', { count: 'exact', head: true })
        
        finalCounts.push({
          table: step.table,
          remaining: count || 0
        })
      } catch (err) {
        finalCounts.push({
          table: step.table,
          remaining: 'error',
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    console.log('🎯 Database cleanup completed!')

    return NextResponse.json({
      message: 'Database cleanup completed',
      results,
      finalCounts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database cleanup failed:', error)
    return NextResponse.json({ 
      error: 'Database cleanup failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET endpoint to check current database state
export async function GET() {
  try {
    const tables = ['projects', 'roofs', 'pins', 'pin_items', 'pin_children', 'photos', 'chats', 'pin_images', 'users']
    const counts = []

    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        counts.push({
          table,
          count: count || 0
        })
      } catch (err) {
        counts.push({
          table,
          count: 'error',
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    return NextResponse.json({
      message: 'Current database state',
      counts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get database state', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}