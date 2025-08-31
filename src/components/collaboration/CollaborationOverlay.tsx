'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useRealtimeCollaboration } from '@/lib/hooks/useRealtimeCollaboration'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Eye, 
  EyeOff, 
  Activity, 
  Wifi, 
  WifiOff,
  MousePointer,
  Bell,
  BellOff
} from 'lucide-react'

interface CollaborationOverlayProps {
  roofId: string
  currentUser: any
  canvasRef?: React.RefObject<HTMLDivElement>
  onCursorMove?: (x: number, y: number) => void
  className?: string
}

interface UserCursor {
  user_id: string
  user_name: string
  x: number
  y: number
  color: string
  avatar_url?: string
}

const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'
]

export function CollaborationOverlay({
  roofId,
  currentUser,
  canvasRef,
  onCursorMove,
  className
}: CollaborationOverlayProps) {
  const {
    presence,
    events,
    isConnected,
    userCount,
    broadcastCursorPosition,
    broadcastActivity,
    updateStatus
  } = useRealtimeCollaboration(roofId, currentUser)
  
  const [showCursors, setShowCursors] = useState(true)
  const [showActivity, setShowActivity] = useState(true)
  const [activityPanelOpen, setActivityPanelOpen] = useState(false)
  const [userCursors, setUserCursors] = useState<Record<string, UserCursor>>({})
  
  const overlayRef = useRef<HTMLDivElement>(null)
  
  // Convert presence data to cursor positions
  useEffect(() => {
    const cursors: Record<string, UserCursor> = {}
    
    Object.entries(presence).forEach(([userId, user], index) => {
      if (user.cursor_position && showCursors) {
        cursors[userId] = {
          user_id: userId,
          user_name: user.user_name,
          x: user.cursor_position.x,
          y: user.cursor_position.y,
          color: CURSOR_COLORS[index % CURSOR_COLORS.length],
          avatar_url: user.avatar_url
        }
      }
    })
    
    setUserCursors(cursors)
  }, [presence, showCursors])
  
  // Handle mouse movement on canvas
  useEffect(() => {
    if (!canvasRef?.current) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      broadcastCursorPosition(x, y)
      onCursorMove?.(x, y)
    }
    
    const canvas = canvasRef.current
    canvas.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [canvasRef, broadcastCursorPosition, onCursorMove])
  
  // Auto-update user status based on activity
  useEffect(() => {
    let idleTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout
    
    const resetTimers = () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
      
      updateStatus('online')
      
      // Set idle after 5 minutes
      idleTimer = setTimeout(() => {
        updateStatus('idle')
        
        // Set away after 15 minutes
        awayTimer = setTimeout(() => {
          updateStatus('away')
        }, 10 * 60 * 1000) // 10 more minutes
        
      }, 5 * 60 * 1000) // 5 minutes
    }
    
    // Reset timers on any user activity
    const handleActivity = () => resetTimers()
    
    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keydown', handleActivity)
    document.addEventListener('click', handleActivity)
    
    resetTimers()
    
    return () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keydown', handleActivity)
      document.removeEventListener('click', handleActivity)
    }
  }, [updateStatus])
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'away': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-3 h-3" />
      case 'idle': return <Eye className="w-3 h-3" />
      case 'away': return <EyeOff className="w-3 h-3" />
      default: return <WifiOff className="w-3 h-3" />
    }
  }
  
  const formatEventDescription = (event: any) => {
    switch (event.type) {
      case 'pin_created':
        return `created pin #${event.data.seq_number}`
      case 'pin_updated':
        return `updated pin #${event.data.new.seq_number}`
      case 'status_changed':
        return `changed pin #${event.data.new.seq_number} status to ${event.data.new.status}`
      case 'photo_uploaded':
        return `uploaded photo for pin #${event.pin_id}`
      case 'comment_added':
        return `added a comment`
      default:
        return event.type.replace('_', ' ')
    }
  }
  
  return (
    <div ref={overlayRef} className={cn('relative pointer-events-none', className)}>
      {/* User Cursors */}
      {showCursors && Object.values(userCursors).map((cursor) => (
        <div
          key={cursor.user_id}
          className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <MousePointer 
            className="w-5 h-5 drop-shadow-sm"
            style={{ color: cursor.color }}
            fill={cursor.color}
          />
          <div 
            className="absolute top-6 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.user_name}
          </div>
        </div>
      ))}
      
      {/* Collaboration Panel */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              {/* User Count */}
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{userCount}</span>
              </div>
              
              {/* Toggle Buttons */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCursors(!showCursors)}
                  className="h-8 w-8 p-0"
                  title={showCursors ? 'Hide cursors' : 'Show cursors'}
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActivity(!showActivity)}
                  className="h-8 w-8 p-0"
                  title={showActivity ? 'Hide activity' : 'Show activity'}
                >
                  {showActivity ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivityPanelOpen(!activityPanelOpen)}
                  className="h-8 w-8 p-0"
                  title="Toggle activity panel"
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Active Users */}
            {Object.keys(presence).length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">Active Users</span>
                </div>
                <div className="flex -space-x-2">
                  {Object.entries(presence).slice(0, 5).map(([userId, user]) => (
                    <div key={userId} className="relative">
                      <Avatar className="w-8 h-8 border-2 border-white">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={cn(
                          'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                          getStatusColor(user.status)
                        )}
                        title={`${user.user_name} - ${user.status}`}
                      />
                    </div>
                  ))}
                  
                  {Object.keys(presence).length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium">+{Object.keys(presence).length - 5}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Feed Panel */}
      {activityPanelOpen && showActivity && (
        <div className="absolute top-4 left-80 pointer-events-auto">
          <Card className="shadow-lg w-80">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivityPanelOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  events.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">{event.user_name}</span>
                        <span className="text-gray-600 ml-1">
                          {formatEventDescription(event)}
                        </span>
                        <div className="text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}