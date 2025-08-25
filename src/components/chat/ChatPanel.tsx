'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessageComponent } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ExportDialog } from '@/components/export/ExportDialog'
import { useChat, type ChatMessage, type UserPresence } from '@/lib/hooks/useChat'
import { useUsers } from '@/lib/hooks/useAuth'
import { useRoof } from '@/lib/hooks/useRoofs'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  roofId: string
  pinId?: string
  pinItemId?: string
  className?: string
  title?: string
  showPresence?: boolean
  maxHeight?: string
}

function TypingIndicator({ users }: { users: Array<{ user_name: string }> }) {
  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {users.length === 1 
          ? `${users[0].user_name} is typing...`
          : `${users.map(u => u.user_name).join(', ')} are typing...`
        }
      </span>
    </div>
  )
}

function UserPresenceList({ users }: { users: UserPresence[] }) {
  const onlineUsers = users.filter(u => u.status === 'online')
  const awayUsers = users.filter(u => u.status === 'away')
  
  if (users.length === 0) return null

  return (
    <div className="space-y-2">
      {onlineUsers.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Online ({onlineUsers.length})
          </div>
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <div key={user.user_id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {user.user_avatar && (
                  <span className="text-base">{user.user_avatar}</span>
                )}
                <span className="flex-1 truncate">{user.user_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {awayUsers.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Away ({awayUsers.length})
          </div>
          <div className="space-y-1">
            {awayUsers.map((user) => (
              <div key={user.user_id} className="flex items-center gap-2 text-sm opacity-60">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                {user.user_avatar && (
                  <span className="text-base">{user.user_avatar}</span>
                )}
                <span className="flex-1 truncate">{user.user_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ChatPanel({
  roofId,
  pinId,
  pinItemId,
  className,
  title,
  showPresence = true,
  maxHeight = "600px"
}: ChatPanelProps) {
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)
  const [showPresencePanel, setShowPresencePanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    userPresence,
    typingUsers,
    isLoadingMessages,
    isSending,
    sendMessage,
    startTyping,
    stopTyping,
    messagesError
  } = useChat(roofId, pinId, pinItemId)

  // Data for export
  const { data: users = [] } = useUsers()
  const { data: roof } = useRoof(roofId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // Generate title based on context
  const getTitle = () => {
    if (title) return title
    if (pinItemId) return 'Pin Item Chat'
    if (pinId) return 'Pin Chat'
    return 'Project Chat'
  }

  const handleSendMessage = async (content: string, options?: any) => {
    await sendMessage({
      content,
      message_type: options?.mentions?.length > 0 ? 'mention' : 'text',
      mentions: options?.mentions,
      reply_to: options?.reply_to,
      attachments: options?.attachments
    })
  }

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setReplyToMessage(message)
    }
  }

  const handleEdit = async (messageId: string, newContent: string) => {
    // In production, this would call an edit mutation
    console.log('Demo: Edit message', { messageId, newContent })
  }

  const totalOnlineUsers = userPresence.filter(u => u.status === 'online').length

  if (messagesError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p>Failed to load chat messages</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col', className)} style={{ maxHeight }}>
      {/* Header */}
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{getTitle()}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {messages.length} messages
              </Badge>
              {showPresence && totalOnlineUsers > 0 && (
                <Badge variant="outline" className="text-xs">
                  {totalOnlineUsers} online
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {roof && (
              <ExportDialog
                roofId={roofId}
                roofName={roof.name}
                messages={messages}
                pins={[]}
                users={users}
                roofData={roof}
              >
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Export Chat">
                  📄
                </Button>
              </ExportDialog>
            )}
            
            {showPresence && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPresencePanel(!showPresencePanel)}
                className="h-8 w-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Presence Panel */}
      {showPresencePanel && showPresence && (
        <div className="border-t bg-muted/25 p-3">
          <UserPresenceList users={userPresence} />
        </div>
      )}

      {/* Messages */}
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full">
          <div className="min-h-full flex flex-col">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading messages...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="text-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {messages.map((message) => (
                  <ChatMessageComponent
                    key={message.id}
                    message={message}
                    isOwn={message.user_name === 'You'}
                    onReply={handleReply}
                    onEdit={handleEdit}
                  />
                ))}
                
                {/* Typing indicator */}
                <TypingIndicator users={typingUsers} />
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          onStartTyping={startTyping}
          onStopTyping={stopTyping}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          disabled={isSending}
          placeholder={
            pinItemId 
              ? "Comment on this item..." 
              : pinId 
              ? "Discuss this pin..." 
              : "Message the team..."
          }
        />
      </div>
    </Card>
  )
}