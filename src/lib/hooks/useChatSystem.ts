// useChatSystem.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useChat } from './useChat';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { User } from '@/lib/database.types';

export interface ChatNotification {
  id: string;
  messageId: string;
  type: 'mention' | 'reply' | 'message';
  content: string;
  from: string;
  scope: string;
  scopeName: string;
  timestamp: string;
  read: boolean;
}

export interface ChatScope {
  type: 'global' | 'project' | 'roof' | 'pin';
  id?: string;
  name: string;
  description?: string;
  unreadCount?: number;
}

export function useChatSystem(scopes: ChatScope[]) {
  const [activeScope, setActiveScope] = useState<ChatScope>(scopes[0]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { user } = useAuth();

  // Use the existing useChat hook
  const { 
    messages, 
    sendMessage: chatSendMessage, 
    isSending,
    sendError 
  } = useChat(activeScope.id || 'global');

  const markScopeAsRead = useCallback((scope: ChatScope) => {
    const scopeKey = `${scope.type}-${scope.id || 'global'}`;
    setUnreadCounts(prev => ({ ...prev, [scopeKey]: 0 }));
    setNotifications(prev =>
      prev.map(notification =>
        notification.scope === scopeKey ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const handleScopeChange = useCallback((scope: ChatScope) => {
    setActiveScope(scope);
    markScopeAsRead(scope);
  }, [markScopeAsRead]);

  const detectMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }, []);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() || !user) return false;
    
    try {
      await chatSendMessage({
        content: content.trim(),
        message_type: 'text'
      });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message', { description: 'Please try again' });
      return false;
    }
  }, [user, activeScope, chatSendMessage]);

  const addNotification = useCallback((notification: Omit<ChatNotification, 'id'>) => {
    const newNotification: ChatNotification = {
      ...notification,
      id: `${notification.messageId}-${Date.now()}`
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
    const scopeKey = notification.scope;
    setUnreadCounts(prev => ({
      ...prev,
      [scopeKey]: (prev[scopeKey] || 0) + 1
    }));
    if (notification.type === 'mention' && user) {
      const currentScopeKey = `${activeScope.type}-${activeScope.id || 'global'}`;
      if (notification.scope !== currentScopeKey) {
        toast.info(`You were mentioned in ${notification.scopeName}`, {
          description: notification.content.substring(0, 100),
          action: {
            label: 'View',
            onClick: () => {
              const scope = scopes.find(s =>
                `${s.type}-${s.id || 'global'}` === notification.scope
              );
              if (scope) handleScopeChange(scope);
            }
          }
        });
      }
    }
  }, [user, activeScope, scopes, handleScopeChange]);

  useEffect(() => {
    if (!messages || !user) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.user_id === user.id) return;
    const scopeKey = `${activeScope.type}-${activeScope.id || 'global'}`;
    const userName = user.user_metadata?.name || user.id;
    if (lastMsg.mentions?.includes(userName)) {
      addNotification({
        messageId: lastMsg.id,
        type: 'mention',
        content: lastMsg.content || '',
        from: lastMsg.user_name || 'Unknown',
        scope: scopeKey,
        scopeName: activeScope.name,
        timestamp: lastMsg.created_at,
        read: false
      });
    } else {
      const currentScopeKey = `${activeScope.type}-${activeScope.id || 'global'}`;
      if (scopeKey !== currentScopeKey) {
        addNotification({
          messageId: lastMsg.id,
          type: 'message',
          content: lastMsg.content || '',
          from: lastMsg.user_name || 'Unknown',
          scope: scopeKey,
          scopeName: activeScope.name,
          timestamp: lastMsg.created_at,
          read: false
        });
      }
    }
  }, [messages, user, activeScope, addNotification]);

  const getScopeWithUnread = useCallback((scope: ChatScope) => {
    const scopeKey = `${scope.type}-${scope.id || 'global'}`;
    const count = unreadCounts[scopeKey] || 0;
    return { ...scope, unreadCount: count };
  }, [unreadCounts]);

  const scopesWithUnread = scopes.map(getScopeWithUnread);
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCounts({});
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return {
    activeScope,
    messages,
    onlineUsers: [],
    onlineCount: 0,
    isLoading: false,
    notifications: notifications.filter(n => !n.read),
    allNotifications: notifications,
    totalUnreadCount,
    unreadCounts,
    scopesWithUnread,
    sendMessage,
    handleScopeChange,
    markScopeAsRead,
    clearNotifications,
    markNotificationAsRead,
    detectMentions,
    availableUsers: [] as User[]
  };
}
