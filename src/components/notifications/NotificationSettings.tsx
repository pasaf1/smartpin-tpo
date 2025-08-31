'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, BellOff, TestTube, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { cn } from '@/lib/utils'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications()

  const [preferences, setPreferences] = useState({
    pinCreated: true,
    statusChanged: true,
    photoUploaded: false,
    commentAdded: true,
    assignments: true,
    dailyDigest: false
  })

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'text-green-600', icon: CheckCircle, text: 'Granted' }
      case 'denied':
        return { color: 'text-red-600', icon: AlertCircle, text: 'Denied' }
      default:
        return { color: 'text-yellow-600', icon: AlertCircle, text: 'Not Requested' }
    }
  }

  const handleSubscriptionToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const handleTestNotification = async () => {
    await testNotification({
      title: 'SmartPin TPO Test',
      body: 'Your notification settings are working correctly!',
      tag: 'settings-test'
    })
  }

  const statusInfo = getPermissionStatus()
  const StatusIcon = statusInfo.icon

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in your browser. 
              Please use a modern browser like Chrome, Firefox, or Safari to enable notifications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications about project activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Status</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
              <span className="text-sm font-medium">Permission: {statusInfo.text}</span>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Subscription Toggle */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Subscription</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable push notifications</Label>
              <p className="text-sm text-gray-600">
                Receive notifications when important events happen in your projects
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleSubscriptionToggle}
              disabled={isLoading || permission === 'denied'}
            />
          </div>
        </div>

        {/* Test Notification */}
        {permission === 'granted' && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestNotification}
              disabled={isLoading}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test Notification
            </Button>
          </div>
        )}

        {/* Notification Preferences */}
        {isSubscribed && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Notification Types
              </Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>New Issues Created</Label>
                    <p className="text-sm text-gray-600">When new pins are created</p>
                  </div>
                  <Switch
                    checked={preferences.pinCreated}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, pinCreated: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Status Changes</Label>
                    <p className="text-sm text-gray-600">When issue status is updated</p>
                  </div>
                  <Switch
                    checked={preferences.statusChanged}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, statusChanged: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Photo Uploads</Label>
                    <p className="text-sm text-gray-600">When photos are uploaded to issues</p>
                  </div>
                  <Switch
                    checked={preferences.photoUploaded}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, photoUploaded: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Comments</Label>
                    <p className="text-sm text-gray-600">When comments are added to issues</p>
                  </div>
                  <Switch
                    checked={preferences.commentAdded}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, commentAdded: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Assignments</Label>
                    <p className="text-sm text-gray-600">When you're assigned to issues</p>
                  </div>
                  <Switch
                    checked={preferences.assignments}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, assignments: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-gray-600">Daily summary of project activity</p>
                  </div>
                  <Switch
                    checked={preferences.dailyDigest}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, dailyDigest: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Permission Instructions */}
        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. To enable them:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Select "Allow" for notifications</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Browser Support Info */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            Push notifications work best in Chrome, Firefox, and Safari. 
            Make sure notifications aren't blocked by your browser or operating system.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}