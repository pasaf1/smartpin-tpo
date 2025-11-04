'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BluebinInteractiveRoofPlanClient as BluebinInteractiveRoofPlan } from '@/components/dashboard/BluebinInteractiveRoofPlanClient'
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet'
import { MobileFAB, defaultBluebinTools } from '@/components/ui/MobileFAB'
import { BluebinPinDetailsCard } from '@/components/pins/BluebinPinDetailsCard'
import { PinItemsTable, ExportDialog } from '@/components/shared'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRoof } from '@/lib/hooks/useRoofs'
import { useCreatePin, usePins, useUpdatePin } from '@/lib/hooks/usePins'
import { useAllPinItems } from '@/lib/hooks/usePinItems'
import { useChat } from '@/lib/hooks/useChat'
import { useUsers, withAuth } from '@/lib/hooks/useAuth'
import ChatInterface from '@/components/chat/ChatInterface'
import { PresenceIndicator } from '@/components/ui/presence-indicator'
import { ConnectionStatus as RealtimeStatus } from '@/components/shared'
import { cn } from '@/lib/utils'
import { DockedChat } from '@/components/chat/DockedChat'
import { toast } from 'sonner'
import type { Database, PinWithRelations, ChildPinWithUIFields } from '@/lib/database.types'

// Type definitions
type Pin = Database['public']['Tables']['pins']['Row']
type PinInsert = Database['public']['Tables']['pins']['Insert']
type PinUpdate = Database['public']['Tables']['pins']['Update']

function RoofDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const roofId = params['id'] as string
  
  // State management
  const [selectedPin, setSelectedPin] = useState<PinWithRelations | null>(null)
  const [showPinPopup, setShowPinPopup] = useState(false)
  const [closurePhotoItemId, setClosurePhotoItemId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'ReadyForInspection' | 'Closed'>('all')
  const [selectedTool, setSelectedTool] = useState<'pin' | 'childPin' | 'annotation' | 'text' | 'measure'>('pin')
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [childPins, setChildPins] = useState<ChildPinWithUIFields[]>([])
  // Removed layers and annotations - tables don't exist in database
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileDetails, setShowMobileDetails] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  // Data fetching hooks
  const { data: roof, isLoading: roofLoading, error: roofError } = useRoof(roofId)
  const { data: pins = [], isLoading: pinsLoading } = usePins(roofId)
  const { data: pinItems = [] } = useAllPinItems(roofId)
  const { messages } = useChat(roofId, selectedPin?.id)
  const { data: users = [] } = useUsers()
  
  // Mutations
  const createPinMutation = useCreatePin()
  const updatePinMutation = useUpdatePin()

  // Mobile detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Initialize default layer ID (simplified without database layers table)
  useEffect(() => {
    if (!selectedLayerId) {
      setSelectedLayerId('default-layer')
    }
  }, [selectedLayerId])
  
  // Handlers
  const handlePinCreate = useCallback(async (x: number, y: number) => {
    try {
      const maxSeqNumber = Math.max(0, ...pins.map(p => p.seq_number || 0))
      const newPin: PinInsert = {
        roof_id: roofId,
        seq_number: maxSeqNumber + 1,
        x: x,
        y: y,
        status: 'Open'
      }
      await createPinMutation.mutateAsync(newPin)
      toast.success('Pin created successfully')
    } catch (error) {
      console.error('Failed to create pin:', error)
      toast.error('Failed to create pin')
    }
  }, [roofId, pins, createPinMutation])

  const handlePinClick = useCallback((pin: PinWithRelations) => {
    setSelectedPin(pin)
    setClosurePhotoItemId(null)
    setShowPinPopup(false)
    if (isMobile) {
      setShowMobileDetails(true)
    }
  }, [isMobile])

  const handleChildPinClick = useCallback((childPin: ChildPinWithUIFields, parentPin: PinWithRelations) => {
    setSelectedPin(parentPin)
    if (isMobile) {
      setShowMobileDetails(true)
    }
  }, [isMobile])

  const handleAddPin = useCallback(async (x: number, y: number, layerId: string) => {
    if (!layerId) {
      toast.error('Please select a layer first')
      return
    }
    await handlePinCreate(x, y)
  }, [handlePinCreate])

  const handleAddChildPin = useCallback(async (parentPin: PinWithRelations, x?: number, y?: number) => {
    try {
      // Create child pin logic
      if (!parentPin) return

      const existingChildren = childPins.filter(cp => cp.pin_id === parentPin.id)
      const nextCode = `${parentPin.seq_number}.${existingChildren.length + 1}`

      const newChildPin: ChildPinWithUIFields = {
        child_id: crypto.randomUUID(),
        pin_id: parentPin.id,
        child_code: nextCode,
        zone: null,
        defect_type: null,
        severity: 'Medium',
        status_child: 'Open',
        due_date: null,
        open_date: new Date().toISOString(),
        closed_date: null,
        openpic_id: null,
        closurepic_id: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        x: x ?? null,
        y: y ?? null
      }

      setChildPins(prev => [...prev, newChildPin])
      toast.success(`Child pin ${nextCode} created`)
    } catch (error) {
      console.error('Failed to add child pin:', error)
      toast.error('Failed to add child pin')
    }
  }, [childPins])

  const handleStatusChange = useCallback(async (pinId: string, newStatus: Pin['status']) => {
    try {
      await updatePinMutation.mutateAsync({
        id: pinId,
        updates: {
          status: newStatus
        }
      })
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }, [updatePinMutation])

  const handleUpdateChildPin = useCallback((childPin: ChildPinWithUIFields) => {
    setChildPins(prev => prev.map(cp =>
      cp.child_id === childPin.child_id ? { ...cp, ...childPin, updated_at: new Date().toISOString() } : cp
    ))
    toast.success('Child pin updated')
  }, [])

  const handleDeleteChildPin = useCallback(async (childId: string) => {
    setChildPins(prev => prev.filter(cp => cp.child_id !== childId))
    toast.success('Child pin deleted')
  }, [])

  // Removed annotation handler - annotations table doesn't exist

  const handleClosurePhotoUpload = useCallback(async () => {
    if (!selectedPin || !closurePhotoItemId) return
    
    try {
      // TODO: Implement photo upload logic
      console.log('Upload closure photo for pin:', selectedPin.id)
      toast.success('Photo uploaded successfully')
      setShowPinPopup(false)
      setClosurePhotoItemId(null)
    } catch (error) {
      console.error('Failed to upload photo:', error)
      toast.error('Failed to upload photo')
    }
  }, [selectedPin, closurePhotoItemId])

  // Loading state
  if (roofLoading || pinsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading roof dashboard...
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (roofError || (!roofLoading && !roof)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-800">Error loading roof</p>
                <p className="text-sm text-red-600 mt-1">
                  {roofError?.message || 'Roof not found'}
                </p>
              </div>
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

  // Filter pins based on status
  const filteredPinItems = statusFilter === 'all' 
    ? pinItems 
    : pinItems.filter(item => item.status === statusFilter)

  // Calculate KPI values
  const kpiCounts = {
    open: pinItems.filter(item => item.status === 'Open').length,
    ready: pinItems.filter(item => item.status === 'ReadyForInspection').length,
    closed: pinItems.filter(item => item.status === 'Closed').length,
    total: pinItems.length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                  ← Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{roof?.name || 'Untitled Roof'}</h1>
                <p className="text-sm text-white/80">
                  {roof?.code} • Building: {roof?.building || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                {pins.length} Pins
              </Badge>
              <RealtimeStatus roofId={roofId} showDetails className="text-white/80" />
              <Button 
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                📄 Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            onClick={() => setStatusFilter('Open')}
            className={cn(
              "bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
              statusFilter === 'Open' ? "border-red-500 shadow-red-200" : "border-red-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-700">{kpiCounts.open}</div>
                <div className="text-sm font-semibold text-red-600">Open Issues</div>
                {statusFilter === 'Open' && (
                  <div className="text-xs text-red-500 mt-1 font-medium">● Active Filter</div>
                )}
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setStatusFilter('ReadyForInspection')}
            className={cn(
              "bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
              statusFilter === 'ReadyForInspection' ? "border-amber-500 shadow-amber-200" : "border-amber-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-700">{kpiCounts.ready}</div>
                <div className="text-sm font-semibold text-amber-600">Ready for Inspection</div>
                {statusFilter === 'ReadyForInspection' && (
                  <div className="text-xs text-amber-500 mt-1 font-medium">● Active Filter</div>
                )}
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setStatusFilter('Closed')}
            className={cn(
              "bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
              statusFilter === 'Closed' ? "border-emerald-500 shadow-emerald-200" : "border-emerald-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-700">{kpiCounts.closed}</div>
                <div className="text-sm font-semibold text-emerald-600">Closed</div>
                {statusFilter === 'Closed' && (
                  <div className="text-xs text-emerald-500 mt-1 font-medium">● Active Filter</div>
                )}
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setStatusFilter('all')}
            className={cn(
              "bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1",
              statusFilter === 'all' ? "border-blue-500 shadow-blue-200" : "border-blue-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-700">{kpiCounts.total}</div>
                <div className="text-sm font-semibold text-blue-600">All Issues</div>
                {statusFilter === 'all' && (
                  <div className="text-xs text-blue-500 mt-1 font-medium">● Active Filter</div>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 pb-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-400px)] min-h-[500px]">
          {/* Left Panel - Interactive Roof Plan (2 columns on desktop) */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Interactive Roof Plan</h3>
                <div className="flex items-center gap-4">
                  <span className="text-white/80">Pins: {pins.length}</span>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    size="sm"
                    onClick={() => setSelectedTool('pin')}
                  >
                    + Add Pin
                  </Button>
                </div>
              </div>
              
              {/* Roof Plan Container */}
              <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden relative min-h-[400px]">
                <BluebinInteractiveRoofPlan
                  roofId={roofId}
                  pins={pins.map(pin => ({
                    ...pin,
                    children_total: childPins.filter(cp => cp.pin_id === pin.id).length,
                    children_open: childPins.filter(cp => cp.pin_id === pin.id && cp.status_child === 'Open').length,
                    children_ready: childPins.filter(cp => cp.pin_id === pin.id && cp.status_child === 'ReadyForInspection').length,
                    children_closed: childPins.filter(cp => cp.pin_id === pin.id && cp.status_child === 'Closed').length
                  }))}
                  childPins={childPins}
                  layers={[]}
                  annotations={[]}
                  {...((roof?.plan_image_url ?? roof?.roof_plan_url) ? { roofPlanImageUrl: (roof?.plan_image_url ?? roof?.roof_plan_url) as string } : {})}
                  onPinClick={handlePinClick}
                  onChildPinClick={handleChildPinClick}
                  onAddPin={handleAddPin}
                  onAddChildPin={handleAddChildPin}
                  onAddAnnotation={() => {}} // No-op since annotations table doesn't exist
                  {...(selectedLayerId ? { selectedLayerId } : {})}
                  selectedTool={selectedTool}
                  className="w-full h-full"
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
          
          {/* Right Panel - Quick Stats & Chat */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Project Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Completion</span>
                  <span className="text-white font-semibold">
                    {Math.round((kpiCounts.closed / Math.max(kpiCounts.total, 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(kpiCounts.closed / Math.max(kpiCounts.total, 1)) * 100}%` }}
                  />
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70">Critical Issues</span>
                    <span className="text-red-400 font-medium">
                      {childPins.filter(cp => cp.severity === 'Critical').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70">Pending Review</span>
                    <span className="text-amber-400 font-medium">{kpiCounts.ready}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Interface */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl flex-1 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-900/50 to-indigo-800/50 p-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Team Chat</h3>
              </div>
              <div className="h-[300px]">
                <ChatInterface
                  roofId={roofId}
                  className="h-full border-0 rounded-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Panel - Issues Table */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900/50 to-gray-800/50 p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">Quality Control Center</h3>
              <p className="text-white/80 mt-1">Defects, inspections & resolution tracking</p>
            </div>
            <div className="h-96">
              <PinItemsTable
                roofId={roofId}
                maxHeight="100%"
                showPagination={true}
                enableVirtualization={true}
                showClosureButtons={true}
                onClosurePhotoClick={(pinItemId) => {
                  setClosurePhotoItemId(pinItemId)
                  setShowPinPopup(true)
                  const pinItem = pinItems.find(item => item.id === pinItemId)
                  if (pinItem) {
                    const pin = pins.find(p => p.id === pinItem.pin_id)
                    if (pin) setSelectedPin(pin)
                  }
                }}
                onEditClick={(pinItemId) => {
                  const pinItem = pinItems.find(item => item.id === pinItemId)
                  if (pinItem) {
                    const pin = pins.find(p => p.id === pinItem.pin_id)
                    if (pin) setSelectedPin(pin)
                  }
                }}
                className="border-0 rounded-none h-full bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pin Details Modal */}
      {selectedPin && !showPinPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/30 to-indigo-600/40 rounded-3xl blur-2xl opacity-75" />
            
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-8 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Pin #{selectedPin.seq_number}
                      </h2>
                      <p className="text-lg text-gray-600 mt-1 font-medium">Zone: {selectedPin.zone || 'N/A'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={selectedPin.status || 'Open'} />
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="lg"
                    onClick={() => setSelectedPin(null)}
                    className="h-12 w-12 p-0 rounded-2xl hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="h-[calc(90vh-200px)] bg-gradient-to-br from-gray-50/50 to-white/50">
                <BluebinPinDetailsCard
                  pin={selectedPin}
                  childPins={childPins.filter(cp => cp.pin_id === selectedPin.id)}
                  onClose={() => setSelectedPin(null)}
                  onStatusChange={handleStatusChange}
                  onAddChildPin={async (childData: string | Partial<Database['public']['Tables']['pin_children']['Insert']>) => {
                    await handleAddChildPin(selectedPin)
                  }}
                  onUpdateChildPin={handleUpdateChildPin}
                  onDeleteChildPin={handleDeleteChildPin}
                  className="h-full border-0 bg-transparent"
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closure Photo Upload Modal */}
      {showPinPopup && selectedPin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/30 to-green-600/40 rounded-3xl blur-2xl opacity-75" />
            
            <Card className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-white to-green-50 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Pin #{selectedPin.seq_number}
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 mt-1">
                      Upload resolution photo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-gray-200/50">
                  <div className="font-semibold text-lg text-gray-800">Pin #{selectedPin.seq_number}</div>
                  <div className="text-gray-600 mt-2">Zone: {selectedPin.zone || 'N/A'}</div>
                  <div className="flex items-center gap-3 mt-4">
                    <StatusBadge status={selectedPin.status || 'Open'} />
                  </div>
                </div>

                <div className="relative">
                  <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer hover:bg-emerald-50/70">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-lg">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">
                      Drop closure photo here
                    </p>
                    <p className="text-gray-600">
                      or click to browse
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPinPopup(false)
                      setClosurePhotoItemId(null)
                    }}
                    className="flex-1 h-14 text-lg font-semibold rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleClosurePhotoUpload}
                    className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl"
                  >
                    Upload & Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <MobileFAB
          tools={defaultBluebinTools}
          selectedTool={selectedTool}
          onToolSelect={(toolId) => setSelectedTool(toolId as any)}
          position="bottom-right"
        />
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <MobileBottomSheet
          isOpen={showMobileDetails && selectedPin !== null}
          onClose={() => setShowMobileDetails(false)}
          snapPoints={[30, 70, 95]}
          initialSnap={1}
          {...(selectedPin ? { title: `Pin ${selectedPin.seq_number}` } : {})}
        >
          {selectedPin && (
            <BluebinPinDetailsCard
              pin={selectedPin}
              childPins={childPins.filter(cp => cp.pin_id === selectedPin.id)}
              onClose={() => {
                setShowMobileDetails(false)
                setSelectedPin(null)
              }}
              onStatusChange={handleStatusChange}
              onAddChildPin={async (childData: string | Partial<Database['public']['Tables']['pin_children']['Insert']>) => {
                await handleAddChildPin(selectedPin)
              }}
              onUpdateChildPin={handleUpdateChildPin}
              onDeleteChildPin={handleDeleteChildPin}
              className="border-0 bg-transparent"
              isMobile={true}
            />
          )}
        </MobileBottomSheet>
      )}

      {/* Docked Chat */}
      <DockedChat roofId={roofId} />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        pins={pins}
        selectedPin={selectedPin || undefined}
      />
    </div>
  )
}

// Export with authentication wrapper
export default withAuth(RoofDashboardPage)