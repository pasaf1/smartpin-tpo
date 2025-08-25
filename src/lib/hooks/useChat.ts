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

// Demo data for development
const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: 'demo-msg-1',
    content: 'Started inspection of the membrane area around drain #3. Found some concerning separation.',
    user_id: 'demo-user-1',
    user_name: 'Mike Rodriguez',
    user_avatar: '👷‍♂️',
    roof_id: 'e1-demo-roof',
    pin_id: 'demo-pin-1',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'demo-msg-2',
    content: '@sarah.chen Can you review the photos I uploaded for Pin #001? The membrane separation looks more severe than initially assessed.',
    user_id: 'demo-user-1',
    user_name: 'Mike Rodriguez',
    user_avatar: '👷‍♂️',
    roof_id: 'e1-demo-roof',
    pin_id: 'demo-pin-1',
    message_type: 'mention',
    mentions: ['demo-user-2'],
    created_at: new Date(Date.now() - 1800000).toISOString() // 30 min ago
  },
  {
    id: 'demo-msg-3',
    content: 'I\'ve reviewed the photos. This definitely needs to be escalated to Critical severity. The separation extends beyond the visible area.',
    user_id: 'demo-user-2',
    user_name: 'Sarah Chen',
    user_avatar: '👩‍🔬',
    roof_id: 'e1-demo-roof',
    pin_id: 'demo-pin-1',
    message_type: 'text',
    reply_to: 'demo-msg-2',
    created_at: new Date(Date.now() - 900000).toISOString() // 15 min ago
  },
  {
    id: 'demo-msg-4',
    content: 'Updated Pin #001 severity to Critical and assigned to repair crew.',
    user_id: 'demo-user-2',
    user_name: 'Sarah Chen',
    user_avatar: '👩‍🔬',
    roof_id: 'e1-demo-roof',
    pin_id: 'demo-pin-1',
    message_type: 'system',
    created_at: new Date(Date.now() - 600000).toISOString() // 10 min ago
  }
]

const DEMO_USERS: UserPresence[] = [
  {
    user_id: 'demo-user-1',
    user_name: 'Mike Rodriguez',
    user_avatar: '👷‍♂️',
    status: 'online',
    last_seen: new Date().toISOString()
  },
  {
    user_id: 'demo-user-2',
    user_name: 'Sarah Chen',
    user_avatar: '👩‍🔬',
    status: 'online',
    last_seen: new Date().toISOString()
  },
  {
    user_id: 'demo-user-3',
    user_name: 'David Kim',
    user_avatar: '🔧',
    status: 'away',
    last_seen: new Date(Date.now() - 300000).toISOString() // 5 min ago
  },
  {
    user_id: 'demo-user-4',
    user_name: 'Lisa Thompson',
    user_avatar: '📊',
    status: 'offline',
    last_seen: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
]

export function useChat(roofId: string, pinId?: string, pinItemId?: string) {
  const queryClient = useQueryClient()
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [userPresence, setUserPresence] = useState<UserPresence[]>(DEMO_USERS)
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
      // In demo mode, return demo messages
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading chat messages', { roofId, pinId, pinItemId })
        return DEMO_MESSAGES.filter(msg => {
          if (pinItemId && msg.pin_item_id !== pinItemId) return false
          if (pinId && !pinItemId && msg.pin_id !== pinId) return false
          return msg.roof_id === roofId
        })
      }

      // Production query
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          attachments:chat_attachments(*)
        `)
        .eq('roof_id', roofId)
        .order('created_at', { ascending: true })

      if (pinItemId) {
        query = query.eq('pin_item_id', pinItemId)
      } else if (pinId) {
        query = query.eq('pin_id', pinId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as ChatMessage[]
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
      // In demo mode, add to local state
      if (process.env.NODE_ENV === 'development') {
        const newMessage: ChatMessage = {
          id: `demo-msg-${Date.now()}`,
          content: messageData.content,
          user_id: 'demo-user-current',
          user_name: 'You',
          user_avatar: '👤',
          roof_id: roofId,
          pin_id: pinId,
          pin_item_id: pinItemId,
          message_type: messageData.message_type || 'text',
          mentions: messageData.mentions,
          reply_to: messageData.reply_to,
          attachments: messageData.attachments?.map((att, index) => ({
            ...att,
            id: `demo-att-${Date.now()}-${index}`
          })),
          created_at: new Date().toISOString()
        }

        console.log('Demo: Sending message', newMessage)
        return newMessage
      }

      // Production implementation
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          content: messageData.content,
          roof_id: roofId,
          pin_id: pinId,
          pin_item_id: pinItemId,
          message_type: messageData.message_type || 'text',
          mentions: messageData.mentions,
          reply_to: messageData.reply_to,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          user_name: (await supabase.auth.getUser()).data.user?.user_metadata?.name || 'Anonymous'
        }])
        .select()
        .single()

      if (error) throw error
      return data as ChatMessage
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
    if (channelRef.current && process.env.NODE_ENV !== 'development') {
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
    if (channelRef.current && process.env.NODE_ENV !== 'development') {
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
    if (process.env.NODE_ENV === 'development') {
      // Demo mode - simulate typing users occasionally
      const interval = setInterval(() => {
        if (Math.random() > 0.8) { // 20% chance every 5 seconds
          const demoUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.user_id !== demoUser.user_id)
            return [...filtered, {
              user_id: demoUser.user_id,
              user_name: demoUser.user_name,
              timestamp: Date.now()
            }]
          })

          // Remove after 2 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.user_id !== demoUser.user_id))
          }, 2000)
        }
      }, 5000)

      return () => clearInterval(interval)
    }

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