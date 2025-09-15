'use client'

/**
 * SmartPin TPO - Real-time Sync Component
 * WebSocket-based live collaboration for pin updates
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  SmartPin,
  SmartChildPin,
  PinRealTimeSyncProps,
  PinActivity,
  UserPresence,
  PinError,
  RealtimeUpdate
} from './types'

interface RealtimeState {
  isConnected: boolean
  connectionError?: string
  lastHeartbeat?: Date
}

export const PinRealTimeSync: React.FC<PinRealTimeSyncProps> = ({
  projectId,
  pinId,
  onPinUpdate,
  onChildPinUpdate,
  onActivity,
  onPresenceUpdate,
  onError,
  userId,
  enabled = true
}) => {
  const supabase = getSupabase()
  const channelRef = useRef<any>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef<RealtimeState>({
    isConnected: false
  })

  // Error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`[PinRealTimeSync] ${context}:`, error)

    const pinError: PinError = {
      code: error.code || 'REALTIME_ERROR',
      message: error.message || `Error in ${context}`,
      severity: 'medium',
      recoverable: true,
      timestamp: new Date().toISOString(),
      context: { context, projectId, pinId, userId }
    }

    onError(pinError)
    stateRef.current.connectionError = pinError.message
  }, [onError, projectId, pinId, userId])

  // Connection heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      if (channelRef.current && stateRef.current.isConnected) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: {
            userId,
            timestamp: new Date().toISOString()
          }
        })
        stateRef.current.lastHeartbeat = new Date()
      }
    }, 30000) // 30 seconds
  }, [userId])

  // Reconnection logic
  const scheduleReconnect = useCallback((delay: number = 5000) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (enabled && !stateRef.current.isConnected) {
        console.log('[PinRealTimeSync] Attempting reconnection...')
        setupRealtimeSubscription()
      }
    }, delay)
  }, [enabled])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(async () => {
    if (!enabled || !supabase) {
      console.log('[PinRealTimeSync] Disabled or no Supabase client')
      return
    }

    try {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      // Create channel name based on scope
      const channelName = pinId
        ? `pin:${pinId}`
        : `project:${projectId}`

      console.log(`[PinRealTimeSync] Connecting to channel: ${channelName}`)

      // Create new channel
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: userId }
          }
        })

        // Pin updates (PostgreSQL changes)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pins',
            filter: pinId ? `id=eq.${pinId}` : `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('[PinRealTimeSync] Pin database change:', payload)

            if (payload.eventType === 'UPDATE' && payload.new) {
              onPinUpdate(payload.new as SmartPin)
            }

            // Create activity entry
            const activity: PinActivity = {
              id: `db-change-${Date.now()}`,
              pin_id: payload.new?.id || payload.old?.id,
              action: payload.eventType.toLowerCase() as any,
              details: {
                table: 'pins',
                changes: payload.new ? Object.keys(payload.new) : []
              },
              user_id: payload.new?.updated_by || 'system',
              user_name: 'Database',
              timestamp: new Date().toISOString(),
              is_system_generated: true
            }

            onActivity(activity)
          }
        )

        // Child pin updates
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pin_children',
            filter: pinId ? `parent_pin_id=eq.${pinId}` : `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('[PinRealTimeSync] Child pin database change:', payload)

            if (payload.eventType === 'UPDATE' && payload.new) {
              onChildPinUpdate(payload.new as SmartChildPin)
            }

            const activity: PinActivity = {
              id: `db-change-${Date.now()}`,
              pin_id: payload.new?.parent_pin_id || payload.old?.parent_pin_id,
              child_pin_id: payload.new?.id || payload.old?.id,
              action: payload.eventType.toLowerCase() as any,
              details: {
                table: 'pin_children',
                changes: payload.new ? Object.keys(payload.new) : []
              },
              user_id: payload.new?.updated_by || 'system',
              user_name: 'Database',
              timestamp: new Date().toISOString(),
              is_system_generated: true
            }

            onActivity(activity)
          }
        )

        // Activity logs
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: pinId ? `pin_id=eq.${pinId}` : `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('[PinRealTimeSync] New activity log:', payload)

            if (payload.new) {
              const activity: PinActivity = {
                id: payload.new.id,
                pin_id: payload.new.pin_id,
                child_pin_id: payload.new.child_pin_id,
                action: payload.new.action,
                details: payload.new.details || {},
                user_id: payload.new.user_id,
                user_name: payload.new.user_name || 'Unknown User',
                timestamp: payload.new.created_at,
                is_system_generated: false
              }

              onActivity(activity)
            }
          }
        )

        // Real-time broadcasts (user actions)
        .on('broadcast', { event: 'pin_update' }, ({ payload }) => {
          console.log('[PinRealTimeSync] Broadcast pin update:', payload)

          const update: RealtimeUpdate = {
            type: 'pin_update',
            payload,
            timestamp: new Date().toISOString(),
            user_id: payload.userId || 'unknown'
          }

          if (payload.userId !== userId) { // Don't echo own updates
            onPinUpdate(payload.pin)
          }
        })

        .on('broadcast', { event: 'child_pin_update' }, ({ payload }) => {
          console.log('[PinRealTimeSync] Broadcast child pin update:', payload)

          if (payload.userId !== userId) {
            onChildPinUpdate(payload.childPin)
          }
        })

        .on('broadcast', { event: 'user_action' }, ({ payload }) => {
          console.log('[PinRealTimeSync] User action broadcast:', payload)

          const activity: PinActivity = {
            id: `action-${Date.now()}-${Math.random()}`,
            pin_id: payload.pinId,
            child_pin_id: payload.childPinId,
            action: payload.action,
            details: payload.details || {},
            user_id: payload.userId,
            user_name: payload.userName || 'Unknown User',
            timestamp: new Date().toISOString(),
            is_system_generated: false
          }

          onActivity(activity)
        })

        .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
          // Handle heartbeat from other users
          if (payload.userId !== userId) {
            console.log(`[PinRealTimeSync] Heartbeat from user: ${payload.userId}`)
          }
        })

        // Presence tracking
        .on('presence', { event: 'sync' }, () => {
          console.log('[PinRealTimeSync] Presence sync')

          const presenceState = channel.presenceState()
          const presenceList: UserPresence[] = Object.keys(presenceState).map(userId => {
            const presence = presenceState[userId][0]
            return {
              user_id: userId,
              user_name: presence.user_name || 'Unknown User',
              project_id: projectId,
              pin_id: pinId,
              last_seen: new Date().toISOString(),
              is_online: true,
              current_action: presence.current_action
            }
          })

          onPresenceUpdate(presenceList)
        })

        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[PinRealTimeSync] User joined:', key, newPresences)
        })

        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[PinRealTimeSync] User left:', key, leftPresences)
        })

      // Subscribe to the channel
      const subscriptionStatus = await channel.subscribe(async (status) => {
        console.log(`[PinRealTimeSync] Subscription status: ${status}`)

        if (status === 'SUBSCRIBED') {
          stateRef.current.isConnected = true
          stateRef.current.connectionError = undefined

          // Track presence
          await channel.track({
            user_id: userId,
            user_name: 'Current User', // Should come from user context
            project_id: projectId,
            pin_id: pinId,
            joined_at: new Date().toISOString()
          })

          startHeartbeat()
          console.log('[PinRealTimeSync] Successfully connected and tracking presence')

        } else if (status === 'CHANNEL_ERROR') {
          stateRef.current.isConnected = false
          handleError(new Error('Channel connection failed'), 'subscription')
          scheduleReconnect()

        } else if (status === 'TIMED_OUT') {
          stateRef.current.isConnected = false
          handleError(new Error('Connection timed out'), 'subscription')
          scheduleReconnect()

        } else if (status === 'CLOSED') {
          stateRef.current.isConnected = false
          console.log('[PinRealTimeSync] Connection closed')
          if (enabled) {
            scheduleReconnect()
          }
        }
      })

      channelRef.current = channel

    } catch (error) {
      handleError(error, 'setupRealtimeSubscription')
      scheduleReconnect()
    }
  }, [enabled, supabase, projectId, pinId, userId, onPinUpdate, onChildPinUpdate, onActivity, onPresenceUpdate, handleError, startHeartbeat, scheduleReconnect])

  // Public methods for broadcasting updates
  const broadcastPinUpdate = useCallback(async (pin: SmartPin) => {
    if (channelRef.current && stateRef.current.isConnected) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'pin_update',
          payload: {
            pin,
            userId,
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        handleError(error, 'broadcastPinUpdate')
      }
    }
  }, [userId, handleError])

  const broadcastChildPinUpdate = useCallback(async (childPin: SmartChildPin) => {
    if (channelRef.current && stateRef.current.isConnected) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'child_pin_update',
          payload: {
            childPin,
            userId,
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        handleError(error, 'broadcastChildPinUpdate')
      }
    }
  }, [userId, handleError])

  const broadcastUserAction = useCallback(async (action: string, details: any, targetPinId?: string, targetChildPinId?: string) => {
    if (channelRef.current && stateRef.current.isConnected) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'user_action',
          payload: {
            action,
            details,
            pinId: targetPinId || pinId,
            childPinId: targetChildPinId,
            userId,
            userName: 'Current User', // Should come from user context
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        handleError(error, 'broadcastUserAction')
      }
    }
  }, [userId, pinId, handleError])

  // Initialize connection
  useEffect(() => {
    if (enabled && projectId && userId) {
      console.log('[PinRealTimeSync] Initializing connection...')
      setupRealtimeSubscription()
    }

    return () => {
      console.log('[PinRealTimeSync] Cleaning up connection...')

      // Clear timers
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Cleanup channel
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      stateRef.current.isConnected = false
    }
  }, [enabled, projectId, userId, setupRealtimeSubscription, supabase])

  // Expose broadcast methods via ref (if needed)
  React.useImperativeHandle(React.forwardRef(function PinRealTimeSyncRef() { return null }), () => ({
    broadcastPinUpdate,
    broadcastChildPinUpdate,
    broadcastUserAction,
    isConnected: () => stateRef.current.isConnected
  }), [broadcastPinUpdate, broadcastChildPinUpdate, broadcastUserAction])

  // This component doesn't render anything - it's purely for real-time functionality
  return null
}

export default PinRealTimeSync