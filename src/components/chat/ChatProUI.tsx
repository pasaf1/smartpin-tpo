'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useChatPro, type ChatProMessage } from '@/lib/hooks/useChatPro'
import { 
  Send, 
  Reply, 
  Edit3, 
  Trash2, 
  Paperclip, 
  Smile, 
  MoreHorizontal,
  Users,
  MessageCircle,
  Search,
  Settings
} from 'lucide-react'

interface ChatProUIProps {
  scope: 'global' | 'roof' | 'pin'
  scopeId?: string | null
  className?: string
  height?: string
  title?: string
  placeholder?: string
}

interface TypingIndicatorProps {
  users: { id: string; name: string }[]
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
      </div>
      <span>
        {users.length === 1 && users[0]
          ? `${users[0].name} is typing...`
          : users.length === 2 && users[0] && users[1]
          ? `${users[0].name} and ${users[1].name} are typing...`
          : `${users.length} people are typing...`
        }
      </span>
    </div>
  )
}

interface MessageProps {
  message: ChatProMessage
  isOwn?: boolean
  onReply?: (message: ChatProMessage) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
}

const MessageComponent: React.FC<MessageProps> = ({
  message,
  isOwn = false,
  onReply,
  onEdit,
  onDelete,
  onReaction
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const commonEmojis = ['👍', '❤️', '😊', '🎉', '👀', '🔥']

  const renderMentions = (text: string) => {
    return text.replace(/@(\w+(?:\.\w+)*)/g, 
      '<span class="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded text-sm font-medium">@$1</span>'
    )
  }

  return (
    <div 
      className={cn(
        "group flex gap-3 px-4 py-3 hover:bg-muted/25 transition-colors relative",
        isOwn && "bg-primary/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
          {message.created_by?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            isOwn && "text-primary"
          )}>
            {message.created_by || 'Unknown User'}
          </span>
          
          {message.type === 'mention' && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              @mention
            </Badge>
          )}
          
          {message.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Reply indicator */}
        {message.reply_to && (
          <div className="text-xs text-muted-foreground mb-2 pl-3 border-l-2 border-muted-foreground/30">
            <MessageCircle className="w-3 h-3 inline mr-1" />
            Replying to a message
          </div>
        )}

        {/* Message text */}
        <div className={cn(
          "text-sm leading-relaxed",
          message.type === 'mention' && "border-l-4 border-l-blue-500 pl-3 bg-blue-50/50 dark:bg-blue-950/20",
          message.type === 'system' && "text-muted-foreground italic bg-muted/25 px-2 py-1 rounded"
        )}>
          <div dangerouslySetInnerHTML={{ __html: renderMentions(message.text) }} />
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/25 max-w-sm"
              >
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(attachment.file_size / 1024)} KB
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 px-2">
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <Button
                  key={emoji}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => onReaction?.(message.id, emoji)}
                >
                  {emoji} {users.length}
                </Button>
              )
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="flex gap-1 mt-2 p-2 bg-popover border rounded-lg shadow-lg">
            {commonEmojis.map(emoji => (
              <Button
                key={emoji}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-base"
                onClick={() => {
                  onReaction?.(message.id, emoji)
                  setShowReactions(false)
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        (showActions || showReactions) && "opacity-100"
      )}>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setShowReactions(!showReactions)}
        >
          <Smile className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onReply?.(message)}
        >
          <Reply className="w-4 h-4" />
        </Button>
        
        {isOwn && onEdit && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(message.id)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
        
        {isOwn && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:text-destructive"
            onClick={() => onDelete(message.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function ChatProUI({
  scope,
  scopeId = null,
  className,
  height = "600px",
  title,
  placeholder = "Type your message..."
}: ChatProUIProps) {
  const [messageText, setMessageText] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatProMessage | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const {
    messages,
    hasMore,
    loadMore,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    markRead,
    unreadCount,
    startTyping,
    typingUsers,
    onlineUsers,
    search,
  } = useChatPro(scope, scopeId, {
    enableReactions: true,
    enableReads: true,
    enableAttachments: true,
    enableTyping: true,
    enablePresence: true,
  })

  // Auto-scroll to bottom for new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    // Mark messages as read when component is visible
    markRead()
  }, [messages, markRead])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [])

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return

    try {
      // Extract mentions
      const mentionMatches = messageText.match(/@(\w+(?:\.\w+)*)/g)
      const mentions = mentionMatches?.map(match => match.slice(1)) || null

      await sendMessage({
        text: messageText.trim(),
        mentions,
        reply_to: replyingTo?.id || null,
        attachments: selectedFiles
      })

      // Reset form
      setMessageText('')
      setSelectedFiles([])
      setReplyingTo(null)
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    } else if (event.key === 'Escape') {
      setReplyingTo(null)
      setEditingMessageId(null)
    }
  }

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      await editMessage(messageId, newText)
      setEditingMessageId(null)
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getScopeTitle = () => {
    if (title) return title
    switch (scope) {
      case 'global': return 'Global Chat'
      case 'roof': return `Roof Chat ${scopeId ? `#${scopeId}` : ''}`
      case 'pin': return `Pin Chat ${scopeId ? `#${scopeId}` : ''}`
      default: return 'Team Chat'
    }
  }

  const currentUserId = 'current-user' // In a real app, get from auth context

  return (
    <Card className={cn("flex flex-col", className)} style={{ height }}>
      {/* Header */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5" />
            {getScopeTitle()}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{onlineUsers.length}</span>
              </div>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        {showSearch && (
          <div className="pt-3 border-t">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            />
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-0">
            {/* Load more button */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadMore()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load older messages'}
                </Button>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isOwn = message.created_by === currentUserId
              const prevMessage = messages[index - 1]
              const showDivider = index === 0 ||
                !prevMessage ||
                new Date(prevMessage.created_at).toDateString() !==
                new Date(message.created_at).toDateString()

              return (
                <React.Fragment key={message.id}>
                  {showDivider && (
                    <div className="flex items-center gap-4 px-4 py-2">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground bg-background px-2">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  
                  <MessageComponent
                    message={message}
                    isOwn={isOwn}
                    onReply={setReplyingTo}
                    onEdit={setEditingMessageId}
                    onDelete={handleDeleteMessage}
                    onReaction={toggleReaction}
                  />
                </React.Fragment>
              )
            })}

            {/* Typing indicator */}
            <TypingIndicator users={typingUsers} />
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t bg-background">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/25">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Replying to <span className="font-medium">{replyingTo.created_by}</span>
              </span>
              <span className="text-muted-foreground max-w-xs truncate">
                {replyingTo.text}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}

        {/* File attachments */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/25">
            {selectedFiles.map((file, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                <Paperclip className="w-3 h-3" />
                {file.name}
                <button
                  onClick={() => removeFile(index)}
                  className="hover:text-destructive ml-1"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 p-4">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx"
          />

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value)
                adjustTextareaHeight()
                startTyping()
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[40px] max-h-[120px] resize-none border-0 bg-muted/25 focus-visible:ring-1"
              rows={1}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && selectedFiles.length === 0}
            className="h-10 w-10 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ChatProUI