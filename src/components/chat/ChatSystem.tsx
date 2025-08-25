import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChatMessages, useSendChatMessage, useRealTimeChat } from '@/lib/hooks/useSupabaseQueries'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  MessageCircle, 
  Send, 
  Users, 
  Hash, 
  Building2, 
  Home,
  Pin,
  AtSign,
  Smile,
  Paperclip,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'

export interface ChatMessage {
  id: string
  content: string
  user_id: string
  scope: 'global' | 'project' | 'roof' | 'pin'
  scope_id?: string
  mentions?: string[]
  attachments?: string[]
  created_at: string
  updated_at: string
  user?: {
    name: string
    avatar_url?: string
    role: string
  }
}

export interface ChatScope {
  type: 'global' | 'project' | 'roof' | 'pin'
  id?: string
  name: string
  description?: string
}

interface ChatSystemProps {
  scopes: ChatScope[]
  defaultScope?: ChatScope
  className?: string
}

export function ChatSystem({ scopes, defaultScope, className }: ChatSystemProps) {
  const [activeScope, setActiveScope] = useState<ChatScope>(defaultScope || scopes[0])
  const [message, setMessage] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const sendMessageMutation = useSendChatMessage()
  
  const { 
    messages, 
    onlineUsers, 
    onlineCount, 
    isLoading 
  } = useRealTimeChat(
    activeScope.type, 
    activeScope.id,
    user ? { 
      id: user.id, 
      name: user.user_metadata?.name || 'Anonymous',
      role: user.user_metadata?.role || 'Viewer'
    } : undefined
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const detectMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(match => match.substring(1)) : []
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !user) return

    const mentions = detectMentions(message)
    
    const chatMessage = {
      content: message.trim(),
      user_id: user.id,
      scope: activeScope.type,
      scope_id: activeScope.id || null,
      mentions: mentions.length > 0 ? mentions : null,
      attachments: null
    }

    try {
      await sendMessageMutation.mutateAsync(chatMessage)
      setMessage('')
      setShowMentions(false)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [message, user, activeScope, sendMessageMutation, detectMentions])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart
    
    setMessage(value)
    setCursorPosition(position)

    const textBeforeCursor = value.substring(0, position)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionSearch('')
    }
  }, [])

  const insertMention = useCallback((username: string) => {
    const textBeforeCursor = message.substring(0, cursorPosition)
    const textAfterCursor = message.substring(cursorPosition)
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '')
    
    const newMessage = `${beforeMention}@${username} ${textAfterCursor}`
    setMessage(newMessage)
    setShowMentions(false)
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeMention.length + username.length + 2
        textareaRef.current.setSelectionRange(newPosition, newPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }, [message, cursorPosition])

  const getScopeIcon = useCallback((scope: ChatScope) => {
    switch (scope.type) {
      case 'global': return <Hash className="h-4 w-4" />
      case 'project': return <Building2 className="h-4 w-4" />
      case 'roof': return <Home className="h-4 w-4" />
      case 'pin': return <Pin className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }, [])

  const availableUsers = onlineUsers.filter(u => 
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Team Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {onlineCount} online
            </Badge>
          </div>
        </div>
        
        <Tabs value={`${activeScope.type}-${activeScope.id || 'global'}`} className="w-full">
          <TabsList className="grid w-full grid-cols-auto">
            {scopes.map((scope) => (
              <TabsTrigger
                key={`${scope.type}-${scope.id || 'global'}`}
                value={`${scope.type}-${scope.id || 'global'}`}
                onClick={() => setActiveScope(scope)}
                className="flex items-center gap-2 text-xs"
              >
                {getScopeIcon(scope)}
                {scope.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {msg.user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.user?.name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">
                      {msg.user?.role || 'Viewer'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  
                  <div className="text-sm leading-relaxed">
                    {msg.content.split(/(@\w+)/).map((part, index) => {
                      if (part.match(/^@\w+$/)) {
                        const username = part.substring(1)
                        const isMentioned = user && (username === user.user_metadata?.name || username === user.id)
                        
                        return (
                          <span
                            key={index}
                            className={cn(
                              "font-medium px-1 py-0.5 rounded",
                              isMentioned 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {part}
                          </span>
                        )
                      }
                      return part
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

                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
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

        {/* Online Users Indicator */}
        {onlineUsers.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-1">
                {onlineUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={user.id}
                    className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
                    +{onlineUsers.length - 5}
                  </div>
                )}
              </div>
              <span>
                {onlineUsers.length} online in {activeScope.name}
              </span>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t relative">
          {showMentions && availableUsers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
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
                onKeyPress={handleKeyPress}
                placeholder={`Message ${activeScope.name}... (@ to mention)`}
                className="min-h-[60px] max-h-32 resize-none pr-20"
                disabled={sendMessageMutation.isPending}
              />
              
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    // TODO: Implement emoji picker
                  }}
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    // TODO: Implement file attachment
                  }}
                >
                  <Paperclip className="h-4 w-4" />
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
              Chatting in {getScopeIcon(activeScope)} {activeScope.name}
            </span>
            <span>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatSystem