'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getImageProcessor, type ImageProcessingResult } from '@/lib/utils/image-processing'

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[], metadata: ImageMetadata) => Promise<void>
  onProcessingComplete?: (results: ImageProcessingResult[]) => void
  pinId?: string
  pinItemId?: string
  maxFiles?: number
  maxSize?: number // in MB
}

interface ImageMetadata {
  title: string
  description: string
  isPrimary: boolean
  tags: string[]
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  onProcessingComplete,
  pinId,
  pinItemId,
  maxFiles = 5,
  maxSize = 10,
}: ImageUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [metadata, setMetadata] = useState<ImageMetadata>({
    title: '',
    description: '',
    isPrimary: false,
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => 
        file.errors.map((error: any) => error.message).join(', ')
      )
      console.warn('Rejected files:', errors)
    }

    // Add accepted files
    const newFiles = acceptedFiles.slice(0, maxFiles - files.length)
    setFiles(prev => [...prev, ...newFiles])

    // Auto-generate title from first file if empty
    if (!metadata.title && newFiles.length > 0) {
      const fileName = newFiles[0].name.split('.')[0]
      setMetadata(prev => ({
        ...prev,
        title: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    }
  }, [files.length, maxFiles, metadata.title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - files.length,
    disabled: uploading,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !metadata.title.trim()) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Process files with image processor for dual-save capability
      const processor = getImageProcessor()
      const processingResults: ImageProcessingResult[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update progress for processing
        setUploadProgress((i / (files.length * 2)) * 100)
        
        // Process each image (creates original + prepared for annotation)
        const result = await processor.processImage(file, [])
        processingResults.push(result)
        
        // Update progress for upload preparation
        setUploadProgress(((i + 1) / files.length) * 50)
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Call original upload callback
      await onUpload(files, metadata)

      // Call processing complete callback with results
      if (onProcessingComplete) {
        await onProcessingComplete(processingResults)
      }
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('Upload completed with dual-save processing:', {
        fileCount: files.length,
        resultsCount: processingResults.length,
        metadata
      })

      // Reset form
      setTimeout(() => {
        setFiles([])
        setMetadata({
          title: '',
          description: '',
          isPrimary: false,
          tags: [],
        })
        setUploadProgress(0)
        onOpenChange(false)
      }, 1000)

    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
          <DialogDescription>
            Add images to document construction issues and progress.
            {pinId && ` Uploading for Pin #${pinId.split('-').pop()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50',
              uploading && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <svg className="w-10 h-10 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to select files (max {maxSize}MB each)
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length}/{maxFiles})</Label>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/25 rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Membrane separation at drain area"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of what the images show..."
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  disabled={uploading}
                />
                <Button variant="outline" onClick={addTag} disabled={!tagInput.trim() || uploading}>
                  Add
                </Button>
              </div>
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {metadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                        disabled={uploading}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="primary"
                checked={metadata.isPrimary}
                onChange={(e) => setMetadata(prev => ({ ...prev, isPrimary: e.target.checked }))}
                disabled={uploading}
                className="rounded border-input"
              />
              <Label htmlFor="primary" className="text-sm">
                Set as primary image for this item
              </Label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Uploading...</Label>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || !metadata.title.trim() || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}