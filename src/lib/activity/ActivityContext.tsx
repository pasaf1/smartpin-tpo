'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ActivityLogger, ActivityContext as LoggerContext, ActivityLogEntry } from './ActivityLogger'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'

interface ActivityProviderProps {
  children: ReactNode
  projectId?: string
  roofId?: string
}

interface ActivityContextValue {
  logger: ActivityLogger | null
  isLoading: boolean
  error: string | null
  recentActivities: ActivityLogEntry[]
  loggerContext: LoggerContext | null
  updateContext: (updates: Partial<LoggerContext>) => void
  getActivityHistory: (filters?: {
    pin_id?: string
    roof_id?: string
    project_id?: string
    limit?: number
    since?: string
  }) => Promise<ActivityLogEntry[]>
}

const ActivityContext = createContext<ActivityContextValue | null>(null)

export function ActivityProvider({ 
  children, 
  projectId, 
  roofId 
}: ActivityProviderProps) {
  const { user } = useAuth()
  const [logger, setLogger] = useState<ActivityLogger | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentActivities, setRecentActivities] = useState<ActivityLogEntry[]>([])
  const [loggerContext, setLoggerContext] = useState<LoggerContext | null>(null)

  // Initialize logger when user and context are available
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const context: LoggerContext = {
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        user_email: user.email || '',
        project_id: projectId,
        roof_id: roofId
      }

      const activityLogger = new ActivityLogger(context, {
        enableBroadcast: true,
        batchSize: 5,
        batchTimeout: 3000
      })

      setLogger(activityLogger)
      setLoggerContext(context)
      setError(null)
    } catch (err) {
      console.error('Failed to initialize activity logger:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize activity logger')
    } finally {
      setIsLoading(false)
    }
  }, [user, projectId, roofId])

  // Load recent activities
  useEffect(() => {
    if (!logger || !loggerContext) return

    const loadRecentActivities = async () => {
      try {
        const activities = await logger.getActivityHistory(
          {
            project_id: loggerContext.project_id,
            roof_id: loggerContext.roof_id
          },
          { limit: 20 }
        )
        setRecentActivities(activities)
      } catch (err) {
        console.warn('Failed to load recent activities:', err)
      }
    }

    loadRecentActivities()
  }, [logger, loggerContext])

  // Set up real-time activity updates
  useEffect(() => {
    if (!loggerContext) return

    let subscription: any = null

    const setupRealTimeSubscription = () => {
      const channels = []
      
      if (loggerContext.project_id) {
        channels.push(`project:${loggerContext.project_id}:activity`)
      }
      
      if (loggerContext.roof_id) {
        channels.push(`roof:${loggerContext.roof_id}:activity`)
      }

      // Subscribe to activity updates
      if (channels.length > 0) {
        subscription = supabase
          .channel('activity-updates')
          .on('broadcast', { event: 'activity' }, (payload) => {
            const newActivity = payload.payload as ActivityLogEntry
            if (newActivity && newActivity.action) {
              setRecentActivities(prev => [newActivity, ...prev.slice(0, 19)])
            }
          })
          .subscribe()
      }
    }

    setupRealTimeSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [loggerContext])

  // Update context function
  const updateContext = (updates: Partial<LoggerContext>) => {
    if (!loggerContext || !logger) return

    const newContext = { ...loggerContext, ...updates }
    setLoggerContext(newContext)
    logger.updateContext(updates)
  }

  // Get activity history function
  const getActivityHistory = async (filters?: {
    pin_id?: string
    roof_id?: string
    project_id?: string
    limit?: number
    since?: string
  }) => {
    if (!logger) return []

    try {
      return await logger.getActivityHistory(
        {
          pin_id: filters?.pin_id,
          roof_id: filters?.roof_id || loggerContext?.roof_id,
          project_id: filters?.project_id || loggerContext?.project_id
        },
        {
          limit: filters?.limit || 50,
          since: filters?.since
        }
      )
    } catch (err) {
      console.error('Failed to get activity history:', err)
      return []
    }
  }

  const value: ActivityContextValue = {
    logger,
    isLoading,
    error,
    recentActivities,
    loggerContext,
    updateContext,
    getActivityHistory
  }

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const context = useContext(ActivityContext)
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}

// Hook for pin-specific activity logging
export function usePinActivityLogger(pinId?: string) {
  const { logger, loggerContext } = useActivity()

  const logPinCreated = async (pin: {
    id: string
    seq_number: number
    roof_id: string
    x_position: number
    y_position: number
    issue_type?: string
    defect_type?: string
    defect_layer?: string
    severity?: number
  }) => {
    if (!logger) return
    await logger.logPinCreated(pin)
  }

  const logStatusChanged = async (pin: {
    id: string
    seq_number: number
    roof_id: string
  }, oldStatus: string, newStatus: string, reason?: string) => {
    if (!logger) return
    await logger.logStatusChanged(pin, oldStatus, newStatus, reason)
  }

  const logPhotoUploaded = async (pin: {
    id: string
    seq_number: number
    roof_id: string
  }, photo: {
    type: 'opening' | 'closing'
    url: string
    file_name?: string
    file_size?: number
  }) => {
    if (!logger) return
    await logger.logPhotoUploaded(pin, photo)
  }

  const logChildPinCreated = async (parentPin: {
    id: string
    seq_number: number
    roof_id: string
  }, child: {
    id: string
    child_seq: string
    defect_type?: string
  }) => {
    if (!logger) return
    await logger.logChildPinCreated(parentPin, child)
  }

  const logCommentAdded = async (pin: {
    id: string
    seq_number: number
    roof_id: string
  }, comment: {
    text: string
    mentions?: string[]
  }) => {
    if (!logger) return
    await logger.logCommentAdded(pin, comment)
  }

  return {
    logger,
    loggerContext,
    logPinCreated,
    logStatusChanged,
    logPhotoUploaded,
    logChildPinCreated,
    logCommentAdded
  }
}

// Hook for project-level activity logging
export function useProjectActivityLogger() {
  const { logger } = useActivity()

  const logProjectEvent = async (project: {
    id: string
    name: string
  }, eventType: 'project_created' | 'project_updated', details: Record<string, any> = {}) => {
    if (!logger) return
    await logger.logProjectEvent(project, eventType, details)
  }

  const logExportGenerated = async (type: 'pdf' | 'csv', details: {
    format: string
    pin_count?: number
    file_size?: number
    filters?: Record<string, any>
  }) => {
    if (!logger) return
    await logger.logExportGenerated(type, details)
  }

  const logSystemEvent = async (eventType: string, details: Record<string, any>) => {
    if (!logger) return
    await logger.logSystemEvent(eventType, details)
  }

  return {
    logger,
    logProjectEvent,
    logExportGenerated,
    logSystemEvent
  }
}