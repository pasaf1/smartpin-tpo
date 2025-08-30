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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  Settings,
  X,
  Image,
  ArrowLeft,
  Menu
} from 'lucide-react'

interface ChatProUIMobileProps {
  scope: 'global' | 'roof' | 'pin'
  scopeId?: string | null
  className?: string
  title?: string
  placeholder?: string
  fullscreen?: boolean
  onClose?: () => void
}

interface MobileMessageProps {
  message: ChatProMessage
  isOwn?: boolean
  onReply?: (message: ChatProMessage) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
}

const MobileTypingIndicator = ({ users }: { users: { id: string; name: string }[] }) => {
  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
      </div>
      <span className="text-xs">
        {users.length === 1 
          ? `${users[0].name.split('.')[0]} typing...`
          : `${users.length} typing...`
        }
      </span>
    </div>
  )
}

const MobileMessage: React.FC<MobileMessageProps> = ({
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

  const handleLongPress = () => {
    setShowActions(true)
  }

  return (
    <div 
      className={cn(
        "flex gap-2 px-3 py-2 active:bg-muted/25 transition-colors",
        isOwn && "bg-primary/5"
      )}
      onTouchStart={() => {
        const timer = setTimeout(handleLongPress, 500)
        const cleanup = () => clearTimeout(timer)
        document.addEventListener('touchend', cleanup, { once: true })
        document.addEventListener('touchmove', cleanup, { once: true })
      }}
    >
      {/* Avatar - Smaller on mobile */}
      <div className="flex-shrink-0 w-7 h-7">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
          {message.created_by?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium truncate",
            isOwn && "text-primary"
          )}>
            {message.created_by?.split('.')[0] || 'User'}
          </span>
          
          {message.type === 'mention' && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              @
            </Badge>
          )}
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
              .replace('about ', '').replace('minutes', 'min').replace('hours', 'h')}
          </span>
        </div>

        {/* Reply indicator */}
        {message.reply_to && (
          <div className="text-xs text-muted-foreground mb-1 pl-2 border-l-2 border-muted-foreground/30">
            ↳ Reply
          </div>
        )}

        {/* Message text */}
        <div className={cn(
          "text-sm leading-relaxed",
          message.type === 'mention' && "border-l-2 border-l-blue-500 pl-2 bg-blue-50/50 dark:bg-blue-950/20",
          message.type === 'system' && "text-muted-foreground italic text-xs"
        )}>
          <div dangerouslySetInnerHTML={{ __html: renderMentions(message.text) }} />
        </div>

        {/* Attachments - Mobile optimized */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-2 border rounded-lg bg-muted/25 max-w-full"
              >
                <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                  {attachment.file_type.startsWith('image/') ? (
                    <Image className="w-3 h-3" />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(attachment.file_size / 1024)}KB
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                  View
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions - Compact on mobile */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <Button
                  key={emoji}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReaction?.(message.id, emoji)}
                >
                  {emoji} {users.length}
                </Button>
              )
            ))}
          </div>
        )}
      </div>

      {/* Mobile Action Button */}
      <div className="flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 opacity-0 group-active:opacity-100 md:group-hover:opacity-100"
          onClick={() => setShowActions(!showActions)}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile Actions Dialog */}
      <Dialog open={showActions} onOpenChange={setShowActions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">Message Actions</DialogTitle>
          </DialogHeader>
            <div className="grid gap-2 py-4">
              <Button
                variant="ghost"
                className="justify-start h-12"
                onClick={() => {
                  onReply?.(message)
                  setShowActions(false)
                }}
              >
                <Reply className="w-4 h-4 mr-3" />
                Reply to message
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start h-12"
                onClick={() => setShowReactions(true)}
              >
                <Smile className="w-4 h-4 mr-3" />
                Add reaction
              </Button>
              
              {isOwn && (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start h-12"
                    onClick={() => {
                      onEdit?.(message.id)
                      setShowActions(false)
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-3" />
                    Edit message
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="justify-start h-12 text-destructive"
                    onClick={() => {
                      onDelete?.(message.id)
                      setShowActions(false)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete message
                  </Button>
                </>
              )}
            </div>

            {/* Reaction Picker */}
            {showReactions && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Add Reaction</p>
                <div className="grid grid-cols-6 gap-2">
                  {commonEmojis.map(emoji => (
                    <Button
                      key={emoji}
                      size="sm"
                      variant="ghost"
                      className="h-12 text-lg"
                      onClick={() => {
                        onReaction?.(message.id, emoji)
                        setShowReactions(false)
                        setShowActions(false)
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ChatProUI_Mobile({
  scope,
  scopeId = null,
  className,
  title,
  placeholder = "Type your message...",
  fullscreen = false,
  onClose
}: ChatProUIMobileProps) {
  const [messageText, setMessageText] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatProMessage | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [inputHeight, setInputHeight] = useState(44)
  
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
    onlineUsers
  } = useChatPro(scope, scopeId, {
    enableReactions: true,
    enableReads: true,
    enableAttachments: true,
    enableTyping: true,
    enablePresence: true,
  })

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    markRead()
  }, [messages, markRead])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120)
      textarea.style.height = newHeight + 'px'
      setInputHeight(newHeight)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return

    try {
      const mentionMatches = messageText.match(/@(\w+(?:\.\w+)*)/g)
      const mentions = mentionMatches?.map(match => match.slice(1)) || null

      await sendMessage({
        text: messageText.trim(),
        mentions,
        reply_to: replyingTo?.id || null,
        attachments: selectedFiles
      })

      setMessageText('')
      setSelectedFiles([])
      setReplyingTo(null)
      
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'
        setInputHeight(44)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
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
    if (confirm('Delete this message?')) {
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
      case 'roof': return `Roof #${scopeId}`
      case 'pin': return `Pin #${scopeId}`
      default: return 'Chat'
    }
  }

  const currentUserId = 'current-user'

  // Mobile-optimized layout
  const containerClass = fullscreen 
    ? "fixed inset-0 bg-background z-50" 
    : "h-[100dvh] max-h-screen"

  return (
    <div className={cn("flex flex-col", containerClass, className)}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {(fullscreen || onClose) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0"
              onClick={onClose}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h2 className="font-medium text-sm">{getScopeTitle()}</h2>
              {onlineUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {onlineUsers.length} online
                </p>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs ml-2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => setShowMenu(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b bg-muted/25">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-background pr-8"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={() => setShowSearch(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div>
            {/* Load more button */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadMore()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load older'}
                </Button>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isOwn = message.created_by === currentUserId
              const showDivider = index === 0 || 
                new Date(messages[index - 1].created_at).toDateString() !== 
                new Date(message.created_at).toDateString()

              return (
                <React.Fragment key={message.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                        {new Date(message.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  
                  <MobileMessage
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
            <MobileTypingIndicator users={typingUsers} />
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/25 border-t">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Reply className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              Reply to <span className="font-medium">{replyingTo.created_by?.split('.')[0]}</span>
            </span>
            <span className="text-muted-foreground truncate max-w-32">
              {replyingTo.text}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReplyingTo(null)}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* File attachments preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 bg-muted/25 border-t">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                <Paperclip className="w-3 h-3" />
                <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Input Area */}
      <div className="border-t bg-background">
        <div className="flex items-end gap-2 p-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 p-0 flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
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
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-muted/25 focus-visible:ring-1 text-base"
              rows={1}
              style={{ height: inputHeight + 'px' }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && selectedFiles.length === 0}
            className="h-11 w-11 p-0 flex-shrink-0"
            size="sm"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dialog */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Options</DialogTitle>
            <DialogDescription>
              Manage chat settings and information
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Chat Info</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Scope: {scope}</p>
                {scopeId && <p>ID: {scopeId}</p>}
                <p>Messages: {messages.length}</p>
                {unreadCount > 0 && <p>Unread: {unreadCount}</p>}
              </div>
            </div>
            
            {onlineUsers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Online ({onlineUsers.length})</h4>
                <div className="space-y-1">
                  {onlineUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="text-sm text-muted-foreground">
                      {user.user_name || user.id}
                    </div>
                  ))}
                  {onlineUsers.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{onlineUsers.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatProUI_Mobile