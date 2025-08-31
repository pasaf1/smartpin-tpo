'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

interface PresenceUser {
  user_id: string
  user_name: string
  user_email: string
  cursor_position?: { x: number; y: number }
  current_view: string
  last_seen: string
  status: 'online' | 'idle' | 'away'
  avatar_url?: string
  role?: string
}

interface RealtimeEvent {
  type: 'pin_created' | 'pin_updated' | 'pin_deleted' | 'status_changed' | 'photo_uploaded' | 'comment_added'
  data: any
  user_id: string
  user_name: string
  timestamp: string
  roof_id?: string
  pin_id?: string
}

interface CollaborationState {
  presence: Record<string, PresenceUser>
  events: RealtimeEvent[]
  isConnected: boolean
  userCount: number
}

export function useRealtimeCollaboration(roofId: string, currentUser: any) {
  // Using direct supabase client instead of hook
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [state, setState] = useState<CollaborationState>({
    presence: {},
    events: [],
    isConnected: false,
    userCount: 0
  })
  
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const cursorThrottleRef = useRef<NodeJS.Timeout>()
  
  // Initialize channel and presence tracking
  useEffect(() => {
    if (!roofId || !currentUser) return
    
    const channelName = `roof:${roofId}:collaboration`
    const channel = supabase.channel(channelName)
    channelRef.current = channel
    
    // Configure presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const presence: Record<string, PresenceUser> = {}
        
        Object.keys(presenceState).forEach((key) => {
          const user = presenceState[key][0] as any as PresenceUser
          if (user.user_id !== currentUser.id) {
            presence[key] = user
          }
        })
        
        setState(prev => ({
          ...prev,
          presence,
          userCount: Object.keys(presence).length + 1 // +1 for current user
        }))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      
    // Real-time database changes
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pins',
        filter: `roof_id=eq.${roofId}`
      }, (payload) => {
        const event: RealtimeEvent = {
          type: 'pin_created',
          data: payload.new,
          user_id: payload.new.created_by || 'system',
          user_name: 'User',
          timestamp: new Date().toISOString(),
          roof_id: roofId,
          pin_id: payload.new.id
        }
        addEvent(event)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pins',
        filter: `roof_id=eq.${roofId}`
      }, (payload) => {
        const event: RealtimeEvent = {
          type: payload.new.status !== payload.old.status ? 'status_changed' : 'pin_updated',
          data: { new: payload.new, old: payload.old },
          user_id: payload.new.updated_by || 'system',
          user_name: 'User',
          timestamp: new Date().toISOString(),
          roof_id: roofId,
          pin_id: payload.new.id
        }
        addEvent(event)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'photos'
      }, (payload) => {
        if (payload.new.roof_id === roofId) {
          const event: RealtimeEvent = {
            type: 'photo_uploaded',
            data: payload.new,
            user_id: payload.new.uploaded_by || 'system',
            user_name: 'User',
            timestamp: new Date().toISOString(),
            roof_id: roofId,
            pin_id: payload.new.pin_id
          }
          addEvent(event)
        }
      })
      
    // Broadcast events for real-time interactions
    channel
      .on('broadcast', { event: 'cursor_move' }, (payload) => {
        const { user_id, position } = payload.payload
        if (user_id !== currentUser.id) {
          setState(prev => ({
            ...prev,
            presence: {
              ...prev.presence,
              [user_id]: {
                ...prev.presence[user_id],
                cursor_position: position
              }
            }
          }))
        }
      })
      .on('broadcast', { event: 'user_activity' }, (payload) => {
        const { user_id, activity } = payload.payload
        console.log('User activity:', user_id, activity)
      })
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.user_metadata?.full_name || currentUser.email,
          user_email: currentUser.email,
          current_view: `roof:${roofId}`,
          last_seen: new Date().toISOString(),
          status: 'online',
          avatar_url: currentUser.user_metadata?.avatar_url,
          role: currentUser.user_metadata?.role
        })
        
        setState(prev => ({ ...prev, isConnected: true }))
      }
    })
    
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [roofId, currentUser, supabase])
  
  const addEvent = useCallback((event: RealtimeEvent) => {
    setState(prev => ({
      ...prev,
      events: [event, ...prev.events].slice(0, 50) // Keep last 50 events
    }))
  }, [])
  
  // Broadcast cursor position
  const broadcastCursorPosition = useCallback((x: number, y: number) => {
    if (!channelRef.current || !currentUser) return
    
    setCursorPosition({ x, y })
    
    // Throttle cursor updates
    if (cursorThrottleRef.current) {
      clearTimeout(cursorThrottleRef.current)
    }
    
    cursorThrottleRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          user_id: currentUser.id,
          position: { x, y }
        }
      })
    }, 100) // Throttle to 10 FPS
  }, [currentUser])
  
  // Broadcast user activity
  const broadcastActivity = useCallback((activity: string, data?: any) => {
    if (!channelRef.current || !currentUser) return
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'user_activity',
      payload: {
        user_id: currentUser.id,
        user_name: currentUser.user_metadata?.full_name || currentUser.email,
        activity,
        data,
        timestamp: new Date().toISOString()
      }
    })
  }, [currentUser])
  
  // Send custom broadcast message
  const broadcast = useCallback((event: string, payload: any) => {
    if (!channelRef.current) return
    
    channelRef.current.send({
      type: 'broadcast',
      event,
      payload: {
        ...payload,
        user_id: currentUser?.id,
        timestamp: new Date().toISOString()
      }
    })
  }, [currentUser])
  
  // Update user status
  const updateStatus = useCallback((status: 'online' | 'idle' | 'away') => {
    if (!channelRef.current || !currentUser) return
    
    channelRef.current.track({
      user_id: currentUser.id,
      user_name: currentUser.user_metadata?.full_name || currentUser.email,
      user_email: currentUser.email,
      current_view: `roof:${roofId}`,
      last_seen: new Date().toISOString(),
      status,
      avatar_url: currentUser.user_metadata?.avatar_url,
      role: currentUser.user_metadata?.role
    })
  }, [currentUser, roofId])
  
  return {
    ...state,
    cursorPosition,
    broadcastCursorPosition,
    broadcastActivity,
    broadcast,
    updateStatus,
    clearEvents: () => setState(prev => ({ ...prev, events: [] }))
  }
}