'use client'

/**
 * SmartPin TPO - Pin Status Workflow
 * Professional status transition system with role-based permissions
 */

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  SmartPin,
  SmartChildPin,
  PinStatusWorkflowProps,
  PinStatus,
  StatusTransition,
  UserRole
} from './types'

export const PinStatusWorkflow: React.FC<PinStatusWorkflowProps> = ({
  pin,
  childPin,
  currentStatus,
  onStatusChange,
  userRole,
  availableTransitions = [],
  isUpdating = false,
  showReasonInput = false,
  className
}) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PinStatus | null>(null)
  const [reason, setReason] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Define workflow rules based on SmartPin TPO business logic
  const workflowRules: StatusTransition[] = useMemo(() => [
    // Open -> Ready for Inspection (auto-trigger when closing photo uploaded)
    {
      from: 'Open',
      to: 'ReadyForInspection',
      auto_trigger: true,
      user_role_required: ['Inspector', 'Admin', 'QA_Manager']
    },
    // Open -> Ready for Inspection (manual)
    {
      from: 'Open',
      to: 'ReadyForInspection',
      user_role_required: ['Inspector', 'Admin', 'QA_Manager']
    },
    // Ready for Inspection -> Closed
    {
      from: 'ReadyForInspection',
      to: 'Closed',
      requires_approval: true,
      user_role_required: ['QA_Manager', 'Admin']
    },
    // Ready for Inspection -> In Dispute
    {
      from: 'ReadyForInspection',
      to: 'InDispute',
      user_role_required: ['Inspector', 'Contractor', 'QA_Manager', 'Admin']
    },
    // In Dispute -> Open (re-work required)
    {
      from: 'InDispute',
      to: 'Open',
      user_role_required: ['QA_Manager', 'Admin']
    },
    // In Dispute -> Closed (dispute resolved)
    {
      from: 'InDispute',
      to: 'Closed',
      requires_approval: true,
      user_role_required: ['Admin']
    },
    // Closed -> In Dispute (reopen if issues found)
    {
      from: 'Closed',
      to: 'InDispute',
      user_role_required: ['QA_Manager', 'Admin']
    }
  ], [])

  // Get valid transitions for current status and user role
  const validTransitions = useMemo(() => {
    return workflowRules.filter(rule =>
      rule.from === currentStatus &&
      rule.user_role_required?.includes(userRole)
    )
  }, [workflowRules, currentStatus, userRole])

  // Get status display properties
  const getStatusProps = (status: PinStatus) => {
    const statusConfig = {
      'Open': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔴',
        label: 'Open'
      },
      'ReadyForInspection': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '🟡',
        label: 'Ready for Inspection'
      },
      'Closed': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🟢',
        label: 'Closed'
      },
      'InDispute': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '🟠',
        label: 'In Dispute'
      }
    }
    return statusConfig[status] || statusConfig['Open']
  }

  // Handle status change
  const handleStatusChange = async (newStatus: PinStatus) => {
    if (isUpdating || isChangingStatus) return

    const transition = validTransitions.find(t => t.to === newStatus)
    if (!transition) {
      console.warn(`Invalid transition from ${currentStatus} to ${newStatus}`)
      return
    }

    // Check if reason is required
    if (transition.requires_approval && showReasonInput && !reason.trim()) {
      alert('Please provide a reason for this status change')
      return
    }

    setIsChangingStatus(true)
    try {
      await onStatusChange(newStatus, reason.trim() || undefined)
      setSelectedStatus(null)
      setReason('')
      setShowDropdown(false)
    } catch (error) {
      console.error('Status change failed:', error)
    } finally {
      setIsChangingStatus(false)
    }
  }

  // Handle dropdown selection
  const handleDropdownSelect = (status: PinStatus) => {
    const transition = validTransitions.find(t => t.to === status)
    if (transition?.requires_approval && showReasonInput) {
      setSelectedStatus(status)
      setShowDropdown(false)
    } else {
      handleStatusChange(status)
    }
  }

  const currentStatusProps = getStatusProps(currentStatus)

  return (
    <div className={cn("relative", className)}>
      {/* Current Status Display */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "px-3 py-1 text-sm font-medium rounded-full border inline-flex items-center gap-2",
          currentStatusProps.color
        )}>
          <span>{currentStatusProps.icon}</span>
          <span>{currentStatusProps.label}</span>
        </span>

        {/* Status change dropdown trigger */}
        {validTransitions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isUpdating || isChangingStatus}
              className={cn(
                "p-1 hover:bg-luxury-200 rounded transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Change status"
            >
              <svg className="w-4 h-4 text-luxury-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-luxury-200 rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-2">
                  {validTransitions.map(transition => {
                    const targetStatusProps = getStatusProps(transition.to)
                    return (
                      <button
                        key={transition.to}
                        onClick={() => handleDropdownSelect(transition.to)}
                        disabled={isChangingStatus}
                        className="w-full px-4 py-2 text-left hover:bg-luxury-50 flex items-center gap-3 disabled:opacity-50"
                      >
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          targetStatusProps.color
                        )}>
                          {targetStatusProps.icon}
                        </span>
                        <div>
                          <div className="font-medium text-luxury-900">
                            {targetStatusProps.label}
                          </div>
                          {transition.requires_approval && (
                            <div className="text-xs text-luxury-500">
                              Requires approval
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {(isUpdating || isChangingStatus) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Reason input modal */}
      {selectedStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Change Status to {getStatusProps(selectedStatus).label}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-luxury-700 mb-2">
                Reason for status change *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're changing the status..."
                className="w-full px-3 py-2 border border-luxury-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedStatus(null)
                  setReason('')
                }}
                className="px-4 py-2 text-sm font-medium text-luxury-700 hover:bg-luxury-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedStatus && handleStatusChange(selectedStatus)}
                disabled={!reason.trim() || isChangingStatus}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isChangingStatus ? 'Changing...' : 'Change Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default PinStatusWorkflow