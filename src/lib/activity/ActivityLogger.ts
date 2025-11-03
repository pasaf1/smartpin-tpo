import { supabase } from '@/lib/supabase'

export interface ActivityLogEntry {
  id?: string
  pin_id?: string
  project_id?: string
  roof_id?: string
  action: string
  details: Record<string, any>
  user_id?: string
  user_name?: string
  user_email?: string
  created_at?: string
}

export interface ActivityContext {
  user_id: string
  user_name: string
  user_email: string
  project_id?: string
  roof_id?: string
}

type ActivityType = 
  | 'pin_created'
  | 'pin_updated' 
  | 'pin_deleted'
  | 'status_changed'
  | 'photo_uploaded'
  | 'photo_deleted'
  | 'child_pin_created'
  | 'child_pin_updated'
  | 'comment_added'
  | 'user_joined'
  | 'user_left'
  | 'project_created'
  | 'project_updated'
  | 'export_generated'
  | 'system_event'

export class ActivityLogger {
  private context: ActivityContext
  private enableBroadcast: boolean
  private batchSize: number
  private batchTimeout: number
  private pendingLogs: ActivityLogEntry[]
  private batchTimer: NodeJS.Timeout | null

  constructor(
    context: ActivityContext, 
    options: {
      enableBroadcast?: boolean
      batchSize?: number
      batchTimeout?: number
    } = {}
  ) {
    this.context = context
    this.enableBroadcast = options.enableBroadcast ?? true
    this.batchSize = options.batchSize ?? 10
    this.batchTimeout = options.batchTimeout ?? 5000 // 5 seconds
    this.pendingLogs = []
    this.batchTimer = null
  }

  /**
   * Log a pin creation event
   */
  async logPinCreated(pin: {
    id: string
    seq_number: number
    roof_id: string
    x_position: number
    y_position: number
    issue_type?: string
    defect_type?: string
    defect_layer?: string
    severity?: number
  }): Promise<void> {
    await this.log('pin_created', {
      pin_id: pin.id,
      pin_sequence: pin.seq_number,
      issue_type: pin.issue_type,
      defect_type: pin.defect_type,
      defect_layer: pin.defect_layer,
      severity: pin.severity,
      location: {
        x: (pin.x_position * 100).toFixed(1),
        y: (pin.y_position * 100).toFixed(1)
      }
    }, pin['roof_id'], pin.id)
  }

  /**
   * Log a status change event
   */
  async logStatusChanged(pin: {
    id: string
    seq_number: number
    roof_id: string
  }, oldStatus: string, newStatus: string, reason?: string): Promise<void> {
    await this.log('status_changed', {
      pin_id: pin.id,
      pin_sequence: pin.seq_number,
      old_status: oldStatus,
      new_status: newStatus,
      reason: reason,
      timestamp: new Date().toISOString()
    }, pin['roof_id'], pin.id)
  }

  /**
   * Log a photo upload event
   */
  async logPhotoUploaded(pin: {
    id: string
    seq_number: number
    roof_id: string
  }, photo: {
    type: 'opening' | 'closing'
    url: string
    file_name?: string
    file_size?: number
  }): Promise<void> {
    await this.log('photo_uploaded', {
      pin_id: pin.id,
      pin_sequence: pin.seq_number,
      photo_type: photo.type,
      file_name: photo.file_name,
      file_size: photo.file_size,
      photo_url: photo.url,
      timestamp: new Date().toISOString()
    }, pin['roof_id'], pin.id)
  }

  /**
   * Log a child pin creation event
   */
  async logChildPinCreated(parentPin: {
    id: string
    seq_number: number
    roof_id: string
  }, child: {
    id: string
    child_seq: string
    defect_type?: string
  }): Promise<void> {
    await this.log('child_pin_created', {
      parent_pin_id: parentPin.id,
      parent_sequence: parentPin.seq_number,
      child_pin_id: child.id,
      child_sequence: child.child_seq,
      defect_type: child.defect_type,
      timestamp: new Date().toISOString()
    }, parentPin.roof_id, parentPin.id)
  }

  /**
   * Log a comment/chat message
   */
  async logCommentAdded(pin: {
    id: string
    seq_number: number
    roof_id: string
  }, comment: {
    text: string
    mentions?: string[]
  }): Promise<void> {
    await this.log('comment_added', {
      pin_id: pin.id,
      pin_sequence: pin.seq_number,
      comment_text: comment.text.substring(0, 200), // Truncate for logging
      mentions: comment.mentions || [],
      timestamp: new Date().toISOString()
    }, pin['roof_id'], pin.id)
  }

  /**
   * Log project-level events
   */
  async logProjectEvent(project: {
    id: string
    name: string
  }, eventType: 'project_created' | 'project_updated', details: Record<string, any> = {}): Promise<void> {
    await this.log(eventType, {
      project_name: project.name,
      ...details,
      timestamp: new Date().toISOString()
    }, undefined, undefined, project.id)
  }

  /**
   * Log export events
   */
  async logExportGenerated(type: 'pdf' | 'csv', details: {
    format: string
    pin_count?: number
    file_size?: number
    filters?: Record<string, any>
  }): Promise<void> {
    await this.log('export_generated', {
      export_type: type,
      format: details.format,
      pin_count: details.pin_count,
      file_size: details.file_size,
      filters: details.filters,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log system events
   */
  async logSystemEvent(eventType: string, details: Record<string, any>): Promise<void> {
    await this.log('system_event', {
      event_type: eventType,
      ...details,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Core logging method
   */
  private async log(
    action: ActivityType, 
    details: Record<string, any>,
    roof_id?: string,
    pin_id?: string,
    project_id?: string
  ): Promise<void> {
    const logEntry: ActivityLogEntry = {
      pin_id,
      project_id: project_id || this.context.project_id,
      roof_id: roof_id || this.context.roof_id,
      action,
      details,
      user_id: this.context.user_id,
      user_name: this.context.user_name,
      user_email: this.context.user_email,
      created_at: new Date().toISOString()
    }

    // Add to batch
    this.pendingLogs.push(logEntry)

    // Process batch if we've hit the size limit
    if (this.pendingLogs.length >= this.batchSize) {
      await this.processBatch()
    } else {
      // Set timer if not already set
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.batchTimeout)
      }
    }
  }

  /**
   * Process the batch of pending logs
   */
  private async processBatch(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const logsToProcess = [...this.pendingLogs]
    this.pendingLogs = []

    try {
      // TODO: Re-enable when activity_logs table is created
      // Insert to database
      // const { data, error } = await supabase
      //   .from('activity_logs')
      //   .insert(logsToProcess)
      //   .select()

      // if (error) {
      //   console.error('Failed to insert activity logs:', error)
      //   // Re-add to pending (simple retry logic)
      //   this.pendingLogs.unshift(...logsToProcess)
      //   return
      // }

      // Broadcast to real-time channels if enabled (with mock data for now)
      if (this.enableBroadcast) {
        await this.broadcastActivities(logsToProcess as ActivityLogEntry[])
      }

    } catch (error) {
      console.error('Error processing activity log batch:', error)
      // Re-add to pending
      this.pendingLogs.unshift(...logsToProcess)
    }
  }

  /**
   * Broadcast activities to real-time channels
   */
  private async broadcastActivities(activities: ActivityLogEntry[]): Promise<void> {
    for (const activity of activities) {
      try {
        // Broadcast to relevant channels
        const channels = this.getRelevantChannels(activity)
        
        for (const channelName of channels) {
          await supabase.channel(channelName).send({
            type: 'broadcast',
            event: 'activity',
            payload: {
              ...activity,
              message: this.formatActivityMessage(activity)
            }
          })
        }
      } catch (error) {
        console.warn('Failed to broadcast activity:', error)
      }
    }
  }

  /**
   * Get relevant channels for broadcasting
   */
  private getRelevantChannels(activity: ActivityLogEntry): string[] {
    const channels: string[] = []

    if (activity.project_id) {
      channels.push(`project:${activity.project_id}:activity`)
    }

    if (activity.roof_id) {
      channels.push(`roof:${activity.roof_id}:activity`)
    }

    if (activity.pin_id) {
      channels.push(`pin:${activity.pin_id}:activity`)
    }

    return channels
  }

  /**
   * Format activity message for display in chat
   */
  public formatActivityMessage(activity: ActivityLogEntry): string {
    const userName = activity.user_name || 'Someone'
    const timeStr = activity.created_at 
      ? new Date(activity.created_at).toLocaleTimeString()
      : 'just now'

    switch (activity.action) {
      case 'pin_created':
        return `${userName} created pin #${activity.details.pin_sequence} at ${timeStr}`

      case 'status_changed':
        return `${userName} changed pin #${activity.details.pin_sequence} status from ${activity.details.old_status} to ${activity.details.new_status} at ${timeStr}`

      case 'photo_uploaded':
        return `${userName} uploaded ${activity.details.photo_type} photo for pin #${activity.details.pin_sequence} at ${timeStr}`

      case 'child_pin_created':
        return `${userName} added child pin ${activity.details.child_sequence} to pin #${activity.details.parent_sequence} at ${timeStr}`

      case 'comment_added':
        return `${userName} added a comment to pin #${activity.details.pin_sequence} at ${timeStr}`

      case 'project_created':
        return `${userName} created project "${activity.details.project_name}" at ${timeStr}`

      case 'export_generated':
        return `${userName} generated ${activity.details.export_type.toUpperCase()} export${activity.details.pin_count ? ` (${activity.details.pin_count} issues)` : ''} at ${timeStr}`

      default:
        return `${userName} performed ${activity.action.replace('_', ' ')} at ${timeStr}`
    }
  }

  /**
   * Flush any pending logs immediately
   */
  async flush(): Promise<void> {
    if (this.pendingLogs.length > 0) {
      await this.processBatch()
    }
  }

  /**
   * Get activity history for a specific context
   */
  async getActivityHistory(
    context: {
      pin_id?: string
      roof_id?: string  
      project_id?: string
    },
    options: {
      limit?: number
      offset?: number
      since?: string
    } = {}
  ): Promise<ActivityLogEntry[]> {
    // TODO: Re-enable when activity_logs table is created
    // For now, return empty array to avoid database errors
    return []
    
    // let query = supabase
    //   .from('activity_logs')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    // if (context.pin_id) {
    //   query = query.eq('pin_id', context.pin_id)
    // } else if (context.roof_id) {
    //   query = query.eq('roof_id', context.roof_id)
    // } else if (context.project_id) {
    //   query = query.eq('project_id', context.project_id)
    // }

    // if (options.since) {
    //   query = query.gte('created_at', options.since)
    // }

    // if (options.limit) {
    //   query = query.limit(options.limit)
    // }

    // if (options.offset) {
    //   query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    // }

    // const { data, error } = await query

    // if (error) {
    //   console.error('Failed to fetch activity history:', error)
    //   return []
    // }

    // return data || []
  }

  /**
   * Update context (useful when switching projects/roofs)
   */
  updateContext(newContext: Partial<ActivityContext>): void {
    this.context = { ...this.context, ...newContext }
  }

  /**
   * Cleanup - flush pending logs and clear timer
   */
  async cleanup(): Promise<void> {
    await this.flush()
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }
}

// Static utility methods
export class ActivityUtils {
  /**
   * Create a formatted activity entry for display
   */
  static formatForDisplay(activity: ActivityLogEntry): {
    title: string
    description: string
    timestamp: string
    type: 'info' | 'success' | 'warning' | 'error'
    icon?: string
  } {
    const timestamp = activity.created_at 
      ? new Date(activity.created_at).toLocaleString()
      : 'Unknown time'

    switch (activity.action) {
      case 'pin_created':
        return {
          title: 'Pin Created',
          description: `Pin #${activity.details.pin_sequence} created`,
          timestamp,
          type: 'info',
          icon: '📌'
        }

      case 'status_changed':
        const statusType = activity.details.new_status === 'Closed' ? 'success' : 'info'
        return {
          title: 'Status Changed',
          description: `Pin #${activity.details.pin_sequence}: ${activity.details.old_status} → ${activity.details.new_status}`,
          timestamp,
          type: statusType,
          icon: '🔄'
        }

      case 'photo_uploaded':
        return {
          title: 'Photo Uploaded',
          description: `${activity.details.photo_type} photo for pin #${activity.details.pin_sequence}`,
          timestamp,
          type: 'success',
          icon: '📷'
        }

      default:
        return {
          title: activity.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: activity.details.description || 'Activity occurred',
          timestamp,
          type: 'info',
          icon: '📝'
        }
    }
  }

  /**
   * Group activities by date
   */
  static groupByDate(activities: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> {
    return activities.reduce((groups, activity) => {
      const date = activity.created_at 
        ? new Date(activity.created_at).toDateString()
        : 'Unknown Date'
      
      if (!groups[date]) {
        groups[date] = []
      }
      
      groups[date].push(activity)
      return groups
    }, {} as Record<string, ActivityLogEntry[]>)
  }

  /**
   * Filter activities by type
   */
  static filterByType(activities: ActivityLogEntry[], types: ActivityType[]): ActivityLogEntry[] {
    return activities.filter(activity => types.includes(activity.action as ActivityType))
  }

  /**
   * Get activity statistics
   */
  static getStatistics(activities: ActivityLogEntry[]) {
    const stats = {
      total: activities.length,
      by_action: {} as Record<string, number>,
      by_user: {} as Record<string, number>,
      by_date: {} as Record<string, number>
    }

    activities.forEach(activity => {
      // Count by action
      stats.by_action[activity.action] = (stats.by_action[activity.action] || 0) + 1

      // Count by user
      const userName = activity.user_name || 'Unknown'
      stats.by_user[userName] = (stats.by_user[userName] || 0) + 1

      // Count by date
      const date = activity.created_at 
        ? new Date(activity.created_at).toDateString()
        : 'Unknown'
      stats.by_date[date] = (stats.by_date[date] || 0) + 1
    })

    return stats
  }
}