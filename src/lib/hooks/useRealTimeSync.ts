'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 2025 Enhancement: Comprehensive Real-Time Synchronization System

export interface UseRealTimeSyncOptions {
  table: string
  schema?: string
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  queryKeysToInvalidate?: (string | (string | number)[])[]
  enabled?: boolean
}

/**
 * 2025 Best Practice: Universal real-time sync hook
 * Provides consistent real-time updates across all data entities
 */
export function useRealTimeSync(options: UseRealTimeSyncOptions) {
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const {
    table,
    schema = 'public',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    queryKeysToInvalidate = [],
    enabled = true
  } = options

  useEffect(() => {
    if (!enabled) return

    const channelName = `realtime-${table}-${filter || 'all'}`
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema,
        table,
        filter
      }, (payload) => {
        console.log(`🔄 Real-time INSERT on ${table}:`, payload.new)
        onInsert?.(payload)
        
        // Invalidate related queries
        queryKeysToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema,
        table,
        filter
      }, (payload) => {
        console.log(`🔄 Real-time UPDATE on ${table}:`, payload.new)
        onUpdate?.(payload)
        
        // Invalidate related queries
        queryKeysToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema,
        table,
        filter
      }, (payload) => {
        console.log(`🔄 Real-time DELETE on ${table}:`, payload.old)
        onDelete?.(payload)
        
        // Invalidate related queries
        queryKeysToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      })
      .subscribe()

    subscriptionRef.current = subscription
    console.log(`🔌 Subscribed to real-time updates for ${table}`)

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log(`🔌 Unsubscribing from ${table} real-time updates`)
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [table, schema, filter, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  return {
    isSubscribed: subscriptionRef.current?.state === 'SUBSCRIBED'
  }
}

/**
 * 2025 Enhancement: Specialized real-time hooks for common use cases
 */

// Pins real-time sync
export function usePinsRealTime(roofId: string, enabled = true) {
  return useRealTimeSync({
    table: 'pins',
    filter: `roof_id=eq.${roofId}`,
    queryKeysToInvalidate: [
      ['pins', 'roof', roofId],
      ['pins', 'parents', roofId],
      ['pin-status-summary', roofId]
    ],
    enabled: enabled && !!roofId
  })
}

// Pin children real-time sync
export function usePinChildrenRealTime(pinId: string, enabled = true) {
  return useRealTimeSync({
    table: 'pin_children',
    filter: `pin_id=eq.${pinId}`,
    queryKeysToInvalidate: [
      ['pins', pinId, 'children'],
      ['pin-children', pinId]
    ],
    enabled: enabled && !!pinId
  })
}

// Chat real-time sync
export function useChatRealTime(scope: string, scopeId?: string | null, enabled = true) {
  const filter = scopeId 
    ? `scope=eq.${scope} AND scope_id=eq.${scopeId}`
    : `scope=eq.${scope} AND scope_id=is.null`

  return useRealTimeSync({
    table: 'chats',
    filter,
    queryKeysToInvalidate: [
      ['chat', scope, scopeId],
      ['chat-messages', scope, scopeId]
    ],
    onInsert: (payload) => {
      // Could trigger notification here
      console.log('💬 New chat message:', payload.new?.text?.substring(0, 50) + '...')
    },
    enabled
  })
}

// Photos real-time sync
export function usePhotosRealTime(entityType: 'project' | 'roof' | 'pin', entityId: string, enabled = true) {
  const filter = `${entityType}_id=eq.${entityId}`

  return useRealTimeSync({
    table: 'photos',
    filter,
    queryKeysToInvalidate: [
      ['photos', entityType, entityId],
      ['photos', 'gallery', entityId]
    ],
    enabled: enabled && !!entityId
  })
}

// Projects real-time sync
export function useProjectsRealTime(enabled = true) {
  return useRealTimeSync({
    table: 'projects',
    queryKeysToInvalidate: [
      ['projects'],
      ['projects', 'list'],
      ['dashboard', 'stats']
    ],
    enabled
  })
}

/**
 * 2025 Enhancement: Connection status monitoring
 */
export function useRealTimeConnection() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored - invalidating all queries')
      queryClient.invalidateQueries()
    }

    const handleOffline = () => {
      console.log('📡 Connection lost - entering offline mode')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])

  return {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true
  }
}