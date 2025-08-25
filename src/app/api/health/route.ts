import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const healthChecks = await Promise.allSettled([
      // Database connectivity
      supabase.from('user_profiles').select('count').limit(1).single(),
      
      // Storage connectivity  
      supabase.storage.from('pin-photos').list('', { limit: 1 }),
      
      // Auth service
      supabase.auth.getSession()
    ])

    const [dbCheck, storageCheck, authCheck] = healthChecks

    const responseTime = Date.now() - startTime

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      services: {
        database: dbCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        storage: storageCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        auth: authCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        responseTime
      }
    }

    const allHealthy = Object.values(health.services).every(status => status === 'healthy')
    
    return NextResponse.json(health, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}