'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RiskQualityMatrix, RiskQualityCell } from '@/lib/hooks/useAnalytics'

interface RiskQualityHeatmapProps {
  matrix: RiskQualityMatrix
  onCellClick?: (cell: RiskQualityCell) => void
  className?: string
}

const SEVERITY_LABELS: Record<string, string> = {
  'Critical': 'Critical',
  'High': 'High',
  'Medium': 'Medium', 
  'Low': 'Low'
}

const STATUS_LABELS: Record<string, string> = {
  'Open': 'Open',
  'InProgress': 'In Progress',
  'ReadyForInspection': 'Ready',
  'Closed': 'Closed'
}

const SEVERITY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-500',
  'High': 'bg-orange-500',
  'Medium': 'bg-yellow-500',
  'Low': 'bg-green-500'
}

const STATUS_COLORS: Record<string, string> = {
  'Open': 'bg-red-100 dark:bg-red-900/20',
  'InProgress': 'bg-blue-100 dark:bg-blue-900/20',
  'ReadyForInspection': 'bg-yellow-100 dark:bg-yellow-900/20',
  'Closed': 'bg-green-100 dark:bg-green-900/20'
}

function getTrendIcon(trend: 'up' | 'down' | 'stable', className?: string) {
  switch (trend) {
    case 'up':
      return (
        <svg className={cn('w-3 h-3 text-red-500', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    case 'down':
      return (
        <svg className={cn('w-3 h-3 text-green-500', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      )
    case 'stable':
      return (
        <svg className={cn('w-3 h-3 text-gray-500', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
  }
}

function getIntensityOpacity(count: number, maxCount: number): string {
  if (count === 0) return '0.1'
  const ratio = count / maxCount
  return Math.max(0.2, Math.min(1, ratio)).toString()
}

function HeatmapCell({ cell, maxCount, onClick }: {
  cell: RiskQualityCell
  maxCount: number
  onClick?: (cell: RiskQualityCell) => void
}) {
  const intensity = getIntensityOpacity(cell.count, maxCount)
  const isHighRisk = cell.severity === 'Critical' || (cell.severity === 'High' && cell.status === 'Open')

  return (
    <div
      className={cn(
        'relative p-3 border border-border rounded-lg cursor-pointer transition-all duration-200',
        'hover:border-primary hover:shadow-md hover:scale-105',
        STATUS_COLORS[cell.status],
        isHighRisk && 'ring-2 ring-red-400 ring-opacity-30'
      )}
      style={{
        opacity: intensity
      }}
      onClick={() => onClick?.(cell)}
    >
      {/* Count display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">
          {cell.count}
        </div>
        <div className="text-xs text-muted-foreground">
          {cell.percentage}%
        </div>
      </div>

      {/* Trend indicator */}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        {getTrendIcon(cell.trend)}
        <span className={cn(
          'text-xs font-medium',
          cell.trend === 'up' && 'text-red-600 dark:text-red-400',
          cell.trend === 'down' && 'text-green-600 dark:text-green-400',
          cell.trend === 'stable' && 'text-gray-600 dark:text-gray-400'
        )}>
          {cell.trendPercentage}%
        </span>
      </div>

      {/* High risk indicator */}
      {isHighRisk && (
        <div className="absolute top-1 left-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}

export function RiskQualityHeatmap({ matrix, onCellClick, className }: RiskQualityHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<RiskQualityCell | null>(null)
  const [viewMode, setViewMode] = useState<'heatmap' | 'details'>('heatmap')

  const maxCount = Math.max(...matrix.cells.flat().map(cell => cell.count))
  const statuses = ['Open', 'InProgress', 'ReadyForInspection', 'Closed']
  const severities = ['Critical', 'High', 'Medium', 'Low']

  const handleCellClick = (cell: RiskQualityCell) => {
    setSelectedCell(cell)
    setViewMode('details')
    onCellClick?.(cell)
  }

  const highRiskCells = matrix.cells.flat().filter(cell => 
    cell.severity === 'Critical' || (cell.severity === 'High' && cell.status === 'Open')
  )

  const totalHighRisk = highRiskCells.reduce((sum, cell) => sum + cell.count, 0)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Risk Quality Matrix</h3>
          <p className="text-sm text-muted-foreground">
            Interactive heatmap showing issue distribution by severity and status
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {matrix.riskScore}
            </div>
            <div className="text-xs text-muted-foreground">Risk Score</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {matrix.qualityScore}
            </div>
            <div className="text-xs text-muted-foreground">Quality Score</div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              onClick={() => setViewMode('heatmap')}
            >
              Heatmap
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'details' ? 'default' : 'outline'}
              onClick={() => setViewMode('details')}
              disabled={!selectedCell}
            >
              Details
            </Button>
          </div>
        </div>
      </div>

      {/* High risk alerts */}
      {totalHighRisk > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            {totalHighRisk} high-risk items require immediate attention
          </span>
          <Badge variant="destructive" className="ml-auto">
            Action Required
          </Badge>
        </div>
      )}

      {viewMode === 'heatmap' ? (
        <div className="space-y-4">
          {/* Matrix grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Column headers */}
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div></div>
                {statuses.map(status => (
                  <div key={status} className="text-center">
                    <div className="font-medium text-sm">
                      {STATUS_LABELS[status]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {matrix.cells.reduce((sum, row, rowIndex) => 
                        sum + row[statuses.indexOf(status)].count, 0
                      )} items
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix rows */}
              {severities.map((severity, severityIndex) => (
                <div key={severity} className="grid grid-cols-5 gap-2 mb-2">
                  {/* Row header */}
                  <div className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded-full', SEVERITY_COLORS[severity])} />
                    <div>
                      <div className="font-medium text-sm">
                        {SEVERITY_LABELS[severity]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {matrix.cells[severityIndex].reduce((sum, cell) => sum + cell.count, 0)} items
                      </div>
                    </div>
                  </div>

                  {/* Cells */}
                  {matrix.cells[severityIndex].map((cell, statusIndex) => (
                    <HeatmapCell
                      key={`${severity}-${statuses[statusIndex]}`}
                      cell={cell}
                      maxCount={maxCount}
                      onClick={handleCellClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between p-4 bg-muted/25 rounded-lg">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Legend</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-current opacity-20 rounded" />
                  <span className="text-xs">Low volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-current opacity-100 rounded" />
                  <span className="text-xs">High volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-xs">High risk</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Trends</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {getTrendIcon('up')}
                  <span className="text-xs">Increasing</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon('down')}
                  <span className="text-xs">Decreasing</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon('stable')}
                  <span className="text-xs">Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : selectedCell ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded-full', SEVERITY_COLORS[selectedCell.severity])} />
              {SEVERITY_LABELS[selectedCell.severity]} - {STATUS_LABELS[selectedCell.status]}
            </CardTitle>
            <CardDescription>
              {selectedCell.count} items ({selectedCell.percentage}% of total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Trend info */}
              <div className="flex items-center gap-2">
                {getTrendIcon(selectedCell.trend)}
                <span className="text-sm">
                  {selectedCell.trend === 'up' && `Increased by ${selectedCell.trendPercentage}% this period`}
                  {selectedCell.trend === 'down' && `Decreased by ${selectedCell.trendPercentage}% this period`}
                  {selectedCell.trend === 'stable' && `Remained stable (±${selectedCell.trendPercentage}%)`}
                </span>
              </div>

              {/* Sample items */}
              <div>
                <h4 className="font-medium mb-2">Recent Items</h4>
                <div className="space-y-2">
                  {selectedCell.items.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{item.pin_title}</div>
                        {item.pin_item_title && (
                          <div className="text-xs text-muted-foreground">{item.pin_item_title}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedCell.items.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {selectedCell.items.length - 5} more items
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}