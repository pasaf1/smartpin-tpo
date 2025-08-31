'use client'

import { supabase } from '@/lib/supabase'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  data?: Record<string, any>
  requireInteraction?: boolean
  silent?: boolean
}

export interface NotificationSubscription {
  user_id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  enabled: boolean
  created_at?: string
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported')
        return false
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported')
        return false
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered successfully')

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(userId: string): Promise<boolean> {
    try {
      const permission = await this.requestPermission()
      
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return false
      }

      if (!this.registration) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }

      // Check if already subscribed
      this.subscription = await this.registration!.pushManager.getSubscription()
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
        })
      }

      // Save subscription to database
      await this.saveSubscription(userId, this.subscription)

      console.log('Push notification subscription successful')
      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
      }

      // Remove subscription from database
      await this.removeSubscription(userId)

      console.log('Push notification unsubscription successful')
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  async getSubscriptionStatus(): Promise<{
    supported: boolean
    permission: NotificationPermission
    subscribed: boolean
  }> {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    const permission = 'Notification' in window ? Notification.permission : 'denied'
    
    let subscribed = false
    if (supported && this.registration) {
      try {
        const subscription = await this.registration.pushManager.getSubscription()
        subscribed = !!subscription
        this.subscription = subscription
      } catch (error) {
        console.warn('Failed to check subscription status:', error)
      }
    }

    return { supported, permission, subscribed }
  }

  private async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const subscriptionData: NotificationSubscription = {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      enabled: true
    }

    // TODO: Re-enable when push_subscriptions table is created
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .upsert(subscriptionData, {
    //     onConflict: 'user_id'
    //   })

    // if (error) {
    //   throw new Error(`Failed to save subscription: ${error.message}`)
    // }
  }

  private async removeSubscription(userId: string): Promise<void> {
    // TODO: Re-enable when push_subscriptions table is created
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .update({ enabled: false })
    //   .eq('user_id', userId)

    // if (error) {
    //   throw new Error(`Failed to remove subscription: ${error.message}`)
    // }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  // Show local notification (for testing)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent
      })
    }
  }
}

// Utility functions for server-side push notifications
export class ServerPushService {
  private vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
  private vapidPublicKey = process.env.VAPID_PUBLIC_KEY || ''

  async sendNotification(
    subscriptions: NotificationSubscription[],
    payload: NotificationPayload
  ): Promise<{ success: number; failures: number }> {
    let success = 0
    let failures = 0

    for (const subscription of subscriptions) {
      try {
        await this.sendToSubscription(subscription, payload)
        success++
      } catch (error) {
        console.error('Failed to send notification:', error)
        failures++
        
        // Mark subscription as invalid if endpoint is gone
        if (error instanceof Error && error.message.includes('410')) {
          await this.markSubscriptionInvalid(subscription.user_id)
        }
      }
    }

    return { success, failures }
  }

  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    // TODO: Re-enable when push_subscriptions table is created
    return false
    
    // try {
    //   // Get user's active subscriptions
    //   const { data: subscriptions, error } = await supabase
    //     .from('push_subscriptions')
    //     .select('*')
    //     .eq('user_id', userId)
    //     .eq('enabled', true)

    //   if (error) throw error
    //   if (!subscriptions || subscriptions.length === 0) return false

    //   const results = await this.sendNotification(subscriptions, payload)
    //   return results.success > 0
    // } catch (error) {
    //   console.error('Failed to send notification to user:', error)
    //   return false
    // }
  }

  async sendToProject(projectId: string, payload: NotificationPayload): Promise<void> {
    try {
      // Get all users in the project with active subscriptions
      // TODO: Re-enable when push_subscriptions table is created
      return
      
      // const { data: subscriptions, error } = await supabase
      //   .from('push_subscriptions')
      //   .select(`
      //     *,
      //     users!inner (
      //       id,
      //       projects!inner (id)
      //     )
      //   `)
      //   .eq('enabled', true)
      //   .eq('users.projects.id', projectId)

      // if (error) throw error
      // if (!subscriptions || subscriptions.length === 0) return

      // await this.sendNotification(subscriptions, payload)
    } catch (error) {
      console.error('Failed to send notifications to project users:', error)
    }
  }

  private async sendToSubscription(
    subscription: NotificationSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    // This would use a library like `web-push` in a real implementation
    // For now, we'll simulate the push notification
    console.log('Sending push notification:', {
      endpoint: subscription.endpoint,
      payload
    })

    // In a real implementation:
    // const webpush = require('web-push')
    // await webpush.sendNotification(subscription, JSON.stringify(payload))
  }

  private async markSubscriptionInvalid(userId: string): Promise<void> {
    // TODO: Re-enable when push_subscriptions table is created
    return
    
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .update({ enabled: false })
    //   .eq('user_id', userId)

    // if (error) {
    //   console.error('Failed to mark subscription as invalid:', error)
    // }
  }
}

// Notification templates
export class NotificationTemplates {
  static pinCreated(pinNumber: number, projectName: string): NotificationPayload {
    return {
      title: 'New Issue Created',
      body: `Pin #${pinNumber} has been created in ${projectName}`,
      icon: '/icons/pin-icon.png',
      tag: 'pin-created',
      url: `/pins/${pinNumber}`,
      data: { type: 'pin_created', pinNumber, projectName }
    }
  }

  static statusChanged(
    pinNumber: number, 
    oldStatus: string, 
    newStatus: string, 
    projectName: string
  ): NotificationPayload {
    return {
      title: 'Issue Status Changed',
      body: `Pin #${pinNumber} changed from ${oldStatus} to ${newStatus}`,
      icon: '/icons/status-icon.png',
      tag: 'status-changed',
      url: `/pins/${pinNumber}`,
      data: { type: 'status_changed', pinNumber, oldStatus, newStatus, projectName }
    }
  }

  static photoUploaded(
    pinNumber: number, 
    photoType: 'opening' | 'closing', 
    projectName: string
  ): NotificationPayload {
    return {
      title: 'Photo Uploaded',
      body: `${photoType} photo uploaded for Pin #${pinNumber}`,
      icon: '/icons/photo-icon.png',
      tag: 'photo-uploaded',
      url: `/pins/${pinNumber}`,
      data: { type: 'photo_uploaded', pinNumber, photoType, projectName }
    }
  }

  static commentAdded(
    pinNumber: number, 
    commenterName: string, 
    projectName: string
  ): NotificationPayload {
    return {
      title: 'New Comment',
      body: `${commenterName} commented on Pin #${pinNumber}`,
      icon: '/icons/comment-icon.png',
      tag: 'comment-added',
      url: `/pins/${pinNumber}#comments`,
      data: { type: 'comment_added', pinNumber, commenterName, projectName }
    }
  }

  static assignmentNotification(
    pinNumber: number, 
    assigneeName: string, 
    projectName: string
  ): NotificationPayload {
    return {
      title: 'New Assignment',
      body: `You have been assigned to Pin #${pinNumber}`,
      icon: '/icons/assignment-icon.png',
      tag: 'assignment',
      url: `/pins/${pinNumber}`,
      requireInteraction: true,
      data: { type: 'assignment', pinNumber, assigneeName, projectName }
    }
  }
}