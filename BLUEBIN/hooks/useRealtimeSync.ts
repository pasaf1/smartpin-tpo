import { useEffect, useCallback, useRef } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

interface CursorPosition {
  userId: string
  x: number
  y: number
  timestamp: number
  userName?: string
}

interface DrawingPreview {
  userId: string
  type: 'line' | 'rectangle' | 'circle'
  coordinates: number[]
  temporary: boolean
}

interface UserPresence {
  userId: string
  userName: string
  lastSeen: string
  isActive: boolean
}

// Main realtime sync hook for SmartPin TPO
export function useRealtimeSync(roofId: string) {
  const supabase = useSupabaseClient<Database>()
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    if (!roofId) return
    
    const setupRealtimeSync = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      
      // Create new channel with mobile-optimized config
      const channel = supabase.channel(`roof:${roofId}`, {
        config: { 
          broadcast: { 
            self: false,
            ack: false // Disable ACK for mobile performance
          },
          presence: { key: 'user_presence' }
        }
      })
      
      // Postgres Changes for persistent data
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parent_pins',
            filter: `roof_id=eq.${roofId}`
          },
          (payload) => {
            console.log('Parent pin change:', payload)
            // Invalidate queries for real-time updates
            queryClient.invalidateQueries(['parent_pins', roofId])
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
            console.log('Child pin change:', payload)
            // Invalidate parent pins to refresh child counts
            queryClient.invalidateQueries(['parent_pins', roofId])
            
            // Invalidate specific child pins if we know the parent
            if (payload.new && 'parent_id' in payload.new) {
              queryClient.invalidateQueries(['child_pins', payload.new.parent_id])
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'layers',
            filter: `roof_id=eq.${roofId}`
          },
          (payload) => {
            console.log('Layer change:', payload)
            queryClient.invalidateQueries(['layers', roofId])
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'annotations',
            filter: `roof_id=eq.${roofId}`
          },
          (payload) => {
            console.log('Annotation change:', payload)
            queryClient.invalidateQueries(['annotations', roofId])
          }
        )
      
      channelRef.current = channel
      
      // Subscribe to the channel
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(' Realtime connected for roof:', roofId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('L Realtime connection error for roof:', roofId)
        }
      })
    }
    
    setupRealtimeSync()
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [roofId, supabase, queryClient])
}

// Cursor broadcasting for mobile collaboration
export function useBroadcastCursor(roofId: string, isEnabled: boolean = true) {
  const supabase = useSupabaseClient<Database>()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const throttleRef = useRef<NodeJS.Timeout | null>(null)
  
  const broadcastCursor = useCallback((x: number, y: number, userName?: string) => {
    if (!isEnabled || !channelRef.current) return
    
    // Throttle cursor updates for mobile performance (max 10 FPS)
    if (throttleRef.current) {
      clearTimeout(throttleRef.current)
    }
    
    throttleRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            userId: supabase.auth.getUser()?.data.user?.id,
            userName,
            x,
            y,
            timestamp: Date.now()
          }
        })
      }
    }, 100) // 100ms throttle
  }, [isEnabled, supabase])
  
  useEffect(() => {
    if (!roofId || !isEnabled) return
    
    const channel = supabase.channel(`cursors:${roofId}`)
    channelRef.current = channel
    
    channel.subscribe()
    
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roofId, isEnabled, supabase])
  
  return { broadcastCursor }
}

// Drawing preview broadcasting
export function useBroadcastDrawing(roofId: string) {
  const supabase = useSupabaseClient<Database>()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  const broadcastDrawing = useCallback((drawing: Omit<DrawingPreview, 'userId'>) => {
    if (!channelRef.current) return
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing',
      payload: {
        ...drawing,
        userId: supabase.auth.getUser()?.data.user?.id,
      }
    })
  }, [supabase])
  
  useEffect(() => {
    if (!roofId) return
    
    const channel = supabase.channel(`drawing:${roofId}`)
    channelRef.current = channel
    
    channel.subscribe()
    
    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roofId, supabase])
  
  return { broadcastDrawing }
}

// User presence tracking
export function useUserPresence(roofId: string, userName: string) {
  const supabase = useSupabaseClient<Database>()
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    if (!roofId || !userName) return
    
    const channel = supabase.channel(`presence:${roofId}`, {
      config: { presence: { key: userName } }
    })
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      console.log('Presence state updated:', Object.keys(state))
    })
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence with mobile-optimized payload
        await channel.track({
          userId: supabase.auth.getUser()?.data.user?.id,
          userName,
          online_at: new Date().toISOString(),
          platform: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      }
    })
    
    channelRef.current = channel
    
    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roofId, userName, supabase])
  
  return { channel: channelRef.current }
}

// Mobile-optimized connection monitoring
export function useConnectionMonitor() {
  const supabase = useSupabaseClient<Database>()
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('= Connection restored')
      // Reconnect realtime channels if needed
      supabase.realtime.connect()
    }
    
    const handleOffline = () => {
      console.log('=ô Connection lost')
    }
    
    // Mobile-specific connection events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Visibility change for mobile app backgrounding
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App backgrounded - reduce realtime activity
        console.log('=ñ App backgrounded')
      } else {
        // App foregrounded - restore realtime activity
        console.log('=ñ App foregrounded')
        supabase.realtime.connect()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase])
}