'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  content: string
  user_id: string
  user_name: string
  user_avatar?: string
  pin_id?: string
  pin_item_id?: string
  roof_id: string
  message_type: 'text' | 'mention' | 'attachment' | 'system'
  attachments?: ChatAttachment[]
  mentions?: string[] // user IDs mentioned in the message
  reply_to?: string // message ID this is replying to
  created_at: string
  updated_at?: string
  is_edited?: boolean
}

export interface ChatAttachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  thumbnail_url?: string
}

export interface TypingUser {
  user_id: string
  user_name: string
  timestamp: number
}

export interface UserPresence {
  user_id: string
  user_name: string
  user_avatar?: string
  status: 'online' | 'away' | 'offline'
  last_seen: string
}

export function useChat(roofId: string, pinId?: string, pinItemId?: string) {
  const queryClient = useQueryClient()
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [userPresence, setUserPresence] = useState<UserPresence[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Chat messages query
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['chat-messages', roofId, pinId, pinItemId],
    queryFn: async () => {
      // Production query - using the actual chats table from database schema
      let query = supabase
        .from('chats')
        .select(`
          *
        `)
        .eq('scope_id', roofId)
        .order('created_at', { ascending: true })

      if (pinItemId) {
        query = query.eq('scope', 'pin').eq('scope_id', pinItemId)
      } else if (pinId) {
        query = query.eq('scope', 'pin').eq('scope_id', pinId)
      } else {
        query = query.eq('scope', 'roof')
      }

      const { data, error } = await query
      if (error) throw error
      
      // Map database schema to ChatMessage interface
      return (data || []).map(chat => ({
        id: chat.message_id,
        content: chat.text || '',
        user_id: chat.created_by || 'unknown',
        user_name: 'User', // Would need to join with users table for real name
        roof_id: roofId,
        message_type: 'text' as const,
        mentions: Array.isArray(chat.mentions) ? chat.mentions : [],
        created_at: chat.created_at
      } as ChatMessage))
    },
    refetchOnWindowFocus: false
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content: string
      message_type?: ChatMessage['message_type']
      mentions?: string[]
      reply_to?: string
      attachments?: Omit<ChatAttachment, 'id'>[]
    }) => {
      // Production implementation - use chats table from database schema
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          text: messageData.content,
          scope: pinItemId ? 'pin' : pinId ? 'pin' : 'roof',
          scope_id: pinItemId || pinId || roofId,
          mentions: messageData.mentions || [],
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error
      
      // Map database result to ChatMessage interface
      return {
        id: data.message_id,
        content: data.text || '',
        user_id: data.created_by || 'unknown',
        user_name: 'User',
        roof_id: roofId,
        message_type: 'text' as const,
        mentions: Array.isArray(data.mentions) ? data.mentions : [],
        created_at: data.created_at
      } as ChatMessage
    },
    onSuccess: (newMessage) => {
      // Update local cache
      queryClient.setQueryData(
        ['chat-messages', roofId, pinId, pinItemId],
        (old: ChatMessage[] = []) => [...old, newMessage]
      )
    }
  })

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (isTyping) return

    setIsTyping(true)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // In production, send typing status via Supabase Realtime
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: 'current-user',
          user_name: 'You',
          action: 'start'
        }
      })
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [isTyping])

  const stopTyping = useCallback(() => {
    if (!isTyping) return

    setIsTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // In production, send stop typing status
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: 'current-user',
          user_name: 'You',
          action: 'stop'
        }
      })
    }
  }, [isTyping])

  // Set up realtime subscriptions
  useEffect(() => {
    // Production realtime setup
    const channelName = pinItemId 
      ? `chat:${roofId}:${pinId}:${pinItemId}`
      : pinId 
      ? `chat:${roofId}:${pinId}`
      : `chat:${roofId}`

    const channel = supabase.channel(channelName)

    // Subscribe to new messages
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages'
    }, (payload) => {
      const newMessage = payload.new as ChatMessage
      queryClient.setQueryData(
        ['chat-messages', roofId, pinId, pinItemId],
        (old: ChatMessage[] = []) => [...old, newMessage]
      )
    })

    // Subscribe to typing indicators
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { user_id, user_name, action } = payload.payload
      
      if (action === 'start') {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.user_id !== user_id)
          return [...filtered, { user_id, user_name, timestamp: Date.now() }]
        })
      } else if (action === 'stop') {
        setTypingUsers(prev => prev.filter(u => u.user_id !== user_id))
      }
    })

    // Subscribe to presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presenceList: UserPresence[] = []
      
      for (const user in state) {
        const presence = state[user][0] as any
        presenceList.push({
          user_id: presence.user_id,
          user_name: presence.user_name,
          user_avatar: presence.user_avatar,
          status: presence.status,
          last_seen: presence.last_seen
        })
      }
      
      setUserPresence(presenceList)
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        channel.track({
          user_id: 'current-user',
          user_name: 'You',
          status: 'online',
          last_seen: new Date().toISOString()
        })
      }
    })

    channelRef.current = channel

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      channel.unsubscribe()
    }
  }, [roofId, pinId, pinItemId, queryClient])

  return {
    // Data
    messages,
    userPresence,
    typingUsers,
    
    // Loading states
    isLoadingMessages,
    isTyping,
    isSending: sendMessageMutation.isPending,
    
    // Actions
    sendMessage: sendMessageMutation.mutateAsync,
    startTyping,
    stopTyping,
    
    // Errors
    messagesError,
    sendError: sendMessageMutation.error
  }
}