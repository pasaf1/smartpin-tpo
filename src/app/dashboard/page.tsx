'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, Building2, BarChart3, Users } from 'lucide-react'
import { LuxuryHeader } from '@/components/dashboard/LuxuryHeader'
import { KPICards } from '@/components/dashboard/KPICards'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PinItemsTable } from '@/components/tables/PinItemsTable'
import { RoofCard } from '@/components/dashboard/RoofCard'
import { FilterPanel } from '@/components/dashboard/FilterPanel'
import { InteractiveRoofPlan } from '@/components/dashboard/InteractiveRoofPlan'
import { PinDetailsModal } from '@/components/dashboard/PinDetailsModal'

interface FilterState {
  issueType: string
  status: string[]
  severity: string[]
}

interface Pin {
  id: string
  x: number
  y: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'ready' | 'closed'
  issueType: string
  title?: string
}

interface PinDetails {
  id: string
  title: string
  issueType: string
  status: 'open' | 'ready' | 'closed'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  assignedTo: string
  createdAt: string
  updatedAt: string
  images: string[]
  coordinates: { x: number; y: number }
}

export default function DashboardPage() {
  const [selectedRoof, setSelectedRoof] = useState<string | null>(null)
  const [selectedPin, setSelectedPin] = useState<PinDetails | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    issueType: '',
    status: ['open', 'ready'],
    severity: []
  })
  const [activeKPIFilter, setActiveKPIFilter] = useState<string>('all')
  const [pins, setPins] = useState<Pin[]>([])
  const [highlightedPinId, setHighlightedPinId] = useState<string>()
  const [kpiModal, setKpiModal] = useState<{ open: boolean; filter: 'all' | 'Open' | 'ReadyForInspection' | 'Closed'; title: string }>(
    { open: false, filter: 'all', title: '' }
  )

  // Sample roof data
  const roofs = [
    {
      id: 'roof-001',
      name: 'Building A - North Wing',
      code: 'BA-NW-001',
      area: '2,400 sq ft',
      openCount: 3,
      readyCount: 1,
      closedCount: 2,
      lastUpdated: 'Today 2:30 PM',
      status: 'in-progress' as const
    },
    {
      id: 'roof-002',
      name: 'Building B - Main Roof',
      code: 'BB-MR-002',
      area: '4,200 sq ft',
      openCount: 2,
      readyCount: 1,
      closedCount: 5,
      lastUpdated: 'Yesterday 4:15 PM',
      status: 'active' as const
    },
    {
      id: 'roof-003',
      name: 'Building C - East Section',
      code: 'BC-ES-003',
      area: '3,100 sq ft',
      openCount: 0,
      readyCount: 0,
      closedCount: 8,
      lastUpdated: '2 days ago',
      status: 'completed' as const
    }
  ]

  const handleRoofSelect = (roofId: string) => {
    setSelectedRoof(roofId)
  }

  const handlePinClick = (pin: Pin) => {
    // Convert Pin to PinDetails format
    const pinDetails: PinDetails = {
      id: pin.id,
      title: pin.title || `Pin ${pin.id}`,
      issueType: pin.issueType,
      status: pin.status,
      severity: pin.severity,
      description: `Quality issue found at coordinates (${pin.x.toFixed(1)}, ${pin.y.toFixed(1)})`,
      assignedTo: 'John Supervisor',
      createdAt: 'Today 10:30 AM',
      updatedAt: 'Today 2:15 PM',
      images: [],
      coordinates: { x: pin.x, y: pin.y }
    }
    setSelectedPin(pinDetails)
  }

  const handleAddPin = (x: number, y: number) => {
    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      x,
      y,
      severity: 'medium',
      status: 'open',
      issueType: 'membrane',
      title: `New Pin ${pins.length + 1}`
    }
    setPins([...pins, newPin])
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleKPIFilterChange = (filter: string) => {
    setActiveKPIFilter(filter)
    
    // Highlight relevant pins based on filter
    if (filter === 'open') {
      // Could highlight open pins
    } else if (filter === 'ready') {
      // Could highlight ready pins
    }

    // Open drill-down modal with mapped status filter
    const map: Record<string, { status: 'Open' | 'ReadyForInspection' | 'Closed' | 'all'; title: string }> = {
      open: { status: 'Open', title: 'Open Issues' },
      ready: { status: 'ReadyForInspection', title: 'Ready for Inspection' },
      closed: { status: 'Closed', title: 'Closed Issues' },
      parent: { status: 'all', title: 'Parent Pins (legacy view)' },
      all: { status: 'all', title: 'All Issues' },
    }
    const m = map[filter] || map.all
    setKpiModal({ open: true, filter: m.status, title: m.title })
  }

  const handleUpdatePin = (pinId: string, updates: Partial<PinDetails>) => {
    if (selectedPin && selectedPin.id === pinId) {
      setSelectedPin({ ...selectedPin, ...updates })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20 shadow-xl shadow-indigo-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title with Breadcrumb */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-6 h-6 bg-white rounded-md opacity-90"></div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Link href="/" className="hover:text-indigo-600 transition-colors duration-200 flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <span>/</span>
                  <span className="text-slate-700 font-medium">Dashboard</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Advanced Dashboard
                </h1>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link href="/roofs" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Roofs
              </Link>
              {/* Demo link removed */}
              {/* <Link href="/demo/analytics" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link> */}
              <Link href="/admin/users" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </Link>
            </div>

            {/* Back Button */}
            <div className="flex items-center">
              <Link href="/">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 text-slate-700 font-medium rounded-lg shadow-lg shadow-slate-500/10 hover:bg-white/70 transition-all duration-300 hover:scale-105">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {!selectedRoof ? (
          // Main Dashboard View
          <div className="space-y-8">
            {/* KPI Cards */}
            <KPICards 
              onFilterChange={handleKPIFilterChange}
              activeFilter={activeKPIFilter}
            />
            
            {/* Filters */}
            <FilterPanel onFilterChange={handleFilterChange} />
            
            {/* Roofs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roofs.map((roof) => (
                <RoofCard
                  key={roof.id}
                  roof={roof}
                  onViewDetails={handleRoofSelect}
                />
              ))}
            </div>
          </div>
        ) : (
          // Detailed Roof View
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedRoof(null)}
                  className="w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-xl flex items-center justify-center text-luxury-600 hover:text-luxury-900 transition-all shadow-luxury"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-luxury-900">
                    {roofs.find(r => r.id === selectedRoof)?.name}
                  </h1>
                  <p className="text-luxury-600">
                    Code: {roofs.find(r => r.id === selectedRoof)?.code} • 
                    Area: {roofs.find(r => r.id === selectedRoof)?.area}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Interactive Roof Plan */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-luxury-lg p-6">
                  <h2 className="text-xl font-bold text-luxury-900 mb-4">Interactive Roof Plan</h2>
                  <InteractiveRoofPlan
                    pins={pins}
                    onPinClick={handlePinClick}
                    onAddPin={handleAddPin}
                    highlightedPinId={highlightedPinId}
                    className="h-96"
                  />
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                <FilterPanel onFilterChange={handleFilterChange} />
                
                <div className="bg-white rounded-2xl shadow-luxury-lg p-6">
                  <h3 className="text-lg font-bold text-luxury-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-luxury-600">Total Pins</span>
                      <span className="font-semibold text-luxury-900">{pins.length + 3}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-luxury-600">Open Issues</span>
                      <span className="font-semibold text-red-600">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-luxury-600">Ready</span>
                      <span className="font-semibold text-amber-600">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-luxury-600">Closed</span>
                      <span className="font-semibold text-emerald-600">2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pin Details Modal */}
      <PinDetailsModal
        pin={selectedPin}
        isOpen={!!selectedPin}
        onClose={() => setSelectedPin(null)}
        onUpdatePin={handleUpdatePin}
      />

      {/* KPI Drill-down Modal */}
      <Dialog open={kpiModal.open} onOpenChange={(open) => setKpiModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>{kpiModal.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <PinItemsTable
              maxHeight="60vh"
              showPagination={true}
              enableVirtualization={true}
              onlyOpenItems={false}
              defaultStatusFilter={kpiModal.filter}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}