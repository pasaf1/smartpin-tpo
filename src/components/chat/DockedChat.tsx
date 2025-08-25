'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useChat } from '@/lib/hooks/useChat'
import { useUsers } from '@/lib/hooks/useAuth'

interface DockedChatProps {
  roofId: string
  className?: string
}

export function DockedChat({ roofId, className }: DockedChatProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const { messages = [], sendMessage, isLoading } = useChat(roofId)
  const { data: users = [] } = useUsers()

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return
    
    try {
      await sendMessage(message)
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const unreadCount = 0 // TODO: Implement unread message tracking

  return (
    <div className={cn('fixed bottom-0 right-4 w-80 z-50', className)}>
      <Card className="shadow-lg border-t-2 border-t-primary">
        <CardHeader 
          className="pb-2 cursor-pointer select-none"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-sm">Team Chat</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs h-5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <svg 
                className={cn('w-3 h-3 transition-transform', isMinimized && 'rotate-180')}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-48 px-3"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💬</div>
                    <p>Team chat for roof</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {messages.map((msg) => {
                    const user = users.find(u => u.id === msg.created_by)
                    return (
                      <div key={msg.id} className="flex gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold">
                          {user?.full_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="font-medium">{user?.full_name || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-sm mt-0.5 break-words">
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Message the team..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span>{users.filter(u => u.is_active).length} online</span>
                </div>
                <span>Press Enter to send</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}