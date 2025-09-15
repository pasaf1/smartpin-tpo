'use client'

/**
 * SmartPin TPO - Pin Photo Manager
 * Advanced photo upload and management with drag-and-drop support
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  SmartPin,
  SmartChildPin,
  PinPhotoManagerProps,
  PhotoUpload
} from './types'

interface PhotoPreview extends PhotoUpload {
  isUploading?: boolean
  uploadProgress?: number
  error?: string
}

export const PinPhotoManager: React.FC<PinPhotoManagerProps> = ({
  pin,
  childPin,
  photos,
  onPhotoUpload,
  onPhotoDelete,
  onPhotoUpdate,
  canUpload,
  canDelete,
  maxPhotos = 30,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  isMobile = false,
  className
}) => {
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>(photos)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activePhotoType, setActivePhotoType] = useState<PhotoUpload['type']>('documentation')
  const [isUploading, setIsUploading] = useState(false)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Update previews when photos prop changes
  useEffect(() => {
    setPhotoPreviews(photos)
  }, [photos])

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use: ${acceptedTypes.join(', ')}`
    }
    if (file.size > maxFileSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${maxFileSize / 1024 / 1024}MB`
    }
    if (photoPreviews.length >= maxPhotos) {
      return `Maximum ${maxPhotos} photos allowed`
    }
    return null
  }, [acceptedTypes, maxFileSize, maxPhotos, photoPreviews.length])

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!canUpload || isUploading) return

    const validFiles: File[] = []
    const errors: string[] = []

    // Validate each file
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`)
    }

    // Upload valid files
    if (validFiles.length > 0) {
      setIsUploading(true)

      // Create preview entries
      const newPreviews: PhotoPreview[] = validFiles.map(file => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        pin_id: pin.id,
        child_pin_id: childPin?.child_id,
        type: activePhotoType,
        url: URL.createObjectURL(file),
        thumbnail_url: URL.createObjectURL(file),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: '', // Will be set by upload handler
        uploaded_at: new Date().toISOString(),
        isUploading: true,
        uploadProgress: 0
      }))

      setPhotoPreviews(prev => [...prev, ...newPreviews])

      try {
        // Simulate upload progress
        for (const preview of newPreviews) {
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise(resolve => setTimeout(resolve, 100))
            setPhotoPreviews(prev => prev.map(p =>
              p.id === preview.id ? { ...p, uploadProgress: progress } : p
            ))
          }
        }

        await onPhotoUpload(validFiles, activePhotoType)

        // Mark as completed
        setPhotoPreviews(prev => prev.map(p =>
          newPreviews.some(np => np.id === p.id)
            ? { ...p, isUploading: false, uploadProgress: 100 }
            : p
        ))
      } catch (error) {
        // Mark failed uploads
        setPhotoPreviews(prev => prev.map(p =>
          newPreviews.some(np => np.id === p.id)
            ? { ...p, isUploading: false, error: 'Upload failed' }
            : p
        ))
        console.error('Photo upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }, [canUpload, isUploading, validateFile, activePhotoType, pin.id, childPin?.child_id, onPhotoUpload])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canUpload && !isUploading) {
      setIsDragging(true)
    }
  }, [canUpload, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!canUpload || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }, [canUpload, isUploading, handleFileSelect])

  // File input handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files)
      // Reset input
      e.target.value = ''
    }
  }, [handleFileSelect])

  // Photo selection
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }, [])

  // Delete selected photos
  const handleDeleteSelected = useCallback(async () => {
    if (!canDelete || selectedPhotos.size === 0) return

    if (!window.confirm(`Delete ${selectedPhotos.size} selected photo(s)?`)) return

    for (const photoId of selectedPhotos) {
      try {
        await onPhotoDelete(photoId)
        setPhotoPreviews(prev => prev.filter(p => p.id !== photoId))
      } catch (error) {
        console.error(`Failed to delete photo ${photoId}:`, error)
      }
    }

    setSelectedPhotos(new Set())
  }, [canDelete, selectedPhotos, onPhotoDelete])

  // Photo type configuration
  const photoTypeConfig = {
    opening: { label: 'Opening Photos', icon: '🔓', color: 'bg-red-100 text-red-800' },
    closing: { label: 'Closing Photos', icon: '🔒', color: 'bg-green-100 text-green-800' },
    documentation: { label: 'Documentation', icon: '📋', color: 'bg-blue-100 text-blue-800' },
    progress: { label: 'Progress Photos', icon: '🚧', color: 'bg-yellow-100 text-yellow-800' }
  }

  // Group photos by type
  const photosByType = photoPreviews.reduce((acc, photo) => {
    if (!acc[photo.type]) acc[photo.type] = []
    acc[photo.type].push(photo)
    return acc
  }, {} as Record<PhotoUpload['type'], PhotoPreview[]>)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-luxury-900">Photo Management</h3>
          <p className="text-sm text-luxury-600">
            {photoPreviews.length} of {maxPhotos} photos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-luxury-200">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-2 text-sm transition-colors",
                viewMode === 'grid' ? "bg-blue-100 text-blue-800" : "text-luxury-600 hover:bg-luxury-50"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-2 text-sm transition-colors",
                viewMode === 'list' ? "bg-blue-100 text-blue-800" : "text-luxury-600 hover:bg-luxury-50"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Delete selected button */}
          {selectedPhotos.size > 0 && canDelete && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete ({selectedPhotos.size})
            </button>
          )}
        </div>
      </div>

      {/* Photo type tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(photoTypeConfig).map(([type, config]) => {
          const count = photosByType[type as PhotoUpload['type']]?.length || 0
          return (
            <button
              key={type}
              onClick={() => setActivePhotoType(type as PhotoUpload['type'])}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                "flex items-center gap-2",
                activePhotoType === type
                  ? `${config.color} border-current`
                  : "text-luxury-600 border-luxury-200 hover:bg-luxury-50"
              )}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              {count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  activePhotoType === type ? "bg-white/50" : "bg-luxury-200"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Upload area */}
      {canUpload && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-blue-400 bg-blue-50"
              : photoPreviews.length === 0
                ? "border-luxury-300 bg-luxury-50"
                : "border-luxury-200 hover:border-luxury-300"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="text-luxury-500">
              {isDragging ? (
                <>
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-blue-600">Drop photos here</p>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium">
                    Upload {photoTypeConfig[activePhotoType].label}
                  </p>
                  <p className="text-sm">
                    Drag and drop or click to select files
                  </p>
                </>
              )}
            </div>

            {!isDragging && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </button>
            )}

            <p className="text-xs text-luxury-500">
              Supported formats: {acceptedTypes.join(', ')} • Max {maxFileSize / 1024 / 1024}MB per file
            </p>
          </div>
        </div>
      )}

      {/* Photos display */}
      <div className="space-y-6">
        {Object.entries(photosByType).map(([type, typePhotos]) => {
          if (typePhotos.length === 0) return null

          const config = photoTypeConfig[type as PhotoUpload['type']]
          return (
            <div key={type}>
              <h4 className="text-md font-semibold text-luxury-900 mb-3 flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="text-sm text-luxury-500">({typePhotos.length})</span>
              </h4>

              {viewMode === 'grid' ? (
                <div className={cn(
                  "grid gap-4",
                  isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                )}>
                  {typePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border-2 transition-all",
                        selectedPhotos.has(photo.id) ? "border-blue-500" : "border-luxury-200 hover:border-luxury-300"
                      )}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedPhotos.has(photo.id)}
                          onChange={() => togglePhotoSelection(photo.id)}
                          className="w-4 h-4 rounded border-luxury-300"
                        />
                      </div>

                      {/* Photo */}
                      <div
                        className="aspect-square bg-luxury-100 cursor-pointer"
                        onClick={() => setExpandedPhoto(photo.id)}
                      >
                        <img
                          src={photo.thumbnail_url || photo.url}
                          alt={photo.file_name}
                          className="w-full h-full object-cover"
                        />

                        {/* Upload progress overlay */}
                        {photo.isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                              <div className="text-sm">{photo.uploadProgress}%</div>
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {photo.error && (
                          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-xs">Failed</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="p-2 bg-white">
                        <div className="text-xs text-luxury-600 truncate" title={photo.file_name}>
                          {photo.file_name}
                        </div>
                        <div className="text-xs text-luxury-500">
                          {(photo.file_size / 1024).toFixed(0)}KB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {typePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "flex items-center gap-4 p-4 border rounded-lg transition-all",
                        selectedPhotos.has(photo.id) ? "border-blue-500 bg-blue-50" : "border-luxury-200 hover:border-luxury-300"
                      )}
                    >
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedPhotos.has(photo.id)}
                        onChange={() => togglePhotoSelection(photo.id)}
                        className="w-4 h-4 rounded border-luxury-300"
                      />

                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-luxury-100">
                        <img
                          src={photo.thumbnail_url || photo.url}
                          alt={photo.file_name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setExpandedPhoto(photo.id)}
                        />
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-luxury-900 truncate">{photo.file_name}</div>
                        <div className="text-sm text-luxury-600">
                          {(photo.file_size / 1024).toFixed(0)}KB • {new Date(photo.uploaded_at).toLocaleDateString()}
                        </div>
                        {photo.description && (
                          <div className="text-sm text-luxury-500 truncate">{photo.description}</div>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        {photo.isUploading && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">{photo.uploadProgress}%</span>
                          </div>
                        )}
                        {photo.error && (
                          <div className="text-red-600 text-sm">Failed</div>
                        )}
                        {!photo.isUploading && !photo.error && (
                          <div className="text-green-600 text-sm">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {photoPreviews.length === 0 && (
          <div className="text-center py-12 text-luxury-500">
            <div className="text-6xl mb-4">📷</div>
            <h4 className="text-lg font-medium mb-2">No photos yet</h4>
            <p className="text-sm">Upload photos to document pin issues and progress</p>
          </div>
        )}
      </div>

      {/* Photo lightbox modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-luxury-600 hover:bg-luxury-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {(() => {
              const photo = photoPreviews.find(p => p.id === expandedPhoto)
              return photo ? (
                <img
                  src={photo.url}
                  alt={photo.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default PinPhotoManager