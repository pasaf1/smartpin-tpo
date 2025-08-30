'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Scope = 'global' | 'roof' | 'pin'
type MessageType = 'text' | 'mention' | 'attachment' | 'system'

export type ChatProMessage = {
  id: string
  text: string
  type: MessageType
  created_at: string
  updated_at?: string | null
  created_by: string | null
  mentions?: string[] | null
  reply_to?: string | null
  scope: Scope
  scope_id: string | null
  attachments?: ChatAttachment[]
  reactions?: Record<string, string[]> // { '👍': ['uid1','uid2'] }
  is_edited?: boolean
}

export type ChatAttachment = {
  id: string
  message_id: string
  file_url: string
  thumbnail_url?: string | null
  file_name: string
  file_type: string
  file_size: number
}

type ReactionRow = { id: string; message_id: string; user_id: string; emoji: string; created_at: string }
type AttachmentRow = ChatAttachment
type ReadsRow = { scope: Scope; scope_id: string | null; user_id: string; last_read_at: string }

const PAGE_SIZE = 30

function channelName(scope: Scope, scopeId: string | null) {
  return `chat:${scope}:${scopeId ?? 'global'}`
}

function toClientMessage(row: any, extras?: Partial<ChatProMessage>): ChatProMessage {
  return {
    id: row.message_id || row.id,
    text: row.text ?? '',
    type: 'text',
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    created_by: row.created_by ?? null,
    mentions: Array.isArray(row.mentions) ? row.mentions : null,
    reply_to: row.reply_to ?? null,
    scope: row.scope,
    scope_id: row.scope_id,
    attachments: [],
    reactions: {},
    is_edited: !!row.updated_at,
    ...extras,
  }
}

async function fetchPage(scope: Scope, scopeId: string | null, page: number) {
  const base = supabase
    .from('chats')
    .select('*')
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + (PAGE_SIZE - 1))

  const query = scopeId ? base.eq('scope_id', scopeId) : base.is('scope_id', null)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => toClientMessage(r))
}

async function getReactionsFor(scope: Scope, scopeId: string | null): Promise<Record<string, Record<string, string[]>>> {
  try {
    // חזרה לטבלת pin_chat קיימת במקום chat_reactions שלא קיימת
    const { data, error } = await (supabase as any)
      .from('pin_chat')
      .select('id, user_id, message, created_at')
      .eq('scope', scope)

    if (error) return {}
    // פישוט: נחזיר מבנה ריק לריאקשנים כי הטבלה לא קיימת
    return {}
  } catch (error) {
    console.warn('Failed to fetch reactions:', error)
    return {}
  }
}

async function getAttachmentsFor(scope: Scope, scopeId: string | null): Promise<Record<string, any[]>> {
  try {
    // חזרה לטבלת photos קיימת במקום chat_attachments שלא קיימת
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('scope', scope)

    if (error) return {}
    // פישוט: נחזיר מבנה ריק להתקשרויות כי הטבלה לא קיימת
    return {}
  } catch (error) {
    console.warn('Failed to fetch attachments:', error)
    return {}
  }
}

export function useChatPro(scope: Scope, scopeId: string | null, opts?: {
  enableReactions?: boolean
  enableReads?: boolean
  enableAttachments?: boolean
  enableTyping?: boolean
  enablePresence?: boolean
  pageSize?: number
}) {
  const queryClient = useQueryClient()
  const pageSize = opts?.pageSize ?? PAGE_SIZE
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; ts: number }[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // messages (infinite)
  const messagesQuery = useInfiniteQuery({
    queryKey: ['chat', scope, scopeId],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await fetchPage(scope, scopeId, pageParam)
      // hydrate extras
      const [rx, atts] = await Promise.all([
        opts?.enableReactions ? getReactionsFor(scope, scopeId) : Promise.resolve({}),
        opts?.enableAttachments ? getAttachmentsFor(scope, scopeId) : Promise.resolve({}),
      ])
      return page.map(m => ({
        ...m,
        reactions: (rx as any)[m.id] ?? {},
        attachments: (atts as any)[m.id] ?? [],
      }))
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    initialPageParam: 0,
  })

  const messages = useMemo(
    () => [...(messagesQuery.data?.pages ?? [])].flat().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messagesQuery.data]
  )

  // send message
  const sendMutation = useMutation({
    mutationFn: async (payload: {
      text: string
      mentions?: string[] | null
      reply_to?: string | null
      attachments?: File[] // optional
    }) => {
      const user = (await supabase.auth.getUser()).data.user
      const { data, error } = await supabase
        .from('chats')
        .insert([{
          text: payload.text,
          scope, scope_id: scopeId,
          mentions: payload.mentions ?? null,
          reply_to: payload.reply_to ?? null,
          created_by: user?.id ?? null
        }])
        .select()
        .single()
      if (error) throw error

      // optional attachments - נשתמש בטבלת photos קיימת
      if (opts?.enableAttachments && payload.attachments?.length) {
        for (const file of payload.attachments) {
          const path = `chat/${scope}/${scopeId ?? 'global'}/${data.message_id}/${Date.now()}-${file.name}`
          try {
            const up = await supabase.storage.from('pin-photos').upload(path, file, { upsert: false })
            if (!up.error) {
              const pub = supabase.storage.from('pin-photos').getPublicUrl(path)
              // נשמור בטבלת photos קיימת במקום chat_attachments
              await supabase.from('photos').insert([{
                type: 'OpenPIC',
                pin_id: scopeId,
                file_url_public: pub.data.publicUrl,
              }])
            }
          } catch (attachError) {
            console.warn('Failed to upload attachment:', attachError)
          }
        }
      }

      return toClientMessage(data)
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['chat', scope, scopeId] })
      const user = (await supabase.auth.getUser()).data.user
      const optimistic: ChatProMessage = {
        id: `tmp_${Date.now()}`,
        text: payload.text,
        type: 'text',
        created_at: new Date().toISOString(),
        created_by: user?.id ?? null,
        mentions: payload.mentions ?? null,
        reply_to: payload.reply_to ?? null,
        scope, scope_id: scopeId,
        attachments: [],
        reactions: {},
        is_edited: false
      }
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const pages = [...old.pages]
        if (!pages.length) pages.push([])
        pages[pages.length - 1] = [...pages[pages.length - 1], optimistic]
        return { ...old, pages }
      })
      return { optimisticId: optimistic.id }
    },
    onSuccess: (msg, _payload, ctx) => {
      // replace optimistic
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: ChatProMessage[]) =>
          page.map((m: ChatProMessage) => (m.id === ctx?.optimisticId ? msg : m))
        )
        return { ...old, pages }
      })
    },
    onError: (_err, _payload, ctx) => {
      // rollback optimistic
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: ChatProMessage[]) =>
          page.filter((m: ChatProMessage) => m.id !== ctx?.optimisticId)
        )
        return { ...old, pages }
      })
    }
  })

  // edit / delete
  const editMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { data, error } = await supabase
        .from('chats')
        .update({ text, updated_at: new Date().toISOString() })
        .eq('message_id', id)
        .select()
        .single()
      if (error) throw error
      return toClientMessage(data)
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: ChatProMessage[]) =>
          page.map((m) => (m.id === msg.id ? { ...m, text: msg.text, is_edited: true, updated_at: msg.updated_at } : m))
        )
        return { ...old, pages }
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chats').delete().eq('message_id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: ChatProMessage[]) =>
          page.filter((m) => m.id !== id)
        )
        return { ...old, pages }
      })
    }
  })

  // reactions (מפושט - רק אופטימיסטי)
  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      // פישוט: רק לוגיקה מקומית, ללא שמירה ב-DB
      return { messageId, emoji, removed: false }
    },
    onSuccess: (res) => {
      queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
        if (!old) return old
        const userId = 'current-user' // פישוט
        const pages = old.pages.map((page: ChatProMessage[]) =>
          page.map((m) => {
            if (m.id !== res.messageId) return m
            const map = { ...(m.reactions ?? {}) }
            const arr = new Set(map[res.emoji] ?? [])
            if (res.removed) arr.delete(userId)
            else arr.add(userId)
            map[res.emoji] = Array.from(arr)
            return { ...m, reactions: map }
          })
        )
        return { ...old, pages }
      })
    }
  })

  // reads (מפושט - מחזיר 0 תמיד)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['chat-unread', scope, scopeId],
    enabled: !!opts?.enableReads,
    queryFn: async () => {
      // פישוט: נחזיר 0 כי הטבלה לא קיימת
      return 0
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: false
  })

  const markRead = useMutation({
    mutationFn: async () => {
      // פישוט: ללא פעולה כי הטבלה לא קיימת
      return
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-unread', scope, scopeId] })
  })

  // typing / presence
  const startTyping = useCallback(() => {
    if (!opts?.enableTyping || !channelRef.current) return
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { action: 'start' } })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { action: 'stop' } })
    }, 2500)
  }, [opts?.enableTyping])

  // realtime wire-up
  useEffect(() => {
    const ch = supabase.channel(channelName(scope, scopeId))

    // messages
    ch.on('postgres_changes', { schema: 'public', table: 'chats', event: '*' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const m = toClientMessage(payload.new)
        queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
          if (!old) return old
          const pages = [...old.pages]
          if (!pages.length) pages.push([])
          pages[pages.length - 1] = [...pages[pages.length - 1], m]
          return { ...old, pages }
        })
      } else if (payload.eventType === 'UPDATE') {
        const m = toClientMessage(payload.new)
        queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
          if (!old) return old
          const pages = old.pages.map((page: ChatProMessage[]) =>
            page.map((x) => (x.id === m.id ? { ...x, text: m.text, is_edited: true, updated_at: m.updated_at } : x))
          )
          return { ...old, pages }
        })
      } else if (payload.eventType === 'DELETE') {
        const id = (payload.old as any).message_id
        queryClient.setQueryData<any>(['chat', scope, scopeId], (old: any) => {
          if (!old) return old
          const pages = old.pages.map((page: ChatProMessage[]) => page.filter((x) => x.id !== id))
          return { ...old, pages }
        })
      }
    })

    // reactions
    ch.on('postgres_changes', { schema: 'public', table: 'chat_reactions', event: '*' }, (p) => {
      queryClient.invalidateQueries({ queryKey: ['chat', scope, scopeId] }) // פשטות: לרענן
    })

    // attachments
    ch.on('postgres_changes', { schema: 'public', table: 'chat_attachments', event: '*' }, () => {
      queryClient.invalidateQueries({ queryKey: ['chat', scope, scopeId] })
    })

    // typing
    if (opts?.enableTyping) {
      ch.on('broadcast', { event: 'typing' }, (payload) => {
        const { action } = payload.payload as { action: 'start' | 'stop' }
        const id = 'someone'
        const name = 'Someone'
        if (action === 'start') {
          setTypingUsers((prev) => [...prev.filter(u => u.id !== id), { id, name, ts: Date.now() }])
        } else {
          setTypingUsers((prev) => prev.filter(u => u.id !== id))
        }
      })
    }

    // presence
    if (opts?.enablePresence) {
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        const users = Object.values(state).flat()
        setOnlineUsers(users as any[])
      })
    }

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED' && opts?.enablePresence) {
        ch.track({ user_id: 'me', user_name: 'Me', status: 'online', last_seen: new Date().toISOString() })
      }
    })

    channelRef.current = ch
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      ch.unsubscribe()
    }
  }, [scope, scopeId, opts?.enableTyping, opts?.enablePresence, queryClient])

  // search
  const search = useCallback(async (term: string) => {
    if (!term.trim()) return []
    try {
      const query = supabase
        .from('chats')
        .select('*')
        .eq('scope', scope)
        .ilike('text', `%${term}%`)
        .limit(100)
      
      // הוסף תנאי scope_id רק אם יש ערך
      const finalQuery = scopeId ? query.eq('scope_id', scopeId) : query.is('scope_id', null)
      const { data, error } = await finalQuery
      
      if (error) return []
      return (data ?? []).map((r) => toClientMessage(r))
    } catch (error) {
      console.warn('Search failed:', error)
      return []
    }
  }, [scope, scopeId])

  return {
    messages,
    pages: messagesQuery.data?.pages ?? [],
    hasMore: !!messagesQuery.hasNextPage,
    loadMore: messagesQuery.fetchNextPage,
    isLoading: messagesQuery.isLoading,

    sendMessage: (p: { text: string; mentions?: string[] | null; reply_to?: string | null; attachments?: File[] }) =>
      sendMutation.mutateAsync(p),
    editMessage: (id: string, text: string) => editMutation.mutateAsync({ id, text }),
    deleteMessage: (id: string) => deleteMutation.mutateAsync(id),

    toggleReaction: (messageId: string, emoji: string) => opts?.enableReactions ? toggleReaction.mutateAsync({ messageId, emoji }) : Promise.resolve(),
    markRead: () => opts?.enableReads ? markRead.mutateAsync() : Promise.resolve(),
    unreadCount,

    startTyping,
    typingUsers,
    onlineUsers,

    search,
  }
}
