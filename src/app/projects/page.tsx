'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useProjects, useCreateProject, useDeleteProject } from '@/lib/hooks/useRoofs'
import type { Tables } from '@/lib/database.types'

type Project = Tables<'projects'>

function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createProject = useCreateProject()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('אנא הזן שם פרויקט')
      return
    }

    setIsCreating(true)

    try {
      await createProject.mutateAsync({ name: name.trim() })
      setName('')
      setOpen(false)
      alert('הפרויקט נוצר בהצלחה!')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('שגיאה ביצירת הפרויקט')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          פרויקט חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-white/20">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">יצירת פרויקט חדש</DialogTitle>
            <DialogDescription className="text-white/70">
              הזן את שם הפרויקט
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">שם הפרויקט *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: פרויקט ABC"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={isCreating}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={isCreating}
            >
              {isCreating ? 'שומר...' : 'צור פרויקט'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteProject = useDeleteProject()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteProject.mutateAsync(project.project_id)
      setOpen(false)
      alert('הפרויקט נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('שגיאה במחיקת הפרויקט')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30 hover:text-red-200"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          מחק
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-red-400">מחיקת פרויקט</DialogTitle>
          <DialogDescription className="text-white/70">
            האם אתה בטוח שברצונך למחוק את הפרויקט הזה?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-white font-semibold mb-2">{project.name}</p>
            <p className="text-white/70 text-sm">
              מחיקת הפרויקט תמחק גם את כל הגגות המשויכים אליו ואת כל הנתונים הקשורים.
              <br />
              <span className="text-red-400 font-semibold">פעולה זו בלתי הפיכה!</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            disabled={isDeleting}
          >
            ביטול
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? 'מוחק...' : 'מחק פרויקט'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="card-3d bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-white">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1 text-white/70">
              ID: {project.project_id}
            </CardDescription>
          </div>
          <DeleteProjectDialog project={project} />
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60 mt-2">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDistanceToNow(new Date(project.created_at ?? new Date()), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/60 text-xs mb-1">סטטוס</div>
            <div className="text-white font-semibold flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${project.status === 'Open' ? 'bg-green-400' : 'bg-gray-400'}`} />
              {project.status || 'Open'}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/60 text-xs mb-1">קבלן</div>
            <div className="text-white font-semibold">
              {project.contractor || 'לא הוקצה'}
            </div>
          </div>
        </div>

        <Link href={`/roofs?project=${project.project_id}`}>
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            צפה בגגות
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: projects = [], isLoading, error } = useProjects()

  const filteredProjects = projects.filter(project =>
    project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              טוען פרויקטים...
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
              <p>שגיאה בטעינת פרויקטים</p>
              <p className="text-sm mt-1 text-white/70">אנא רענן את הדף</p>
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
              <h1 className="text-3xl font-bold text-white">ניהול פרויקטים</h1>
              <p className="text-white/70 mt-1">
                צור ונהל את הפרויקטים שלך
              </p>
            </div>

            <div className="flex items-center gap-4">
              <CreateProjectDialog />
              <Link href="/roofs">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  לכל הגגות
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="חפש פרויקט לפי שם..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">סה״כ פרויקטים</p>
                  <p className="text-3xl font-bold text-white">{projects.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">פרויקטים פעילים</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {projects.filter(p => p.status === 'Open').length}
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
                  <p className="text-white/70 text-sm font-medium">נוצרו היום</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {projects.filter(p => {
                      const created = new Date(p.created_at ?? '')
                      const today = new Date()
                      return created.toDateString() === today.toDateString()
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.project_id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">לא נמצאו פרויקטים</h3>
            <p className="text-white/70 mb-4">
              {searchTerm ? 'נסה לשנות את מונחי החיפוש' : 'טרם נוצרו פרויקטים'}
            </p>
            {!searchTerm && <CreateProjectDialog />}
          </div>
        )}
      </div>
    </div>
  )
}
