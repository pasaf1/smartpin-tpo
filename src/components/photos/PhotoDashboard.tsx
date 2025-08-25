import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePhotoAnalytics, usePhotosByPin } from '@/lib/hooks/useSupabaseQueries'
import PhotoGallery from './PhotoGallery'
import PhotoUploadZone from './PhotoUploadZone'
import { 
  Camera, 
  BarChart3, 
  HardDrive, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface PhotoDashboardProps {
  pinId: string
  className?: string
}

export function PhotoDashboard({ pinId, className }: PhotoDashboardProps) {
  const [activeTab, setActiveTab] = useState('gallery')
  const photosQuery = usePhotosByPin(pinId)
  const analyticsQuery = usePhotoAnalytics(pinId)

  const photos = photosQuery.data || []
  const analytics = analyticsQuery.data || {}

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getPhotoTypeStats = () => {
    const stats = {
      defect: photos.filter(p => p.upload_type === 'defect').length,
      completion: photos.filter(p => p.upload_type === 'completion').length,
      general: photos.filter(p => p.upload_type === 'general').length
    }
    return stats
  }

  const typeStats = getPhotoTypeStats()
  const totalSize = photos.reduce((sum, photo) => sum + photo.file_size, 0)
  const avgSize = photos.length > 0 ? totalSize / photos.length : 0

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Photos</p>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Defect Photos</p>
                <p className="text-2xl font-bold text-red-600">{typeStats.defect}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Photos</p>
                <p className="text-2xl font-bold text-green-600">{typeStats.completion}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Gallery ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-4">
          <PhotoGallery 
            pinId={pinId} 
            photos={photos}
            onRefresh={() => {
              photosQuery.refetch()
              analyticsQuery.refetch()
            }}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <PhotoUploadZone 
            pinId={pinId}
            onUploadComplete={() => {
              photosQuery.refetch()
              analyticsQuery.refetch()
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Upload Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Photos</span>
                    <span className="font-medium">{photos.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="font-medium">{formatFileSize(totalSize)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Size</span>
                    <span className="font-medium">{formatFileSize(avgSize)}</span>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">By Type</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="w-3 h-3 p-0"></Badge>
                          <span className="text-sm">Defects</span>
                        </div>
                        <span className="font-medium">{typeStats.defect}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="w-3 h-3 p-0"></Badge>
                          <span className="text-sm">Completions</span>
                        </div>
                        <span className="font-medium">{typeStats.completion}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-3 h-3 p-0"></Badge>
                          <span className="text-sm">General</span>
                        </div>
                        <span className="font-medium">{typeStats.general}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {photos.slice(0, 5).map((photo) => (
                    <div key={photo.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <img
                        src={photo.thumbnail_url || photo.storage_url}
                        alt={photo.file_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{photo.file_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(photo.uploaded_at), 'MMM d, HH:mm')}</span>
                          <Badge variant="outline" className="text-xs py-0">
                            {photo.upload_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(photo.file_size)}
                      </div>
                    </div>
                  ))}
                  
                  {photos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No photos uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Upload Activity by User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    photos.reduce((acc, photo) => {
                      const uploaderName = photo.uploader?.name || 'Unknown'
                      if (!acc[uploaderName]) {
                        acc[uploaderName] = { count: 0, size: 0 }
                      }
                      acc[uploaderName].count++
                      acc[uploaderName].size += photo.file_size
                      return acc
                    }, {} as Record<string, { count: number; size: number }>)
                  )
                    .sort(([,a], [,b]) => b.count - a.count)
                    .map(([name, stats]) => (
                      <div key={name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.count} photo{stats.count > 1 ? 's' : ''} • {formatFileSize(stats.size)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{stats.count}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PhotoDashboard