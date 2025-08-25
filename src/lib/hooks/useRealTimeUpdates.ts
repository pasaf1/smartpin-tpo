// Dedicated real-time update hooks for SmartPin TPO
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '../supabase-production'
import { queryKeys } from './useSupabaseQueries'
import { toast } from 'sonner'

// Real-time notification types
export interface RealTimeNotification {
  id: string
  type: 'pin_created' | 'pin_updated' | 'pin_status_changed' | 'photo_uploaded' | 'chat_message' | 'user_joined'
  title: string
  message: string
  timestamp: string
  userId?: string
  userName?: string
  pinId?: string
  roofId?: string
  projectId?: string
}

// Global real-time notifications hook
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Subscribe to global real-time updates for notifications
    const subscription = db.realtime.subscribeToProject('*', (payload) => {
      const notification = createNotificationFromPayload(payload)
      if (notification) {
        setNotifications(prev => [notification, ...prev.slice(0, 99)]) // Keep last 100
        setUnreadCount(prev => prev + 1)
        
        // Show toast notification
        toast(notification.title, {
          description: notification.message,
          duration: 5000,
        })
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const markAsRead = (notificationId?: string) => {
    if (notificationId) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } else {
      // Mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications
  }
}

// Enhanced project dashboard with real-time updates
export function useRealTimeProjectDashboard() {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  useEffect(() => {
    // Subscribe to all project changes for dashboard overview
    const subscription = db.realtime.subscribeToProject('*', (payload) => {
      console.log('Dashboard real-time update:', payload)
      
      // Invalidate project list to refresh dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      
      // Handle specific events that affect dashboard
      if (payload.table === 'projects') {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      } else if (payload.table === 'pins') {
        // Pin status changes affect project completion percentages
        queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      }
      
      setConnectionStatus('connected')
    })

    // Handle connection status
    const connectionStatusInterval = setInterval(() => {
      if (subscription) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    }, 5000)

    return () => {
      subscription?.unsubscribe()
      clearInterval(connectionStatusInterval)
    }
  }, [queryClient])

  return { connectionStatus }
}

// Real-time activity feed
export function useActivityFeed(scope: 'global' | 'project' | 'roof', scopeId?: string) {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    
    // Subscribe based on scope
    let subscription: any
    
    if (scope === 'global') {
      subscription = db.realtime.subscribeToProject('*', (payload) => {
        const activity = createActivityFromPayload(payload)
        if (activity) {
          setActivities(prev => [activity, ...prev.slice(0, 49)]) // Keep last 50
        }
      })
    } else if (scope === 'project' && scopeId) {
      subscription = db.realtime.subscribeToProject(scopeId, (payload) => {
        const activity = createActivityFromPayload(payload)
        if (activity) {
          setActivities(prev => [activity, ...prev.slice(0, 49)])
        }
      })
    } else if (scope === 'roof' && scopeId) {
      subscription = db.realtime.subscribeToRoof(scopeId, (payload) => {
        const activity = createActivityFromPayload(payload)
        if (activity) {
          setActivities(prev => [activity, ...prev.slice(0, 49)])
        }
      })
    }

    setIsLoading(false)

    return () => {
      subscription?.unsubscribe()
    }
  }, [scope, scopeId])

  return {
    activities,
    isLoading
  }
}

// Real-time collaborative cursors (for advanced features)
export function useCollaborativeCursors(roofId: string, userInfo: { id: string; name: string; color: string }) {
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; user: any }>>({})

  useEffect(() => {
    if (!roofId || !userInfo.id) return

    const channel = db.realtime.subscribeToRoof(`cursors:${roofId}`, (payload) => {
      if (payload.type === 'cursor_move') {
        setCursors(prev => ({
          ...prev,
          [payload.userId]: {
            x: payload.x,
            y: payload.y,
            user: payload.user
          }
        }))
      } else if (payload.type === 'cursor_leave') {
        setCursors(prev => {
          const newCursors = { ...prev }
          delete newCursors[payload.userId]
          return newCursors
        })
      }
    })

    return () => {
      channel?.unsubscribe()
    }
  }, [roofId, userInfo.id])

  const updateCursor = (x: number, y: number) => {
    // In a real implementation, you'd send cursor position updates
    // This is a placeholder for the cursor tracking functionality
  }

  return {
    cursors,
    updateCursor
  }
}

// Utility functions for creating notifications and activities
function createNotificationFromPayload(payload: any): RealTimeNotification | null {
  const timestamp = new Date().toISOString()
  const id = `notification-${timestamp}-${Math.random().toString(36).substr(2, 9)}`

  switch (payload.table) {
    case 'pins':
      if (payload.eventType === 'INSERT') {
        return {
          id,
          type: 'pin_created',
          title: 'New Pin Created',
          message: `Pin #${payload.new?.seq_number || 'Unknown'} was created`,
          timestamp,
          pinId: payload.new?.id,
          roofId: payload.new?.roof_id
        }
      } else if (payload.eventType === 'UPDATE') {
        return {
          id,
          type: 'pin_status_changed',
          title: 'Pin Status Updated',
          message: `Pin #${payload.new?.seq_number || 'Unknown'} status changed to ${payload.new?.status}`,
          timestamp,
          pinId: payload.new?.id,
          roofId: payload.new?.roof_id
        }
      }
      break

    case 'photos':
      if (payload.eventType === 'INSERT') {
        return {
          id,
          type: 'photo_uploaded',
          title: 'Photo Uploaded',
          message: `New ${payload.new?.type || 'photo'} uploaded`,
          timestamp,
          pinId: payload.new?.pin_id
        }
      }
      break

    case 'chats':
      if (payload.eventType === 'INSERT') {
        return {
          id,
          type: 'chat_message',
          title: 'New Message',
          message: payload.new?.message?.substring(0, 50) + (payload.new?.message?.length > 50 ? '...' : ''),
          timestamp,
          userId: payload.new?.user_id,
          userName: payload.new?.user_name
        }
      }
      break
  }

  return null
}

function createActivityFromPayload(payload: any): any {
  const timestamp = new Date().toISOString()
  
  // Create activity entries based on the payload
  // This would be implemented based on your specific activity tracking needs
  return {
    id: `activity-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    type: payload.table,
    action: payload.eventType,
    timestamp,
    data: payload.new || payload.old
  }
}

// Connection status hook
export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  const [lastConnected, setLastConnected] = useState<string | null>(null)

  useEffect(() => {
    // Monitor Supabase connection status
    const checkConnection = () => {
      // This is a simplified version - in production you'd want more robust connection checking
      const isOnline = navigator.onLine
      if (isOnline) {
        setStatus('connected')
        setLastConnected(new Date().toISOString())
      } else {
        setStatus('disconnected')
      }
    }

    checkConnection()
    
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    
    const interval = setInterval(checkConnection, 10000) // Check every 10 seconds

    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
      clearInterval(interval)
    }
  }, [])

  return {
    status,
    lastConnected,
    isOnline: status === 'connected'
  }
}