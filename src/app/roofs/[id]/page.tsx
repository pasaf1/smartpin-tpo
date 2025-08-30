'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BluebinInteractiveRoofPlan } from '@/components/dashboard/BluebinInteractiveRoofPlan'
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet'
import { MobileFAB, defaultBluebinTools } from '@/components/ui/MobileFAB'
import { BluebinPinDetailsCard } from '@/components/pins/BluebinPinDetailsCard'
import { PinItemsTable } from '@/components/tables/PinItemsTable'
import ExportDialog from '@/components/export/ExportDialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRoof } from '@/lib/hooks/useRoofs'
import { useCreatePin, usePins } from '@/lib/hooks/usePins'
import { useAllPinItems } from '@/lib/hooks/usePinItems'
import { useChat } from '@/lib/hooks/useChat'
import { useUsers, withAuth } from '@/lib/hooks/useAuth'
import ChatInterface from '@/components/chat/ChatInterface'
import { PresenceIndicator } from '@/components/ui/presence-indicator'
import { RealtimeStatus } from '@/components/realtime/ConnectionStatus'
import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'
import { DockedChat } from '@/components/chat/DockedChat'

function RoofDashboardPage() {
  const params = useParams()
  const roofId = params.id as string
  
  const [selectedPin, setSelectedPin] = useState<PinWithRelations | null>(null)
  const [showPinPopup, setShowPinPopup] = useState(false)
  const [closurePhotoItemId, setClosurePhotoItemId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'ReadyForInspection' | 'Closed'>('all')
  const [selectedTool, setSelectedTool] = useState<'pin' | 'childPin' | 'annotation' | 'text' | 'measure'>('pin')
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [childPins, setChildPins] = useState<any[]>([])
  const [layers, setLayers] = useState<any[]>([{ id: '1', name: 'Quality Control', visible: true, z_index: 1, opacity: 1.0, type: 'pins' }])
  const [annotations, setAnnotations] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileDetails, setShowMobileDetails] = useState(false)
  
  // Real-time roof data with live updates
  const { data: roof, isLoading: roofLoading, error: roofError } = useRoof(roofId)
  const { data: pins = [] } = usePins(roofId) as { data: any[] }
  const { data: pinItems = [] } = useAllPinItems(roofId)
  const { messages } = useChat(roofId, selectedPin?.id)
  const { data: users = [] } = useUsers()
  const createPinMutation = useCreatePin()

  // Mobile detection
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set default layer
  useEffect(() => {
    if (layers.length > 0 && !selectedLayerId) {
      setSelectedLayerId(layers[0].id)
    }
  }, [layers, selectedLayerId])
  
  // Presence tracking for collaborative features (simplified)
  const onlineUsers: any[] = []
  const onlineCount = 0

  const handlePinCreate = async (x: number, y: number) => {
    try {
      await createPinMutation.mutateAsync({
        roof_id: roofId,
        x: x,
        y: y,
        status: 'Open' as const,
      } as any)
    } catch (error) {
      console.error('Failed to create pin:', error)
    }
  }

  const handlePinClick = (pin: any) => {
    setSelectedPin({
      ...pin,
      layer_id: pin.layer_id || selectedLayerId || layers[0]?.id || '1'
    } as PinWithRelations)
    setClosurePhotoItemId(null)
    setShowPinPopup(false)
    if (isMobile) {
      setShowMobileDetails(true)
    }
  }

  const handleChildPinClick = (childPin: any, parentPin: any) => {
    setSelectedPin(parentPin)
    if (isMobile) {
      setShowMobileDetails(true)
    }
  }

  const handleAddPin = async (x: number, y: number, layerId: string) => {
    if (!selectedLayerId) return
    try {
      await createPinMutation.mutateAsync({
        roof_id: roofId,
        layer_id: layerId,
        x: x,
        y: y,
        status: 'Open' as const,
      } as any)
    } catch (error) {
      console.error('Failed to create pin:', error)
    }
  }

  const handleAddChildPin = async (parentPin: any, x: number, y: number) => {
    // Create child pin logic
    const newChildPin = {
      id: Date.now().toString(),
      parent_id: parentPin.id,
      seq: `${parentPin.seq_number}.${childPins.filter(cp => cp.parent_id === parentPin.id).length + 1}`,
      x,
      y,
      status: 'Open',
      severity: 'Medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {}
    }
    setChildPins([...childPins, newChildPin])
  }

  const handleStatusChange = (pinId: string, newStatus: any, isChild = false) => {
    if (isChild) {
      setChildPins(childPins.map(cp => cp.id === pinId ? { ...cp, status: newStatus } : cp))
    } else {
      // Update parent pin status logic
      console.log('Update parent pin status:', pinId, newStatus)
    }
  }

  const handleUpdateChildPin = (childPin: any) => {
    setChildPins(childPins.map(cp => cp.id === childPin.id ? childPin : cp))
  }

  const handleDeleteChildPin = (childPinId: string) => {
    setChildPins(childPins.filter(cp => cp.id !== childPinId))
  }

  const handleAddAnnotation = (annotation: any) => {
    setAnnotations([...annotations, { ...annotation, id: Date.now().toString() }])
  }

  const handleChildPinCreate = async (parentPinId: string, x: number, y: number) => {
    try {
      await createPinMutation.mutateAsync({
        roof_id: roofId,
        x: x,
        y: y,
        status: 'Open' as const,
      } as any)
    } catch (error) {
      console.error('Failed to create child pin:', error)
    }
  }

  if (roofLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" style={{backgroundSize: '100px 100px'}}></div>
      {/* Luxury Header */}
      <header className="relative bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{roof.name}</h1>
                <p className="text-sm text-white/80">
                  {roof.code} • Building: {roof.building || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-sm px-3 py-1">
                {pins.length} Pins
              </Badge>
              
              {/* Real-time Status */}
              <RealtimeStatus roofId={roofId} showDetails className="text-white/80" />
              
              {/* Presence Indicator */}
              <PresenceIndicator 
                users={onlineUsers} 
                maxVisible={4} 
                className="text-white/90"
              />
              
              <ExportDialog
                roofId={roofId}
                roofName={roof.name}
                messages={messages || []}
                pins={pins}
                users={users}
                roofData={roof}
              >
                <Button className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200" size="sm">
                  📄 Export Report
                </Button>
              </ExportDialog>
              <Link href={`/roofs/${roofId}/settings`}>
                <Button className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200" size="sm">
                  ⚙️
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Premium KPI Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            onClick={() => setStatusFilter('Open')}
            className={cn(
              "bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]",
              statusFilter === 'Open' ? "border-red-500 shadow-red-200" : "border-red-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-700 mb-1">
                  {pinItems.filter(item => item.status === 'Open').length}
                </div>
                <div className="text-sm font-semibold text-red-600">Open Issues</div>
                {statusFilter === 'Open' && <div className="text-xs text-red-500 mt-1 font-medium">● Active Filter</div>}
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => setStatusFilter('ReadyForInspection')}
            className={cn(
              "bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]",
              statusFilter === 'ReadyForInspection' ? "border-amber-500 shadow-amber-200" : "border-amber-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-amber-700 mb-1">
                  {pinItems.filter(item => item.status === 'ReadyForInspection').length}
                </div>
                <div className="text-sm font-semibold text-amber-600">Ready for Inspection</div>
                {statusFilter === 'ReadyForInspection' && <div className="text-xs text-amber-500 mt-1 font-medium">● Active Filter</div>}
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
              "bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]",
              statusFilter === 'Closed' ? "border-emerald-500 shadow-emerald-200" : "border-emerald-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-700 mb-1">
                  {pinItems.filter(item => item.status === 'Closed').length}
                </div>
                <div className="text-sm font-semibold text-emerald-600">Closed</div>
                {statusFilter === 'Closed' && <div className="text-xs text-emerald-500 mt-1 font-medium">● Active Filter</div>}
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
              "bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]",
              statusFilter === 'all' ? "border-blue-500 shadow-blue-200" : "border-blue-200/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {pinItems.length}
                </div>
                <div className="text-sm font-semibold text-blue-600">All Issues</div>
                {statusFilter === 'all' && <div className="text-xs text-blue-500 mt-1 font-medium">● Active Filter</div>}
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout - 3 Column Grid matching HTML design */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-240px)]">
          {/* Left Panel - Filters & Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl h-full">
              <h3 className="text-xl font-semibold text-white mb-6">Project Filters</h3>
              
              {/* Filter Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Status Filter</label>
                  <select className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60">
                    <option value="all">All Statuses</option>
                    <option value="open">Open Issues</option>
                    <option value="ready">Ready for Inspection</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Severity Filter</label>
                  <select className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60">
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date Range</label>
                  <input type="date" className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 mb-2" />
                  <input type="date" className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60" />
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Apply Filters
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <button className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                    Export Report
                  </button>
                  <button className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                    Schedule Inspection
                  </button>
                  <button className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Panel - Interactive Roof Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Interactive Roof Plan</h3>
                <div className="flex items-center gap-4">
                  <span className="text-white/80">Pins: {pins.length}</span>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg">
                    + Add Pin
                  </button>
                </div>
              </div>
              
              {/* BLUEBIN Interactive Roof Plan Container */}
              <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden relative">
                <BluebinInteractiveRoofPlan
                  roofId={roofId}
                  pins={pins.map(pin => ({
                    ...pin,
                    layer_id: selectedLayerId || layers[0]?.id || '1',
                    children_total: childPins.filter(cp => cp.parent_id === pin.id).length,
                    children_open: childPins.filter(cp => cp.parent_id === pin.id && cp.status === 'Open').length,
                    children_ready: childPins.filter(cp => cp.parent_id === pin.id && cp.status === 'ReadyForInspection').length,
                    children_closed: childPins.filter(cp => cp.parent_id === pin.id && cp.status === 'Closed').length,
                    parent_mix_state: childPins.filter(cp => cp.parent_id === pin.id).length === 0 ? null :
                                     childPins.filter(cp => cp.parent_id === pin.id && cp.status === 'Closed').length === childPins.filter(cp => cp.parent_id === pin.id).length ? 'ALL_CLOSED' :
                                     childPins.filter(cp => cp.parent_id === pin.id && cp.status === 'Open').length === childPins.filter(cp => cp.parent_id === pin.id).length ? 'ALL_OPEN' : 'MIXED'
                  }))}
                  childPins={childPins}
                  layers={layers}
                  annotations={annotations}
                  roofPlanImageUrl={roof.plan_image_url || roof.roof_plan_url || undefined}
                  onPinClick={handlePinClick}
                  onChildPinClick={handleChildPinClick}
                  onAddPin={handleAddPin}
                  onAddChildPin={(parentPin: any) => handleAddChildPin(parentPin, 0.5, 0.5)}
                  onAddAnnotation={handleAddAnnotation}
                  selectedLayerId={selectedLayerId || undefined}
                  selectedTool={selectedTool}
                  className="w-full h-full"
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Panel - Defects Table */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900/50 to-gray-800/50 p-6 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quality Control Center</h3>
                  <p className="text-white/80 mt-1">Defects, inspections & resolution tracking</p>
                </div>
              </div>
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
                }}
                onEditClick={(pinItemId) => {
                  // Find the pin item and corresponding pin to open INCR modal
                  const pinItem = pinItems.find(item => item.id === pinItemId)
                  if (pinItem) {
                    const pin = pins.find(p => p.id === pinItem.pin_id)
                    if (pin) {
                      setSelectedPin(pin)
                    }
                  }
                }}
                className="border-0 rounded-none h-full bg-transparent"
              />
            </div>
          </div>
        </div>
        
        {/* Team Chat Panel */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-800/50 p-6 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Team Collaboration</h3>
                  <p className="text-white/80 mt-1">Real-time chat with @mentions across project scopes</p>
                </div>
              </div>
            </div>
            <div className="h-96">
              <ChatInterface
                roofId={roofId}
                className="h-full border-0 rounded-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Pin Details Modal */}
      {selectedPin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/30 to-indigo-600/40 rounded-3xl blur-2xl opacity-75 hover:opacity-100 transition-all duration-500"></div>
            
            {/* Modal Content */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20">
              {/* Premium Header */}
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
                      <p className="text-lg text-gray-600 mt-1 font-medium">{selectedPin.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={selectedPin.status} />
                        {selectedPin.severity && <SeverityBadge severity={selectedPin.severity} />}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="lg"
                    onClick={() => setSelectedPin(null)}
                    className="h-12 w-12 p-0 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                  >
                    <svg className="w-6 h-6 hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="h-[calc(90vh-200px)] bg-gradient-to-br from-gray-50/50 to-white/50">
                <BluebinPinDetailsCard
                  pin={selectedPin as any}
                  childPins={childPins.filter(cp => cp.parent_id === selectedPin.id)}
                  onClose={() => setSelectedPin(null)}
                  onStatusChange={handleStatusChange}
                  onAddChildPin={(parentPin: any) => handleAddChildPin(parentPin, 0.5, 0.5)}
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

      {/* Premium Closure Photo Upload Modal */}
      {showPinPopup && selectedPin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/30 to-green-600/40 rounded-3xl blur-2xl opacity-75 hover:opacity-100 transition-all duration-500"></div>
            
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
                      Upload resolution photo to close this defect
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                {/* Pin Details Summary */}
                <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-gray-200/50">
                  <div className="font-semibold text-lg text-gray-800">{selectedPin.title}</div>
                  <div className="text-gray-600 mt-2">{selectedPin.description}</div>
                  <div className="flex items-center gap-3 mt-4">
                    <StatusBadge status={selectedPin.status} />
                    {selectedPin.severity && <SeverityBadge severity={selectedPin.severity} />}
                  </div>
                </div>

                {/* Premium Upload Area */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-green-600/30 rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer hover:bg-emerald-50/70">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">
                      Drop closure photo here
                    </p>
                    <p className="text-gray-600 mb-1">
                      or click to browse files
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WebP up to 10MB • High resolution recommended
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPinPopup(false)
                      setClosurePhotoItemId(null)
                    }}
                    className="flex-1 h-14 text-lg font-semibold rounded-xl border-2 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('Upload closure photo for pin:', selectedPin.id)
                      // TODO: Implement photo upload logic
                      setShowPinPopup(false)
                      setClosurePhotoItemId(null)
                    }}
                    className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Upload & Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile FAB for tool selection */}
      {isMobile && (
        <MobileFAB
          tools={defaultBluebinTools}
          selectedTool={selectedTool}
          onToolSelect={(toolId: string) => setSelectedTool(toolId as any)}
          position="bottom-right"
        />
      )}

      {/* Mobile Bottom Sheet for Pin Details */}
      {isMobile && (
        <MobileBottomSheet
          isOpen={showMobileDetails && selectedPin !== null}
          onClose={() => setShowMobileDetails(false)}
          snapPoints={[30, 70, 95]}
          initialSnap={1}
          title={selectedPin ? `Pin ${selectedPin.seq_number}` : undefined}
        >
          {selectedPin && (
            <BluebinPinDetailsCard
              pin={selectedPin as any}
              childPins={childPins.filter(cp => cp.parent_id === selectedPin.id)}
              onClose={() => {
                setShowMobileDetails(false)
                setSelectedPin(null)
              }}
              onStatusChange={handleStatusChange}
              onAddChildPin={(parentPin: any) => handleAddChildPin(parentPin, 0.5, 0.5)}
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
    </div>
  )
}

// Protect this route - require authentication
export default withAuth(RoofDashboardPage)