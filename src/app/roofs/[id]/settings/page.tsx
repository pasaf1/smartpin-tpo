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
  
  const handleFiles = (files: FileList) => {
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP)')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    // Create preview URL and get image dimensions
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // For demo purposes, use the file URL directly
        // In production, this would upload to Supabase Storage
        const imageUrl = e.target?.result as string
        onImageUpdate(imageUrl, img.width, img.height)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
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
              <Button variant="secondary" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
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
  const updateRoofMutation = useUpdateRoof()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_name: '',
    project_number: '',
    location: '',
    base_map_url: '',
    base_map_width: 0,
    base_map_height: 0
  })
  
  // Update form data when roof loads
  useEffect(() => {
    if (roof) {
      setFormData({
        name: roof.name || '',
        description: roof.description || '',
        project_name: roof.project_name || '',
        project_number: roof.project_number || '',
        location: roof.location || '',
        base_map_url: roof.base_map_url || '',
        base_map_width: roof.base_map_width || 0,
        base_map_height: roof.base_map_height || 0
      })
    }
  }, [roof])
  
  const handleSave = async () => {
    try {
      await updateRoofMutation.mutateAsync({
        id: roofId,
        updates: {
          name: formData.name,
          description: formData.description,
          project_name: formData.project_name,
          project_number: formData.project_number,
          location: formData.location,
          base_map_url: formData.base_map_url,
          base_map_width: formData.base_map_width,
          base_map_height: formData.base_map_height,
        }
      })
      router.push(`/roofs/${roofId}`)
    } catch (error) {
      console.error('Failed to update roof:', error)
    }
  }
  
  const handleBaseMapUpdate = (url: string, width: number, height: number) => {
    setFormData(prev => ({
      ...prev,
      base_map_url: url,
      base_map_width: width,
      base_map_height: height
    }))
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
                <h1 className="text-2xl font-bold text-foreground">Roof Settings</h1>
                <p className="text-muted-foreground">
                  {roof.name} • {roof.project_number}
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the basic details for this roof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Roof Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Building A - North Wing"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Downtown Campus"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this roof..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>
                  Project-related details and identifiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_name">Project Name</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                      placeholder="e.g., Metro Office Complex"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="project_number">Project Number</Label>
                    <Input
                      id="project_number"
                      value={formData.project_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
                      placeholder="e.g., MOC-2024-102"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Base Map Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Base Map Image</CardTitle>
                <CardDescription>
                  Upload a high-resolution image of the roof plan to use as the background for pin placement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaseMapUpload
                  currentImageUrl={formData.base_map_url}
                  onImageUpdate={handleBaseMapUpdate}
                  isUploading={updateRoofMutation.isPending}
                />
                
                {formData.base_map_url && formData.base_map_width > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Image Details</div>
                    <div className="text-sm text-muted-foreground">
                      Dimensions: {formData.base_map_width} × {formData.base_map_height} pixels
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
                <CardTitle>Current Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Pins</span>
                  <span className="text-sm font-medium">{roof.total_pins || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Open Defects</span>
                  <span className="text-sm font-medium text-red-600">{roof.open_defects || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-sm font-medium">{roof.completion_percentage || 0}%</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(roof.created_at).toLocaleDateString()}</span>
                  </div>
                  {roof.updated_at && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{new Date(roof.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={updateRoofMutation.isPending}
                className="w-full"
              >
                {updateRoofMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Link href={`/roofs/${roofId}`}>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}