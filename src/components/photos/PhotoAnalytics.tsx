import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePhotoAnalytics } from '@/lib/hooks/useSupabaseQueries'
import { 
  BarChart3, 
  HardDrive, 
  Camera, 
  TrendingUp,
  Users,
  Calendar,
  Zap
} from 'lucide-react'

interface PhotoAnalyticsProps {
  pinId?: string
  projectId?: string
  className?: string
}

export function PhotoAnalytics({ pinId, projectId, className }: PhotoAnalyticsProps) {
  const analyticsQuery = usePhotoAnalytics(pinId)
  const analytics = analyticsQuery.data || {}

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number, total: number): string => {
    if (!total || total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  const photosByType = analytics.photos_by_type || {}
  const totalPhotos = analytics.total_photos || 0
  const totalSize = analytics.total_size || 0
  const avgSize = analytics.avg_file_size || 0

  if (analyticsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">{totalPhotos.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Size</p>
                <p className="text-2xl font-bold">{formatFileSize(avgSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compression</p>
                <p className="text-2xl font-bold">
                  {totalPhotos > 0 ? '~65%' : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Photo Distribution by Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(photosByType).map(([type, count]) => {
            const percentage = formatPercentage(count as number, totalPhotos)
            const progressValue = totalPhotos > 0 ? ((count as number) / totalPhotos) * 100 : 0

            const typeConfig = {
              defect: { color: 'text-red-600', bg: 'bg-red-500', label: 'Defect Photos' },
              completion: { color: 'text-green-600', bg: 'bg-green-500', label: 'Completion Photos' },
              general: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'General Photos' }
            }[type] || { color: 'text-gray-600', bg: 'bg-gray-500', label: type }

            return (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count} photos • {percentage}
                    </span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-2"
                  style={{
                    '--progress-background': typeConfig.bg
                  } as React.CSSProperties}
                />
              </div>
            )
          })}

          {totalPhotos === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Start uploading photos to see analytics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      {analytics.top_uploaders && Object.keys(analytics.top_uploaders).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.top_uploaders)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(count as number, totalPhotos)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Upload Trend */}
      {analytics.photos_by_month && Object.keys(analytics.photos_by_month).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upload Trend by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.photos_by_month)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, count]) => {
                  const percentage = formatPercentage(count as number, totalPhotos)
                  const progressValue = totalPhotos > 0 ? ((count as number) / totalPhotos) * 100 : 0

                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{month}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} photos • {percentage}
                        </span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PhotoAnalytics