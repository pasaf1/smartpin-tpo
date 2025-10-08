'use client'

/**
 * SmartPin TPO - Unified Pin Details Modal
 * Professional roof inspection platform with hierarchical pin management
 */

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  SmartPin,
  SmartChildPin,
  PinDetailsModalProps,
  PinStatus,
  PhotoUpload,
  UserRole
} from './types'
import { PinHierarchyManager } from './PinHierarchyManager'
import { PinStatusWorkflow } from './PinStatusWorkflow'
import { PinPhotoManager } from './PinPhotoManager'
import { PinRealTimeSync } from './PinRealTimeSync'
import { PinErrorBoundary } from './utils/error-handling'
import { useMobileGestures } from './utils/mobile-gestures'

interface TabItem {
  key: 'overview' | 'hierarchy' | 'photos' | 'activity'
  label: string
  icon: string
  count?: number
}

export const PinDetailsModal: React.FC<PinDetailsModalProps> = ({
  pin,
  isOpen,
  onClose,
  onUpdate,
  onStatusChange,
  onPhotoUpload,
  onChildPinCreate,
  onChildPinUpdate,
  onChildPinDelete,
  currentUser,
  isMobile = false,
  canEdit = true,
  canDelete = false,
  className
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'photos' | 'activity'>('overview')
  const [isUpdating, setIsUpdating] = useState(false)
  const [localPin, setLocalPin] = useState<SmartPin>(pin)
  const [errors, setErrors] = useState<string[]>([])

  // Mobile gesture support
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useMobileGestures({
    onSwipeLeft: () => navigateTab('next'),
    onSwipeRight: () => navigateTab('prev'),
    onLongPress: canEdit ? () => setActiveTab('hierarchy') : undefined,
    enabled: isMobile
  })

  // Tab navigation
  const tabs: TabItem[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon: '📋'
    },
    {
      key: 'hierarchy',
      label: 'Issues',
      icon: '🔗',
      count: localPin.children?.length || 0
    },
    {
      key: 'photos',
      label: 'Photos',
      icon: '📷',
      count: localPin.documentation_photos?.length || 0
    },
    {
      key: 'activity',
      label: 'Activity',
      icon: '📝',
      count: localPin.activity_count || 0
    }
  ]

  const navigateTab = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = tabs.findIndex(tab => tab.key === activeTab)
    let newIndex: number

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % tabs.length
    } else {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
    }

    setActiveTab(tabs[newIndex].key)
  }, [activeTab, tabs])

  // Real-time sync effects
  useEffect(() => {
    setLocalPin(pin)
  }, [pin])

  // Status change handler with validation
  const handleStatusChange = useCallback(async (newStatus: PinStatus, reason?: string) => {
    setIsUpdating(true)
    setErrors([])

    try {
      await onStatusChange(newStatus, reason)
      setLocalPin(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      setErrors([`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`])
      console.error('Status change failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [onStatusChange])

  // Photo upload handler
  const handlePhotoUpload = useCallback(async (files: File[], type: PhotoUpload['type']) => {
    setIsUpdating(true)
    setErrors([])

    try {
      const photoUploads: PhotoUpload[] = files.map(file => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        pin_id: localPin.id,
        type,
        url: '', // Will be set by the upload handler
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: currentUser.id,
        uploaded_at: new Date().toISOString()
      }))

      await onPhotoUpload(photoUploads)
    } catch (error) {
      setErrors([`Failed to upload photos: ${error instanceof Error ? error.message : 'Unknown error'}`])
      console.error('Photo upload failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [localPin.id, currentUser.id, onPhotoUpload])

  // Child pin handlers
  const handleChildPinCreate = useCallback(async () => {
    setIsUpdating(true)
    setErrors([])

    try {
      const childPinData: Partial<SmartChildPin> = {
        pin_id: localPin.id,
        child_code: `${localPin.seq_number}.${(localPin.children?.length || 0) + 1}`,
        status_child: 'Open',
        created_by: currentUser.id,
        issue_description: 'New child issue',
        display_order: (localPin.children?.length || 0) + 1,
        offset_x: 0,
        offset_y: 0,
        requires_inspection: true,
        is_critical: false,
        needs_sync: false,
        documentation_photos: []
      }

      const newChildPin = await onChildPinCreate(childPinData)
      setLocalPin(prev => ({
        ...prev,
        children: [...(prev.children || []), newChildPin],
        children_total: (prev.children_total || 0) + 1,
        children_open: (prev.children_open || 0) + 1
      }))
    } catch (error) {
      setErrors([`Failed to create child pin: ${error instanceof Error ? error.message : 'Unknown error'}`])
      console.error('Child pin creation failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [localPin, currentUser.id, onChildPinCreate])

  const handleChildPinReorder = useCallback(async (reorderedChildren: SmartChildPin[]) => {
    setIsUpdating(true)
    setErrors([])

    try {
      // Update display order for each child
      for (const child of reorderedChildren) {
        await onChildPinUpdate({
          ...child,
          display_order: reorderedChildren.indexOf(child)
        })
      }

      setLocalPin(prev => ({ ...prev, children: reorderedChildren }))
    } catch (error) {
      setErrors([`Failed to reorder child pins: ${error instanceof Error ? error.message : 'Unknown error'}`])
      console.error('Child pin reorder failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [onChildPinUpdate])

  // Calculate status colors and statistics
  const getStatusColor = (status: PinStatus): string => {
    const colors = {
      'Open': 'bg-red-100 text-red-800 border-red-200',
      'ReadyForInspection': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Closed': 'bg-green-100 text-green-800 border-green-200',
      'InDispute': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getSeverityIcon = (severity?: string): string => {
    const icons = {
      'Critical': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢'
    }
    return icons[severity as keyof typeof icons] || '⚪'
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <PinErrorBoundary>
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm"
      )}>
        <div className={cn(
          "bg-white rounded-2xl shadow-luxury-2xl border border-luxury-200 overflow-hidden",
          "w-full max-w-4xl mx-4",
          isMobile ? "h-[90vh]" : "max-h-[80vh]",
          "flex flex-col",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-luxury-50 to-luxury-100 px-6 py-4 border-b border-luxury-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg",
                  localPin.severity === 'Critical' ? 'bg-red-500' :
                  localPin.severity === 'High' ? 'bg-orange-500' :
                  localPin.severity === 'Medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                )}>
                  {localPin.seq_number}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-luxury-900">
                    Pin {localPin.seq_number} Details
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn(
                      "px-3 py-1 text-sm font-medium rounded-full border",
                      getStatusColor(localPin.status)
                    )}>
                      {localPin.status}
                    </span>
                    <span className="text-sm text-luxury-600 flex items-center gap-1">
                      {getSeverityIcon(localPin.severity)}
                      {localPin.severity || 'Medium'}
                    </span>
                    {localPin.is_overdue && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-luxury-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-luxury-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-luxury-900">{localPin.children_total || 0}</div>
                <div className="text-xs text-luxury-600">Total Issues</div>
              </div>
              <div className="bg-red-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-800">{localPin.children_open || 0}</div>
                <div className="text-xs text-red-600">Open</div>
              </div>
              <div className="bg-yellow-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-800">{localPin.children_ready || 0}</div>
                <div className="text-xs text-yellow-600">Ready</div>
              </div>
              <div className="bg-green-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-800">{localPin.children_closed || 0}</div>
                <div className="text-xs text-green-600">Closed</div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex-shrink-0">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm">{error}</p>
                  ))}
                </div>
                <button
                  onClick={() => setErrors([])}
                  className="ml-auto p-1 hover:bg-red-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-luxury-200 bg-luxury-50 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  "flex items-center justify-center gap-2",
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-luxury-600 hover:text-luxury-900 hover:bg-luxury-100"
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full",
                    activeTab === tab.key
                      ? "bg-blue-200 text-blue-800"
                      : "bg-luxury-200 text-luxury-700"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pin Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-luxury-900 mb-4">Pin Information</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-luxury-600">Status:</span>
                        <PinStatusWorkflow
                          pin={localPin}
                          currentStatus={localPin.status}
                          onStatusChange={handleStatusChange}
                          userRole={currentUser.role}
                          availableTransitions={[]} // Will be calculated in component
                          isUpdating={isUpdating}
                          showReasonInput={true}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-luxury-600">Defect Type:</span>
                        <span className="text-luxury-900 font-medium">
                          {localPin.defect_type || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-luxury-600">Layer:</span>
                        <span className="text-luxury-900 font-medium">
                          {localPin.defect_layer || 'Not specified'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-luxury-600">Position:</span>
                        <span className="text-luxury-900 font-mono text-sm">
                          ({localPin.x.toFixed(3)}, {localPin.y.toFixed(3)})
                        </span>
                      </div>

                      {localPin.zone && (
                        <div className="flex justify-between items-center">
                          <span className="text-luxury-600">Zone:</span>
                          <span className="text-luxury-900 font-medium">{localPin.zone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-luxury-900 mb-4">Progress Summary</h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-luxury-600">Completion:</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-luxury-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${localPin.completion_percentage || 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-luxury-900">
                            {localPin.completion_percentage || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-luxury-600">Days Open:</span>
                        <span className={cn(
                          "font-medium",
                          localPin.is_overdue ? "text-red-600" : "text-luxury-900"
                        )}>
                          {localPin.days_open || 0} days
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-luxury-600">Last Activity:</span>
                        <span className="text-sm text-luxury-600">
                          {localPin.last_activity
                            ? new Date(localPin.last_activity).toLocaleDateString()
                            : 'No activity'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hierarchy Tab */}
            {activeTab === 'hierarchy' && (
              <div className="p-6">
                <PinHierarchyManager
                  pin={localPin}
                  onChildReorder={handleChildPinReorder}
                  onChildAdd={handleChildPinCreate}
                  onChildEdit={(childPin) => onChildPinUpdate(childPin)}
                  onChildDelete={onChildPinDelete}
                  canEdit={canEdit}
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="p-6">
                <PinPhotoManager
                  pin={localPin}
                  photos={localPin.documentation_photos?.map(url => ({
                    id: `photo-${Date.now()}-${Math.random()}`,
                    pin_id: localPin.id,
                    type: 'documentation' as const,
                    url,
                    file_name: 'Unknown',
                    file_size: 0,
                    mime_type: 'image/jpeg',
                    uploaded_by: currentUser.id,
                    uploaded_at: new Date().toISOString()
                  })) || []}
                  onPhotoUpload={handlePhotoUpload}
                  onPhotoDelete={async () => {}} // Will be implemented
                  onPhotoUpdate={async () => {}} // Will be implemented
                  canUpload={canEdit}
                  canDelete={canDelete}
                  maxPhotos={30}
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-luxury-900">Activity Feed</h3>
                  <div className="space-y-3">
                    {/* Activity items will be implemented */}
                    <div className="text-center py-8 text-luxury-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>Activity feed coming soon</p>
                      <p className="text-sm">All pin changes and comments will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-luxury-50 border-t border-luxury-200 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-luxury-700 hover:bg-luxury-200 rounded-lg transition-colors"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  // Open edit mode or save changes
                }}
                disabled={isUpdating}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Real-time sync component */}
        <PinRealTimeSync
          projectId={localPin.project_id || ''}
          pinId={localPin.id}
          onPinUpdate={setLocalPin}
          onChildPinUpdate={(updatedChild) => {
            setLocalPin(prev => ({
              ...prev,
              children: prev.children?.map(child =>
                child.child_id === updatedChild.child_id ? updatedChild : child
              ) || []
            }))
          }}
          onActivity={(activity) => {
            console.log('Pin activity:', activity)
          }}
          onPresenceUpdate={(presence) => {
            console.log('User presence:', presence)
          }}
          onError={(error) => {
            setErrors(prev => [...prev, error.message])
          }}
          userId={currentUser.id}
          enabled={isOpen}
        />
      </div>
    </PinErrorBoundary>
  )
}

export default PinDetailsModal