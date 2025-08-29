'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePhotoAnalytics } from '@/lib/hooks/usePhotosAndChat'
import { BarChart3, HardDrive, Camera, TrendingUp, Users, Calendar, Zap } from 'lucide-react'

type NumRecord = Record<string, number>

interface AnalyticsData {
  total_photos: number
  total_size: number
  avg_file_size: number
  photos_by_type: NumRecord
  top_uploaders?: NumRecord
  photos_by_month?: NumRecord
}

interface PhotoAnalyticsProps {
  pinId?: string
  className?: string
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toNumRecord(o: unknown): NumRecord {
  if (!o || typeof o !== 'object') return {}
  const rec: NumRecord = {}
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    rec[k] = asNumber(v)
  }
  return rec
}

function formatFileSize(bytes: number): string {
  const b = asNumber(bytes)
  if (b <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatPercentage(value: number, total: number): string {
  const v = asNumber(value)
  const t = asNumber(total)
  if (t <= 0) return '0%'
  return `${Math.round((v / t) * 100)}%`
}

/**
 * Displays analytics for photos including total count, storage used, average size,
 * distribution by type, top contributors, and monthly upload trends.
 *
 * @param {string} [pinId] - Optional pin identifier to filter analytics.
 * @param {string} [projectId] - Optional project identifier to filter analytics.
 * @param {string} [className] - Optional CSS class for custom styling.
 */
export default function PhotoAnalytics({ pinId, className }: PhotoAnalyticsProps) {
  const analyticsQuery = usePhotoAnalytics()
  const a = (analyticsQuery.data as Partial<AnalyticsData> | undefined) ?? {}

  const totalPhotos = asNumber(a.total_photos)
  const totalSize = asNumber(a.total_size)
  const avgSize = asNumber(a.avg_file_size)
  const photosByType = toNumRecord(a.photos_by_type)
  const topUploaders = toNumRecord(a.top_uploaders)
  const photosByMonth = toNumRecord(a.photos_by_month)

  if (analyticsQuery.isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
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
                  {totalPhotos > 0 && avgSize > 0 && totalSize > 0
                    ? `${Math.round((1 - avgSize / (totalSize / totalPhotos)) * 100)}%`
                    : '0%'}
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
            const countNum = asNumber(count)
            const percentage = formatPercentage(countNum, totalPhotos)
            const progressValue = totalPhotos > 0 ? (countNum / totalPhotos) * 100 : 0

            const { color, label } =
              {
                defect: { color: 'text-red-600', label: 'Defect Photos' },
                completion: { color: 'text-green-600', label: 'Completion Photos' },
                general: { color: 'text-blue-600', label: 'General Photos' },
              }[type] || { color: 'text-gray-600', label: type }

            return (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={color}>
                      {label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {countNum} photos • {percentage}
                    </span>
                  </div>
                  <span className="font-medium">{countNum}</span>
                </div>
                <Progress value={progressValue} className="h-2" />
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
      {Object.keys(topUploaders).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(topUploaders)
                .sort(([, a], [, b]) => asNumber(b) - asNumber(a))
                .slice(0, 5)
                .map(([name, count]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{asNumber(count)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(asNumber(count), totalPhotos)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Upload Trend */}
      {Object.keys(photosByMonth).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upload Trend by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(photosByMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, count]) => {
                  const countNum = asNumber(count)
                  const percentage = formatPercentage(countNum, totalPhotos)
                  const progressValue = totalPhotos > 0 ? (countNum / totalPhotos) * 100 : 0

                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{month}</span>
                        <span className="text-sm text-muted-foreground">
                          {countNum} photos • {percentage}
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
