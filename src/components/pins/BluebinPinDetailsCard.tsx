'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'
import { useBluebinRealtimeSync } from '@/lib/hooks/useBluebinRealtimeSync'

import type { PinWithRelations, ChildPinWithUIFields, AddChildPinHandler, UpdateChildPinHandler, DeleteChildPinHandler } from '@/lib/database.types'

interface BluebinPinDetailsCardProps {
  pin: PinWithRelations
  childPins: ChildPinWithUIFields[]
  onClose: () => void
  onStatusChange: (pinId: string, newStatus: 'Open' | 'ReadyForInspection' | 'Closed', isChild?: boolean) => void
  onAddChildPin: AddChildPinHandler
  onUpdateChildPin: UpdateChildPinHandler
  onDeleteChildPin: DeleteChildPinHandler
  className?: string
  isMobile?: boolean
}

export function BluebinPinDetailsCard({
  pin,
  childPins,
  onClose,
  onStatusChange,
  onAddChildPin,
  onUpdateChildPin,
  onDeleteChildPin,
  className,
  isMobile = false
}: BluebinPinDetailsCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'children' | 'photos'>('overview')
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = getSupabase()

  // Real-time sync for this specific pin using BLUEBIN manager
  const { 
    broadcast, 
    broadcastChildPinOperation, 
    isConnected 
  } = useBluebinRealtimeSync({
    roofId: pin.roof_id,
    onChildPinUpdate: (payload) => {
      console.log('Child pin updated in real-time:', payload)
      // Trigger data refresh or optimistic update
    },
    onPinUpdate: (payload) => {
      console.log('Parent pin updated in real-time:', payload)
    }
  })

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return 'bg-red-500'
      case 'High': return 'bg-orange-500' 
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800'
      case 'ReadyForInspection': return 'bg-yellow-100 text-yellow-800'
      case 'Closed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = async (newStatus: 'Open' | 'ReadyForInspection' | 'Closed', childPin?: ChildPinWithUIFields) => {
    setIsUpdating(true)
    
    try {
      if (childPin) {
        // Update child pin status
        await onStatusChange(childPin.id || childPin.child_id || childPin.child_id, newStatus, true)
        // Broadcast change to other users using BLUEBIN manager
        broadcastChildPinOperation('update', {
          childPinId: childPin.id || childPin.child_id,
          parentPinId: pin.id,
          newStatus,
          seq: childPin.seq || childPin.child_code
        })
      } else {
        // Update parent pin status
        await onStatusChange(pin.id, newStatus, false)
        // Broadcast change to other users using BLUEBIN manager
        broadcast('pin_status_changed', {
          pinId: pin.id,
          newStatus,
          seqNumber: pin.seq_number
        })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddChildPin = () => {
    onAddChildPin(pin)
    broadcastChildPinOperation('create', {
      parentPinId: pin.id,
      seqNumber: pin.seq_number
    })
  }

  const toggleChildExpansion = (childId: string) => {
    setExpandedChildId(expandedChildId === childId ? null : childId)
  }

  const StatusSelect = ({ 
    currentStatus, 
    onStatusChange, 
    disabled = false 
  }: { 
    currentStatus: string
    onStatusChange: (status: 'Open' | 'ReadyForInspection' | 'Closed') => void
    disabled?: boolean 
  }) => (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value as 'Open' | 'ReadyForInspection' | 'Closed')}
      disabled={disabled || isUpdating}
      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
    >
      <option value="Open">Open</option>
      <option value="ReadyForInspection">Ready for Inspection</option>
      <option value="Closed">Closed</option>
    </select>
  )

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-luxury-xl border border-luxury-200 overflow-hidden",
      isMobile ? "fixed inset-x-2 bottom-2 top-20 z-50" : "w-full max-w-2xl mx-auto",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-luxury-50 to-luxury-100 px-6 py-4 border-b border-luxury-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg",
              getSeverityColor(pin.severity || 'Low')
            )}>
              {pin.seq_number}
            </div>
            <div>
              <h2 className="text-xl font-bold text-luxury-900">
                Pin {pin.seq_number} Details
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(pin.status))}>
                  {pin.status}
                </span>
                <span className="text-sm text-luxury-600">
                  {pin.zone && `Zone: ${pin.zone}`}
                </span>
                {isConnected && (
                  <span className="text-xs text-green-600 font-medium">🟢 Live</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-luxury-200 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-luxury-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pin statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-luxury-900">{pin.children_total}</div>
            <div className="text-xs text-luxury-600">Total Issues</div>
          </div>
          <div className="bg-red-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-800">{pin.children_open}</div>
            <div className="text-xs text-red-600">Open</div>
          </div>
          <div className="bg-yellow-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-800">{pin.children_ready}</div>
            <div className="text-xs text-yellow-600">Ready</div>
          </div>
          <div className="bg-green-100/70 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-800">{pin.children_closed}</div>
            <div className="text-xs text-green-600">Closed</div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-luxury-200 bg-luxury-50">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'children', label: `Child Issues (${pin.children_total})` },
          { key: 'photos', label: 'Photos' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-luxury-600 hover:text-luxury-900 hover:bg-luxury-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        isMobile ? "max-h-[calc(100vh-300px)]" : "max-h-96"
      )}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-luxury-900 mb-4">Pin Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-luxury-600">Status:</span>
                    <StatusSelect
                      currentStatus={pin.status}
                      onStatusChange={(status) => handleStatusChange(status)}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-600">Severity:</span>
                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full text-white", getSeverityColor(pin.severity || 'Low'))}>
                      {pin.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-600">Position:</span>
                    <span className="text-luxury-900 font-mono text-sm">
                      ({pin.x.toFixed(3)}, {pin.y.toFixed(3)})
                    </span>
                  </div>
                  {pin.zone && (
                    <div className="flex justify-between">
                      <span className="text-luxury-600">Zone:</span>
                      <span className="text-luxury-900">{pin.zone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-luxury-900 mb-4">Status Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-luxury-600">Parent Status:</span>
                    <span className={cn(
                      "px-3 py-1 text-sm font-medium rounded-full",
                      pin.parent_mix_state === 'ALL_CLOSED' ? "bg-green-100 text-green-800" :
                      pin.parent_mix_state === 'MIXED' ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    )}>
                      {pin.parent_mix_state === 'ALL_CLOSED' ? 'All Complete' :
                       pin.parent_mix_state === 'MIXED' ? 'In Progress' :
                       'Open Issues'}
                    </span>
                  </div>
                  <div className="text-sm text-luxury-600">
                    Progress: {pin.children_total > 0 ? 
                      Math.round((pin.children_closed / pin.children_total) * 100) : 0}% complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Child Issues Tab */}
        {activeTab === 'children' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-luxury-900">Child Issues</h3>
              <button
                onClick={handleAddChildPin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Child Issue
              </button>
            </div>

            <div className="space-y-3">
              {childPins.length === 0 ? (
                <div className="text-center py-8 text-luxury-500">
                  <div className="text-4xl mb-2">📍</div>
                  <p>No child issues yet</p>
                  <p className="text-sm">Click "Add Child Issue" to create one</p>
                </div>
              ) : (
                childPins.map(childPin => (
                  <div key={childPin.id || childPin.child_id} className="border border-luxury-200 rounded-lg overflow-hidden">
                    <div 
                      className="p-4 bg-luxury-50 hover:bg-luxury-100 cursor-pointer transition-colors"
                      onClick={() => toggleChildExpansion(childPin.id || childPin.child_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                            getSeverityColor(childPin.severity)
                          )}>
                            {childPin.seq || childPin.child_code.split('.')[1] || childPin.seq || childPin.child_code}
                          </div>
                          <div>
                            <div className="font-medium text-luxury-900">
                              {childPin.title || `Issue ${childPin.seq || childPin.child_code}`}
                            </div>
                            <div className="text-sm text-luxury-600">
                              {childPin.defect_layer && `${childPin.defect_layer} • `}
                              Created {new Date(childPin.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(childPin.status || childPin.status_child))}>
                            {childPin.status || childPin.status_child}
                          </span>
                          <svg 
                            className={cn(
                              "w-4 h-4 text-luxury-400 transition-transform",
                              expandedChildId === childPin.id || childPin.child_id && "rotate-180"
                            )} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded child pin details */}
                    {expandedChildId === childPin.id || childPin.child_id && (
                      <div className="p-4 border-t border-luxury-200 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Child pin info */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-luxury-700 mb-1">Status</label>
                              <StatusSelect
                                currentStatus={childPin.status || childPin.status_child}
                                onStatusChange={(status) => handleStatusChange(status, childPin)}
                                disabled={isUpdating}
                              />
                            </div>
                            
                            {childPin.description && (
                              <div>
                                <label className="block text-sm font-medium text-luxury-700 mb-1">Description</label>
                                <p className="text-sm text-luxury-600 bg-luxury-50 p-3 rounded-lg">
                                  {childPin.description}
                                </p>
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-luxury-700 mb-1">Position</label>
                              <p className="text-sm font-mono text-luxury-600">
                                ({(childPin.x || 0).toFixed(3)}, {(childPin.y || 0).toFixed(3)})
                              </p>
                            </div>
                          </div>

                          {/* Photos */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-luxury-700 mb-2">Open Picture</label>
                              <div className="w-full h-32 bg-luxury-100 rounded-lg flex items-center justify-center border-2 border-dashed border-luxury-300">
                                {childPin.open_pic_url ? (
                                  <img 
                                    src={childPin.open_pic_url} 
                                    alt="Open picture" 
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="text-center text-luxury-500">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">No open picture</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-luxury-700 mb-2">Close Picture</label>
                              <div className="w-full h-32 bg-luxury-100 rounded-lg flex items-center justify-center border-2 border-dashed border-luxury-300">
                                {childPin.close_pic_url ? (
                                  <img 
                                    src={childPin.close_pic_url} 
                                    alt="Close picture" 
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="text-center text-luxury-500">
                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">No close picture</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 flex justify-end gap-2">
                          <button
                            onClick={() => onUpdateChildPin(childPin)}
                            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteChildPin(childPin.id || childPin.child_id)}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-luxury-900 mb-4">All Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {childPins.flatMap(childPin => [
                ...(childPin.open_pic_url ? [{
                  id: `${childPin.id || childPin.child_id}-open`,
                  url: childPin.open_pic_url,
                  type: 'Open',
                  childSeq: childPin.seq || childPin.child_code
                }] : []),
                ...(childPin.close_pic_url ? [{
                  id: `${childPin.id || childPin.child_id}-close`,
                  url: childPin.close_pic_url,
                  type: 'Close',
                  childSeq: childPin.seq || childPin.child_code
                }] : [])
              ]).map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={`${photo.type} picture for ${photo.childSeq}`}
                    className="w-full h-32 object-cover rounded-lg border border-luxury-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                      {photo.childSeq} - {photo.type}
                    </div>
                  </div>
                </div>
              ))}
              
              {childPins.every(cp => !cp.open_pic_url && !cp.close_pic_url) && (
                <div className="col-span-full text-center py-8 text-luxury-500">
                  <div className="text-4xl mb-2">📸</div>
                  <p>No photos yet</p>
                  <p className="text-sm">Photos will appear here when child issues are documented</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}