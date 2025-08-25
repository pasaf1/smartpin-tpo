'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/hooks/useChat'

interface ChatMessageProps {
  message: ChatMessage
  isOwn?: boolean
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  className?: string
}

export function ChatMessageComponent({
  message,
  isOwn = false,
  onReply,
  onEdit,
  className
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit?.(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const getMessageTypeStyles = () => {
    switch (message.message_type) {
      case 'mention':
        return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 pl-3'
      case 'system':
        return 'bg-muted/50 text-muted-foreground text-sm italic'
      case 'attachment':
        return 'border border-border rounded-lg p-3'
      default:
        return ''
    }
  }

  const renderMentions = (content: string) => {
    // Simple mention highlighting - in production, this would be more sophisticated
    return content.replace(/@(\w+(?:\.\w+)*)/g, '<span class="text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-900/20 px-1 rounded">@$1</span>')
  }

  return (
    <div className={cn(
      'flex gap-3 py-2 px-3 hover:bg-muted/25 transition-colors',
      isOwn && 'bg-primary/5',
      className
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.user_avatar ? (
          <div className="w-8 h-8 flex items-center justify-center text-lg">
            {message.user_avatar}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {message.user_name.charAt(0)}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'font-medium text-sm',
            isOwn && 'text-primary'
          )}>
            {message.user_name}
          </span>
          
          {message.message_type === 'mention' && (
            <Badge variant="secondary" className="text-xs">
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
          <div className="text-xs text-muted-foreground mb-2 pl-3 border-l-2 border-muted">
            Replying to message
          </div>
        )}

        {/* Message body */}
        <div className={cn('text-sm', getMessageTypeStyles())}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: renderMentions(message.content) 
              }}
            />
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-2 border rounded-lg bg-muted/25"
              >
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  {attachment.file_type.startsWith('image/') ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(attachment.file_size / 1024)} KB
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 opacity-75 hover:opacity-100 transition-opacity">
          {onReply && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => onReply(message.id)}
            >
              Reply
            </Button>
          )}
          
          {isOwn && onEdit && !isEditing && message.message_type === 'text' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}