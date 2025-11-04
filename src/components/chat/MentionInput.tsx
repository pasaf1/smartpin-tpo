import React, { useState, useRef, useCallback, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AtSign, User } from 'lucide-react'

export interface MentionUser {
  id: string
  name: string
  role?: string
  avatar_url?: string
}

interface MentionInputProps extends React.ComponentPropsWithoutRef<typeof Textarea> {
  availableUsers?: MentionUser[]
  onMentionSelect?: (user: MentionUser) => void
  showMentionList?: boolean
  mentionTrigger?: string
}

export const MentionInput = forwardRef<
  React.ElementRef<typeof Textarea>,
  MentionInputProps
>(({ 
  availableUsers = [], 
  onMentionSelect, 
  showMentionList,
  mentionTrigger = '@',
  value,
  onChange,
  className,
  ...props 
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value
    const position = e.target.selectionStart || 0
    
    setCursorPosition(position)
    
    const textBeforeCursor = inputValue.substring(0, position)
    const mentionMatch = textBeforeCursor.match(new RegExp(`\\${mentionTrigger}(\\w*)$`))
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1] || '')
      setShowSuggestions(true)
      setSuggestionIndex(0)
    } else {
      setShowSuggestions(false)
      setMentionQuery('')
    }
    
    onChange?.(e)
  }, [mentionTrigger, onChange])

  const insertMention = useCallback((user: MentionUser) => {
    if (!textareaRef.current) return

    const currentValue = textareaRef.current.value
    const textBeforeCursor = currentValue.substring(0, cursorPosition)
    const textAfterCursor = currentValue.substring(cursorPosition)
    
    const beforeMention = textBeforeCursor.replace(new RegExp(`\\${mentionTrigger}\\w*$`), '')
    const newValue = `${beforeMention}${mentionTrigger}${user.name} ${textAfterCursor}`
    
    const newPosition = beforeMention.length + mentionTrigger.length + user.name.length + 1
    
    const syntheticEvent = {
      target: {
        ...textareaRef.current,
        value: newValue
      }
    } as React.ChangeEvent<HTMLTextAreaElement>
    
    onChange?.(syntheticEvent)
    onMentionSelect?.(user)
    
    setShowSuggestions(false)
    setMentionQuery('')
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPosition, newPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }, [cursorPosition, mentionTrigger, onChange, onMentionSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSuggestionIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          )
          break
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault()
            const selectedUser = filteredUsers[suggestionIndex]
            if (selectedUser) {
              insertMention(selectedUser)
            }
            return
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          setMentionQuery('')
          break
        case 'Tab':
          e.preventDefault()
          const selectedUser = filteredUsers[suggestionIndex]
          if (selectedUser) {
            insertMention(selectedUser)
          }
          break
      }
    }
  }, [showSuggestions, filteredUsers, suggestionIndex, insertMention])

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={cn("resize-none", className)}
        {...props}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <Card className="absolute bottom-full left-0 right-0 mb-2 shadow-lg z-50 max-h-48 overflow-hidden">
          <CardContent className="p-0">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-2">
                <AtSign className="h-3 w-3" />
                Mention someone
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                {filteredUsers.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors",
                      index === suggestionIndex && "bg-muted"
                    )}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      {user.role && (
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                    
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
                Use ↑↓ to navigate, Enter to select, Esc to close
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

MentionInput.displayName = 'MentionInput'

export default MentionInput