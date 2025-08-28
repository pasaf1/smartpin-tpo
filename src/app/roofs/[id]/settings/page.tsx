'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useRoof, useUpdateRoof } from '@/lib/hooks/useRoofs'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface BaseMapUploadProps {
  currentImageUrl?: string
  onImageUpdate: (url: string, width: number, height: number) => void
  isUploading: boolean
}

function BaseMapUpload({ currentImageUrl, onImageUpdate, isUploading }: BaseMapUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }
  
  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP)')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    try {
      // Upload to Supabase Storage
      const fileName = `roof-${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('roof-plans')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Fallback to base64 for development
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const imageUrl = e.target?.result as string
            onImageUpdate(imageUrl, img.width, img.height)
          }
          img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
        return
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('roof-plans')
        .getPublicUrl(fileName)
      
      if (urlData?.publicUrl) {
        // Get image dimensions
        const img = new Image()
        img.onload = () => {
          onImageUpdate(urlData.publicUrl, img.width, img.height)
        }
        img.src = urlData.publicUrl
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
    }
  }
  
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isUploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Base map preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">Upload Base Map</p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your roof plan image here, or click to browse
            </p>
            <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
              Choose File
            </Button>
          </div>
        )}
      </div>
      
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={isUploading}
      />
      
      <div className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, WebP • Maximum size: 10MB
        <br />
        For best results, use high-resolution images (1200px+ width)
      </div>
    </div>
  )
}

export default function RoofSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const roofId = params.id as string
  
  const { data: roof, isLoading: roofLoading, error: roofError } = useRoof(roofId)
  const updateRoof = useUpdateRoof()
  
  // Editing disabled - project details can only be set during creation
  const handleRedirectToProjects = () => {
    router.push('/')
  }
  
  if (roofLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading roof settings...
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (roofError || !roof) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <p>Roof not found</p>
              <p className="text-sm mt-1">Please check the URL and try again</p>
              <Link href="/roofs">
                <Button className="mt-4" variant="outline">
                  ← Back to Roofs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/roofs/${roofId}`}>
                <Button variant="ghost" size="sm">
                  ← Back to Roof
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Project Information</h1>
                <p className="text-muted-foreground">
                  {roof.name} • {roof.code} • Read-only view
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Settings</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Project details (established during project creation)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Roof Name</Label>
                    <div className="text-sm font-medium p-2 bg-muted/30 rounded border">
                      {roof?.name || 'Not set'}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Roof Code</Label>
                    <div className="text-sm font-medium p-2 bg-muted/30 rounded border">
                      {roof?.code || 'Not set'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Building</Label>
                  <div className="text-sm font-medium p-2 bg-muted/30 rounded border min-h-[80px]">
                    {roof?.building || 'No building information provided'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Information - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>
                  Project-related details and identifiers (linked to project)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Project ID</Label>
                  <div className="text-sm font-medium p-2 bg-muted/30 rounded border">
                    {roof?.project_id || 'Not set'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Base Map - Editable */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Image</CardTitle>
                <CardDescription>
                  Upload or update the roof plan image for better pin placement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaseMapUpload
                  currentImageUrl={roof?.plan_image_url || undefined}
                  onImageUpdate={(url, width, height) => {
                    // Update the roof with new image URL
                    updateRoof.mutate({
                      id: roofId,
                      updates: { plan_image_url: url }
                    }, {
                      onSuccess: () => {
                        alert('Image updated successfully! The new image will appear in the dashboard.')
                      },
                      onError: (error) => {
                        console.error('Failed to update image:', error)
                        alert('Failed to update image. Please try again.')
                      }
                    })
                  }}
                  isUploading={updateRoof.isPending}
                />
                
                {roof?.plan_image_url && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Current Image</div>
                    <div className="text-sm text-muted-foreground">
                      Image successfully configured and visible in dashboard
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Roof Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Roof ID</span>
                  <span className="text-sm font-medium">{roof.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Status</span>
                  <span className="text-sm font-medium">{roof.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(roof.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm font-medium text-amber-800 mb-1">
                  Editing Disabled
                </div>
                <div className="text-xs text-amber-700">
                  Project details can only be set during project creation for data integrity.
                </div>
              </div>
              
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800">
                  ← Back to Projects Dashboard
                </Button>
              </Link>
              
              <Link href={`/roofs/${roofId}`}>
                <Button variant="outline" className="w-full">
                  View Project Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}