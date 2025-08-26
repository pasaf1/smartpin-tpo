'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { QualityTrend } from '@/lib/hooks/useAnalytics'

interface QualityTrendsChartProps {
  trends: QualityTrend[]
  className?: string
  height?: number
}

interface ChartPoint {
  x: number
  y: number
  date: string
  value: number
}

function SimpleLineChart({ 
  data, 
  width = 800, 
  height = 200, 
  color = '#3B82F6',
  label = ''
}: {
  data: ChartPoint[]
  width?: number
  height?: number
  color?: string
  label?: string
}) {
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  if (data.length === 0) return null

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const valueRange = maxValue - minValue || 1

  const points = data.map((point, index) => ({
    ...point,
    x: padding + (index / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight
  }))

  const pathData = points
    .join(' ')

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Area fill */}
        <path 
          d={areaData}
          fill={color}
          fillOpacity={0.1}
        />

        {/* Line */}
        <path 
          d={pathData}
          fill="none" 
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={3}
              fill={color}
              stroke="white"
              strokeWidth={2}
              className="hover:r-4 transition-all cursor-pointer"
            />
            <title>
              {label}: {point.value} ({point.date})
            </title>
          </g>
        ))}

        {/* Y-axis labels */}
        <text x={10} y={padding} className="text-xs fill-current" textAnchor="start" dy=".35em">
          {maxValue}
        </text>
        <text x={10} y={height - padding} className="text-xs fill-current" textAnchor="start" dy=".35em">
          {minValue}
        </text>

        {/* X-axis labels */}
        <text x={padding} y={height - 10} className="text-xs fill-current" textAnchor="start">
          {data[0]?.date}
        </text>
        <text x={width - padding} y={height - 10} className="text-xs fill-current" textAnchor="end">
          {data[data.length - 1]?.date}
        </text>
      </svg>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  trend, 
  trendValue, 
  color = 'blue' 
}: {
  title: string
  value: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  color?: string
}) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400'
  }

  return (
    <div className="text-center">
      <div className={cn('text-2xl font-bold', colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
        {value}
      </div>
      <div className="text-xs font-medium text-muted-foreground mb-1">
        {title}
      </div>
      <div className="flex items-center justify-center gap-1">
        {trend === 'up' && (
          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        )}
        {trend === 'down' && (
          <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        )}
        {trend === 'stable' && (
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        <span className={cn(
          'text-xs font-medium',
          trend === 'up' && 'text-red-600 dark:text-red-400',
          trend === 'down' && 'text-green-600 dark:text-green-400',
          trend === 'stable' && 'text-gray-600 dark:text-gray-400'
        )}>
          {trendValue}%
        </span>
      </div>
    </div>
  )
}

export function QualityTrendsChart({ trends, className, height = 300 }: QualityTrendsChartProps) {
  const chartData = useMemo(() => {
    return {
      totalPins: trends.map((trend, index) => ({
        x: index,
        y: trend.totalPins,
        date: new Date(trend.date).toLocaleDateString(),
        value: trend.totalPins
      })),
      openPins: trends.map((trend, index) => ({
        x: index,
        y: trend.openPins,
        date: new Date(trend.date).toLocaleDateString(),
        value: trend.openPins
      })),
      criticalPins: trends.map((trend, index) => ({
        x: index,
        y: trend.criticalPins,
        date: new Date(trend.date).toLocaleDateString(),
        value: trend.criticalPins
      })),
      resolutionTime: trends.map((trend, index) => ({
        x: index,
        y: trend.averageResolutionTime,
        date: new Date(trend.date).toLocaleDateString(),
        value: trend.averageResolutionTime
      }))
    }
  }, [trends])

  const metrics = useMemo(() => {
    if (trends.length < 2) return null

    const latest = trends[trends.length - 1]
    const previous = trends[trends.length - 2]

    const totalChange = ((latest.totalPins - previous.totalPins) / previous.totalPins) * 100
    const openChange = ((latest.openPins - previous.openPins) / previous.openPins) * 100
    const criticalChange = ((latest.criticalPins - previous.criticalPins) / previous.criticalPins) * 100
    const resolutionChange = ((latest.averageResolutionTime - previous.averageResolutionTime) / previous.averageResolutionTime) * 100

    return {
      total: {
        value: latest.totalPins,
        trend: totalChange > 5 ? 'up' : totalChange < -5 ? 'down' : 'stable',
        change: Math.abs(Math.round(totalChange))
      },
      open: {
        value: latest.openPins,
        trend: openChange > 5 ? 'up' : openChange < -5 ? 'down' : 'stable',
        change: Math.abs(Math.round(openChange))
      },
      critical: {
        value: latest.criticalPins,
        trend: criticalChange > 5 ? 'up' : criticalChange < -5 ? 'down' : 'stable',
        change: Math.abs(Math.round(criticalChange))
      },
      resolution: {
        value: latest.averageResolutionTime,
        trend: resolutionChange > 5 ? 'up' : resolutionChange < -5 ? 'down' : 'stable',
        change: Math.abs(Math.round(resolutionChange))
      }
    }
  }, [trends])

  if (trends.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p>No trend data available</p>
            <p className="text-sm mt-1">Data will appear as quality metrics are collected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Metrics overview */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <MetricCard
              title="Total Pins"
              value={metrics.total.value}
              trend={metrics.total.trend as any}
              trendValue={metrics.total.change}
              color="blue"
            />
          </div>
          
          <div className="p-4 border rounded-lg">
            <MetricCard
              title="Open Issues"
              value={metrics.open.value}
              trend={metrics.open.trend as any}
              trendValue={metrics.open.change}
              color="red"
            />
          </div>
          
          <div className="p-4 border rounded-lg">
            <MetricCard
              title="Critical Items"
              value={metrics.critical.value}
              trend={metrics.critical.trend as any}
              trendValue={metrics.critical.change}
              color="orange"
            />
          </div>
          
          <div className="p-4 border rounded-lg">
            <MetricCard
              title="Avg Resolution (hrs)"
              value={metrics.resolution.value}
              trend={metrics.resolution.trend as any}
              trendValue={metrics.resolution.change}
              color="green"
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pin Volume Trends</CardTitle>
            <CardDescription>
              Total pins vs. open issues over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <SimpleLineChart
                data={chartData.totalPins}
                height={height}
                color="#3B82F6"
                label="Total Pins"
              />
              <SimpleLineChart
                data={chartData.openPins}
                height={height}
                color="#EF4444"
                label="Open Pins"
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs">Total Pins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-xs">Open Issues</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Critical Issues & Resolution Time</CardTitle>
            <CardDescription>
              Critical pin count and average resolution time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <SimpleLineChart
                data={chartData.criticalPins}
                height={height}
                color="#F97316"
                label="Critical Pins"
              />
              <SimpleLineChart
                data={chartData.resolutionTime}
                height={height}
                color="#10B981"
                label="Resolution Time (hrs)"
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-xs">Critical Issues</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-xs">Resolution Time</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.round((trends[trends.length - 1]?.closedPins / trends[trends.length - 1]?.totalPins) * 100 || 0)}%
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              Resolution Rate
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {trends[trends.length - 1]?.newPinsCreated || 0}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              New Issues (Today)
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {trends[trends.length - 1]?.pinsResolved || 0}
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              Resolved (Today)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}