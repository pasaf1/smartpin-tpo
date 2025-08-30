import { getSupabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

interface RealtimeManager {
  channels: Map<string, RealtimeChannel>
  subscriptions: Map<string, (() => void)[]>
  isConnected: boolean
}

class SupabaseRealtimeManager {
  private static instance: SupabaseRealtimeManager
  private supabase = getSupabase()
  private manager: RealtimeManager = {
    channels: new Map(),
    subscriptions: new Map(),
    isConnected: false
  }
  
  private constructor() {
    this.setupConnectionMonitoring()
  }

  static getInstance(): SupabaseRealtimeManager {
    if (!SupabaseRealtimeManager.instance) {
      SupabaseRealtimeManager.instance = new SupabaseRealtimeManager()
    }
    return SupabaseRealtimeManager.instance
  }

  private setupConnectionMonitoring() {
    // Monitor connection status
    window.addEventListener('online', () => {
      console.log('🌐 Network back online, reconnecting channels...')
      this.reconnectAllChannels()
    })

    window.addEventListener('offline', () => {
      console.log('📵 Network offline, real-time features disabled')
      this.manager.isConnected = false
    })

    // Heartbeat mechanism to detect stale connections
    setInterval(() => {
      this.healthCheck()
    }, 30000)
  }

  private async healthCheck() {
    try {
      // Simple auth check to verify connection
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) throw error
      
      const wasConnected = this.manager.isConnected
      this.manager.isConnected = !!user
      
      // If connection was lost and restored, reconnect channels
      if (!wasConnected && this.manager.isConnected) {
        console.log('🔄 Connection restored, reconnecting channels...')
        this.reconnectAllChannels()
      }
    } catch (error) {
      console.warn('❤️ Health check failed:', error)
      this.manager.isConnected = false
    }
  }

  private async reconnectAllChannels() {
    const channelNames = Array.from(this.manager.channels.keys())
    
    for (const channelName of channelNames) {
      const channel = this.manager.channels.get(channelName)
      if (channel) {
        try {
          await channel.unsubscribe()
          this.manager.channels.delete(channelName)
          
          // Re-trigger subscriptions for this channel
          const callbacks = this.manager.subscriptions.get(channelName) || []
          callbacks.forEach(callback => callback())
        } catch (error) {
          console.error(`Failed to reconnect channel ${channelName}:`, error)
        }
      }
    }
  }

  // Subscribe to roof-level changes (pins, child_pins, layers, etc.)
  async subscribeToRoof(
    roofId: string,
    callbacks: {
      onPinChange?: (payload: any) => void
      onChildPinChange?: (payload: any) => void
      onLayerChange?: (payload: any) => void
      onAnnotationChange?: (payload: any) => void
      onPresenceSync?: (presences: RealtimePresenceState) => void
    }
  ): Promise<{ unsubscribe: () => void; broadcast: (event: string, payload: any) => void }> {
    const channelName = `roof:${roofId}`
    
    // Clean up existing channel
    const existingChannel = this.manager.channels.get(channelName)
    if (existingChannel) {
      await existingChannel.unsubscribe()
    }

    const user = (await this.supabase.auth.getUser()).data.user
    if (!user) {
      throw new Error('User not authenticated for real-time subscription')
    }

    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    })

    // Database changes subscriptions
    if (callbacks.onPinChange) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pins',
          filter: `roof_id=eq.${roofId}`
        },
        callbacks.onPinChange
      )
    }

    if (callbacks.onChildPinChange) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'child_pins'
        },
        (payload) => {
          // Filter child pins that belong to this roof's pins
          if (payload.new?.parent_id || payload.old?.parent_id) {
            callbacks.onChildPinChange?.(payload)
          }
        }
      )
    }

    if (callbacks.onLayerChange) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'layers',
          filter: `roof_id=eq.${roofId}`
        },
        callbacks.onLayerChange
      )
    }

    if (callbacks.onAnnotationChange) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'annotations',
          filter: `roof_id=eq.${roofId}`
        },
        callbacks.onAnnotationChange
      )
    }

    // Broadcast events (real-time collaboration)
    channel.on('broadcast', { event: '*' }, (payload) => {
      console.log(`📡 Broadcast received on ${channelName}:`, payload)
      // Handle different broadcast events based on payload.event
    })

    // Presence (collaborative cursors, active users)
    if (callbacks.onPresenceSync) {
      channel.on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState()
        callbacks.onPresenceSync?.(presences)
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`👋 User ${key} joined roof ${roofId}`, newPresences)
      })

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`👋 User ${key} left roof ${roofId}`, leftPresences)
      })
    }

    // Subscribe and track presence
    const subscription = await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.manager.isConnected = true
        console.log(`✅ Subscribed to roof channel: ${channelName}`)
        
        // Track user presence
        await channel.track({
          userId: user.id,
          userEmail: user.email || 'Anonymous',
          joinedAt: new Date().toISOString(),
          roofId: roofId
        })
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel error: ${channelName}`)
        this.manager.isConnected = false
      } else if (status === 'TIMED_OUT') {
        console.warn(`⏰ Channel timeout: ${channelName}`)
        this.manager.isConnected = false
        // Attempt to reconnect after timeout
        setTimeout(() => this.reconnectAllChannels(), 2000)
      } else if (status === 'CLOSED') {
        console.log(`🔒 Channel closed: ${channelName}`)
        this.manager.isConnected = false
      }
    })

    // Store channel and subscription callback
    this.manager.channels.set(channelName, channel)
    const subscriptionCallback = () => this.subscribeToRoof(roofId, callbacks)
    const existingCallbacks = this.manager.subscriptions.get(channelName) || []
    this.manager.subscriptions.set(channelName, [...existingCallbacks, subscriptionCallback])

    // Return unsubscribe function and broadcast helper
    return {
      unsubscribe: async () => {
        await channel.unsubscribe()
        this.manager.channels.delete(channelName)
        
        // Remove subscription callback
        const callbacks = this.manager.subscriptions.get(channelName) || []
        const filteredCallbacks = callbacks.filter(cb => cb !== subscriptionCallback)
        if (filteredCallbacks.length === 0) {
          this.manager.subscriptions.delete(channelName)
        } else {
          this.manager.subscriptions.set(channelName, filteredCallbacks)
        }
        
        console.log(`🔌 Unsubscribed from ${channelName}`)
      },
      broadcast: async (event: string, payload: any) => {
        return channel.send({
          type: 'broadcast',
          event,
          payload: {
            ...payload,
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  }

  // Subscribe to pin-level changes (for detailed pin views)
  async subscribeToPinDetails(
    pinId: string,
    callbacks: {
      onChildPinChange?: (payload: any) => void
      onPinUpdate?: (payload: any) => void
    }
  ): Promise<{ unsubscribe: () => void; broadcast: (event: string, payload: any) => void }> {
    const channelName = `pin:${pinId}`
    
    const existingChannel = this.manager.channels.get(channelName)
    if (existingChannel) {
      await existingChannel.unsubscribe()
    }

    const user = (await this.supabase.auth.getUser()).data.user
    if (!user) {
      throw new Error('User not authenticated for real-time subscription')
    }

    const channel = this.supabase.channel(channelName)

    // Child pins changes for this specific parent pin
    if (callbacks.onChildPinChange) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'child_pins',
          filter: `parent_id=eq.${pinId}`
        },
        callbacks.onChildPinChange
      )
    }

    // Pin updates
    if (callbacks.onPinUpdate) {
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pins',
          filter: `id=eq.${pinId}`
        },
        callbacks.onPinUpdate
      )
    }

    // Broadcast events for collaboration
    channel.on('broadcast', { event: '*' }, (payload) => {
      console.log(`📡 Pin broadcast received:`, payload)
    })

    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to pin channel: ${channelName}`)
      }
    })

    this.manager.channels.set(channelName, channel)

    return {
      unsubscribe: async () => {
        await channel.unsubscribe()
        this.manager.channels.delete(channelName)
        console.log(`🔌 Unsubscribed from ${channelName}`)
      },
      broadcast: async (event: string, payload: any) => {
        return channel.send({
          type: 'broadcast',
          event,
          payload: {
            ...payload,
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.manager.isConnected,
      activeChannels: this.manager.channels.size,
      channels: Array.from(this.manager.channels.keys())
    }
  }

  // Clean up all subscriptions (useful for app-wide cleanup)
  async cleanup() {
    const unsubscribePromises = Array.from(this.manager.channels.values()).map(
      channel => channel.unsubscribe()
    )
    
    await Promise.allSettled(unsubscribePromises)
    
    this.manager.channels.clear()
    this.manager.subscriptions.clear()
    this.manager.isConnected = false
    
    console.log('🧹 Real-time manager cleaned up')
  }
}

export { SupabaseRealtimeManager }
export default SupabaseRealtimeManager.getInstance()