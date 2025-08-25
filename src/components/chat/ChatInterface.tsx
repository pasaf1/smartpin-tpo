import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ChatSystem from './ChatSystem'
import ChatNotifications from './ChatNotifications'
import MentionInput from './MentionInput'
import useChatSystem, { ChatScope } from '@/lib/hooks/useChatSystem'
import { 
  MessageCircle, 
  Hash, 
  Building2, 
  Home, 
  Pin,
  Users,
  Settings
} from 'lucide-react'

interface ChatInterfaceProps {
  projectId?: string
  roofId?: string
  pinId?: string
  className?: string
}

export function ChatInterface({ projectId, roofId, pinId, className }: ChatInterfaceProps) {
  const [showSettings, setShowSettings] = useState(false)

  const buildScopes = (): ChatScope[] => {
    const scopes: ChatScope[] = [
      {
        type: 'global',
        name: 'General',
        description: 'Company-wide discussions'
      }
    ]

    if (projectId) {
      scopes.push({
        type: 'project',
        id: projectId,
        name: 'Project Chat',
        description: 'Project team discussions'
      })
    }

    if (roofId) {
      scopes.push({
        type: 'roof',
        id: roofId,
        name: 'Roof Chat',
        description: 'Roof-specific discussions'
      })
    }

    if (pinId) {
      scopes.push({
        type: 'pin',
        id: pinId,
        name: 'Pin Chat',
        description: 'Pin-specific discussions'
      })
    }

    return scopes
  }

  const scopes = buildScopes()
  const {
    activeScope,
    scopesWithUnread,
    notifications,
    totalUnreadCount,
    sendMessage,
    handleScopeChange,
    clearNotifications,
    markNotificationAsRead,
    availableUsers
  } = useChatSystem(scopes)

  const getScopeIcon = (scope: ChatScope) => {
    switch (scope.type) {
      case 'global': return <Hash className="h-4 w-4" />
      case 'project': return <Building2 className="h-4 w-4" />
      case 'roof': return <Home className="h-4 w-4" />
      case 'pin': return <Pin className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Team Chat
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <ChatNotifications
                notifications={notifications}
                totalUnreadCount={totalUnreadCount}
                onNotificationClick={(notification) => {
                  const scope = scopes.find(s => 
                    `${s.type}-${s.id || 'global'}` === notification.scope
                  )
                  if (scope) {
                    handleScopeChange(scope)
                  }
                }}
                onMarkAsRead={markNotificationAsRead}
                onClearAll={clearNotifications}
              />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs 
            value={`${activeScope.type}-${activeScope.id || 'global'}`} 
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full mx-4 mb-4" style={{ gridTemplateColumns: `repeat(${scopes.length}, 1fr)` }}>
              {scopesWithUnread.map((scope) => (
                <TabsTrigger
                  key={`${scope.type}-${scope.id || 'global'}`}
                  value={`${scope.type}-${scope.id || 'global'}`}
                  onClick={() => handleScopeChange(scope)}
                  className="flex items-center gap-2 text-xs relative"
                >
                  {getScopeIcon(scope)}
                  <span className="truncate">{scope.name}</span>
                  {scope.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">
                      {scope.unreadCount > 9 ? '9+' : scope.unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {scopes.map((scope) => (
              <TabsContent
                key={`${scope.type}-${scope.id || 'global'}`}
                value={`${scope.type}-${scope.id || 'global'}`}
                className="flex-1 m-0"
              >
                <ChatSystem
                  scopes={[scope]}
                  defaultScope={scope}
                  className="h-full border-0 shadow-none"
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {showSettings && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Chat Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notifications</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked />
                    Mentions
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked />
                    Direct messages
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" />
                    All messages
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Online Status</label>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Available in chat:</p>
                <div className="flex flex-wrap gap-1">
                  {availableUsers.map((user) => (
                    <Badge key={user.id} variant="outline" className="text-xs">
                      {user.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ChatInterface