// useChatSystem.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useChatMessages, useSendChatMessage, useRealTimeChat } from './useSupabaseQueries';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
  const sendMessageMutation = useSendChatMessage();

  const userInfo = user ? {
    id: user.id,
    name: user.user_metadata?.name || 'Anonymous',
    role: user.user_metadata?.role || 'Viewer'
  } : undefined;

  const {
    messages,
    onlineUsers,
    onlineCount,
    isLoading
  } = useRealTimeChat(activeScope.type as 'global' | 'roof' | 'pin', activeScope.id, userInfo);

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
    const mentions = detectMentions(content);
    const chatMessage = {
      content: content.trim(),
      user_id: user.id,
      scope: activeScope.type as 'global' | 'roof' | 'pin',
      scope_id: activeScope.id || null,
      mentions: mentions.length > 0 ? mentions : null,
      attachments: null
    };
    try {
      await sendMessageMutation.mutateAsync(chatMessage);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message', { description: 'Please try again' });
      return false;
    }
  }, [user, activeScope, sendMessageMutation, detectMentions]);

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
    if (!lastMsg || lastMsg.created_by === user.id) return;
    const scopeKey = `${activeScope.type}-${activeScope.id || 'global'}`;
    const userName = user.user_metadata?.name || user.id;
    if (lastMsg.mentions?.includes(userName)) {
      addNotification({
        messageId: lastMsg.message_id,
        type: 'mention',
        content: lastMsg.text || '',
        from: 'Unknown', // lastMsg.user is not available on this type
        scope: scopeKey,
        scopeName: activeScope.name,
        timestamp: lastMsg.created_at,
        read: false
      });
    } else {
      const currentScopeKey = `${activeScope.type}-${activeScope.id || 'global'}`;
      if (scopeKey !== currentScopeKey) {
        addNotification({
          messageId: lastMsg.message_id,
          type: 'message',
          content: lastMsg.text || '',
          from: 'Unknown', // lastMsg.user is not available on this type
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
    onlineUsers,
    onlineCount,
    isLoading,
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
    availableUsers: onlineUsers
  };
}
