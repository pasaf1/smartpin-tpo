// Enhanced hooks with proper error handling and TypeScript
import React, { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pinService } from '../services/PinServiceEnhanced'
import { storageService } from '../services/StorageService'
import { isRLSError, getRLSErrorMessage } from '@/components/error/RLSErrorBoundary'
import type { 
  PinWithRelations, 
  CreatePinForm, 
  CreatePinChildForm, 
  PinStatistics,
  UploadPhotoForm,
  PhotoUploadProgress
} from '../types/relations'
import type { Pin, PinChild, Photo, PinUpdate, PinChildUpdate } from '../database.types'

// ===============================
// PIN HOOKS
// ===============================

/**
 * Get pins for roof with real-time updates
 */
export function usePinsForRoof(roofId: string) {
  return useQuery({
    queryKey: ['pins', 'roof', roofId],
    queryFn: () => pinService.getPinsForRoof(roofId),
    enabled: !!roofId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on RLS errors
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Get single pin with relations
 */
export function usePin(pinId: string) {
  return useQuery({
    queryKey: ['pins', pinId],
    queryFn: () => pinService.getPinById(pinId),
    enabled: !!pinId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Create pin mutation
 */
export function useCreatePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePinForm) => pinService.createPin(data),
    onSuccess: (newPin: Pin) => {
      // Invalidate and refetch roof pins
      queryClient.invalidateQueries({ queryKey: ['pins', 'roof', newPin.roof_id] })
      // Invalidate roof statistics
      queryClient.invalidateQueries({ queryKey: ['pin-statistics', newPin.roof_id] })
    },
    onError: (error: any) => {
      console.error('Failed to create pin:', error)
    }
  })
}

/**
 * Update pin mutation
 */
export function useUpdatePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pinId, updates }: { pinId: string; updates: PinUpdate }) => 
      pinService.updatePin(pinId, updates),
    onSuccess: (updatedPin: Pin) => {
      // Update specific pin in cache
      queryClient.setQueryData(['pins', updatedPin.id], updatedPin)
      // Invalidate roof pins
      queryClient.invalidateQueries({ queryKey: ['pins', 'roof', updatedPin.roof_id] })
      // Invalidate statistics if status changed
      if (updatedPin.status) {
        queryClient.invalidateQueries({ queryKey: ['pin-statistics', updatedPin.roof_id] })
      }
    }
  })
}

/**
 * Delete pin mutation
 */
export function useDeletePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pinId: string) => pinService.deletePin(pinId),
    onSuccess: (_, pinId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['pins', pinId] })
      // Invalidate roof pins list
      queryClient.invalidateQueries({ queryKey: ['pins', 'roof'] })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: ['pin-statistics'] })
    }
  })
}

/**
 * Close pin mutation with validation
 */
export function useClosePin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pinId: string) => pinService.closePin(pinId),
    onSuccess: (closedPin: Pin) => {
      // Update pin in cache
      queryClient.setQueryData(['pins', closedPin.id], closedPin)
      // Invalidate roof pins
      queryClient.invalidateQueries({ queryKey: ['pins', 'roof', closedPin.roof_id] })
      // Update statistics
      queryClient.invalidateQueries({ queryKey: ['pin-statistics', closedPin.roof_id] })
    }
  })
}

// ===============================
// CHILD PIN HOOKS
// ===============================

/**
 * Create child pin mutation
 */
export function useCreateChildPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePinChildForm) => pinService.createChildPin(data),
    onSuccess: (newChild: PinChild) => {
      // Invalidate parent pin to get updated children
      queryClient.invalidateQueries({ queryKey: ['pins', newChild.pin_id] })
      // Invalidate roof pins
      queryClient.invalidateQueries({ queryKey: ['pins', 'roof'] })
    }
  })
}

/**
 * Update child pin mutation
 */
export function useUpdateChildPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ childId, updates }: { childId: string; updates: PinChildUpdate }) => 
      pinService.updateChildPin(childId, updates),
    onSuccess: (updatedChild: PinChild) => {
      // Invalidate parent pin
      queryClient.invalidateQueries({ queryKey: ['pins', updatedChild.pin_id] })
      // Invalidate roof pins if status changed
      if (updatedChild.status_child) {
        queryClient.invalidateQueries({ queryKey: ['pins', 'roof'] })
      }
    }
  })
}

// ===============================
// STATISTICS HOOKS
// ===============================

/**
 * Get pin statistics for roof
 */
export function usePinStatistics(roofId: string) {
  return useQuery({
    queryKey: ['pin-statistics', roofId],
    queryFn: () => pinService.getRoofPinStatistics(roofId),
    enabled: !!roofId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30 // Refetch every 30 seconds
  })
}

// ===============================
// PHOTO HOOKS
// ===============================

/**
 * Get photos for pin or child
 */
export function usePhotos(pinId?: string, childId?: string) {
  return useQuery({
    queryKey: ['photos', { pinId, childId }],
    queryFn: () => storageService.getPhotos(pinId, childId),
    enabled: !!(pinId || childId),
    staleTime: 1000 * 60 * 2 // 2 minutes
  })
}

/**
 * Upload photo with progress tracking
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<PhotoUploadProgress>({ 
    progress: 0, 
    status: 'idle' 
  })

  const mutation = useMutation({
    mutationFn: async (data: UploadPhotoForm) => {
      setProgress({ progress: 0, status: 'uploading' })
      
      return storageService.uploadPhoto(data, (progressData) => {
        setProgress(progressData)
      })
    },
    onSuccess: (newPhoto: Photo) => {
      setProgress({ progress: 100, status: 'success' })
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['photos', { pinId: newPhoto.pin_id, childId: newPhoto.child_id }] 
      })
      
      // If this affects a pin or child, invalidate those too
      if (newPhoto.pin_id) {
        queryClient.invalidateQueries({ queryKey: ['pins', newPhoto.pin_id] })
      }
      if (newPhoto.child_id) {
        queryClient.invalidateQueries({ queryKey: ['pins', 'roof'] })
      }
    },
    onError: (error: any) => {
      setProgress({ progress: 0, status: 'error', error: error.message })
    }
  })

  const reset = useCallback(() => {
    setProgress({ progress: 0, status: 'idle' })
  }, [])

  return {
    ...mutation,
    progress,
    reset
  }
}

/**
 * Replace photo mutation
 */
export function useReplacePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ photoId, newFile }: { photoId: string; newFile: File }) => 
      storageService.replacePhoto(photoId, newFile),
    onSuccess: (updatedPhoto: Photo) => {
      // Invalidate photo queries
      queryClient.invalidateQueries({ 
        queryKey: ['photos', { pinId: updatedPhoto.pin_id, childId: updatedPhoto.child_id }] 
      })
      
      // Invalidate related pins
      if (updatedPhoto.pin_id) {
        queryClient.invalidateQueries({ queryKey: ['pins', updatedPhoto.pin_id] })
      }
    }
  })
}

/**
 * Delete photo mutation
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (photoId: string) => storageService.deletePhoto(photoId),
    onSuccess: (_, photoId) => {
      // Invalidate all photo queries (we don't know which pin/child this belonged to)
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      // Invalidate all pins to refresh photo relationships
      queryClient.invalidateQueries({ queryKey: ['pins'] })
    }
  })
}

// ===============================
// REAL-TIME HOOKS
// ===============================

/**
 * Real-time subscription to roof pins
 */
export function useRealTimePins(roofId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['pins', 'roof', roofId, 'realtime'],
    queryFn: () => pinService.getPinsForRoof(roofId),
    enabled: !!roofId,
    refetchInterval: false, // Disable polling, we'll use subscriptions
  })

  // Set up real-time subscription in a separate effect
  useEffect(() => {
    if (!roofId) return

    const subscription = pinService.subscribeToRoofPins(roofId, (pins) => {
      queryClient.setQueryData(['pins', 'roof', roofId], pins)
      queryClient.invalidateQueries({ queryKey: ['pin-statistics', roofId] })
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [roofId, queryClient])

  return query
}

// ===============================
// ERROR HANDLING HOOK
// ===============================

/**
 * Error boundary for service operations
 */
export function useServiceError() {
  const handleError = useCallback((error: any, context: string) => {
    console.error(`[${context}] Service error:`, error)
    
    // Check for specific error types
    if (error.message?.includes('הרשאה')) {
      return {
        type: 'permission',
        message: error.message,
        canRetry: false
      }
    }
    
    if (error.message?.includes('רשת')) {
      return {
        type: 'network',
        message: 'בעיית רשת. אנא בדקו את החיבור לאינטרנט.',
        canRetry: true
      }
    }
    
    if (error.message?.includes('שדה חובה')) {
      return {
        type: 'validation',
        message: error.message,
        canRetry: false
      }
    }
    
    return {
      type: 'unknown',
      message: error.message || 'שגיאה לא ידועה',
      canRetry: true
    }
  }, [])

  return { handleError }
}
