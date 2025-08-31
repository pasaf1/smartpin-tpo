'use client'

import { useState, useEffect, useCallback } from 'react'
import { PushNotificationService, NotificationPayload } from '@/lib/notifications/PushNotificationService'
import { useAuth } from '@/lib/auth/AuthContext'

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  testNotification: (payload?: Partial<NotificationPayload>) => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth()
  const [service] = useState(() => new PushNotificationService())
  
  const [state, setState] = useState({
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isSubscribed: false,
    isLoading: true,
    error: null as string | null
  })

  // Initialize service and check status
  const checkStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const initialized = await service.initialize()
      if (!initialized) {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          isLoading: false,
          error: 'Push notifications not supported'
        }))
        return
      }

      const status = await service.getSubscriptionStatus()
      
      setState(prev => ({
        ...prev,
        isSupported: status.supported,
        permission: status.permission,
        isSubscribed: status.subscribed,
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to check notification status:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [service])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return false
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const success = await service.subscribe(user.id)
      
      if (success) {
        setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }))
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to subscribe to push notifications'
        }))
      }
      
      return success
    } catch (error) {
      console.error('Subscription failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Subscription failed'
      }))
      return false
    }
  }, [user, service])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const success = await service.unsubscribe(user.id)
      
      if (success) {
        setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }))
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to unsubscribe from push notifications'
        }))
      }
      
      return success
    } catch (error) {
      console.error('Unsubscription failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unsubscription failed'
      }))
      return false
    }
  }, [user, service])

  // Test notification (local)
  const testNotification = useCallback(async (payload?: Partial<NotificationPayload>) => {
    try {
      const defaultPayload: NotificationPayload = {
        title: 'SmartPin TPO Test',
        body: 'This is a test notification from SmartPin TPO',
        icon: '/icons/icon-192x192.png',
        tag: 'test-notification',
        ...payload
      }
      
      await service.showLocalNotification(defaultPayload)
    } catch (error) {
      console.error('Test notification failed:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Test notification failed'
      }))
    }
  }, [service])

  // Initialize on mount and when user changes
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    isSupported: state.isSupported,
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    isLoading: state.isLoading,
    error: state.error,
    subscribe,
    unsubscribe,
    testNotification
  }
}

// Hook for sending notifications (for admin/server use)
export function useNotificationSender() {
  const sendPinCreatedNotification = useCallback(async (
    pinNumber: number, 
    projectId: string, 
    projectName: string
  ) => {
    try {
      // This would typically call an API endpoint that uses ServerPushService
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pin_created',
          projectId,
          data: { pinNumber, projectName }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
      
      return true
    } catch (error) {
      console.error('Failed to send pin created notification:', error)
      return false
    }
  }, [])

  const sendStatusChangeNotification = useCallback(async (
    pinNumber: number,
    oldStatus: string,
    newStatus: string,
    projectId: string,
    projectName: string
  ) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_changed',
          projectId,
          data: { pinNumber, oldStatus, newStatus, projectName }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
      
      return true
    } catch (error) {
      console.error('Failed to send status change notification:', error)
      return false
    }
  }, [])

  const sendPhotoUploadedNotification = useCallback(async (
    pinNumber: number,
    photoType: 'opening' | 'closing',
    projectId: string,
    projectName: string
  ) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'photo_uploaded',
          projectId,
          data: { pinNumber, photoType, projectName }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
      
      return true
    } catch (error) {
      console.error('Failed to send photo uploaded notification:', error)
      return false
    }
  }, [])

  const sendCommentNotification = useCallback(async (
    pinNumber: number,
    commenterName: string,
    projectId: string,
    projectName: string
  ) => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comment_added',
          projectId,
          data: { pinNumber, commenterName, projectName }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
      
      return true
    } catch (error) {
      console.error('Failed to send comment notification:', error)
      return false
    }
  }, [])

  return {
    sendPinCreatedNotification,
    sendStatusChangeNotification,
    sendPhotoUploadedNotification,
    sendCommentNotification
  }
}