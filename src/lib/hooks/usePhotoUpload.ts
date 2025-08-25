import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { useOfflinePhotoOperations } from './useOfflineSync'
import { toast } from 'sonner'

export interface PhotoUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  url?: string
  publicUrl?: string
}

export interface PhotoUploadResult {
  success: boolean
  url?: string
  publicUrl?: string
  error?: string
}

export function usePhotoUpload() {
  const [uploads, setUploads] = useState<Map<string, PhotoUploadProgress>>(new Map())
  const { user } = useAuth()
  const { uploadPhotoOffline, isOffline } = useOfflinePhotoOperations()
  const supabase = createClient()

  const compressImage = useCallback(async (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const generateThumbnail = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const size = 200
        canvas.width = size
        canvas.height = size

        const minDim = Math.min(img.width, img.height)
        const x = (img.width - minDim) / 2
        const y = (img.height - minDim) / 2

        ctx?.drawImage(img, x, y, minDim, minDim, 0, 0, size, size)

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(thumbnailFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.7)
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const uploadPhoto = useCallback(async (
    file: File,
    pinId: string,
    type: 'defect' | 'completion' | 'general' = 'defect',
    options: {
      compress?: boolean
      generateThumbnail?: boolean
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<PhotoUploadResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const uploadId = `${pinId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (isOffline) {
      await uploadPhotoOffline(pinId, file, type)
      return { 
        success: true, 
        url: 'offline-pending',
        publicUrl: 'offline-pending' 
      }
    }

    try {
      let processedFile = file
      let thumbnailFile: File | null = null

      setUploads(prev => new Map(prev.set(uploadId, {
        file,
        progress: 0,
        status: 'pending'
      })))

      if (options.compress) {
        setUploads(prev => new Map(prev.set(uploadId, {
          ...prev.get(uploadId)!,
          status: 'processing',
          progress: 10
        })))

        processedFile = await compressImage(file)
      }

      if (options.generateThumbnail) {
        setUploads(prev => new Map(prev.set(uploadId, {
          ...prev.get(uploadId)!,
          progress: 20
        })))

        thumbnailFile = await generateThumbnail(processedFile)
      }

      setUploads(prev => new Map(prev.set(uploadId, {
        ...prev.get(uploadId)!,
        status: 'uploading',
        progress: 30
      })))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileExt = processedFile.name.split('.').pop()
      const fileName = `${pinId}/${type}/${timestamp}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pin-photos')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setUploads(prev => new Map(prev.set(uploadId, {
        ...prev.get(uploadId)!,
        progress: 70
      })))

      let thumbnailUrl: string | null = null
      if (thumbnailFile) {
        const thumbFileName = `${pinId}/${type}/thumbs/${timestamp}.jpg`
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('pin-photos')
          .upload(thumbFileName, thumbnailFile)

        if (!thumbError && thumbData) {
          const { data: thumbUrlData } = supabase.storage
            .from('pin-photos')
            .getPublicUrl(thumbData.path)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      }

      const { data: urlData } = supabase.storage
        .from('pin-photos')
        .getPublicUrl(uploadData.path)

      setUploads(prev => new Map(prev.set(uploadId, {
        ...prev.get(uploadId)!,
        progress: 90
      })))

      const { error: dbError } = await supabase
        .from('pin_photos')
        .insert({
          pin_id: pinId,
          file_name: processedFile.name,
          file_path: uploadData.path,
          file_size: processedFile.size,
          mime_type: processedFile.type,
          upload_type: type,
          storage_url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          uploaded_by: user.id,
          metadata: {
            originalName: file.name,
            originalSize: file.size,
            compressed: options.compress,
            hasThumbnail: !!thumbnailFile
          }
        })

      if (dbError) throw dbError

      setUploads(prev => new Map(prev.set(uploadId, {
        ...prev.get(uploadId)!,
        status: 'completed',
        progress: 100,
        url: uploadData.path,
        publicUrl: urlData.publicUrl
      })))

      toast.success('Photo uploaded successfully', {
        description: `${processedFile.name} has been saved`
      })

      return {
        success: true,
        url: uploadData.path,
        publicUrl: urlData.publicUrl
      }

    } catch (error) {
      console.error('Photo upload failed:', error)
      
      setUploads(prev => new Map(prev.set(uploadId, {
        ...prev.get(uploadId)!,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      })))

      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }, [user, isOffline, uploadPhotoOffline, compressImage, generateThumbnail, supabase])

  const uploadMultiplePhotos = useCallback(async (
    files: File[],
    pinId: string,
    type: 'defect' | 'completion' | 'general' = 'defect',
    options: {
      compress?: boolean
      generateThumbnail?: boolean
      onProgress?: (completed: number, total: number) => void
    } = {}
  ): Promise<PhotoUploadResult[]> => {
    const results: PhotoUploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const result = await uploadPhoto(files[i], pinId, type, options)
      results.push(result)
      options.onProgress?.(i + 1, files.length)
    }

    return results
  }, [uploadPhoto])

  const deletePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data: photo, error: fetchError } = await supabase
        .from('pin_photos')
        .select('file_path, thumbnail_url')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      if (photo.file_path) {
        await supabase.storage
          .from('pin-photos')
          .remove([photo.file_path])
      }

      if (photo.thumbnail_url) {
        const thumbPath = photo.thumbnail_url.split('/pin-photos/')[1]
        if (thumbPath) {
          await supabase.storage
            .from('pin-photos')
            .remove([thumbPath])
        }
      }

      const { error: deleteError } = await supabase
        .from('pin_photos')
        .delete()
        .eq('id', photoId)

      if (deleteError) throw deleteError

      toast.success('Photo deleted successfully')
      return true

    } catch (error) {
      console.error('Photo deletion failed:', error)
      toast.error('Failed to delete photo', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
      return false
    }
  }, [user, supabase])

  const clearUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev)
      newMap.delete(uploadId)
      return newMap
    })
  }, [])

  const clearAllUploads = useCallback(() => {
    setUploads(new Map())
  }, [])

  return {
    uploads: Array.from(uploads.entries()).map(([id, upload]) => ({ id, ...upload })),
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    clearUpload,
    clearAllUploads,
    isOffline
  }
}