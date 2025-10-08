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
      updated_at: new Date().toISOString()
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

    const photoUrl = URL.createObjectURL(photo)

    const updatedPin = {
      ...selectedPin,
      documentation_photos: [...(selectedPin.documentation_photos || []), photoUrl],
      updated_at: new Date().toISOString()
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

    console.log('Creating child pin (demo):', childData)

    // Demo: just log the action
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${PinUtils.getSeverityColor(demoPin.severity, 'bg')}`}>
                    {demoPin.seq_number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-luxury-900">
                      Pin #{demoPin.seq_number}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${PinUtils.getStatusColor(demoPin.status, 'badge')}`}>
                        {demoPin.status}
                      </span>
                      <span className="text-sm text-luxury-600">
                        Zone: {demoPin.zone}
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
                  <div className="text-2xl font-bold text-luxury-900">{demoPin.children_total}</div>
                  <div className="text-xs text-luxury-600">Total</div>
                </div>
                <div className="bg-red-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-800">{demoPin.children_open}</div>
                  <div className="text-xs text-red-600">Open</div>
                </div>
                <div className="bg-yellow-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-800">{demoPin.children_ready}</div>
                  <div className="text-xs text-yellow-600">Ready</div>
                </div>
                <div className="bg-green-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-800">{demoPin.children_closed}</div>
                  <div className="text-xs text-green-600">Closed</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-luxury-500">
                <span>Created: {new Date(demoPin.created_at).toLocaleDateString()}</span>
                <span>Photos: {(demoPin.documentation_photos || []).length}</span>
                <span>Progress: {demoPin.completion_percentage}%</span>
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
  seq_number: 1,
  roof_id: 'roof-demo',
  x: 0.5,
  y: 0.3,
  zone: 'Zone A',
  status: 'Open',
  severity: 'High',
  priority: 3,
  issue_type: 'INC',
  defect_type: 'Membrane Separation',
  defect_layer: 'TPO',
  defect_category: 'INCR',
  opening_photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  documentation_photos: [],
  created_by: 'inspector-1',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:45:00Z',
  is_overdue: false,
  days_open: 5,
  escalation_level: 0,
  requires_approval: false,
  children_total: 0,
  children_open: 0,
  children_ready: 0,
  children_closed: 0,
  completion_percentage: 0,
  parent_mix_state: 'ALL_CLOSED',
  target_resolution_time: 48,
  activity_count: 1,
  comment_count: 0,
  mention_count: 0,
  sync_status: 'synced',
  needs_sync: false,
  children: [],
  child_count: 0
} as SmartPin

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