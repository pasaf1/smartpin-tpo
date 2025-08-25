'use client'

import { useState } from 'react'
import { LuxuryHeader } from '@/components/dashboard/LuxuryHeader'
import { KPICards } from '@/components/dashboard/KPICards'
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
  }

  const handleUpdatePin = (pinId: string, updates: Partial<PinDetails>) => {
    if (selectedPin && selectedPin.id === pinId) {
      setSelectedPin({ ...selectedPin, ...updates })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-25 via-luxury-50 to-luxury-75">
      <LuxuryHeader />
      
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
    </div>
  )
}