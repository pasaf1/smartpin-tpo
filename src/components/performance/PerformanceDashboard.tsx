'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { performanceMonitor } from '@/lib/performance/monitoring'
import { errorTracker } from '@/lib/monitoring/errorTracking'
import { resourceManager } from '@/lib/performance/optimization'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Eye,
  XCircle
} from 'lucide-react'

interface PerformanceStats {
  coreWebVitals: {
    fcp: number | null
    lcp: number | null
    fid: number | null
    cls: number | null
    ttfb: number | null
  }
  runtime: {
    totalPageViews: number
    averageSessionTime: number
    memoryUsage: number
    userActions: number
  }
  errors: {
    total: number
    recent: number
    critical: number
    errorRate: number
  }
  resources: {
    memoryPercentage: number
    shouldCleanup: boolean
    cacheHitRate: number
  }
}

interface PerformanceDashboardProps {
  className?: string
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchPerformanceData = async () => {
    setIsLoading(true)
    try {
      const [coreWebVitals, runtimeStats, errorStats, memoryUsage] = await Promise.all([
        performanceMonitor.getCoreWebVitals(),
        performanceMonitor.getRuntimeStats(),
        errorTracker.getErrorStats(),
        resourceManager.checkMemoryUsage()
      ])

      setStats({
        coreWebVitals,
        runtime: {
          totalPageViews: runtimeStats.pageViews,
          averageSessionTime: runtimeStats.sessionTime / 1000, // Convert to seconds
          memoryUsage: memoryUsage.used / (1024 * 1024), // Convert to MB
          userActions: runtimeStats.userActions
        },
        errors: {
          total: errorStats.total,
          recent: errorStats.recent,
          critical: errorStats.criticalErrors,
          errorRate: errorStats.total > 0 ? (errorStats.recent / errorStats.total) * 100 : 0
        },
        resources: {
          memoryPercentage: memoryUsage.percentage,
          shouldCleanup: memoryUsage.shouldCleanup,
          cacheHitRate: 85 // Mock cache hit rate
        }
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      errorTracker.captureError({
        message: 'Failed to fetch performance dashboard data',
        component: 'PerformanceDashboard',
        severity: 'medium',
        metadata: { error }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    try {
      await resourceManager.performGarbageCollection()
      await fetchPerformanceData() // Refresh data after cleanup
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  const clearErrors = () => {
    errorTracker.clearErrors()
    fetchPerformanceData()
  }

  useEffect(() => {
    fetchPerformanceData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score: number | null, thresholds: { good: number; needsImprovement: number }) => {
    if (score === null) return 'bg-gray-200'
    if (score <= thresholds.good) return 'bg-green-500'
    if (score <= thresholds.needsImprovement) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreBadgeColor = (score: number | null, thresholds: { good: number; needsImprovement: number }) => {
    if (score === null) return 'secondary'
    if (score <= thresholds.good) return 'default'
    if (score <= thresholds.needsImprovement) return 'secondary'
    return 'destructive'
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor application performance, Core Web Vitals, and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="runtime">Runtime Stats</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* First Contentful Paint */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.coreWebVitals.fcp ? `${stats.coreWebVitals.fcp.toFixed(0)}ms` : 'N/A'}
                </div>
                <Progress 
                  value={stats?.coreWebVitals.fcp ? Math.min((stats.coreWebVitals.fcp / 2500) * 100, 100) : 0} 
                  className="mt-2" 
                />
                <Badge 
                  variant={getScoreBadgeColor(stats?.coreWebVitals.fcp || null, { good: 1800, needsImprovement: 3000 })}
                  className="mt-2 text-xs"
                >
                  {stats?.coreWebVitals.fcp && stats.coreWebVitals.fcp <= 1800 ? 'Good' : 
                   stats?.coreWebVitals.fcp && stats.coreWebVitals.fcp <= 3000 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            {/* Largest Contentful Paint */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.coreWebVitals.lcp ? `${stats.coreWebVitals.lcp.toFixed(0)}ms` : 'N/A'}
                </div>
                <Progress 
                  value={stats?.coreWebVitals.lcp ? Math.min((stats.coreWebVitals.lcp / 4000) * 100, 100) : 0} 
                  className="mt-2" 
                />
                <Badge 
                  variant={getScoreBadgeColor(stats?.coreWebVitals.lcp || null, { good: 2500, needsImprovement: 4000 })}
                  className="mt-2 text-xs"
                >
                  {stats?.coreWebVitals.lcp && stats.coreWebVitals.lcp <= 2500 ? 'Good' : 
                   stats?.coreWebVitals.lcp && stats.coreWebVitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            {/* First Input Delay */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Input Delay</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.coreWebVitals.fid ? `${stats.coreWebVitals.fid.toFixed(0)}ms` : 'N/A'}
                </div>
                <Progress 
                  value={stats?.coreWebVitals.fid ? Math.min((stats.coreWebVitals.fid / 300) * 100, 100) : 0} 
                  className="mt-2" 
                />
                <Badge 
                  variant={getScoreBadgeColor(stats?.coreWebVitals.fid || null, { good: 100, needsImprovement: 300 })}
                  className="mt-2 text-xs"
                >
                  {stats?.coreWebVitals.fid && stats.coreWebVitals.fid <= 100 ? 'Good' : 
                   stats?.coreWebVitals.fid && stats.coreWebVitals.fid <= 300 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            {/* Cumulative Layout Shift */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumulative Layout Shift</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.coreWebVitals.cls ? stats.coreWebVitals.cls.toFixed(3) : 'N/A'}
                </div>
                <Progress 
                  value={stats?.coreWebVitals.cls ? Math.min((stats.coreWebVitals.cls / 0.25) * 100, 100) : 0} 
                  className="mt-2" 
                />
                <Badge 
                  variant={getScoreBadgeColor(stats?.coreWebVitals.cls || null, { good: 0.1, needsImprovement: 0.25 })}
                  className="mt-2 text-xs"
                >
                  {stats?.coreWebVitals.cls && stats.coreWebVitals.cls <= 0.1 ? 'Good' : 
                   stats?.coreWebVitals.cls && stats.coreWebVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            {/* Time to First Byte */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time to First Byte</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.coreWebVitals.ttfb ? `${stats.coreWebVitals.ttfb.toFixed(0)}ms` : 'N/A'}
                </div>
                <Progress 
                  value={stats?.coreWebVitals.ttfb ? Math.min((stats.coreWebVitals.ttfb / 1500) * 100, 100) : 0} 
                  className="mt-2" 
                />
                <Badge 
                  variant={getScoreBadgeColor(stats?.coreWebVitals.ttfb || null, { good: 800, needsImprovement: 1500 })}
                  className="mt-2 text-xs"
                >
                  {stats?.coreWebVitals.ttfb && stats.coreWebVitals.ttfb <= 800 ? 'Good' : 
                   stats?.coreWebVitals.ttfb && stats.coreWebVitals.ttfb <= 1500 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="runtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.runtime.totalPageViews || 0}</div>
                <p className="text-xs text-muted-foreground">Total sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.runtime.averageSessionTime ? `${(stats.runtime.averageSessionTime / 60).toFixed(1)}m` : '0m'}
                </div>
                <p className="text-xs text-muted-foreground">Average per session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.runtime.memoryUsage ? `${stats.runtime.memoryUsage.toFixed(1)}MB` : '0MB'}
                </div>
                <p className="text-xs text-muted-foreground">Current heap size</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Actions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.runtime.userActions || 0}</div>
                <p className="text-xs text-muted-foreground">Total interactions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.errors.total || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.errors.recent || 0}</div>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.errors.critical || 0}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.errors.errorRate ? `${stats.errors.errorRate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">Recent vs total</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearErrors}>
              <XCircle className="h-4 w-4 mr-2" />
              Clear Error Log
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.resources.memoryPercentage ? `${stats.resources.memoryPercentage.toFixed(1)}%` : '0%'}
                </div>
                <Progress 
                  value={stats?.resources.memoryPercentage || 0} 
                  className="mt-2" 
                />
                {stats?.resources.shouldCleanup && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    Cleanup Recommended
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.resources.cacheHitRate ? `${stats.resources.cacheHitRate}%` : '0%'}
                </div>
                <Progress 
                  value={stats?.resources.cacheHitRate || 0} 
                  className="mt-2" 
                />
                <Badge variant="default" className="mt-2 text-xs">
                  Optimal
                </Badge>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center">
              <CardContent className="pt-6">
                <Button 
                  onClick={handleCleanup}
                  disabled={isLoading}
                  className="w-full"
                  variant={stats?.resources.shouldCleanup ? "destructive" : "outline"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {stats?.resources.shouldCleanup ? 'Perform Cleanup' : 'Force Cleanup'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Clear caches and free memory
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard