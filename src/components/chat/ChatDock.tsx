'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
  avatar?: string
}

export function ChatDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'Sarah Chen',
      message: 'The roof inspection for Section A is complete. Found 3 minor issues.',
      timestamp: new Date(Date.now() - 300000),
      avatar: '👩‍💼'
    },
    {
      id: '2', 
      user: 'Mike Rodriguez',
      message: 'Thanks Sarah! I\'ll schedule the repairs for tomorrow morning.',
      timestamp: new Date(Date.now() - 240000),
      avatar: '👨‍🔧'
    },
    {
      id: '3',
      user: 'Jennifer Park',
      message: 'Quality check passed on Section B. All pins resolved.',
      timestamp: new Date(Date.now() - 120000),
      avatar: '👩‍🏭'
    }
  ])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        user: 'You',
        message: message.trim(),
        timestamp: new Date(),
        avatar: '👤'
      }
      setMessages(prev => [...prev, newMessage])
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl shadow-slate-500/20 transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-80 h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-slate-800">Team Chat</h3>
            <span className="text-xs text-slate-500 bg-blue-100 px-2 py-1 rounded-full">
              {messages.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 h-64 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                    {msg.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">{msg.user}</span>
                      <span className="text-xs text-slate-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/50 border-white/30 focus:ring-blue-500/50 focus:border-blue-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}