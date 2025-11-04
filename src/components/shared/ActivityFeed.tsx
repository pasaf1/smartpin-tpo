'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Filter, Clock, User, MapPin } from 'lucide-react'
import { useActivity } from '@/lib/activity/ActivityContext'
import { ActivityLogEntry, ActivityUtils } from '@/lib/activity/ActivityLogger'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  className?: string
  maxHeight?: string
  showFilters?: boolean
  pinId?: string
  roofId?: string
  projectId?: string
  limit?: number
}

export function ActivityFeed({
  className,
  maxHeight = '400px',
  showFilters = false,
  pinId,
  roofId,
  projectId,
  limit = 20
}: ActivityFeedProps) {
  const { recentActivities, getActivityHistory, isLoading } = useActivity()
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Load activities on mount or when filters change
  useEffect(() => {
    const loadActivities = async () => {
      setIsRefreshing(true)
      try {
        if (pinId || roofId || projectId) {
          // Load filtered activities
          const filteredActivities = await getActivityHistory({
            ...(pinId ? { pin_id: pinId } : {}),
            ...(roofId ? { roof_id: roofId } : {}),
            ...(projectId ? { project_id: projectId } : {}),
            limit
          })
          setActivities(filteredActivities)
        } else {
          // Use recent activities from context
          setActivities(recentActivities.slice(0, limit))
        }
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    loadActivities()
  }, [pinId, roofId, projectId, limit, getActivityHistory, recentActivities])

  // Refresh activities
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const freshActivities = await getActivityHistory({
        ...(pinId ? { pin_id: pinId } : {}),
        ...(roofId ? { roof_id: roofId } : {}),
        ...(projectId ? { project_id: projectId } : {}),
        limit
      })
      setActivities(freshActivities)
    } catch (error) {
      console.error('Failed to refresh activities:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter activities by type
  const filteredActivities = selectedTypes.length > 0
    ? activities.filter(activity => selectedTypes.includes(activity.action))
    : activities

  // Get activity type options
  const activityTypes = Array.from(new Set(activities.map(a => a.action)))

  // Format activity for display
  const formatActivity = (activity: ActivityLogEntry) => {
    return ActivityUtils.formatForDisplay(activity)
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'pin_created':
        return '📌'
      case 'status_changed':
        return '🔄'
      case 'photo_uploaded':
        return '📷'
      case 'child_pin_created':
        return '➕'
      case 'comment_added':
        return '💬'
      case 'project_created':
      case 'project_updated':
        return '📁'
      case 'export_generated':
        return '📄'
      default:
        return '📝'
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'pin_created':
      case 'child_pin_created':
        return 'bg-blue-100 text-blue-800'
      case 'status_changed':
        return 'bg-green-100 text-green-800'
      case 'photo_uploaded':
        return 'bg-purple-100 text-purple-800'
      case 'comment_added':
        return 'bg-orange-100 text-orange-800'
      case 'project_created':
      case 'project_updated':
        return 'bg-indigo-100 text-indigo-800'
      case 'export_generated':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (isLoading && activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading activities...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Activity Feed</CardTitle>
            {activities.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredActivities.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
        {showFilters && activityTypes.length > 1 && (
          <CardDescription>
            <div className="flex flex-wrap gap-1 mt-2">
              <Button
                variant={selectedTypes.length === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTypes([])}
              >
                All
              </Button>
              {activityTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTypes(prev =>
                      prev.includes(type)
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    )
                  }}
                >
                  {getActivityIcon(type)} {type.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          {filteredActivities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 px-6">
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No activities found</p>
                {selectedTypes.length > 0 && (
                  <p className="text-sm">Try clearing the filters</p>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredActivities.map((activity, index) => {
                const formatted = formatActivity(activity)
                return (
                  <div key={`${activity.id}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                          getActivityColor(activity.action)
                        )}>
                          {getActivityIcon(activity.action)}
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatted.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {activity.action.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatted.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {activity.user_name || 'Unknown User'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatted.timestamp}
                          </div>
                          {activity.details?.['pin_sequence'] && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Pin #{activity.details['pin_sequence']}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default ActivityFeed