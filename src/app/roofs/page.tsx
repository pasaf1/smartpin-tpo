'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoofs, useCreateRoof, useProjects } from '@/lib/hooks/useRoofs'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

function CreateRoofDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [projectId, setProjectId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const createRoof = useCreateRoof()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code || !projectId) {
      alert('אנא מלא את כל השדות הנדרשים')
      return
    }

    setIsUploading(true)

    try {
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${code}-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('roof-plans')
          .upload(fileName, imageFile)

        if (error) {
          console.error('Image upload error:', error)
          alert('שגיאה בהעלאת התמונה')
          setIsUploading(false)
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('roof-plans')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Create roof
      await createRoof.mutateAsync({
        name,
        code,
        project_id: projectId,
        plan_image_url: imageUrl,
        is_active: true,
      })

      // Reset form and close dialog
      setName('')
      setCode('')
      setProjectId('')
      setImageFile(null)
      setImagePreview(null)
      setOpen(false)
      alert('הגג נוצר בהצלחה!')
    } catch (error) {
      console.error('Error creating roof:', error)
      alert('שגיאה ביצירת הגג')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          גג חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-white/20">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">יצירת גג חדש</DialogTitle>
            <DialogDescription className="text-white/70">
              הזן את פרטי הגג והעלה תמונת תוכנית
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Project Selection */}
            <div className="grid gap-2">
              <Label htmlFor="project" className="text-white">פרויקט *</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={projectsLoading}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20">
                  {projects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id}
                      className="text-white hover:bg-white/10"
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Roof Name */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">שם הגג *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: גג בניין A"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            {/* Roof Code */}
            <div className="grid gap-2">
              <Label htmlFor="code" className="text-white">קוד הגג *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="לדוגמה: ROOF-001"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-2">
              <Label htmlFor="image" className="text-white">תמונת תוכנית הגג</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
              {imagePreview && (
                <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-white/5">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isUploading}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isUploading}
            >
              {isUploading ? 'שומר...' : 'צור גג'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RoofCard({ roof }: { roof: Tables<'roofs'> }) {
  const hasPlanImage = roof.plan_image_url && roof.plan_image_url.length > 0

  return (
    <Link href={`/roofs/${roof.id}`}>
      <Card className="cursor-pointer card-3d bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-white hover:text-blue-300 transition-colors">
                {roof.name}
              </CardTitle>
              <CardDescription className="mt-1 text-white/70">
                Code: {roof.code}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60 mt-2">
            <span>{roof.code}</span>
            {roof.building && (
              <>
                <span>•</span>
                <span>{roof.building}</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plan image preview */}
          <div className="relative">
            {hasPlanImage ? (
              <div className="aspect-[3/2] rounded-lg overflow-hidden bg-muted relative">
                <Image
                  src={roof.plan_image_url || ''}
                  alt={`${roof.name} plan image`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30">
                    Plan Image
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/2] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                <div className="text-center text-white/50">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No plan image uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className="text-center">
            <div className="text-lg font-bold text-blue-300">
              {roof.is_active ? 'Active' : 'Inactive'}
            </div>
            <div className="text-xs text-white/60">Status</div>
          </div>

          {/* Project info */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                Project ID: {roof.project_id}
              </div>
              <div className="text-white/60">
                {formatDistanceToNow(new Date(roof.created_at ?? new Date()), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function RoofsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: roofs = [], isLoading, error } = useRoofs()

  const filteredRoofs = roofs.filter(roof =>
    roof?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roof?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roof?.building && roof.building.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading roofs...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-white">
              <p>Error loading roofs</p>
              <p className="text-sm mt-1 text-white/70">Please try refreshing the page</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Roofs Overview</h1>
              <p className="text-white/70 mt-1">
                Manage and monitor all roof projects
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <CreateRoofDialog />
              <Link href="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search roofs by name, code, or building..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Total Roofs</p>
                  <p className="text-3xl font-bold text-white">{roofs.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Active Roofs</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {roofs.filter(roof => roof.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">With Plan Images</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {roofs.filter(roof => roof.plan_image_url).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roofs grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoofs.map((roof) => (
            <RoofCard key={roof.id} roof={roof} />
          ))}
        </div>

        {filteredRoofs.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No roofs found</h3>
            <p className="text-white/70">
              {searchTerm ? 'Try adjusting your search terms' : 'No roofs have been created yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
