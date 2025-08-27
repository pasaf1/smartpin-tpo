'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Eye, Users, Plus, Camera, TrendingUp, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'
import { MentionInput } from '@/components/ui/mention-input'
import { PageLayout } from '@/components/layout'
import { withAuth, useAuth } from '@/lib/hooks/useAuth'
import { useRealTimeProjectDashboard } from '@/lib/hooks/useRealTimeUpdates'
import { useProjects, useCreateProject } from '@/lib/hooks/useSupabaseQueries'

function HomePage() {
  const { profile } = useAuth()
  const canCreateProject = profile?.role === 'Admin' || profile?.role === 'QA_Manager'
  const { } = useRealTimeProjectDashboard() // connectionStatus not used
  
  // Real projects from Supabase
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const createProject = useCreateProject()
  
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
      alert('You do not have permission to create a project. Only Admin or QA_Manager can create projects.')
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
      // Create project in Supabase
      await createProject.mutateAsync({
        name: newProjectForm.name.trim(),
        status,
        contractor: null,
        created_by: profile?.id || null,
      })

      // Close modal and reset form
      setShowNewProjectModal(false)
      resetNewProjectForm()

      // Show success message
      alert(`Project "${newProjectForm.name}" created successfully!`)
      
    } catch (error: any) {
      console.error('Failed to create project:', error)
      const code = error?.code || 'UNKNOWN'
      const msg = error?.message || 'Unknown error'
      if (code === '42501' || /insufficient privileges|RLS|policy/i.test(msg)) {
        alert('Permission denied. Only Admin or QA_Manager can create projects.')
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

  // הצג טעינה אם הדאטה עדיין נטענת
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Quality Management Overview"
      showSearch={true}
      searchPlaceholder="Search projects..."
    >
      <div className="space-y-8">
        
        {/* Project Overview Filters - Now positioned above KPI cards */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Project Dashboard</h2>
          </div>
          
          {/* Project Status Filters */}
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-filter inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200 text-sm rounded-lg">
                Open
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">2</span>
              </button>
              <button className="btn-filter inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200 text-sm rounded-lg">
                In Progress
                <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">1</span>
              </button>
              <button className="btn-filter inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200 text-sm rounded-lg">
                Completed
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">0</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Projects */}
          <div 
            className="relative overflow-hidden rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #4338ca 100%)',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.4)'
            }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium text-white opacity-90 mb-2">Total Projects</span>
              <div className="text-4xl font-bold text-white mb-2">3</div>
              <p className="text-sm text-white opacity-80 font-medium">Active roofs</p>
            </div>
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)'
              }}
            />
          </div>

          {/* Open INCRs */}
          <div 
            className="relative overflow-hidden rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #fb923c 0%, #ef4444 50%, #dc2626 100%)',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4)'
            }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium text-white opacity-90 mb-2">Open INCRs</span>
              <div className="text-4xl font-bold text-white mb-2">12</div>
              <p className="text-sm text-white opacity-80 font-medium">Need attention</p>
            </div>
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)'
              }}
            />
          </div>

          {/* Ready for Inspection */}
          <div 
            className="relative overflow-hidden rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #8b5cf6 50%, #a855f7 100%)',
              boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.4)'
            }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Eye className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium text-white opacity-90 mb-2">Ready for Inspection</span>
              <div className="text-4xl font-bold text-white mb-2">8</div>
              <p className="text-sm text-white opacity-80 font-medium">Pending review</p>
            </div>
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)'
              }}
            />
          </div>

          {/* Closed */}
          <div 
            className="relative overflow-hidden rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
              boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.4)'
            }}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium text-white opacity-90 mb-2">Closed</span>
              <div className="text-4xl font-bold text-white mb-2">145</div>
              <p className="text-sm text-white opacity-80 font-medium">Completed items</p>
            </div>
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)'
              }}
            />
          </div>
        </div>

        {/* Central New Project Button */}
        <div className="flex justify-center py-8">
          <button 
            onClick={() => {
              if (!canCreateProject) {
                alert('Only Admin or QA_Manager can create projects.')
                return
              }
              setShowNewProjectModal(true)
            }}
            className={`group relative px-12 py-6 text-white text-lg font-bold rounded-2xl shadow-2xl transition-all duration-500 transform ${
              canCreateProject 
                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 shadow-emerald-500/50 hover:shadow-3xl hover:shadow-emerald-500/60 hover:scale-105 cursor-pointer' 
                : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 shadow-gray-500/50 cursor-not-allowed opacity-75'
            }`}
            disabled={!canCreateProject}
          >
            <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 ${
              canCreateProject ? 'bg-gradient-to-r from-emerald-400 to-green-500 group-hover:opacity-20' : ''
            }`}></div>
            <div className="relative flex items-center gap-4">
              <Plus className="w-8 h-8" />
              <span>{canCreateProject ? 'New Project' : 'New Project (Access Denied)'}</span>
            </div>
            {canCreateProject && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-75"></div>
            )}
          </button>
        </div>

        {/* Project Management Section - Now positioned at bottom */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl shadow-xl shadow-slate-500/10">
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Projects Table</h2>
              <div className="flex items-center gap-4">
                {/* Quick filter/search above the table */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
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
          
          {/* Projects Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50">
                <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contractor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                  {filteredProjects.map((p) => (
                    <tr key={p.project_id} className="hover:bg-white/30 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {p.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono mt-1">{p.project_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg">
                          {p.status}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{p.contractor || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <Link href={`/roofs/${p.project_id}`}>
                          <button className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300">
                            Open
                          </button>
                        </Link>
                        <button className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all duration-200">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Chat Section - For all projects */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl shadow-xl shadow-slate-500/10">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Project Communications
            </h2>
            <p className="text-sm text-slate-600 mt-1">Global chat for all projects - stay connected with your team</p>
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
        </div>

      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
                <button 
                  onClick={() => {
                    setShowNewProjectModal(false)
                    resetNewProjectForm()
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              {!canCreateProject && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  You don\'t have permission to create projects. Ask an Admin or QA Manager to grant access.
                </div>
              )}
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter project name..."
                  value={newProjectForm.name}
                  onChange={(e) => handleNewProjectFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea 
                  placeholder="Project description..."
                  rows={3}
                  value={newProjectForm.description}
                  onChange={(e) => handleNewProjectFormChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Site Location *</label>
                  <input 
                    type="text" 
                    placeholder="Site address..."
                    value={newProjectForm.location}
                    onChange={(e) => handleNewProjectFormChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select 
                    value={newProjectForm.priority}
                    onChange={(e) => handleNewProjectFormChange('priority', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
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
                {newProjectForm.roofPlanFile && (
                  <div className="mt-2 text-sm text-slate-600">
                    File: {newProjectForm.roofPlanFile.name} ({(newProjectForm.roofPlanFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewProjectModal(false)
                    resetNewProjectForm()
                  }}
                  className="px-6 py-3 text-slate-700 font-semibold hover:bg-white/50 rounded-lg transition-colors"
                  disabled={isCreatingProject}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingProject || !canCreateProject}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isCreatingProject ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

// Temporarily disable auth protection for testing
// export default withAuth(HomePage)
export default HomePage