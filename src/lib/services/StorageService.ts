// Storage Service - Comprehensive photo/file management with validation
import { createClient } from '@supabase/supabase-js'
import type { Database, Photo, PhotoInsert } from '../database.types'
import type { PhotoUploadProgress, UploadPhotoForm } from '../types/relations'

export class StorageService {
  private supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  private readonly BUCKET_NAME = 'pin-photos'
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  /**
   * Handle storage errors with user-friendly messages
   */
  private handleError(error: any, operation: string): never {
    console.error(`[StorageService] ${operation} failed:`, error)

    if (error.statusCode === 413) {
      throw new Error('הקובץ גדול מדי. מקסימום 10MB.')
    }
    if (error.statusCode === 400 && error.error?.includes('Invalid file type')) {
      throw new Error('סוג קובץ לא נתמך. אנא העלו תמונה בפורמט JPG, PNG או WebP.')
    }
    if (error.statusCode === 404) {
      throw new Error('הקובץ לא נמצא או נמחק.')
    }
    if (error.error?.includes('Bucket not found')) {
      throw new Error('שגיאת תצורה: Bucket לא נמצא.')
    }

    throw new Error(error.message || 'שגיאה בהעלאת הקובץ. אנא נסו שוב.')
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    if (!file) {
      throw new Error('לא נבחר קובץ')
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`הקובץ גדול מדי. מקסימום ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('סוג קובץ לא נתמך. רק JPG, PNG או WebP מותרים.')
    }
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(pinId: string, childId: string | undefined, type: 'opening' | 'closure'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseId = childId || pinId
    return `pins/${baseId}/${type}/${timestamp}.jpg`
  }

  /**
   * Upload photo with progress tracking
   */
  async uploadPhoto(
    formData: UploadPhotoForm,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo> {
    this.validateFile(formData.file)

    if (!formData.pin_id && !formData.child_id) {
      throw new Error('חובה לציין pin_id או child_id')
    }

    // Generate file path
    const filePath = this.generateFilePath(
      formData.pin_id!, 
      formData.child_id, 
      formData.type === 'OpenPIC' ? 'opening' : 'closure'
    )

    onProgress?.({ progress: 0, status: 'uploading' })

    try {
      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        this.handleError(uploadError, 'uploadPhoto - storage')
      }

      onProgress?.({ progress: 70, status: 'uploading' })

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      onProgress?.({ progress: 90, status: 'uploading' })

      // Save to database
      const photoData: PhotoInsert = {
        type: formData.type,
        file_url_public: publicUrl,
        project_id: null, // Will be filled by trigger
        roof_id: null, // Will be filled by trigger
        pin_id: formData.pin_id || null,
        child_id: formData.child_id || null
      }

      const { data: photo, error: dbError } = await this.supabase
        .from('photos')
        .insert(photoData)
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage
          .from(this.BUCKET_NAME)
          .remove([filePath])
        
        this.handleError(dbError, 'uploadPhoto - database')
      }

      onProgress?.({ progress: 100, status: 'success' })

      return photo as Photo

    } catch (error: any) {
      onProgress?.({ progress: 0, status: 'error', error: error.message })
      throw error
    }
  }

  /**
   * Replace existing photo
   */
  async replacePhoto(photoId: string, newFile: File): Promise<Photo> {
    this.validateFile(newFile)

    // Get existing photo
    const { data: existingPhoto, error: fetchError } = await this.supabase
      .from('photos')
      .select('*')
      .eq('photo_id', photoId)
      .single()

    if (fetchError || !existingPhoto) {
      throw new Error('התמונה הקיימת לא נמצאה')
    }

    // Extract file path from URL
    const url = new URL(existingPhoto.file_url_public)
    const oldFilePath = url.pathname.split('/').slice(-4).join('/')

    // Upload new file to same path (overwrite)
    const { error: uploadError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(oldFilePath, newFile, {
        cacheControl: '3600',
        upsert: true // Overwrite existing
      })

    if (uploadError) {
      this.handleError(uploadError, 'replacePhoto')
    }

    // Update database record
    const { data: updatedPhoto, error: updateError } = await this.supabase
      .from('photos')
      .update({
        uploaded_at: new Date().toISOString()
      })
      .eq('photo_id', photoId)
      .select()
      .single()

    if (updateError) {
      this.handleError(updateError, 'replacePhoto - database')
    }

    return updatedPhoto as Photo
  }

  /**
   * Delete photo and file
   */
  async deletePhoto(photoId: string): Promise<void> {
    // Get photo data
    const { data: photo, error: fetchError } = await this.supabase
      .from('photos')
      .select('file_url_public')
      .eq('photo_id', photoId)
      .single()

    if (fetchError || !photo) {
      throw new Error('התמונה לא נמצאה')
    }

    // Extract file path from URL
    const url = new URL(photo.file_url_public)
    const filePath = url.pathname.split('/').slice(-4).join('/')

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([filePath])

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('photos')
      .delete()
      .eq('photo_id', photoId)

    if (dbError) {
      this.handleError(dbError, 'deletePhoto - database')
    }
  }

  /**
   * Get photos for pin or child
   */
  async getPhotos(pinId?: string, childId?: string): Promise<Photo[]> {
    if (!pinId && !childId) {
      throw new Error('חובה לציין pinId או childId')
    }

    let query = this.supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (childId) {
      query = query.eq('child_id', childId)
    } else if (pinId) {
      query = query.eq('pin_id', pinId).is('child_id', null)
    }

    const { data, error } = await query

    if (error) {
      this.handleError(error, 'getPhotos')
    }

    return (data as Photo[]) || []
  }

  /**
   * Get signed URL for private photos (if needed)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      this.handleError(error, 'getSignedUrl')
    }

    return data!.signedUrl
  }

  /**
   * Check bucket exists and is accessible
   */
  async verifyBucket(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets()
      
      if (error) {
        console.error('Failed to list buckets:', error)
        return false
      }

      const bucket = data.find(b => b.name === this.BUCKET_NAME)
      return !!bucket
    } catch (error) {
      console.error('Bucket verification failed:', error)
      return false
    }
  }

  /**
   * Cleanup orphaned files (admin operation)
   */
  async cleanupOrphanedFiles(): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = []
    let deletedCount = 0

    try {
      // Get all files in storage
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .list('pins', { limit: 1000 })

      if (listError) {
        errors.push(`Failed to list files: ${listError.message}`)
        return { deleted: 0, errors }
      }

      // Get all photo URLs from database
      const { data: photos, error: dbError } = await this.supabase
        .from('photos')
        .select('file_url_public')

      if (dbError) {
        errors.push(`Failed to get database photos: ${dbError.message}`)
        return { deleted: 0, errors }
      }

      const dbUrls = new Set(photos?.map(p => p.file_url_public) || [])

      // Find orphaned files
      for (const file of files || []) {
        const publicUrl = this.supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(`pins/${file.name}`).data.publicUrl

        if (!dbUrls.has(publicUrl)) {
          // File exists in storage but not in database - delete it
          const { error: deleteError } = await this.supabase.storage
            .from(this.BUCKET_NAME)
            .remove([`pins/${file.name}`])

          if (deleteError) {
            errors.push(`Failed to delete ${file.name}: ${deleteError.message}`)
          } else {
            deletedCount++
          }
        }
      }

      return { deleted: deletedCount, errors }
    } catch (error: any) {
      errors.push(`Cleanup failed: ${error.message}`)
      return { deleted: deletedCount, errors }
    }
  }
}

// Create singleton instance
export const storageService = new StorageService()
