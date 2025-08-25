import { useState, useCallback, useEffect } from 'react'
import { useChatMessages, useSendChatMessage, useRealTimeChat } from './useSupabaseQueries'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface ChatNotification {
  id: string
  messageId: string
  type: 'mention' | 'reply' | 'message'
  content: string
  from: string
  scope: string
  scopeName: string
  timestamp: string
  read: boolean
}

export interface ChatScope {
  type: 'global' | 'project' | 'roof' | 'pin'
  id?: string
  name: string
  description?: string
  unreadCount?: number
}

export function useChatSystem(scopes: ChatScope[]) {
  const [activeScope, setActiveScope] = useState<ChatScope>(scopes[0])
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  const { user } = useAuth()
  const sendMessageMutation = useSendChatMessage()

  const userInfo = user ? {
    id: user.id,
    name: user.user_metadata?.name || 'Anonymous',
    role: user.user_metadata?.role || 'Viewer'
  } : undefined

  const { 
    messages, 
    onlineUsers, 
    onlineCount, 
    isLoading 
  } = useRealTimeChat(activeScope.type, activeScope.id, userInfo)

  const markScopeAsRead = useCallback((scope: ChatScope) => {
    const scopeKey = `${scope.type}-${scope.id || 'global'}`
    setUnreadCounts(prev => ({ ...prev, [scopeKey]: 0 }))
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.scope === scopeKey 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const handleScopeChange = useCallback((scope: ChatScope) => {
    setActiveScope(scope)
    markScopeAsRead(scope)
  }, [markScopeAsRead])

  const detectMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(match => match.substring(1)) : []
  }, [])

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() || !user) return false

    const mentions = detectMentions(content)
    
    const chatMessage = {
      content: content.trim(),
      user_id: user.id,
      scope: activeScope.type,
      scope_id: activeScope.id || null,
      mentions: mentions.length > 0 ? mentions : null,
      attachments: null // TODO: Implement file attachments
    }

    try {
      await sendMessageMutation.mutateAsync(chatMessage)
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', {
        description: 'Please try again'
      })
      return false
    }
  }, [user, activeScope, sendMessageMutation, detectMentions])

  const addNotification = useCallback((notification: Omit<ChatNotification, 'id'>) => {
    const newNotification: ChatNotification = {
      ...notification,
      id: `${notification.messageId}-${Date.now()}`
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep last 50

    const scopeKey = notification.scope
    setUnreadCounts(prev => ({ 
      ...prev, 
      [scopeKey]: (prev[scopeKey] || 0) + 1 
    }))

    if (notification.type === 'mention' && user) {
      const isCurrentScope = scopeKey === `${activeScope.type}-${activeScope.id || 'global'}`
      
      if (!isCurrentScope) {
        toast.info(`You were mentioned in ${notification.scopeName}`, {
          description: notification.content.substring(0, 100),
          action: {
            label: 'View',
            onClick: () => {
              const scope = scopes.find(s => 
                `${s.type}-${s.id || 'global'}` === scopeKey
              )
              if (scope) {
                handleScopeChange(scope)
              }
            }
          }
        })
      }
    }
  }, [user, activeScope, scopes, handleScopeChange])

  useEffect(() => {
    if (!messages || !user) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.user_id === user.id) return

    const scopeKey = `${activeScope.type}-${activeScope.id || 'global'}`
    const userName = user.user_metadata?.name || user.id

    if (lastMessage.mentions?.includes(userName)) {
      addNotification({
        messageId: lastMessage.id,
        type: 'mention',
        content: lastMessage.content,
        from: lastMessage.user?.name || 'Unknown',
        scope: scopeKey,
        scopeName: activeScope.name,
        timestamp: lastMessage.created_at,
        read: false
      })
    } else {
      const currentScopeKey = `${activeScope.type}-${activeScope.id || 'global'}`
      const isCurrentScope = scopeKey === currentScopeKey
      
      if (!isCurrentScope) {
        addNotification({
          messageId: lastMessage.id,
          type: 'message',
          content: lastMessage.content,
          from: lastMessage.user?.name || 'Unknown',
          scope: scopeKey,
          scopeName: activeScope.name,
          timestamp: lastMessage.created_at,
          read: false
        })
      }
    }
  }, [messages, user, activeScope, addNotification])

  const getScopeWithUnreadCount = useCallback((scope: ChatScope) => {
    const scopeKey = `${scope.type}-${scope.id || 'global'}`
    const unreadCount = unreadCounts[scopeKey] || 0
    
    return {
      ...scope,
      unreadCount
    }
  }, [unreadCounts])

  const scopesWithUnread = scopes.map(getScopeWithUnreadCount)
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCounts({})
  }, [])

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  return {
    // Chat state
    activeScope,
    messages,
    onlineUsers,
    onlineCount,
    isLoading,
    
    // Notifications
    notifications: notifications.filter(n => !n.read),
    allNotifications: notifications,
    totalUnreadCount,
    unreadCounts,
    
    // Scopes with unread counts
    scopesWithUnread,
    
    // Actions
    sendMessage,
    handleScopeChange,
    markScopeAsRead,
    clearNotifications,
    markNotificationAsRead,
    
    // Mention helpers
    detectMentions,
    availableUsers: onlineUsers
  }
}

export default useChatSystem