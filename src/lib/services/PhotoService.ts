// Unified Photo Service with enhanced error handling
import { BaseService } from './BaseService'
import type { Photo, PhotoInsert, PhotoUpdate } from '../database.types'
import type { PhotoWithContext } from '../types/relations'

export class PhotoService extends BaseService {
  
  /**
   * Get all photos for a pin with context
   */
  async getPhotosForPin(pinId: string): Promise<PhotoWithContext[]> {
    this.validateUUID(pinId, 'pinId')
    this.logOperation('getPhotosForPin', { pinId })

    return this.safeArrayOperation(
      async () => await this.supabase
        .from('photos')
        .select(`
          *,
          pin:pins (*),
          pin_child:pin_children (*),
          roof:roofs (*),
          project:projects (*),
          uploaded_by_user:users!photos_uploaded_by_fkey (*)
        `)
        .eq('pin_id', pinId)
        .order('uploaded_at', { ascending: false }) as any,
      'getPhotosForPin',
      'photos'
    )
  }

  /**
   * Get photos for a pin child
   */
  async getPhotosForPinChild(childId: string): Promise<Photo[]> {
    this.validateUUID(childId, 'childId')
    this.logOperation('getPhotosForPinChild', { childId })

    return this.safeArrayOperation(
      async () => await this.supabase
        .from('photos')
        .select('*')
        .eq('pin_child_id', childId)
        .order('uploaded_at', { ascending: false }),
      'getPhotosForPinChild',
      'photos'
    )
  }

  /**
   * Upload photo with automatic metadata
   */
  async uploadPhoto(data: {
    file: File
    pinId?: string
    pinChildId?: string
    type: 'OpenPIC' | 'ClosurePIC'
    metadata?: Record<string, any>
  }): Promise<Photo> {
    this.validateRequired(data, ['file', 'type'])
    if (!data.pinId && !data.pinChildId) {
      throw new Error('חובה לציין pin_id או pin_child_id')
    }

    this.logOperation('uploadPhoto', {
      fileName: data.file.name,
      fileSize: data.file.size,
      type: data.type
    })

    // Validate file
    this.validatePhotoFile(data.file)

    // Generate file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${data.type}_${timestamp}_${data.file.name}`
    const filePath = data.pinId 
      ? `pins/${data.pinId}/${fileName}`
      : `pin-children/${data.pinChildId}/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('pin-photos')
      .upload(filePath, data.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      this.handleError(uploadError, 'uploadPhoto_storage')
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('pin-photos')
      .getPublicUrl(uploadData.path)

    // Create photo record
    const photoData: PhotoInsert = {
      type: data.type,
      file_url_public: urlData.publicUrl,
      pin_id: data.pinId || null,
      child_id: data.pinChildId || null
    }

    return this.safeOperation(
      async () => await this.supabase
        .from('photos')
        .insert(photoData)
        .select()
        .single(),
      'uploadPhoto_database',
      'photos'
    )
  }

  /**
   * Delete photo and file
   */
  async deletePhoto(photoId: string): Promise<void> {
    this.validateUUID(photoId, 'photoId')
    this.logOperation('deletePhoto', { photoId })

    // Get photo details first
    const { data: photo, error } = await this.supabase
      .from('photos')
      .select('file_url_public')
      .eq('photo_id', photoId)
      .single()

    if (error || !photo) {
      this.handleError(error || new Error('תמונה לא נמצאה'), 'deletePhoto_getDetails', 'photos')
    }

    // Extract file path from URL for storage deletion
    if (photo.file_url_public) {
      const url = new URL(photo.file_url_public)
      const filePath = url.pathname.split('/').slice(-2).join('/') // Get last 2 parts
      
      const { error: storageError } = await this.supabase.storage
        .from('pin-photos')
        .remove([filePath])

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
        // Continue with database deletion
      }
    }

    // Delete from database
    await this.safeOperation(
      async () => await this.supabase
        .from('photos')
        .delete()
        .eq('photo_id', photoId),
      'deletePhoto_database',
      'photos'
    )
  }

  /**
   * Get photo analytics for dashboard
   */
  async getPhotoAnalytics(filters?: {
    projectId?: string
    roofId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalPhotos: number
    openingPhotos: number
    closurePhotos: number
    photosThisWeek: number
    averagePhotosPerPin: number
  }> {
    this.logOperation('getPhotoAnalytics', filters)

    let query = this.supabase
      .from('photos')
      .select(`
        photo_id,
        type,
        uploaded_at,
        pin:pins!inner (roof_id, roof:roofs!inner (project_id))
      `)

    // Apply filters
    if (filters?.projectId) {
      query = query.eq('pin.roof.project_id', filters.projectId)
    }
    if (filters?.roofId) {
      query = query.eq('pin.roof_id', filters.roofId)
    }
    if (filters?.dateFrom) {
      query = query.gte('uploaded_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('uploaded_at', filters.dateTo)
    }

    const photos = await this.safeArrayOperation(
      async () => await query,
      'getPhotoAnalytics',
      'photos'
    )

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return {
      totalPhotos: photos.length,
      openingPhotos: photos.filter(p => p.type === 'OpenPIC').length,
      closurePhotos: photos.filter(p => p.type === 'ClosurePIC').length,
      photosThisWeek: photos.filter(p => 
        new Date(p.uploaded_at) > weekAgo
      ).length,
      averagePhotosPerPin: 0 // TODO: Calculate from pin count
    }
  }

  /**
   * Validate photo file
   */
  private validatePhotoFile(file: File): void {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (file.size > maxSize) {
      throw new Error('גודל הקובץ חורג מ-10MB')
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('סוג קובץ לא נתמך. נתמכים: JPG, PNG, WebP')
    }
  }
}

// Export singleton instance
export const photoService = new PhotoService()
