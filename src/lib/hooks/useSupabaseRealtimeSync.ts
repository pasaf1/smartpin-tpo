import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/utils/supabaseClient'

interface RealtimeSyncConfig {
  channelName: string
  onPinUpdate?: (payload: any) => void
  onChildPinUpdate?: (payload: any) => void
  onAnnotationUpdate?: (payload: any) => void
  onLayerUpdate?: (payload: any) => void
  onUserPresence?: (payload: any) => void
}

interface UserPresence {
  userId: string
  userEmail: string
  cursorPosition?: { x: number; y: number }
  selectedTool?: string
  activeLayerId?: string
  lastSeen: string
}

export function useSupabaseRealtimeSync({
  channelName,
  onPinUpdate,
  onChildPinUpdate,
  onAnnotationUpdate,
  onLayerUpdate,
  onUserPresence
}: RealtimeSyncConfig) {
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createBrowserSupabaseClient()

  // Broadcast function for sending real-time updates
  const broadcast = useCallback(async (
    event: string, 
    payload: any
  ): Promise<RealtimeChannelSendResponse> => {
    if (!channelRef.current) {
      return { status: 'error', error: 'Channel not initialized' }
    }

    return channelRef.current.send({
      type: 'broadcast',
      event,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        userId: (await supabase.auth.getUser()).data.user?.id
      }
    })
  }, [supabase])

  // Track user cursor position for collaborative editing
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!channelRef.current) return

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    channelRef.current.track({
      userId: user.id,
      userEmail: user.email || 'Anonymous',
      cursorPosition: { x, y },
      lastSeen: new Date().toISOString()
    })
  }, [supabase])

  // Update user's selected tool for collaboration awareness
  const updateSelectedTool = useCallback(async (tool: string, layerId?: string) => {
    if (!channelRef.current) return

    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    channelRef.current.track({
      userId: user.id,
      userEmail: user.email || 'Anonymous',
      selectedTool: tool,
      activeLayerId: layerId,
      lastSeen: new Date().toISOString()
    })
  }, [supabase])

  // Subscribe to real-time updates
  const subscribe = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
    }

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      console.warn('No authenticated user for real-time sync')
      return
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    })

    // Handle database changes (pins, child_pins, etc.)
    channel
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pins' 
        },
        (payload) => {
          console.log('Real-time pin change:', payload)
          onPinUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'child_pins' 
        },
        (payload) => {
          console.log('Real-time child pin change:', payload)
          onChildPinUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'annotations' 
        },
        (payload) => {
          console.log('Real-time annotation change:', payload)
          onAnnotationUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'layers' 
        },
        (payload) => {
          console.log('Real-time layer change:', payload)
          onLayerUpdate?.(payload)
        }
      )

    // Handle broadcast events (immediate updates)
    channel
      .on('broadcast', { event: 'pin_created' }, ({ payload }) => {
        console.log('Pin created by another user:', payload)
        // Optimistic update or refetch
      })
      .on('broadcast', { event: 'child_pin_created' }, ({ payload }) => {
        console.log('Child pin created by another user:', payload)
        // Optimistic update or refetch
      })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        console.log('User cursor moved:', payload)
        // Update collaborative cursors
      })
      .on('broadcast', { event: 'tool_change' }, ({ payload }) => {
        console.log('User changed tool:', payload)
        // Update collaborative tool indicators
      })

    // Handle presence (user join/leave)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: UserPresence[] = []
        
        Object.keys(state).forEach(userId => {
          const userState = state[userId]?.[0] as UserPresence
          if (userState && userId !== user.id) {
            users.push(userState)
          }
        })
        
        setActiveUsers(users)
        onUserPresence?.(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

    // Subscribe and track initial presence
    const subscription = await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        console.log(`✅ Subscribed to channel: ${channelName}`)
        
        // Track initial presence
        await channel.track({
          userId: user.id,
          userEmail: user.email || 'Anonymous',
          lastSeen: new Date().toISOString()
        })
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false)
        console.error(`❌ Channel error: ${channelName}`)
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false)
        console.warn(`⏰ Channel timeout: ${channelName}`)
      } else if (status === 'CLOSED') {
        setIsConnected(false)
        console.log(`🔒 Channel closed: ${channelName}`)
      }
    })

    channelRef.current = channel
  }, [channelName, supabase, onPinUpdate, onChildPinUpdate, onAnnotationUpdate, onLayerUpdate, onUserPresence])

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
      setActiveUsers([])
      console.log(`🔌 Unsubscribed from channel: ${channelName}`)
    }
  }, [channelName])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  // Connection recovery mechanism
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network back online, reconnecting...')
      subscribe()
    }

    const handleOffline = () => {
      console.log('📵 Network offline')
      setIsConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [subscribe])

  // Periodic connection health check
  useEffect(() => {
    const healthCheck = setInterval(async () => {
      if (channelRef.current && isConnected) {
        try {
          // Send heartbeat
          await broadcast('heartbeat', { timestamp: new Date().toISOString() })
        } catch (error) {
          console.warn('❤️ Heartbeat failed, connection may be stale:', error)
          setIsConnected(false)
          // Attempt reconnection
          setTimeout(() => subscribe(), 1000)
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(healthCheck)
  }, [isConnected, broadcast, subscribe])

  return {
    isConnected,
    activeUsers,
    subscribe,
    unsubscribe,
    broadcast,
    updateCursorPosition,
    updateSelectedTool
  }
}