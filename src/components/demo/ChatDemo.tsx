'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { cn } from '@/lib/utils'

interface DemoContext {
  id: string
  title: string
  description: string
  type: 'project' | 'pin' | 'pin_item'
  roofId: string
  pinId?: string
  pinItemId?: string
}

const DEMO_CONTEXTS: DemoContext[] = [
  {
    id: 'project-chat',
    title: 'Project Chat',
    description: 'General project communication for E1 Demo Roof',
    type: 'project',
    roofId: 'e1-demo-roof'
  },
  {
    id: 'pin-chat-001',
    title: 'Pin #001 Chat',
    description: 'Membrane separation at drain area discussion',
    type: 'pin',
    roofId: 'e1-demo-roof',
    pinId: 'demo-pin-1'
  },
  {
    id: 'pin-item-chat-001-A',
    title: 'Pin Item #001-A Chat',
    description: 'Specific repair item discussion',
    type: 'pin_item',
    roofId: 'e1-demo-roof',
    pinId: 'demo-pin-1',
    pinItemId: 'demo-pin-item-1'
  }
]

export function ChatDemo() {
  const [selectedContext, setSelectedContext] = useState<DemoContext>(DEMO_CONTEXTS[0])
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single')

  const getTypeIcon = (type: DemoContext['type']) => {
    switch (type) {
      case 'project':
        return '🏗️'
      case 'pin':
        return '📌'
      case 'pin_item':
        return '🔧'
    }
  }

  const getTypeColor = (type: DemoContext['type']) => {
    switch (type) {
      case 'project':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'pin':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pin_item':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Collaboration Demo</h2>
          <p className="text-muted-foreground">
            Chat system with @mentions, file attachments, and live typing indicators
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'single' ? 'default' : 'outline'}
            onClick={() => setViewMode('single')}
          >
            Single View
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'split' ? 'default' : 'outline'}
            onClick={() => setViewMode('split')}
          >
            Split View
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chat System Features</CardTitle>
          <CardDescription>
            Comprehensive real-time collaboration capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                @
              </div>
              <div>
                <h4 className="font-medium text-sm">@Mentions</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Type @ to mention team members with autocomplete
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                📎
              </div>
              <div>
                <h4 className="font-medium text-sm">File Attachments</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Share images, documents, and other files
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400">
                💬
              </div>
              <div>
                <h4 className="font-medium text-sm">Live Typing</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  See when team members are typing responses
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                👥
              </div>
              <div>
                <h4 className="font-medium text-sm">User Presence</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Track who&apos;s online, away, or offline
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Context Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chat Contexts</CardTitle>
              <CardDescription>
                Different conversation scopes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_CONTEXTS.map((context) => (
                <button
                  key={context.id}
                  onClick={() => setSelectedContext(context)}
                  className={cn(
                    'w-full p-3 text-left border rounded-lg transition-colors hover:bg-muted/25',
                    selectedContext.id === context.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getTypeIcon(context.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {context.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {context.description}
                      </p>
                      <Badge 
                        className={cn('mt-2 text-xs', getTypeColor(context.type))}
                      >
                        {context.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className={cn(
          'space-y-4',
          viewMode === 'single' ? 'lg:col-span-3' : 'lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4'
        )}>
          {viewMode === 'single' ? (
            <ChatPanel
              roofId={selectedContext.roofId}
              pinId={selectedContext.pinId}
              pinItemId={selectedContext.pinItemId}
              title={selectedContext.title}
              showPresence={true}
              maxHeight="600px"
            />
          ) : (
            <>
              {/* Primary chat */}
              <ChatPanel
                roofId={selectedContext.roofId}
                pinId={selectedContext.pinId}
                pinItemId={selectedContext.pinItemId}
                title={selectedContext.title}
                showPresence={true}
                maxHeight="500px"
              />
              
              {/* Secondary chat for comparison */}
              <ChatPanel
                roofId="e1-demo-roof"
                pinId="demo-pin-2"
                title="Pin #002 Chat"
                showPresence={false}
                maxHeight="500px"
              />
            </>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Try It Out!</CardTitle>
          <CardDescription>
            Interactive demo features to test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">💬 Send Messages</h4>
              <p className="text-muted-foreground">
                Type messages and see them appear in real-time. Messages persist across context switches.
              </p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">@ Mention Someone</h4>
              <p className="text-muted-foreground">
                Type @ followed by a name to see mention autocomplete. Try @mike.rodriguez or @sarah.chen.
              </p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">📎 Attach Files</h4>
              <p className="text-muted-foreground">
                Click the paperclip icon to attach files. See file previews and download options.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}