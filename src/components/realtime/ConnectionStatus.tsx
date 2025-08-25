'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react'
import { useConnectionStatus } from '@/lib/hooks/useRealTimeUpdates'

interface ConnectionStatusProps {
  className?: string
  variant?: 'badge' | 'card' | 'inline'
}

export function ConnectionStatus({ className, variant = 'badge' }: ConnectionStatusProps) {
  const { status, lastConnected, isOnline } = useConnectionStatus()

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          color: 'bg-green-500 text-white',
          variant: 'default' as const
        }
      case 'connecting':
        return {
          icon: Clock,
          label: 'Connecting...',
          color: 'bg-amber-500 text-white',
          variant: 'secondary' as const
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Disconnected',
          color: 'bg-red-500 text-white',
          variant: 'destructive' as const
        }
      default:
        return {
          icon: AlertTriangle,
          label: 'Unknown',
          color: 'bg-slate-500 text-white',
          variant: 'outline' as const
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  if (variant === 'badge') {
    return (
      <Badge 
        variant={config.variant} 
        className={cn("flex items-center gap-1.5", className)}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", config.color)}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Connection Status</h3>
                <p className="text-sm text-slate-600">{config.label}</p>
              </div>
            </div>
            
            {lastConnected && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Last connected</p>
                <p className="text-xs font-medium text-slate-700">
                  {new Date(lastConnected).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
          
          {status === 'disconnected' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Connection Lost</p>
                  <p className="text-red-600 mt-1">
                    You&apos;re working offline. Changes will sync when connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Inline variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === 'connected' ? "bg-green-500 animate-pulse" :
        status === 'connecting' ? "bg-amber-500 animate-pulse" :
        "bg-red-500"
      )} />
      <span className="text-sm text-slate-600">
        {status === 'connected' && 'Live'}
        {status === 'connecting' && 'Connecting...'}
        {status === 'disconnected' && 'Offline'}
      </span>
    </div>
  )
}

interface RealtimeStatusProps {
  roofId?: string
  projectId?: string
  showDetails?: boolean
  className?: string
}

export function RealtimeStatus({ 
  roofId, 
  projectId, 
  showDetails = false, 
  className 
}: RealtimeStatusProps) {
  const { status, isOnline } = useConnectionStatus()

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
      )} />
      
      <span className="text-slate-600">
        {isOnline ? 'Real-time updates active' : 'Working offline'}
      </span>
      
      {showDetails && (
        <Badge variant="outline" className="ml-2 text-xs">
          {roofId ? `Roof: ${roofId.slice(-6)}` : 
           projectId ? `Project: ${projectId.slice(-6)}` : 
           'Global'}
        </Badge>
      )}
    </div>
  )
}