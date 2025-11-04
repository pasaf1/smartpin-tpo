'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/hooks/useChat'

interface ChatInputProps {
  onSendMessage: (content: string, options?: {
    mentions?: string[]
    reply_to?: string
    attachments?: File[]
  }) => Promise<void>
  onStartTyping?: () => void
  onStopTyping?: () => void
  replyToMessage?: ChatMessage | null
  onCancelReply?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface MentionSuggestion {
  id: string
  name: string
  avatar?: string
}

// Demo mention suggestions
const DEMO_MENTIONS: MentionSuggestion[] = [
  { id: 'demo-user-1', name: 'mike.rodriguez', avatar: '👷‍♂️' },
  { id: 'demo-user-2', name: 'sarah.chen', avatar: '👩‍🔬' },
  { id: 'demo-user-3', name: 'david.kim', avatar: '🔧' },
  { id: 'demo-user-4', name: 'lisa.thompson', avatar: '📊' }
]

export function ChatInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  replyToMessage,
  onCancelReply,
  placeholder = "Type a message...",
  disabled = false,
  className
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [])

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    onStartTyping?.()
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.()
    }, 1000)
  }, [onStartTyping, onStopTyping])

  // Handle content change
  const handleContentChange = (value: string) => {
    setContent(value)
    adjustTextareaHeight()
    handleTyping()

    // Check for @mentions
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1)
      const spaceIndex = afterAt.indexOf(' ')
      
      if (spaceIndex === -1) {
        // Still typing mention
        setMentionQuery(afterAt.toLowerCase())
        setMentionPosition(lastAtIndex)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const selectMention = (mention: MentionSuggestion) => {
    const beforeMention = content.slice(0, mentionPosition)
    const afterMention = content.slice(mentionPosition + mentionQuery.length + 1)
    const newContent = `${beforeMention}@${mention.name} ${afterMention}`
    
    setContent(newContent)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle send message
  const handleSend = async () => {
    if (!content.trim() && selectedFiles.length === 0) return
    
    try {
      // Extract mentions
      const mentionMatches = content.match(/@(\w+(?:\.\w+)*)/g)
      const mentions = mentionMatches?.map(match => {
        const username = match.slice(1)
        const user = DEMO_MENTIONS.find(m => m.name === username)
        return user?.id
      }).filter(Boolean) as string[]

      await onSendMessage(content.trim(), {
        mentions,
        ...(replyToMessage?.id ? { reply_to: replyToMessage.id } : {}),
        attachments: selectedFiles
      })

      // Reset form
      setContent('')
      setSelectedFiles([])
      onCancelReply?.()
      onStopTyping?.()
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    } else if (event.key === 'Escape') {
      onCancelReply?.()
      setShowMentions(false)
    }
  }

  // Filter mentions based on query
  const filteredMentions = DEMO_MENTIONS.filter(mention =>
    mention.name.toLowerCase().includes(mentionQuery)
  ).slice(0, 5)

  useEffect(() => {
    adjustTextareaHeight()
  }, [adjustTextareaHeight])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-2 bg-muted/25 border-t">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-muted-foreground">
              Replying to <span className="font-medium">{replyToMessage.user_name}</span>
            </span>
            <span className="text-muted-foreground max-w-xs truncate">
              {replyToMessage.content}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}

      {/* File attachments */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/25 border-t">
          {selectedFiles.map((file, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
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

      {/* Mention suggestions */}
      {showMentions && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-popover border border-border rounded-lg shadow-lg mb-1 max-h-48 overflow-y-auto">
          <div className="p-2 text-xs font-medium text-muted-foreground border-b">
            Mention someone
          </div>
          {filteredMentions.map((mention) => (
            <button
              key={mention.id}
              className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 text-left"
              onClick={() => selectMention(mention)}
            >
              {mention.avatar && (
                <span className="text-lg">{mention.avatar}</span>
              )}
              <span className="font-medium">@{mention.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3 border-t bg-background">
        {/* File upload */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,application/pdf,.doc,.docx"
        />

        {/* Text input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-sm min-h-[32px] max-h-[120px]"
            rows={1}
          />
        </div>

        {/* Send button */}
        <Button
          size="sm"
          onClick={handleSend}
          disabled={disabled || (!content.trim() && selectedFiles.length === 0)}
          className="h-8 w-8 p-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  )
}