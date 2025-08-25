import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { 
  Bell, 
  BellDot, 
  AtSign, 
  MessageCircle, 
  X,
  Check,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'
import { ChatNotification } from '@/lib/hooks/useChatSystem'

interface ChatNotificationsProps {
  notifications: ChatNotification[]
  totalUnreadCount: number
  onNotificationClick?: (notification: ChatNotification) => void
  onMarkAsRead?: (notificationId: string) => void
  onClearAll?: () => void
  className?: string
}

export function ChatNotifications({
  notifications,
  totalUnreadCount,
  onNotificationClick,
  onMarkAsRead,
  onClearAll,
  className
}: ChatNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: ChatNotification['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-4 w-4 text-blue-600" />
      case 'reply':
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case 'message':
        return <MessageCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: ChatNotification['type']) => {
    switch (type) {
      case 'mention':
        return 'border-l-blue-500 bg-blue-50/50'
      case 'reply':
        return 'border-l-green-500 bg-green-50/50'
      case 'message':
        return 'border-l-gray-500 bg-gray-50/50'
      default:
        return 'border-l-gray-300'
    }
  }

  const truncateContent = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("relative", className)}
        >
          {totalUnreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-xs h-8"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
            
            {totalUnreadCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellDot className="h-4 w-4" />
                {totalUnreadCount} unread notification{totalUnreadCount > 1 ? 's' : ''}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-1 p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-muted/50",
                        getNotificationColor(notification.type),
                        !notification.read && "border-l-4"
                      )}
                      onClick={() => {
                        onNotificationClick?.(notification)
                        onMarkAsRead?.(notification.id)
                        setIsOpen(false)
                      }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {notification.from}
                          </span>
                          
                          {notification.type === 'mention' && (
                            <Badge variant="secondary" className="text-xs">
                              mentioned you
                            </Badge>
                          )}
                          
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(notification.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {truncateContent(notification.content)}
                        </p>
                        
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            in {notification.scopeName}
                          </span>
                          
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onMarkAsRead?.(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">All caught up!</p>
                <p className="text-sm">No new notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export default ChatNotifications