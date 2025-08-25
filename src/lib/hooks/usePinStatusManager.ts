'use client'

import { useState, useCallback } from 'react'
import { 
  Pin, 
  StatusUpdateResult,
  processChildPinClosurePhoto,
  closeChildPin,
  updateParentPinStatus,
  getParentPinStatusSummary,
  validatePinClosure
} from '@/lib/pin-status-manager'

export function usePinStatusManager() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdateResult, setLastUpdateResult] = useState<StatusUpdateResult | null>(null)

  const handleChildPinClosurePhoto = useCallback(async (
    childPin: Pin,
    parentPin: Pin,
    allChildPins: Pin[],
    closurePhotoFile: File
  ): Promise<StatusUpdateResult> => {
    setIsUpdating(true)

    try {
      // Simulate photo upload
      const closurePhotoUrl = URL.createObjectURL(closurePhotoFile)
      
      // Process the closure photo and status updates
      const result = processChildPinClosurePhoto(
        childPin,
        parentPin,
        allChildPins,
        closurePhotoUrl
      )

      setLastUpdateResult(result)

      // In a real implementation, you would:
      // 1. Upload the photo to your storage service
      // 2. Update the database with new pin statuses
      // 3. Send notifications to relevant users
      // 4. Trigger real-time updates to other connected clients

      console.log('Child pin closure photo processed:', result)
      
      return result
    } catch (error) {
      console.error('Failed to process child pin closure photo:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const handleCloseChildPin = useCallback(async (
    childPin: Pin,
    parentPin: Pin,
    allChildPins: Pin[]
  ): Promise<StatusUpdateResult> => {
    setIsUpdating(true)

    try {
      // Validate closure requirements
      const validation = validatePinClosure(childPin)
      if (!validation.canClose) {
        throw new Error(validation.reason || 'Cannot close child pin')
      }

      // Close the child pin
      const result = closeChildPin(childPin, parentPin, allChildPins)
      setLastUpdateResult(result)

      console.log('Child pin closed:', result)
      
      return result
    } catch (error) {
      console.error('Failed to close child pin:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const updateParentStatus = useCallback(async (
    parentPin: Pin,
    childPins: Pin[]
  ): Promise<StatusUpdateResult> => {
    setIsUpdating(true)

    try {
      const result = updateParentPinStatus(parentPin, childPins)
      setLastUpdateResult(result)

      console.log('Parent pin status updated:', result)
      
      return result
    } catch (error) {
      console.error('Failed to update parent pin status:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const getStatusSummary = useCallback((parentPin: Pin, childPins: Pin[]) => {
    return getParentPinStatusSummary(parentPin, childPins)
  }, [])

  const validateClosure = useCallback((pin: Pin) => {
    return validatePinClosure(pin)
  }, [])

  const clearLastResult = useCallback(() => {
    setLastUpdateResult(null)
  }, [])

  return {
    isUpdating,
    lastUpdateResult,
    handleChildPinClosurePhoto,
    handleCloseChildPin,
    updateParentStatus,
    getStatusSummary,
    validateClosure,
    clearLastResult
  }
}