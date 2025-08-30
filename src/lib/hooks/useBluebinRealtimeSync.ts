import { useEffect, useState, useCallback, useRef } from 'react'
import realtimeManager from '@/lib/services/supabaseRealtimeManager'

interface UseBluebinRealtimeSyncProps {
  roofId: string
  onPinUpdate?: (payload: any) => void
  onChildPinUpdate?: (payload: any) => void
  onLayerUpdate?: (payload: any) => void
  onAnnotationUpdate?: (payload: any) => void
  onPresenceUpdate?: (users: any[]) => void
  enabled?: boolean
}

interface RealtimeUser {
  userId: string
  userEmail: string
  joinedAt: string
  roofId: string
  cursorPosition?: { x: number; y: number }
  selectedTool?: string
  activeLayerId?: string
}

export function useBluebinRealtimeSync({
  roofId,
  onPinUpdate,
  onChildPinUpdate,
  onLayerUpdate,
  onAnnotationUpdate,
  onPresenceUpdate,
  enabled = true
}: UseBluebinRealtimeSyncProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<RealtimeUser[]>([])
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void; broadcast: (event: string, payload: any) => void } | null>(null)

  // Handle presence updates
  const handlePresenceSync = useCallback((presences: any) => {
    const users: RealtimeUser[] = []
    
    Object.keys(presences).forEach(userId => {
      const presence = presences[userId]?.[0] as RealtimeUser
      if (presence && presence.roofId === roofId) {
        users.push(presence)
      }
    })
    
    setActiveUsers(users)
    onPresenceUpdate?.(users)
  }, [roofId, onPresenceUpdate])

  // Handle database changes with optimistic UI updates
  const handlePinChange = useCallback((payload: any) => {
    console.log('🔄 Pin changed:', payload)
    
    // Trigger data refetch or optimistic update
    if (onPinUpdate) {
      onPinUpdate(payload)
    }
    
    // Show toast notification for collaborative changes
    if (payload.eventType !== 'INSERT' && payload.new && payload.old) {
      const changes = Object.keys(payload.new).filter(
        key => payload.new[key] !== payload.old[key]
      )
      
      if (changes.length > 0) {
        console.log(`📝 Pin ${payload.new.seq_number} updated: ${changes.join(', ')}`)
      }
    }
  }, [onPinUpdate])

  const handleChildPinChange = useCallback((payload: any) => {
    console.log('🔄 Child pin changed:', payload)
    
    if (onChildPinUpdate) {
      onChildPinUpdate(payload)
    }
    
    // Show collaborative notification
    if (payload.eventType === 'INSERT') {
      console.log(`➕ New child pin created: ${payload.new.seq}`)
    } else if (payload.eventType === 'UPDATE') {
      console.log(`📝 Child pin updated: ${payload.new.seq}`)
    }
  }, [onChildPinUpdate])

  const handleLayerChange = useCallback((payload: any) => {
    console.log('🔄 Layer changed:', payload)
    
    if (onLayerUpdate) {
      onLayerUpdate(payload)
    }
    
    if (payload.eventType === 'UPDATE' && payload.new.visible !== payload.old?.visible) {
      console.log(`👁️ Layer "${payload.new.name}" ${payload.new.visible ? 'shown' : 'hidden'}`)
    }
  }, [onLayerUpdate])

  const handleAnnotationChange = useCallback((payload: any) => {
    console.log('🔄 Annotation changed:', payload)
    
    if (onAnnotationUpdate) {
      onAnnotationUpdate(payload)
    }
  }, [onAnnotationUpdate])

  // Subscribe to real-time updates
  const subscribe = useCallback(async () => {
    if (!enabled || !roofId || subscriptionRef.current) {
      return
    }

    try {
      setConnectionError(null)
      
      const subscription = await realtimeManager.subscribeToRoof(roofId, {
        onPinChange: handlePinChange,
        onChildPinChange: handleChildPinChange,
        onLayerChange: handleLayerChange,
        onAnnotationChange: handleAnnotationChange,
        onPresenceSync: handlePresenceSync
      })

      subscriptionRef.current = subscription
      setIsConnected(true)
      
      console.log(`✅ Real-time sync enabled for roof ${roofId}`)
    } catch (error) {
      console.error('❌ Failed to subscribe to real-time updates:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      setIsConnected(false)
    }
  }, [enabled, roofId, handlePinChange, handleChildPinChange, handleLayerChange, handleAnnotationChange, handlePresenceSync])

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(async () => {
    if (subscriptionRef.current) {
      try {
        await subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
        setIsConnected(false)
        setActiveUsers([])
        console.log(`🔌 Real-time sync disabled for roof ${roofId}`)
      } catch (error) {
        console.error('❌ Failed to unsubscribe:', error)
      }
    }
  }, [roofId])

  // Broadcast events to other users
  const broadcast = useCallback(async (event: string, payload: any) => {
    if (!subscriptionRef.current) {
      console.warn('⚠️ Cannot broadcast: not connected to real-time channel')
      return
    }

    try {
      await subscriptionRef.current.broadcast(event, payload)
      console.log(`📡 Broadcasted ${event}:`, payload)
    } catch (error) {
      console.error('❌ Failed to broadcast:', error)
    }
  }, [])

  // Update user's cursor position for collaborative editing
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    await broadcast('cursor_move', { x, y })
  }, [broadcast])

  // Update user's selected tool for collaboration awareness
  const updateSelectedTool = useCallback(async (tool: string, layerId?: string) => {
    await broadcast('tool_change', { tool, layerId })
  }, [broadcast])

  // Broadcast pin operations for immediate feedback
  const broadcastPinOperation = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    data: any
  ) => {
    await broadcast(`pin_${operation}`, data)
  }, [broadcast])

  // Broadcast child pin operations
  const broadcastChildPinOperation = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    data: any
  ) => {
    await broadcast(`child_pin_${operation}`, data)
  }, [broadcast])

  // Auto-subscribe on mount and dependency changes
  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  // Connection recovery on network changes
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && !isConnected) {
        console.log('🌐 Network restored, reconnecting...')
        setTimeout(subscribe, 1000) // Delay to ensure network is stable
      }
    }

    const handleOffline = () => {
      setIsConnected(false)
      setConnectionError('Network offline')
      console.log('📵 Network offline, real-time disabled')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enabled, isConnected, subscribe])

  // Get connection status with details
  const getConnectionStatus = useCallback(() => {
    const managerStatus = realtimeManager.getConnectionStatus()
    
    return {
      isConnected: isConnected && managerStatus.isConnected,
      activeUsers: activeUsers.length,
      totalChannels: managerStatus.activeChannels,
      error: connectionError,
      users: activeUsers
    }
  }, [isConnected, activeUsers, connectionError])

  return {
    // Connection state
    isConnected: isConnected && realtimeManager.getConnectionStatus().isConnected,
    connectionError,
    activeUsers,
    
    // Control functions
    subscribe,
    unsubscribe,
    
    // Broadcasting functions
    broadcast,
    updateCursorPosition,
    updateSelectedTool,
    broadcastPinOperation,
    broadcastChildPinOperation,
    
    // Status
    getConnectionStatus
  }
}