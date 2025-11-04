import { supabase as sharedSupabase } from '@/lib/supabase/client'

export interface StorageConfig {
  bucket: string
  maxFileSize: number
  allowedTypes: string[]
  paths: {
    defects: string
    completions: string
    general: string
    thumbnails: string
  }
}

export const PHOTO_STORAGE_CONFIG: StorageConfig = {
  bucket: 'pin-photos',
  maxFileSize: 25 * 1024 * 1024, // 25MB
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ],
  paths: {
    defects: 'defects',
    completions: 'completions', 
    general: 'general',
    thumbnails: 'thumbnails'
  }
}

export class PhotoStorageService {
  private supabase = sharedSupabase

  async ensureBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets()
      
      if (error) {
        console.error('Failed to list buckets:', error)
        return false
      }

  const bucketExists = (buckets as Array<{ name: string }>).some((bucket) => bucket.name === PHOTO_STORAGE_CONFIG.bucket)
      
      if (!bucketExists) {
        const { error: createError } = await this.supabase.storage.createBucket(
          PHOTO_STORAGE_CONFIG.bucket,
          {
            public: true,
            allowedMimeTypes: PHOTO_STORAGE_CONFIG.allowedTypes,
            fileSizeLimit: PHOTO_STORAGE_CONFIG.maxFileSize
          }
        )

        if (createError) {
          console.error('Failed to create bucket:', createError)
          return false
        }

        console.log(`Created storage bucket: ${PHOTO_STORAGE_CONFIG.bucket}`)
      }

      return true
    } catch (error) {
      console.error('Bucket verification failed:', error)
      return false
    }
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!PHOTO_STORAGE_CONFIG.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported. Please use: ${PHOTO_STORAGE_CONFIG.allowedTypes.join(', ')}`
      }
    }

    if (file.size > PHOTO_STORAGE_CONFIG.maxFileSize) {
      const maxSizeMB = PHOTO_STORAGE_CONFIG.maxFileSize / 1024 / 1024
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of ${maxSizeMB}MB`
      }
    }

    return { valid: true }
  }

  generateStoragePath(
    pinId: string, 
    type: 'defect' | 'completion' | 'general',
    fileName: string,
    isThumbnail = false
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExt = fileName.split('.').pop()
    const basePath = PHOTO_STORAGE_CONFIG.paths[`${type}s` as keyof typeof PHOTO_STORAGE_CONFIG.paths]
    
    if (isThumbnail) {
      return `${basePath}/${pinId}/thumbnails/${timestamp}.jpg`
    }
    
    return `${basePath}/${pinId}/${timestamp}.${fileExt}`
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return {
          success: false,
          ...(validation.error !== undefined ? { error: validation.error } : {})
        }
      }

      const { data, error } = await this.supabase.storage
        .from(PHOTO_STORAGE_CONFIG.bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(PHOTO_STORAGE_CONFIG.bucket)
        .remove([path])

      if (error) {
        console.error('Failed to delete file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('File deletion failed:', error)
      return false
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(PHOTO_STORAGE_CONFIG.bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(PHOTO_STORAGE_CONFIG.bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Failed to create signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL creation failed:', error)
      return null
    }
  }

  async cleanupOrphanedFiles(olderThanDays = 7): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const { data: files, error: listError } = await this.supabase.storage
        .from(PHOTO_STORAGE_CONFIG.bucket)
        .list()

      if (listError || !files) {
        console.error('Failed to list files for cleanup:', listError)
        return 0
      }

      const { data: dbPhotos, error: dbError } = await this.supabase
        .from('photos')
        .select('file_url_public')

      if (dbError) {
        console.error('Failed to get database photos:', dbError)
        return 0
      }

      const dbFileNames = new Set(
        (dbPhotos || [])
          .map((p: any) => (p.file_url_public || '').split('/pin-photos/')[1])
          .filter(Boolean)
          .map((path: string) => path.split('/').pop() as string)
      )

  const orphanedFiles = (files || []).filter((file: { name: string; created_at?: string }) => 
        !dbFileNames.has(file.name) &&
        file.created_at && new Date(file.created_at) < cutoffDate
      )

      if (orphanedFiles.length > 0) {
        const { error: deleteError } = await this.supabase.storage
          .from(PHOTO_STORAGE_CONFIG.bucket)
          .remove(orphanedFiles.map((f: { name: string }) => f.name))

        if (deleteError) {
          console.error('Failed to delete orphaned files:', deleteError)
          return 0
        }
      }

      return orphanedFiles.length
    } catch (error) {
      console.error('Cleanup failed:', error)
      return 0
    }
  }
}

export const photoStorage = new PhotoStorageService()