'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageEditor, type Annotation } from '@/components/image/ImageEditor'
import { ImageUploadDialog } from '@/components/image/ImageUploadDialog'
import { type ImageProcessingResult } from '@/lib/utils/image-processing'

interface DemoImage {
  id: string
  name: string
  url: string
  originalBlob?: Blob
  annotatedBlob?: Blob
  annotations: Annotation[]
  metadata?: any
}

export function ImageDualSaveDemo() {
  const [images, setImages] = useState<DemoImage[]>([])
  const [selectedImage, setSelectedImage] = useState<DemoImage | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [processingResults, setProcessingResults] = useState<ImageProcessingResult[]>([])

  // Handle file upload with processing
  const handleUpload = async (files: File[], metadata: any) => {
    console.log('Demo: Uploading files with dual-save processing...', {
      fileCount: files.length,
      metadata
    })

    // Convert files to demo images
    const newImages: DemoImage[] = []
    
    for (const file of files) {
      const url = URL.createObjectURL(file)
      const demoImage: DemoImage = {
        id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url,
        annotations: [],
        metadata
      }
      newImages.push(demoImage)
    }

    setImages(prev => [...prev, ...newImages])
  }

  // Handle processing completion
  const handleProcessingComplete = async (results: ImageProcessingResult[]) => {
    console.log('Demo: Processing completed', results)
    setProcessingResults(results)
  }

  // Handle dual-save export from editor
  const handleDualSaveExport = async (
    originalBlob: Blob, 
    annotatedBlob: Blob, 
    annotations: Annotation[]
  ) => {
    if (!selectedImage) return

    console.log('Demo: Dual-save export triggered', {
      imageId: selectedImage.id,
      originalSize: originalBlob.size,
      annotatedSize: annotatedBlob.size,
      annotationCount: annotations.length
    })

    // Create download URLs
    const originalUrl = URL.createObjectURL(originalBlob)
    const annotatedUrl = URL.createObjectURL(annotatedBlob)

    // Update the demo image
    const updatedImages = images.map(img => 
      img.id === selectedImage.id 
        ? { 
            ...img, 
            originalBlob, 
            annotatedBlob, 
            annotations 
          }
        : img
    )
    setImages(updatedImages)

    // Auto-download both versions (demo purposes)
    const downloadOriginal = document.createElement('a')
    downloadOriginal.href = originalUrl
    downloadOriginal.download = `original_${selectedImage.name}`
    document.body.appendChild(downloadOriginal)
    downloadOriginal.click()
    document.body.removeChild(downloadOriginal)

    setTimeout(() => {
      const downloadAnnotated = document.createElement('a')
      downloadAnnotated.href = annotatedUrl
      downloadAnnotated.download = `annotated_${selectedImage.name}`
      document.body.appendChild(downloadAnnotated)
      downloadAnnotated.click()
      document.body.removeChild(downloadAnnotated)
    }, 500)

    // Cleanup URLs after download
    setTimeout(() => {
      URL.revokeObjectURL(originalUrl)
      URL.revokeObjectURL(annotatedUrl)
    }, 2000)
  }

  // Handle annotation changes
  const handleAnnotationsChange = (annotations: Annotation[]) => {
    if (!selectedImage) return

    const updatedImages = images.map(img => 
      img.id === selectedImage.id 
        ? { ...img, annotations }
        : img
    )
    setImages(updatedImages)
    setSelectedImage({ ...selectedImage, annotations })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dual-Save Image System Demo</h2>
          <p className="text-muted-foreground">
            Upload images and annotate them. Export both original and annotated versions.
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          Upload Images
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annotated Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(img => img.annotations.length > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.reduce((sum, img) => sum + img.annotations.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dual-Save Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(img => img.originalBlob && img.annotatedBlob).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>
              Select an image to edit and annotate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No images uploaded yet</p>
                <p className="text-sm">Upload some images to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map(image => (
                  <div
                    key={image.id}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-colors ${
                      selectedImage?.id === image.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-24 object-cover rounded"
                    />
                    <div className="mt-2">
                      <p className="text-xs font-medium truncate">{image.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {image.annotations.length} annotations
                        </Badge>
                        {image.originalBlob && image.annotatedBlob && (
                          <Badge variant="outline" className="text-xs">
                            Dual-save ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Image Editor</CardTitle>
            <CardDescription>
              Add annotations and export dual-save versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedImage ? (
              <ImageEditor
                imageUrl={selectedImage.url}
                annotations={selectedImage.annotations}
                onAnnotationsChange={handleAnnotationsChange}
                onExportDualSave={handleDualSaveExport}
                maxWidth={400}
                maxHeight={300}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                Select an image to start editing
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Results */}
      {processingResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              Latest batch processing results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processingResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {result.metadata.width}x{result.metadata.height} • {result.metadata.format}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(result.metadata.size / 1024)} KB • {result.annotations.length} annotations
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Processed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUpload}
        onProcessingComplete={handleProcessingComplete}
        maxFiles={10}
        maxSize={20}
      />
    </div>
  )
}