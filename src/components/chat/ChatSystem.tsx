// ChatSystem.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatMessages, useSendChatMessage, useRealTimeChat } from '@/lib/hooks/useSupabaseQueries';
import { useAuth } from '@/lib/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Users, MessageCircle, Hash, Building2, Home, Pin, AtSign, Send } from 'lucide-react';
import { format } from 'date-fns';

// Utility function for conditional className concatenation
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ChatScope {
  type: 'global' | 'project' | 'roof' | 'pin';
  id?: string;
  name: string;
  description?: string;
}

interface ChatSystemProps {
  scopes: ChatScope[];
  defaultScope?: ChatScope;
  className?: string;
}

export function ChatSystem({ scopes, defaultScope, className }: ChatSystemProps) {
  const [activeScope, setActiveScope] = useState<ChatScope>(defaultScope ? defaultScope : scopes[0]);
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  } = ['global', 'roof', 'pin'].includes(activeScope?.type)
    ? useRealTimeChat(activeScope.type as 'global' | 'roof' | 'pin', activeScope?.id, userInfo)
    : { messages: [], onlineUsers: [], onlineCount: 0, isLoading: false };

  // גלילה לתחתית כשהודעות משתנות
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !user) return;
    const mentions = detectMentions(message);
    // Only allow valid scope types
    if (!['global', 'roof', 'pin'].includes(activeScope.type)) return;

    const chatMessage = {
      text: message.trim(),
      scope: activeScope.type as 'global' | 'roof' | 'pin',
      scope_id: activeScope.id || null,
      mentions: mentions.length > 0 ? mentions : null,
    };
    try {
      await sendMessageMutation.mutateAsync(chatMessage);
      setMessage('');
      setShowMentions(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, user, activeScope, sendMessageMutation, detectMentions]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setMessage(value);
    setCursorPosition(position);
    const textBeforeCursor = value.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  }, []);

  const insertMention = useCallback((username: string) => {
    const textBefore = message.substring(0, cursorPosition);
    const textAfter = message.substring(cursorPosition);
    const newMessage = `${textBefore.replace(/@\w*$/, '')}@${username} ${textAfter}`;
    setMessage(newMessage);
    setShowMentions(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = (textBefore.replace(/@\w*$/, '')).length + username.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [message, cursorPosition]);

  const availableUsers = onlineUsers.filter(u =>
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Team Chat
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {onlineCount} online
          </Badge>
        </div>
        <Tabs value={`${activeScope.type}-${activeScope.id || 'global'}`} className="w-full">
          <TabsList className="grid grid-cols-auto">
            {scopes.map(scope => (
              <TabsTrigger
                key={`${scope.type}-${scope.id || 'global'}`}
                value={`${scope.type}-${scope.id || 'global'}`}
                onClick={() => setActiveScope(scope)}
                className="flex items-center gap-2 text-xs"
              >
                {/* אייקונים לפי סוג */}
                {scope.type === 'global' && <Hash className="h-4 w-4" />}
                {scope.type === 'project' && <Building2 className="h-4 w-4" />}
                {scope.type === 'roof' && <Home className="h-4 w-4" />}
                {scope.type === 'pin' && <Pin className="h-4 w-4" />}
                {scope.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.message_id} className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {(msg.created_by?.charAt(0).toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.created_by || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">
                      {/* If you have a role, display it, otherwise default */}
                      {'Viewer'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed">
                    {(msg.text ?? '').split(/(@\w+)/).map((part, index) => {
                      if (part.match(/^@\w+$/)) {
                        const username = part.substring(1);
                        const isMentioned = user && (
                          username === user.user_metadata?.name ||
                          username === user.id
                        );
                        return (
                          <span
                            key={index}
                            className={cn(
                              "font-medium px-1 py-0.5 rounded",
                              isMentioned ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </div>
                  {msg.mentions && msg.mentions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <AtSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Mentioned: {msg.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation in {activeScope.name}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t relative">
          {showMentions && availableUsers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => insertMention(u.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextChange}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${activeScope.name}... (@ to mention)`}
                className="min-h-[60px] max-h-32 resize-none pr-20"
                disabled={sendMessageMutation.isPending}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  😊
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  📎
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              Chatting in {activeScope.name}
            </span>
            <span>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
