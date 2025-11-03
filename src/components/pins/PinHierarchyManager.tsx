'use client'

/**
 * SmartPin TPO - Pin Hierarchy Manager
 * Manages parent-child pin relationships with drag-and-drop reordering
 */

import React, { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { cn } from '@/lib/utils'
import {
  SmartPin,
  SmartChildPin,
  PinHierarchyManagerProps,
  PinStatus
} from './types'
import { PinStatusWorkflow } from './PinStatusWorkflow'

export const PinHierarchyManager: React.FC<PinHierarchyManagerProps> = ({
  pin,
  onChildReorder,
  onChildAdd,
  onChildEdit,
  onChildDelete,
  canEdit,
  isMobile = false
}) => {
  const [expandedChildIds, setExpandedChildIds] = useState<Set<string>>(new Set())
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  // Toggle child pin expansion
  const toggleChildExpansion = useCallback((childId: string) => {
    setExpandedChildIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(childId)) {
        newSet.delete(childId)
      } else {
        newSet.add(childId)
      }
      return newSet
    })
  }, [])

  // Get status colors
  const getStatusColor = (status: PinStatus, type: 'bg' | 'badge' = 'badge'): string => {
    const colors = {
      'Open': type === 'bg' ? 'bg-red-500' : 'bg-red-100 text-red-800 border-red-200',
      'ReadyForInspection': type === 'bg' ? 'bg-yellow-500' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Closed': type === 'bg' ? 'bg-green-500' : 'bg-green-100 text-green-800 border-green-200',
      'InDispute': type === 'bg' ? 'bg-orange-500' : 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status] || (type === 'bg' ? 'bg-gray-500' : 'bg-gray-100 text-gray-800 border-gray-200')
  }

  const getStatusIcon = (status: PinStatus): string => {
    const icons = {
      'Open': '🔴',
      'ReadyForInspection': '🟡',
      'Closed': '🟢',
      'InDispute': '🟠'
    }
    return icons[status] || '⚪'
  }

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(async (result: any) => {
    if (!result.destination || !canEdit || !pin) {
      return
    }

    const items = Array.from(pin.children)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order for all items
    const reorderedWithOrder = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    setIsReordering(true)
    try {
      await onChildReorder(reorderedWithOrder)
    } finally {
      setIsReordering(false)
    }
  }, [pin, onChildReorder, canEdit])

  // Get child pin statistics
  const childStats = {
    total: pin?.children?.length || 0,
    open: pin?.children?.filter(child => child.status_child === 'Open').length || 0,
    ready: pin?.children?.filter(child => child.status_child === 'ReadyForInspection').length || 0,
    closed: pin?.children?.filter(child => child.status_child === 'Closed').length || 0
  }

  // Guard clause for null pin
  if (!pin) return null

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-luxury-900">Child Issues</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-sm text-luxury-600">
              Total: <span className="font-medium">{childStats.total}</span>
            </div>
            <div className="text-sm text-red-600">
              Open: <span className="font-medium">{childStats.open}</span>
            </div>
            <div className="text-sm text-yellow-600">
              Ready: <span className="font-medium">{childStats.ready}</span>
            </div>
            <div className="text-sm text-green-600">
              Closed: <span className="font-medium">{childStats.closed}</span>
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={onChildAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Child Issue
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {childStats.total > 0 && (
        <div className="bg-luxury-100 rounded-full h-2 overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(childStats.open / childStats.total) * 100}%` }}
            />
            <div
              className="bg-yellow-500 transition-all duration-300"
              style={{ width: `${(childStats.ready / childStats.total) * 100}%` }}
            />
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(childStats.closed / childStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Child pins list */}
      {pin.children?.length === 0 ? (
        <div className="text-center py-12 text-luxury-500">
          <div className="text-6xl mb-4">📍</div>
          <h4 className="text-lg font-medium mb-2">No child issues yet</h4>
          <p className="text-sm mb-4">Create child issues to track specific problems within this pin</p>
          {canEdit && (
            <button
              onClick={onChildAdd}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create First Child Issue
            </button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="child-pins" isDropDisabled={!canEdit || isReordering}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-3",
                  snapshot.isDraggingOver && "bg-blue-50 rounded-lg p-2"
                )}
              >
                {pin.children
                  ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map((childPin, index) => (
                    <Draggable
                      key={childPin.child_id}
                      draggableId={childPin.child_id}
                      index={index}
                      isDragDisabled={!canEdit || isReordering}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "border border-luxury-200 rounded-lg overflow-hidden",
                            "bg-white shadow-sm transition-all",
                            snapshot.isDragging && "shadow-lg rotate-2",
                            selectedChildId === childPin.child_id && "border-blue-300 shadow-md"
                          )}
                        >
                          {/* Child pin header */}
                          <div
                            className={cn(
                              "p-4 cursor-pointer transition-colors",
                              expandedChildIds.has(childPin.child_id) ? "bg-luxury-50" : "hover:bg-luxury-25"
                            )}
                            onClick={() => toggleChildExpansion(childPin.child_id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Drag handle */}
                                {canEdit && (
                                  <div
                                    {...provided.dragHandleProps}
                                    className="p-1 hover:bg-luxury-200 rounded cursor-grab active:cursor-grabbing"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-4 h-4 text-luxury-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                    </svg>
                                  </div>
                                )}

                                {/* Child pin icon and code */}
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                                  getStatusColor(childPin.status_child || 'Open', 'bg')
                                )}>
                                  {childPin.child_code?.split('.')[1] || index + 1}
                                </div>

                                <div>
                                  <div className="font-medium text-luxury-900">
                                    {childPin.issue_description || `Child Issue ${childPin.child_code}`}
                                  </div>
                                  <div className="text-sm text-luxury-600 flex items-center gap-2">
                                    <span>Code: {childPin.child_code}</span>
                                    {childPin.defect_type && (
                                      <>
                                        <span>•</span>
                                        <span>{childPin.defect_type}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Status badge */}
                                <span className={cn(
                                  "px-3 py-1 text-xs font-medium rounded-full border",
                                  getStatusColor(childPin.status_child || 'Open', 'badge')
                                )}>
                                  {getStatusIcon(childPin.status_child || 'Open')}
                                  {childPin.status_child || 'Open'}
                                </span>

                                {/* Critical indicator */}
                                {childPin.is_critical && (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    Critical
                                  </span>
                                )}

                                {/* Expand/collapse icon */}
                                <svg
                                  className={cn(
                                    "w-5 h-5 text-luxury-400 transition-transform",
                                    expandedChildIds.has(childPin.child_id) && "rotate-180"
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
                          {expandedChildIds.has(childPin.child_id) && (
                            <div className="p-4 border-t border-luxury-200 bg-white">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Child pin information */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-luxury-900 mb-3">Issue Details</h4>

                                  <div className="space-y-3">
                                    {/* Status workflow */}
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-luxury-600">Status:</span>
                                      <PinStatusWorkflow
                                        pin={pin}
                                        childPin={childPin}
                                        currentStatus={childPin.status_child || 'Open'}
                                        onStatusChange={async (newStatus) => {
                                          const updatedChild = {
                                            ...childPin,
                                            status_child: newStatus
                                          }
                                          onChildEdit(updatedChild)
                                        }}
                                        userRole="Inspector" // Will be passed from parent
                                        availableTransitions={[]} // Will be calculated
                                        showReasonInput={false}
                                        className="text-sm"
                                      />
                                    </div>

                                    {childPin.defect_layer && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-luxury-600">Layer:</span>
                                        <span className="text-sm font-medium text-luxury-900">{childPin.defect_layer}</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-luxury-600">Requires Inspection:</span>
                                      <span className={cn(
                                        "text-sm font-medium",
                                        childPin.requires_inspection ? "text-yellow-600" : "text-green-600"
                                      )}>
                                        {childPin.requires_inspection ? 'Yes' : 'No'}
                                      </span>
                                    </div>

                                    {childPin.estimated_hours && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-luxury-600">Estimated Hours:</span>
                                        <span className="text-sm font-medium text-luxury-900">{childPin.estimated_hours}h</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  {childPin.notes && (
                                    <div className="mt-4">
                                      <h5 className="text-sm font-semibold text-luxury-900 mb-2">Notes</h5>
                                      <div className="text-sm text-luxury-600 bg-luxury-50 p-3 rounded-lg">
                                        {childPin.notes}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Photos section */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-luxury-900 mb-3">Photos</h4>

                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Opening photo */}
                                    <div>
                                      <label className="block text-sm font-medium text-luxury-700 mb-2">Opening Photo</label>
                                      <div className="aspect-square bg-luxury-100 rounded-lg border-2 border-dashed border-luxury-300 flex items-center justify-center">
                                        {childPin.open_pic_url ? (
                                          <img
                                            src={childPin.open_pic_url}
                                            alt="Opening photo"
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                        ) : (
                                          <div className="text-center text-luxury-500">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs">No photo</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Closing photo */}
                                    <div>
                                      <label className="block text-sm font-medium text-luxury-700 mb-2">Closing Photo</label>
                                      <div className="aspect-square bg-luxury-100 rounded-lg border-2 border-dashed border-luxury-300 flex items-center justify-center">
                                        {childPin.close_pic_url ? (
                                          <img
                                            src={childPin.close_pic_url}
                                            alt="Closing photo"
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                        ) : (
                                          <div className="text-center text-luxury-500">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-xs">No photo</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              {canEdit && (
                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-luxury-200">
                                  <button
                                    onClick={() => onChildEdit(childPin)}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete child issue ${childPin.child_code}?`)) {
                                        onChildDelete(childPin.child_id)
                                      }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    Delete Issue
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Loading indicator */}
      {isReordering && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Reordering issues...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PinHierarchyManager