import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { Avatar, AvatarFallback } from './avatar'

interface PresenceIndicatorProps {
  users: Array<{
    id: string
    name: string
    role: string
    avatar?: string
  }>
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PresenceIndicator({ 
  users, 
  maxVisible = 3, 
  size = 'md',
  className 
}: PresenceIndicatorProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = Math.max(0, users.length - maxVisible)

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  if (users.length === 0) {
    return (
      <div className={cn("flex items-center text-slate-500 text-sm", className)}>
        <div className="w-2 h-2 bg-slate-300 rounded-full mr-2" />
        No one online
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center -space-x-1">
        {visibleUsers.map((user, index) => (
          <div key={user.id} className="relative">
            <Avatar className={cn(sizeClasses[size], "border-2 border-white")}>
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className={cn(
            "flex items-center justify-center bg-slate-200 text-slate-600 font-medium rounded-full border-2 border-white",
            sizeClasses[size]
          )}>
            +{remainingCount}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 text-sm text-slate-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-medium">{users.length}</span>
        <span>online</span>
      </div>
    </div>
  )
}

interface UserPresenceProps {
  user: {
    id: string
    name: string
    role: string
    lastSeen?: string
  }
  isOnline: boolean
  showRole?: boolean
  className?: string
}

export function UserPresence({ user, isOnline, showRole = true, className }: UserPresenceProps) {
  return (
    <div className={cn("flex items-center gap-3 p-2 rounded-lg", className)}>
      <div className="relative">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full",
          isOnline ? "bg-green-500" : "bg-slate-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 truncate">{user.name}</p>
          {showRole && (
            <Badge 
              variant={user.role === 'Admin' ? 'destructive' : 'secondary'}
              className="text-xs px-1.5 py-0.5"
            >
              {user.role}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-slate-500">
          {isOnline ? (
            <span className="text-green-600 font-medium">Active now</span>
          ) : user.lastSeen ? (
            `Last seen ${user.lastSeen}`
          ) : (
            'Offline'
          )}
        </p>
      </div>
      
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300"
      )} />
    </div>
  )
}