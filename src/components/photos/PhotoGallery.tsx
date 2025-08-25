import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { usePhotoUpload } from '@/lib/hooks/usePhotoUpload'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  Camera, 
  Upload, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye,
  ZoomIn,
  Calendar,
  User,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react'
import { format } from 'date-fns'

export interface PinPhoto {
  id: string
  pin_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  upload_type: 'defect' | 'completion' | 'general'
  storage_url: string
  thumbnail_url?: string
  uploaded_by: string
  uploaded_at: string
  metadata?: {
    originalName?: string
    originalSize?: number
    compressed?: boolean
    hasThumbnail?: boolean
    _offline?: boolean
    _cachedAt?: string
  }
  uploader?: {
    name: string
    avatar_url?: string
  }
}

interface PhotoGalleryProps {
  pinId: string
  photos: PinPhoto[]
  onRefresh?: () => void
  className?: string
}

export function PhotoGallery({ pinId, photos, onRefresh, className }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PinPhoto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PinPhoto | null>(null)
  const { deletePhoto, isOffline } = usePhotoUpload()
  const { user, canPerformAction } = useAuth()

  const handleDelete = useCallback(async (photo: PinPhoto) => {
    const success = await deletePhoto(photo.id)
    if (success) {
      setDeleteConfirm(null)
      onRefresh?.()
    }
  }, [deletePhoto, onRefresh])

  const handleDownload = useCallback(async (photo: PinPhoto) => {
    try {
      const response = await fetch(photo.storage_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed', {
        description: 'Could not download the photo'
      })
    }
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }, [])

  const getUploadTypeBadge = useCallback((type: string) => {
    const variants = {
      defect: 'destructive',
      completion: 'default',
      general: 'secondary'
    } as const

    const labels = {
      defect: 'Defect',
      completion: 'Completion',
      general: 'General'
    }

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    )
  }, [])

  const groupedPhotos = photos.reduce((acc, photo) => {
    const type = photo.upload_type
    if (!acc[type]) acc[type] = []
    acc[type].push(photo)
    return acc
  }, {} as Record<string, PinPhoto[]>)

  if (photos.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <div className="text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No photos yet</p>
          <p className="text-sm">Upload photos to document this pin</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold capitalize">{type} Photos</h3>
            {getUploadTypeBadge(type)}
            <span className="text-sm text-muted-foreground">
              ({typePhotos.length})
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {typePhotos.map((photo) => (
              <Card key={photo.id} className="group overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <img
                      src={photo.thumbnail_url || photo.storage_url}
                      alt={photo.file_name}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setSelectedPhoto(photo)}
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedPhoto(photo)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(photo)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {canPerformAction('Foreman') && (
                              <DropdownMenuItem 
                                onClick={() => setDeleteConfirm(photo)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between text-xs text-white">
                          <span className="bg-black/50 px-2 py-1 rounded">
                            {formatFileSize(photo.file_size)}
                          </span>
                          {photo.metadata?._offline && (
                            <div className="bg-orange-500/80 px-2 py-1 rounded flex items-center gap-1">
                              <WifiOff className="h-3 w-3" />
                              Offline
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedPhoto.storage_url}
                alt={selectedPhoto.file_name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedPhoto(null)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPhoto.file_name}
                  {getUploadTypeBadge(selectedPhoto.upload_type)}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(selectedPhoto.file_size)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Uploaded:</span>
                    <span>{format(new Date(selectedPhoto.uploaded_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">By:</span>
                    <span>{selectedPhoto.uploader?.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPhoto.metadata?.compressed && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="font-medium">✓ Compressed</span>
                    </div>
                  )}
                  
                  {selectedPhoto.metadata?.hasThumbnail && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="font-medium">✓ Thumbnail</span>
                    </div>
                  )}

                  {selectedPhoto.metadata?._offline && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <WifiOff className="h-4 w-4" />
                      <span className="font-medium">Uploaded offline</span>
                    </div>
                  )}

                  {!isOffline && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Wifi className="h-4 w-4" />
                      <span className="font-medium">Online</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedPhoto)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {canPerformAction('Foreman') && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteConfirm(selectedPhoto)
                      setSelectedPhoto(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Photo</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteConfirm.file_name}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete Photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PhotoGallery