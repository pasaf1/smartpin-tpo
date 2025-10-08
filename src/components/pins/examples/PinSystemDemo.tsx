'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  PinDetailsModal,
  SmartPin,
  PinStatus,
  PinUtils,
  PIN_CONSTANTS,
  PinErrorBoundary,
  useMobileGestures,
  isMobileDevice,
  hasTouchSupport,
  triggerHapticFeedback
} from '../index'

type ImageKind = 'opening' | 'closing'

/**
 * Demo component showcasing the rebuilt SmartPin TPO Pin System
 * This demonstrates all major features and components working together
 */
export function PinSystemDemo() {
  const [selectedPin, setSelectedPin] = useState<SmartPin | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pins, setPins] = useState<SmartPin[]>([demoPin])

  const isMobile = isMobileDevice()
  const isTouch = hasTouchSupport()
  const haptic = {
    isSupported: hasTouchSupport(),
    success: () => triggerHapticFeedback('light'),
    warning: () => triggerHapticFeedback('medium'),
    error: () => triggerHapticFeedback('heavy'),
    lightImpact: () => triggerHapticFeedback('light'),
    mediumImpact: () => triggerHapticFeedback('medium'),
    heavyImpact: () => triggerHapticFeedback('heavy')
  }

  // Mock current user
  const currentUser = {
    id: 'user-1',
    name: 'Asaf Peer',
    role: 'Inspector' as const
  }

  const handleOpenPinDetails = (pin: SmartPin) => {
    if (haptic.isSupported) {
      haptic.lightImpact()
    }
    setSelectedPin(pin)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedPin(null), 300) // Delay to allow modal close animation
  }

  const handlePinUpdate = async (updates: Partial<SmartPin>) => {
    if (!selectedPin) return

    console.log('Updating pin:', selectedPin.id, updates)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update local state
    setPins(prev => prev.map(pin =>
      pin.id === selectedPin.id
        ? { ...pin, ...updates, updatedAt: new Date().toISOString() }
        : pin
    ))

    if (haptic.isSupported) {
      haptic.success()
    }
  }

  const handleStatusChange = async (newStatus: PinStatus, reason?: string) => {
    if (!selectedPin) return

    console.log('Changing pin status:', selectedPin.id, newStatus, reason)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update pin with new status
    const updatedPin = {
      ...selectedPin,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: newStatus,
          changedAt: new Date().toISOString(),
          changedBy: currentUser.name,
          reason
        },
        ...selectedPin.statusHistory
      ]
    }

    setPins(prev => prev.map(pin =>
      pin.id === selectedPin.id ? updatedPin : pin
    ))

    setSelectedPin(updatedPin)

    if (haptic.isSupported) {
      haptic.mediumImpact()
    }
  }

  const handlePhotoUpload = async (photo: File, type: ImageKind) => {
    if (!selectedPin) return

    console.log('Uploading photo:', photo.name, type)

    // Simulate photo upload
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newPhoto = {
      id: `photo-${Date.now()}`,
      url: URL.createObjectURL(photo),
      thumbnailUrl: URL.createObjectURL(photo),
      type,
      fileName: photo.name,
      fileSize: photo.size,
      mimeType: photo.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id
    }

    const updatedPin = {
      ...selectedPin,
      photos: [...selectedPin.photos, newPhoto],
      updatedAt: new Date().toISOString()
    }

    setPins(prev => prev.map(pin =>
      pin.id === selectedPin.id ? updatedPin : pin
    ))

    setSelectedPin(updatedPin)

    if (haptic.isSupported) {
      haptic.success()
    }
  }

  const handleChildPinCreate = async (childData: Partial<SmartPin>) => {
    if (!selectedPin) return

    console.log('Creating child pin:', childData)

    // Create child pin
    const childPin = PinUtils.createPin({
      id: `child-${Date.now()}`,
      roofId: selectedPin.roofId,
      seqNumber: 0, // Will be auto-assigned
      hierarchy: {
        parentId: selectedPin.id,
        parentSeqNumber: selectedPin.seqNumber,
        childSeqNumber: selectedPin.children.length + 1,
        depth: 1,
        fullHierarchyCode: `${selectedPin.seqNumber}.${selectedPin.children.length + 1}`
      },
      ...childData,
      createdBy: currentUser.id
    }) as SmartPin

    // Update parent pin with new child
    const updatedPin = {
      ...selectedPin,
      children: [...selectedPin.children, childPin],
      childrenStats: {
        ...selectedPin.childrenStats,
        total: selectedPin.childrenStats.total + 1,
        open: selectedPin.childrenStats.open + 1
      },
      updatedAt: new Date().toISOString()
    }

    setPins(prev => prev.map(pin =>
      pin.id === selectedPin.id ? updatedPin : pin
    ))

    setSelectedPin(updatedPin)

    if (haptic.isSupported) {
      haptic.success()
    }
  }

  return (
    <PinErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-luxury-900 mb-2">
            SmartPin TPO Pin System Demo
          </h1>
          <p className="text-luxury-600">
            Professional roof inspection platform with hierarchical pin management
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-luxury-500">
            <span>Device: {isMobile ? '📱 Mobile' : '🖥️ Desktop'}</span>
            <span>Touch: {isTouch ? '👆 Yes' : '🖱️ No'}</span>
            <span>Haptic: {haptic.isSupported ? '📳 Yes' : '❌ No'}</span>
          </div>
        </div>

        {/* Pin Card */}
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white rounded-xl shadow-lg border border-luxury-200 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200"
            onClick={() => handleOpenPinDetails(demoPin)}
          >
            <div className="bg-gradient-to-r from-luxury-50 to-luxury-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${PinUtils.getSeverityColorClass(demoPin.severity)}`}>
                    {demoPin.seqNumber}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-luxury-900">
                      {PinUtils.getDisplayName(demoPin)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${PinUtils.getStatusColorClass(demoPin.status)}`}>
                        {demoPin.status}
                      </span>
                      <span className="text-sm text-luxury-600">
                        Zone: {demoPin.position.zone}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>

              {/* Statistics */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-luxury-900">{demoPin.childrenStats.total}</div>
                  <div className="text-xs text-luxury-600">Total</div>
                </div>
                <div className="bg-red-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-800">{demoPin.childrenStats.open}</div>
                  <div className="text-xs text-red-600">Open</div>
                </div>
                <div className="bg-yellow-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-800">{demoPin.childrenStats.readyForInspection}</div>
                  <div className="text-xs text-yellow-600">Ready</div>
                </div>
                <div className="bg-green-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-800">{demoPin.childrenStats.closed}</div>
                  <div className="text-xs text-green-600">Closed</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-luxury-700 text-sm leading-relaxed mb-4">
                {demoPin.description}
              </p>

              <div className="flex items-center justify-between text-sm text-luxury-500">
                <span>Created: {new Date(demoPin.createdAt).toLocaleDateString()}</span>
                <span>Photos: {demoPin.photos.length}</span>
                <span>Progress: {PinUtils.calculateCompletion(demoPin)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-luxury-900 text-center mb-6">
            System Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg border border-luxury-200 p-6">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-luxury-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-luxury-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pin Details Modal */}
        <PinDetailsModal
          pin={selectedPin}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handlePinUpdate}
          onStatusChange={handleStatusChange}
          onPhotoUpload={handlePhotoUpload}
          onChildPinCreate={handleChildPinCreate}
          isMobile={isMobile}
        />
      </div>
    </PinErrorBoundary>
  )
}

// Demo data
const demoPin: SmartPin = {
  id: 'pin-demo-1',
  seqNumber: 1,
  roofId: 'roof-demo',
  hierarchy: {
    parentId: null,
    depth: 0,
    fullHierarchyCode: '1'
  },
  position: {
    x: 0.5,
    y: 0.3,
    zone: 'Zone A',
    building: 'Building 1'
  },
  status: 'Open',
  severity: 'High',
  defectType: 'Membrane Separation',
  defectLayer: 'TPO_Membrane',
  defectCategory: 'INCR',
  description: 'Significant membrane separation observed along the eastern edge of the building. The TPO membrane has pulled away from the substrate creating a potential water infiltration point. Immediate repair required to prevent structural damage.',
  notes: 'Weather conditions during inspection: Dry, 72°F. Area accessible via ladder.',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T14:45:00Z',
  openedAt: '2024-01-15T10:30:00Z',
  dueDate: '2024-01-20T17:00:00Z',
  createdBy: 'inspector-1',
  children: [
    {
      id: 'child-1',
      seqNumber: 0,
      roofId: 'roof-demo',
      hierarchy: {
        parentId: 'pin-demo-1',
        parentSeqNumber: 1,
        childSeqNumber: 1,
        depth: 1,
        fullHierarchyCode: '1.1'
      },
      position: { x: 0.51, y: 0.31, zone: 'Zone A' },
      status: 'Open',
      severity: 'Medium',
      defectType: 'Edge Lifting',
      description: 'Minor edge lifting at seam connection',
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      createdBy: 'inspector-1',
      children: [],
      photos: [],
      activities: [],
      childrenStats: { total: 0, open: 0, readyForInspection: 0, closed: 0, inDispute: 0, completionPercentage: 0 },
      sla: { createdToReady: 24, readyToClosed: 48, isOverdue: false, escalationLevel: 0 },
      statusHistory: []
    }
  ],
  photos: [
    {
      id: 'photo-1',
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
      type: 'Open',
      fileName: 'membrane-separation-open.jpg',
      fileSize: 2457600,
      mimeType: 'image/jpeg',
      uploadedAt: '2024-01-15T10:35:00Z',
      uploadedBy: 'inspector-1'
    }
  ],
  activities: [
    {
      id: 'activity-1',
      pinId: 'pin-demo-1',
      action: 'created',
      actorId: 'inspector-1',
      actorName: 'Asaf Peer',
      actorRole: 'Inspector',
      timestamp: '2024-01-15T10:30:00Z'
    }
  ],
  childrenStats: {
    total: 1,
    open: 1,
    readyForInspection: 0,
    closed: 0,
    inDispute: 0,
    completionPercentage: 0
  },
  lastActivityAt: '2024-01-15T14:45:00Z',
  sla: {
    createdToReady: 24,
    readyToClosed: 48,
    isOverdue: false,
    escalationLevel: 0
  },
  statusHistory: [
    {
      status: 'Open',
      changedAt: '2024-01-15T10:30:00Z',
      changedBy: 'Asaf Peer'
    }
  ]
}

const features = [
  {
    icon: '🏗️',
    title: 'Hierarchical Management',
    description: 'Organize pins with parent-child relationships. Create sub-defects and manage complex issues systematically.'
  },
  {
    icon: '🔄',
    title: 'Status Workflow',
    description: 'Professional workflow with Open → Ready for Inspection → Closed states. Role-based permissions and validation.'
  },
  {
    icon: '📸',
    title: 'Photo Management',
    description: 'Upload and organize opening, closing, and documentation photos. Automatic compression and cloud storage.'
  },
  {
    icon: '⚡',
    title: 'Real-time Sync',
    description: 'Live collaboration with WebSocket connections. See other users working and get instant updates.'
  },
  {
    icon: '📱',
    title: 'Mobile-first PWA',
    description: 'Touch gestures, offline support, and native app experience. Install directly from the browser.'
  },
  {
    icon: '🛡️',
    title: 'Error Handling',
    description: 'Comprehensive error handling with validation, recovery strategies, and user-friendly messages.'
  }
]