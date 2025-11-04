'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  getMentionSuggestions, 
  insertMention, 
  type User 
} from '@/lib/mentions'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  users: User[]
  className?: string
  showSendButton?: boolean
  disabled?: boolean
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message... use @username to mention team members",
  users,
  className,
  showSendButton = true,
  disabled = false
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionDropdownRef = useRef<HTMLDivElement>(null)

  // Update suggestions when value or cursor position changes
  useEffect(() => {
    const newSuggestions = getMentionSuggestions(value, cursorPosition, users)
    setSuggestions(newSuggestions)
    setShowSuggestions(newSuggestions.length > 0)
    setSelectedSuggestionIndex(0)
  }, [value, cursorPosition, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const newCursorPosition = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(newCursorPosition)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          const selectedUser = suggestions[selectedSuggestionIndex]
          if (selectedUser) {
            selectSuggestion(selectedUser)
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          break
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const selectSuggestion = (user: User) => {
    const { newText, newCursorPosition } = insertMention(value, cursorPosition, user)
    onChange(newText)
    setShowSuggestions(false)
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        setCursorPosition(newCursorPosition)
      }
    }, 0)
  }

  const handleSubmit = () => {
    if (value.trim() && onSubmit) {
      onSubmit(value.trim())
      onChange('')
      setShowSuggestions(false)
    }
  }

  const handleInputClick = () => {
    if (inputRef.current) {
      const position = inputRef.current.selectionStart || 0
      setCursorPosition(position)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-4",
              showSuggestions && "border-blue-500 ring-2 ring-blue-500/20",
              className
            )}
          />
          
          {/* Mention Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionDropdownRef}
              className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto"
            >
              <div className="p-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Mention someone
                </span>
              </div>
              {suggestions.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => selectSuggestion(user)}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-3 transition-colors duration-150",
                    index === selectedSuggestionIndex && "bg-blue-50 border-l-2 border-blue-500"
                  )}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user.email}
                    </div>
                  </div>
                  {user.role && (
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {user.role}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {showSendButton && (
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Send
          </Button>
        )}
      </div>
    </div>
  )
}