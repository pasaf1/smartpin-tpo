'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'

export interface RoofPresenceUser {
  id: string
  fullName: string
  email?: string | null
  lastSeen?: string
}

interface UseRoofPresenceResult {
  users: RoofPresenceUser[]
  onlineCount: number
  isLoading: boolean
  error: Error | null
}

function mapPresenceState(state: RealtimePresenceState, roofId: string): RoofPresenceUser[] {
  const users: RoofPresenceUser[] = []

  Object.keys(state).forEach((key) => {
    const entries = state[key]
    if (!entries || entries.length === 0) return

    entries.forEach((entry) => {
      const data = entry as Record<string, any>
      const roofScope = data?.['roof_id']
      if (roofScope && roofScope !== roofId) {
        return
      }

      users.push({
        id: (data?.['user_id'] as string) ?? key,
        fullName:
          (data?.['full_name'] as string) ??
          (data?.['user_name'] as string) ??
          (data?.['user_email'] as string) ??
          'Unknown user',
        email: (data?.['user_email'] as string) ?? null,
        lastSeen: (data?.['last_seen'] as string) ?? (data?.['joinedAt'] as string) ?? undefined,
      })
    })
  })

  return users
}

export function useRoofPresence(roofId: string | undefined | null): UseRoofPresenceResult {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<RoofPresenceUser[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSupabaseConfigured = typeof process !== 'undefined'
    ? Boolean(process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
    : true

  useEffect(() => {
    let cancelled = false

    async function subscribe() {
      if (!isSupabaseConfigured) {
        setUsers([])
        setIsLoading(false)
        setError(null)
        return
      }

      if (!roofId) {
        setUsers([])
        setIsLoading(false)
        return
      }

      if (!user) {
        setUsers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const channel = supabase.channel(`presence:roof:${roofId}`, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })

        const syncPresence = () => {
          const state = channel.presenceState()
          const presenceUsers = mapPresenceState(state, roofId)
          if (!cancelled) {
            setUsers(presenceUsers)
            setIsLoading(false)
          }
        }

        channel.on('presence', { event: 'sync' }, syncPresence)
        channel.on('presence', { event: 'join' }, syncPresence)
        channel.on('presence', { event: 'leave' }, syncPresence)

        channelRef.current = channel

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({
                user_id: user.id,
                full_name:
                  profile?.full_name ??
                  user.user_metadata?.['full_name'] ??
                  user.email?.split('@')[0] ??
                  'Unknown user',
                user_email: user.email ?? null,
                roof_id: roofId,
                last_seen: new Date().toISOString(),
              })
              syncPresence()
            } catch (trackError) {
              console.error('Failed to track presence', trackError)
              if (!cancelled && trackError instanceof Error) {
                setError(trackError)
              }
              if (!cancelled) {
                setIsLoading(false)
              }
            }
          } else if (status === 'CHANNEL_ERROR') {
            const channelError = new Error(`Realtime channel error for roof ${roofId}`)
            if (!cancelled) {
              setError(channelError)
              setIsLoading(false)
            }
          }
        })
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to subscribe to presence')
          setError(error)
          setIsLoading(false)
          setUsers([])
        }
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [roofId, user, profile?.full_name, isSupabaseConfigured])

  const onlineCount = useMemo(() => users.length, [users])

  return {
    users,
    onlineCount,
    isLoading,
    error,
  }
}
