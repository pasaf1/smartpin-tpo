'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Eye, Users, Plus, Camera, TrendingUp, AlertTriangle, CheckCircle, Clock, X, RefreshCw } from 'lucide-react'
import { MentionInput } from '@/components/ui/mention-input'
import { PageLayout } from '@/components/layout'
import { withAuth, useAuth } from '@/lib/hooks/useAuth'
import { useRealTimeProjectDashboard } from '@/lib/hooks/useRealTimeUpdates'
import { useProjects, useCreateProject, useDeleteProject } from '@/lib/hooks/useRoofs'
import { useRoofsByProject } from '@/lib/hooks/useRoofs'
import { useCreateRoof } from '@/lib/hooks/useRoofs'
import { supabase } from '@/lib/supabase'
import { uploadRoofPlanImage } from '@/lib/utils/roofPlanUpload'
// Enhanced UI Components
import { LoadingPage, LoadingError } from '@/components/ui/loading-states'
import { SmartCard, KPICard, ResponsiveGrid, SmartContainer } from '@/components/ui/design-system'
import { AccessibleModal, SkipLink, AccessibleField, AccessibleTable } from '@/components/ui/accessibility'
import { ResponsiveContainer, useBreakpoint, ResponsiveModal, TouchButton } from '@/components/ui/responsive'

function HomePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  
  // Allow all authenticated users to create projects (temporary fix)
  // Proper role-based access control should be implemented at the database level
  const canCreateProject = !!profile // Any authenticated user can create projects
  const isHighPrivilegeUser = profile?.role === 'Admin' || profile?.role === 'QA_Manager' || profile?.role === 'Supervisor'
  // Temporarily disable real-time updates to fix page loading
  // const { } = useRealTimeProjectDashboard() // connectionStatus not used
  
  // Real projects from Supabase
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    error: projectsError, 
    refetch: refetchProjects 
  } = useProjects()
  const createProject = useCreateProject()
  const createRoof = useCreateRoof()
  const deleteProject = useDeleteProject()

  // Issue statistics state
  const [issueStats, setIssueStats] = useState({
    totalProjects: 0,
    openIssues: 0,
    readyForInspection: 0,
    closedIssues: 0
  })

  // Modal state for KPI details
  const [showKpiModal, setShowKpiModal] = useState<null | string>(null)

  // Fetch issue statistics
  const fetchIssueStats = useCallback(async () => {
    try {
      // Get all pins (parent issues) across all projects
      const { data: pins, error: pinsError } = await supabase
        .from('pins')
        .select('status, id')

      if (pinsError) throw pinsError

      // Get all pin children (child issues) across all projects
      const { data: pinChildren, error: childrenError } = await supabase
        .from('pin_children')
        .select('status_child')

      if (childrenError) throw childrenError

      // Calculate statistics
      const openIssues = (pins?.filter(p => p.status === 'Open').length || 0) + 
                        (pinChildren?.filter(c => c.status_child === 'Open').length || 0)
      
      const readyForInspection = (pins?.filter(p => p.status === 'ReadyForInspection').length || 0) + 
                                (pinChildren?.filter(c => c.status_child === 'ReadyForInspection').length || 0)
      
      const closedIssues = (pins?.filter(p => p.status === 'Closed').length || 0) + 
                          (pinChildren?.filter(c => c.status_child === 'Closed').length || 0)

      setIssueStats({
        totalProjects: projects.length,
        openIssues,
        readyForInspection,
        closedIssues
      })
    } catch (error) {
      console.error('Failed to fetch issue statistics:', error)
      // Set to 0 on error
      setIssueStats({
        totalProjects: projects.length,
        openIssues: 0,
        readyForInspection: 0,
        closedIssues: 0
      })
    }
  }, [projects.length])
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    completion: 'all',
    sort: 'name'
  })

  // New Project Modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    location: '',
    priority: 'normal',
    roofPlanFile: null as File | null,
    roofPlanPreview: ''
  })

  // Global Chat state
  const [globalChatMessage, setGlobalChatMessage] = useState('')

  // Demo users for mentions
  const demoUsers = [
    { id: '1', name: 'Asaf Peer', email: 'asaf6peer@gmail.com', role: 'Inspector', status: 'active' as const },
    { id: '2', name: 'John Doe', email: 'john@contractor.com', role: 'Foreman', status: 'active' as const },
    { id: '3', name: 'Sarah Miller', email: 'sarah@qa.com', role: 'Supervisor', status: 'active' as const },
    { id: '4', name: 'Mike Smith', email: 'mike@contractor.com', role: 'Contractor', status: 'active' as const }
  ]

  // Project Link Component - gets first roof for project
  const ProjectOpenButton = ({ project }: { project: any }) => {
    const { data: roofs = [] } = useRoofsByProject(project.project_id)
    const firstRoof = roofs[0]
    
    if (!firstRoof) {
      return (
        <button 
          disabled 
          className="px-3 py-2 bg-gray-300 text-gray-500 text-xs font-semibold rounded-lg cursor-not-allowed"
        >
          No Roof
        </button>
      )
    }
    
    return (
      <Link href={`/roofs/${firstRoof.id}`}>
        <button className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300">
          Open
        </button>
      </Link>
    )
  }

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    const filtered = [...projects]
    // basic sort
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    return filtered
  }, [projects])
  
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleNewProjectFormChange = (field: string, value: string | File) => {
    setNewProjectForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    
    setNewProjectForm(prev => ({
      ...prev,
      roofPlanFile: file,
      roofPlanPreview: previewUrl
    }))
  }

  const resetNewProjectForm = () => {
    // Clean up preview URL
    if (newProjectForm.roofPlanPreview) {
      URL.revokeObjectURL(newProjectForm.roofPlanPreview)
    }
    
    setNewProjectForm({
      name: '',
      description: '',
      location: '',
      priority: 'normal',
      roofPlanFile: null,
      roofPlanPreview: ''
    })
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canCreateProject) {
      alert('Please log in to create a project.')
      return
    }

    // Validate required fields
    if (!newProjectForm.name.trim()) {
      alert('Project name is required')
      return
    }

    if (!newProjectForm.location.trim()) {
      alert('Site location is required')
      return
    }

    setIsCreatingProject(true)

    try {
      // Map priority to status
      const status = 'Open' as const
      
      // Upload roof plan image if provided
      let roofPlanImageUrl: string | null = null
      if (newProjectForm.roofPlanFile) {
        const uploadResult = await uploadRoofPlanImage(newProjectForm.roofPlanFile)
        if (uploadResult.success && uploadResult.url) {
          roofPlanImageUrl = uploadResult.url
        } else {
          console.error('Failed to upload roof plan image:', uploadResult.error)
          alert(`Failed to upload roof plan image: ${uploadResult.error || 'Unknown error'}`)
          return
        }
      }

      // Create project in Supabase
      const newProject = await createProject.mutateAsync({
        name: newProjectForm.name.trim(),
        description: newProjectForm.description
      })

      console.log('Project created:', newProject)

      // Create a default roof for the project
      const roofCode = newProjectForm.name.trim()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 5) // Max 5 characters
        
      const newRoof = await createRoof.mutateAsync({
        project_id: newProject.project_id,
        code: roofCode,
        name: `${newProjectForm.name} - Main Roof`,
        building: newProjectForm.location.trim(),
        plan_image_url: roofPlanImageUrl,
        roof_plan_url: null,
        zones: {},
        stakeholders: {},
        origin_lat: null,
        origin_lng: null,
        is_active: true,
      })

      console.log('Roof created:', newRoof)

      // Close modal and reset form
      setShowNewProjectModal(false)
      resetNewProjectForm()

      // Show success message with navigation info
      const confirmed = confirm(
        `Project "${newProjectForm.name}" created successfully!\n\n` +
        `A roof plan has been created and you'll be redirected to the roof dashboard where you can:\n` +
        `• Add pins to mark issues\n` +
        `• Upload photos\n` +
        `• Track progress\n\n` +
        `Click OK to continue to the roof dashboard.`
      )
      
      if (confirmed) {
        // Navigate to the roof dashboard
        router.push(`/roofs/${newRoof.id}`)
      }
      
    } catch (error: any) {
      console.error('Failed to create project:', error)
      const code = error?.code || 'UNKNOWN'
      const msg = error?.message || 'Unknown error'
      if (code === '42501' || /insufficient privileges|RLS|policy/i.test(msg)) {
        alert('Permission denied by database. Please contact your administrator to enable project creation for your role.')
      } else {
        alert(`Failed to create project. ${msg} (code: ${code})`)
      }
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleSendGlobalMessage = (message: string) => {
    console.log('Sending global message:', message)
    // In a real implementation, this would send the message to your chat system
    // with the mentioned users extracted for notifications
  }

  const handleDeleteProject = async (project: any) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${project.name}"?\n\n` +
      `This will permanently delete:\n` +
      `• The project and all its data\n` +
      `• All associated roofs and issues\n` +
      `• All photos and documentation\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      console.log('🗑️ Starting project deletion:', project.project_id)
      
      await deleteProject.mutateAsync(project.project_id)
      
      console.log('✅ Project deletion completed successfully')
      
      // Wait a bit longer for React Query cache invalidation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Manually trigger a refetch of projects to ensure UI updates
      await refetchProjects()
      console.log('🔄 Projects manually refetched')
      
      // Refresh issue statistics after successful deletion
      await fetchIssueStats()
      
      console.log('📊 Issue statistics refreshed')
      
      alert(`Project "${project.name}" has been successfully deleted.`)
    } catch (error: any) {
      console.error('❌ Failed to delete project:', error)
      const code = error?.code || 'UNKNOWN'
      const msg = error?.message || 'Unknown error'
      
      if (code === '42501' || /insufficient privileges|RLS|policy/i.test(msg)) {
        alert('Permission denied. You do not have permission to delete this project.')
      } else {
        alert(`Failed to delete project. ${msg} (code: ${code})`)
      }
    }
  }

  const handleProjectRowClick = async (project: any) => {
    try {
      // Get the first roof for this project to navigate to
      const { data: roofs } = await supabase
        .from('roofs')
        .select('*')
        .eq('project_id', project.project_id)
        .limit(1)

      if (roofs && roofs.length > 0) {
        // Navigate to the roof dashboard
        router.push(`/roofs/${roofs[0].id}`)
      } else {
        // No roofs found, show message
        alert(`No roofs found for project "${project.name}". Please create a roof first.`)
      }
    } catch (error) {
      console.error('Failed to navigate to project:', error)
      alert('Failed to open project. Please try again.')
    }
  }

  // KPI click handlers
  const handleKpiClick = (kpiType: string) => {
    setShowKpiModal(kpiType)
  }

  // Fetch stats when projects change
  useEffect(() => {
    if (!projectsLoading) {
      fetchIssueStats()
    }
  }, [fetchIssueStats, projectsLoading])

  // Show enhanced loading state with timeout protection
  if (projectsLoading) {
    return (
      <LoadingPage 
        title="Loading Dashboard" 
        message="Fetching your projects and data..."
        showLogo={true}
        variant="fullscreen"
      />
    )
  }

  // Show error state if projects failed to load
  if (projectsError) {
    return (
      <LoadingError
        title="Failed to Load Projects"
        message="We couldn't load your projects. This might be a temporary connection issue."
        error={projectsError}
        onRetry={() => refetchProjects()}
        onReload={() => window.location.reload()}
      />
    )
  }

  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      
      <PageLayout
        title="Dashboard"
        subtitle="Quality Management Overview"
        showSearch={true}
        searchPlaceholder="Search projects..."
      >
        <SmartContainer size="xl" padding="lg">
          <main id="main-content" className="space-y-8">
            
            {/* Project Overview Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Project Dashboard</h2>
              </div>
            </div>

            {/* Enhanced KPI Cards with Responsive Grid */}
            <ResponsiveGrid
              columns={{ 
                xs: 1, 
                md: 2, 
                lg: 4 
              }}
              gap="lg"
            >
              <KPICard
                title="Total Projects"
                value={projects.length}
                subtitle="Active projects"
                icon={TrendingUp}
                color="primary"
                onClick={() => handleKpiClick('projects')}
              />
              
              <KPICard
                title="Open Issues"
                value={issueStats.openIssues}
                subtitle="Need attention"
                icon={AlertTriangle}
                color="error"
                onClick={() => handleKpiClick('open')}
              />
              
              <KPICard
                title="Ready for Inspection"
                value={issueStats.readyForInspection}
                subtitle="Pending review"
                icon={Eye}
                color="warning"
                onClick={() => handleKpiClick('ready')}
              />
              
              <KPICard
                title="Closed Issues"
                value={issueStats.closedIssues}
                subtitle="Completed items"
                icon={CheckCircle}
                color="success"
                onClick={() => handleKpiClick('closed')}
              />
            </ResponsiveGrid>

            {/* Enhanced New Project Button */}
            <div className="flex justify-center py-8">
              <TouchButton
                size={isMobile ? "lg" : "lg"}
                variant="primary"
                onClick={() => {
                  if (!canCreateProject) {
                    alert('Please log in to create projects.')
                    return
                  }
                  if (!isHighPrivilegeUser) {
                    const confirmed = confirm(
                      `You are logged in as a ${profile?.role || 'user'}. ` +
                      'Typically only Admin, QA_Manager, or Supervisor roles create projects. ' +
                      'Do you want to continue?'
                    )
                    if (!confirmed) return
                  }
                  setShowNewProjectModal(true)
                }}
                disabled={!canCreateProject}
                className={`group relative shadow-2xl transition-all duration-500 ${
                  canCreateProject 
                    ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 shadow-emerald-500/50 hover:shadow-emerald-500/60' 
                    : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 shadow-gray-500/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Plus className="w-6 h-6" />
                  <span className="font-bold text-lg">
                    {canCreateProject ? 'New Project' : 'Login Required'}
                  </span>
                  {!isHighPrivilegeUser && canCreateProject && (
                    <span className="text-xs bg-orange-500 px-2 py-1 rounded-full">
                      {profile?.role || 'Limited'}
                    </span>
                  )}
                </div>
              </TouchButton>
            </div>

            {/* Enhanced Projects Management Section */}
            <SmartCard variant="glass" size="lg" className="w-full">
              <div className="border-b border-white/30 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Projects Table</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Manage and monitor all your roof projects
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Quick filter/search above the table */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        className="pl-10 pr-4 py-2 w-full sm:w-72 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                        aria-label="Search projects"
                      />
                    </div>
                  </div>
                </div>
              </div>

          {/* Project Filters */}
          <div className="p-6 border-b border-white/30">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="review">Review</option>
                  <option value="critical">Critical</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Completion:</label>
                <select 
                  value={filters.completion}
                  onChange={(e) => handleFilterChange('completion', e.target.value)}
                  className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Projects</option>
                  <option value="0-25">0-25%</option>
                  <option value="26-50">26-50%</option>
                  <option value="51-75">51-75%</option>
                  <option value="76-100">76-100%</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Sort:</label>
                <select 
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="name">Name</option>
                  <option value="completion">Completion</option>
                  <option value="status">Status</option>
                  <option value="updated">Last Updated</option>
                </select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-slate-500 font-medium">{filteredProjects.length} of {projects.length} projects</span>
              </div>
            </div>
          </div>
          
              {/* Enhanced Accessible Projects Table */}
              <AccessibleTable
                caption="Project Management Dashboard - All active roof projects"
                headers={[
                  { key: 'project', label: 'Project', scope: 'col' },
                  { key: 'status', label: 'Status', scope: 'col' },
                  { key: 'contractor', label: 'Contractor', scope: 'col' },
                  { key: 'created', label: 'Created', scope: 'col' },
                  { key: 'actions', label: 'Actions', scope: 'col' }
                ]}
                rows={filteredProjects.map((p) => ({
                  project: (
                    <div className="cursor-pointer" onClick={() => handleProjectRowClick(p)}>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-700 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{p.project_id}</p>
                    </div>
                  ),
                  status: (
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-lg ${
                      p.status === 'Open' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                      p.status === 'InProgress' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' :
                      p.status === 'Completed' ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white' :
                      'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
                    }`}>
                      {p.status || 'Open'}
                    </span>
                  ),
                  contractor: (
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {p.contractor || '—'}
                    </div>
                  ),
                  created: (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                    </div>
                  ),
                  actions: (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <TouchButton 
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          handleProjectRowClick(p)
                        }}
                        className="text-xs"
                      >
                        Open
                      </TouchButton>
                      {isHighPrivilegeUser && (
                        <TouchButton 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleDeleteProject(p)
                          }}
                          className="text-xs text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          Delete
                        </TouchButton>
                      )}
                    </div>
                  )
                }))}
                className="w-full"
                rowClassName={(row, index) => `hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/10 dark:bg-slate-800/10' : ''}`}
              />
            </SmartCard>

            {/* Enhanced Global Chat Section */}
            <SmartCard variant="glass" size="lg" className="w-full">
              <div className="border-b border-white/30 pb-6 mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Project Communications
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Global chat for all projects - stay connected with your team
                </p>
              </div>
          <div className="p-6">
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {/* Sample messages - in real implementation this would be from your chat system */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
                <div className="flex-1">
                  <div className="bg-white/80 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">John Doe</span>
                      <span className="text-xs text-slate-500">2 minutes ago</span>
                    </div>
                    <p className="text-slate-700 text-sm">New defects found in Building A roof section. Please review when possible.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  SM
                </div>
                <div className="flex-1">
                  <div className="bg-white/80 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">Sarah Miller</span>
                      <span className="text-xs text-slate-500">15 minutes ago</span>
                    </div>
                    <p className="text-slate-700 text-sm">@JohnDoe Residential Block B inspection completed. All items closed.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <MentionInput
                value={globalChatMessage}
                onChange={setGlobalChatMessage}
                onSubmit={handleSendGlobalMessage}
                placeholder="Type a message... use @username to mention team members"
                users={demoUsers}
                className="bg-white/60 backdrop-blur-sm border-white/40 focus:ring-indigo-500"
              />
            </div>
          </div>
        </SmartCard>

          </main>
        </SmartContainer>
      </PageLayout>

      {/* Enhanced New Project Modal with Accessibility */}
      {showNewProjectModal && (
        <ResponsiveModal
          isOpen={showNewProjectModal}
          onClose={() => {
            setShowNewProjectModal(false)
            resetNewProjectForm()
          }}
          title="Create New Project"
        >
          <div className="space-y-6">
            {/* User Info and Warning */}
            <div className="space-y-4">
              {profile && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Logged in as: <strong className="text-slate-900 dark:text-slate-100">{profile.full_name}</strong> ({profile.role || 'Unknown role'})
                  </p>
                </div>
              )}
              
              {!isHighPrivilegeUser && canCreateProject && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> You are logged in as a {profile?.role || 'user'}. Typically only Admin, QA Manager, or Supervisor roles create projects. If you encounter database permission errors, please contact your administrator.
                </div>
              )}
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              <AccessibleField
                label="Project Name"
                required={true}
                hint="Enter a descriptive name for your roofing project"
              >
                <input 
                  type="text" 
                  placeholder="Enter project name..."
                  value={newProjectForm.name}
                  onChange={(e) => handleNewProjectFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100"
                  required
                />
              </AccessibleField>
              
              <AccessibleField
                label="Description"
                hint="A roof plan will be automatically created for this project"
              >
                <textarea 
                  placeholder="Brief description of the project..."
                  rows={3}
                  value={newProjectForm.description}
                  onChange={(e) => handleNewProjectFormChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-slate-900 dark:text-slate-100"
                />
              </AccessibleField>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccessibleField
                  label="Site Location"
                  required={true}
                  hint="Enter the physical address or location of the roofing project"
                >
                  <input 
                    type="text" 
                    placeholder="Site address..."
                    value={newProjectForm.location}
                    onChange={(e) => handleNewProjectFormChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100"
                    required
                  />
                </AccessibleField>
                
                <AccessibleField
                  label="Priority"
                  hint="Set the project priority level for resource allocation"
                >
                  <select 
                    value={newProjectForm.priority}
                    onChange={(e) => handleNewProjectFormChange('priority', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </AccessibleField>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Roof Plan Image</label>
                <div className="border-2 border-dashed border-white/30 rounded-lg hover:border-indigo-400 transition-colors">
                  {newProjectForm.roofPlanPreview ? (
                    <div className="relative">
                      <Image 
                        src={newProjectForm.roofPlanPreview} 
                        alt="Roof plan preview" 
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (newProjectForm.roofPlanPreview) {
                              URL.revokeObjectURL(newProjectForm.roofPlanPreview)
                            }
                            setNewProjectForm(prev => ({ ...prev, roofPlanFile: null, roofPlanPreview: '' }))
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold mr-2"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('roof-image')?.click()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="roof-image"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="roof-image" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Camera className="w-12 h-12 text-slate-400 mb-4" />
                          <p className="text-slate-600 font-medium">Click to upload roof plan image</p>
                          <p className="text-sm text-slate-500 mt-2">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This image will be used as the background for the interactive roof plan where you can add pins to mark issues.
                </p>
                {newProjectForm.roofPlanFile && (
                  <div className="mt-2 text-sm text-slate-600">
                    File: {newProjectForm.roofPlanFile.name} ({(newProjectForm.roofPlanFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
              
              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 pt-6">
                <TouchButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowNewProjectModal(false)
                    resetNewProjectForm()
                  }}
                  disabled={isCreatingProject}
                  className="order-2 sm:order-1"
                >
                  Cancel
                </TouchButton>
                
                <TouchButton
                  type="submit"
                  variant="primary"
                  disabled={isCreatingProject || !canCreateProject}
                  className="order-1 sm:order-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProject ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{newProjectForm.roofPlanFile ? 'Uploading & Creating...' : 'Creating Project...'}</span>
                    </div>
                  ) : (
                    'Create Project'
                  )}
                </TouchButton>
              </div>
            </form>
          </div>
        </ResponsiveModal>
      )}

      {/* KPI Detail Modals */}
      {showKpiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {showKpiModal === 'projects' && `Projects Details (${issueStats.totalProjects})`}
                  {showKpiModal === 'open' && `Open Issues Details (${issueStats.openIssues})`}
                  {showKpiModal === 'ready' && `Ready for Inspection Details (${issueStats.readyForInspection})`}
                  {showKpiModal === 'closed' && `Closed Issues Details (${issueStats.closedIssues})`}
                </h2>
                <button
                  onClick={() => setShowKpiModal(null)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {showKpiModal === 'projects' && (
                <div>
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <div className="text-4xl mb-3">📋</div>
                      <p>No projects found</p>
                      <p className="text-sm mt-1">Create your first project to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left p-3 font-semibold">Project Name</th>
                            <th className="text-left p-3 font-semibold">Status</th>
                            <th className="text-left p-3 font-semibold">Created</th>
                            <th className="text-left p-3 font-semibold">Contractor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map(project => (
                            <tr key={project.project_id} className="border-b hover:bg-slate-50">
                              <td className="p-3">
                                <div>
                                  <div className="font-semibold">{project.name}</div>
                                  <div className="text-sm text-slate-500">{project.project_id}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  project.status === 'Open' ? 'bg-green-100 text-green-800' :
                                  project.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-slate-600">
                                {new Date(project.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-sm text-slate-600">
                                {project.contractor || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {(showKpiModal === 'open' || showKpiModal === 'ready' || showKpiModal === 'closed') && (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">
                    {showKpiModal === 'open' && '🚨'}
                    {showKpiModal === 'ready' && '👁️'}
                    {showKpiModal === 'closed' && '✅'}
                  </div>
                  <p>No {showKpiModal} issues found</p>
                  <p className="text-sm mt-1">
                    {showKpiModal === 'open' && 'All issues are resolved or in progress'}
                    {showKpiModal === 'ready' && 'No issues are ready for inspection'}
                    {showKpiModal === 'closed' && 'No issues have been completed yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Protect the homepage - require authentication
export default withAuth(HomePage)