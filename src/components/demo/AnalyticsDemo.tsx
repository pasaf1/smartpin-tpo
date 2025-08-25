'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiskQualityHeatmap } from '@/components/analytics/RiskQualityHeatmap'
import { QualityTrendsChart } from '@/components/analytics/QualityTrendsChart'
import { useRiskQualityMatrix, useQualityTrends, useCategoryAnalysis, type RiskQualityCell } from '@/lib/hooks/useAnalytics'
import { cn } from '@/lib/utils'

export function AnalyticsDemo() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 30 | 90>(30)
  const [selectedCell, setSelectedCell] = useState<RiskQualityCell | null>(null)
  
  const demoRoofId = 'e1-demo-roof'
  
  const { data: matrix, isLoading: matrixLoading } = useRiskQualityMatrix(demoRoofId)
  const { data: trends, isLoading: trendsLoading } = useQualityTrends(demoRoofId, selectedTimeframe)
  const { data: categories, isLoading: categoriesLoading } = useCategoryAnalysis(demoRoofId)

  const handleCellClick = (cell: RiskQualityCell) => {
    setSelectedCell(cell)
  }

  const isLoading = matrixLoading || trendsLoading || categoriesLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading analytics dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Quality Analytics</h2>
          <p className="text-muted-foreground">
            Advanced quality management analytics with interactive heatmaps and trend analysis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              size="sm"
              variant={selectedTimeframe === days ? 'default' : 'outline'}
              onClick={() => setSelectedTimeframe(days as any)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quality Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {matrix?.totalPins || 0}
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={cn(
                'text-2xl font-bold',
                (matrix?.riskScore || 0) >= 80 && 'text-green-600',
                (matrix?.riskScore || 0) >= 60 && (matrix?.riskScore || 0) < 80 && 'text-yellow-600',
                (matrix?.riskScore || 0) < 60 && 'text-red-600'
              )}>
                {matrix?.riskScore || 0}
              </div>
              <Badge 
                variant={(matrix?.riskScore || 0) >= 80 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {(matrix?.riskScore || 0) >= 80 ? 'Good' : 'Action Needed'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={cn(
                'text-2xl font-bold',
                (matrix?.qualityScore || 0) >= 80 && 'text-green-600',
                (matrix?.qualityScore || 0) >= 60 && (matrix?.qualityScore || 0) < 80 && 'text-yellow-600',
                (matrix?.qualityScore || 0) < 60 && 'text-red-600'
              )}>
                {matrix?.qualityScore || 0}%
              </div>
              <Badge 
                variant={(matrix?.qualityScore || 0) >= 80 ? 'secondary' : 'outline'}
                className="text-xs"
              >
                Resolution Rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">
                {matrix?.cells[0]?.reduce((sum, cell) => sum + cell.count, 0) || 0}
              </div>
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Quality Matrix Heatmap */}
      {matrix && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Quality Matrix</CardTitle>
            <CardDescription>
              Interactive heatmap showing issue distribution by severity and status. 
              Click on cells to explore details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskQualityHeatmap
              matrix={matrix}
              onCellClick={handleCellClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Quality Trends */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Trends</CardTitle>
            <CardDescription>
              Historical trend analysis showing quality metrics over the selected timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QualityTrendsChart trends={trends} />
          </CardContent>
        </Card>
      )}

      {/* Category Analysis */}
      {categories && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Quality issues analyzed by category with severity and resolution metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">
                        {category.category}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.totalCount} items
                      </Badge>
                      {category.criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {category.criticalCount} critical
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Avg Severity:</span>{' '}
                        <span className={cn(
                          category.averageSeverityScore >= 3.5 && 'text-red-600',
                          category.averageSeverityScore >= 2.5 && category.averageSeverityScore < 3.5 && 'text-orange-600',
                          category.averageSeverityScore < 2.5 && 'text-green-600'
                        )}>
                          {category.averageSeverityScore}/4.0
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Avg Resolution:</span>{' '}
                        <span className={cn(
                          category.averageResolutionTime > 48 && 'text-red-600',
                          category.averageResolutionTime > 24 && category.averageResolutionTime <= 48 && 'text-orange-600',
                          category.averageResolutionTime <= 24 && 'text-green-600'
                        )}>
                          {category.averageResolutionTime}h
                        </span>
                      </div>

                      <div>
                        <span className="font-medium">30-Day Trend:</span>{' '}
                        <span className="text-muted-foreground">
                          {Math.round(category.trendsLast30Days.reduce((sum, t) => sum + t.count, 0) / 30 * 10) / 10} items/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini trend sparkline */}
                  <div className="w-24 h-8 ml-4">
                    <svg width="96" height="32" className="overflow-visible">
                      {category.trendsLast30Days.slice(-14).map((trend, i, arr) => {
                        const maxCount = Math.max(...arr.map(t => t.count))
                        const x = (i / (arr.length - 1)) * 88 + 4
                        const y = 28 - (trend.count / maxCount) * 24
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1"
                            fill="currentColor"
                            opacity="0.6"
                          />
                        )
                      })}
                      <path
                        d={category.trendsLast30Days.slice(-14).map((trend, i, arr) => {
                          const maxCount = Math.max(...arr.map(t => t.count))
                          const x = (i / (arr.length - 1)) * 88 + 4
                          const y = 28 - (trend.count / maxCount) * 24
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Features</CardTitle>
          <CardDescription>
            Explore the advanced quality management analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">📊 Interactive Heatmap</h4>
              <p className="text-muted-foreground">
                Click on heatmap cells to drill down into specific severity/status combinations. 
                Color intensity shows volume, trends indicate direction.
              </p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">📈 Quality Trends</h4>
              <p className="text-muted-foreground">
                Historical analysis shows patterns over time. Switch between 7, 30, and 90-day views 
                to identify short and long-term trends.
              </p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">🏷️ Category Analysis</h4>
              <p className="text-muted-foreground">
                Breakdown by issue type reveals which categories need attention. 
                Sparklines show 14-day micro-trends for each category.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}