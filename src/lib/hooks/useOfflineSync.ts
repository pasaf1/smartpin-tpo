// Offline synchronization hooks for SmartPin TPO
import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types for offline operations
export interface OfflineOperation {
  id: string
  type: 'pin-update' | 'photo-upload' | 'chat-message' | 'status-change' | 'project-update'
  data: any
  timestamp: number
  retries: number
  maxRetries: number
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: string | null
  syncErrors: string[]
}

// Main offline sync hook
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncErrors: []
  })
  
  const queryClient = useQueryClient()

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }))
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Listen for service worker sync messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncTime: new Date().toISOString(),
            pendingCount: Math.max(0, prev.pendingCount - (event.data.count || 0))
          }))
          
          // Show success notification
          toast.success(`Synced ${event.data.count} ${event.data.category}`, {
            description: 'Your offline changes have been saved to the server'
          })
          
          // Invalidate queries to refresh UI with latest data
          queryClient.invalidateQueries()
        } else if (event.data?.type === 'SYNC_ERROR') {
          setSyncStatus(prev => ({
            ...prev,
            isSyncing: false,
            syncErrors: [...prev.syncErrors, event.data.error]
          }))
          
          toast.error('Sync failed', {
            description: 'Some changes could not be synced. Will retry automatically.'
          })
        } else if (event.data?.type === 'SW_ACTIVATED') {
          console.log('Service Worker activated:', event.data.version)
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [queryClient])

  // Queue offline operation
  const queueOperation = useCallback(async (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>) => {
    const fullOperation: OfflineOperation = {
      ...operation,
      id: `${operation.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0
    }

    // Store in IndexedDB via service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_OPERATION',
        operation: fullOperation
      })
      
      setSyncStatus(prev => ({ ...prev, pendingCount: prev.pendingCount + 1 }))
      
      // Show offline notification
      if (!syncStatus.isOnline) {
        toast.info('Saved offline', {
          description: 'This change will sync when connection is restored'
        })
      }
    }
  }, [syncStatus.isOnline])

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!syncStatus.isOnline) {
      toast.error('No internet connection', {
        description: 'Cannot sync while offline'
      })
      return
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }))
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        // Type assertion for background sync API
        await (registration as any).sync?.register('manual-sync')
        
        toast.info('Sync started', {
          description: 'Synchronizing your offline changes...'
        })
      } catch (error) {
        console.error('Failed to register background sync:', error)
        setSyncStatus(prev => ({ ...prev, isSyncing: false }))
        
        toast.error('Sync failed to start', {
          description: 'Please try again'
        })
      }
    }
  }, [syncStatus.isOnline])

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, syncErrors: [] }))
  }, [])

  return {
    syncStatus,
    queueOperation,
    triggerSync,
    clearSyncErrors
  }
}

// Hook for pin operations with offline support
export function useOfflinePinOperations() {
  const { queueOperation, syncStatus } = useOfflineSync()
  
  const updatePinOffline = useCallback(async (pinId: string, updates: any) => {
    await queueOperation({
      type: 'pin-update',
      data: { pinId, updates },
      maxRetries: 3
    })
  }, [queueOperation])
  
  const updatePinStatusOffline = useCallback(async (pinId: string, status: string) => {
    await queueOperation({
      type: 'status-change',
      data: { pinId, status },
      maxRetries: 5 // Status changes are critical
    })
  }, [queueOperation])
  
  return {
    updatePinOffline,
    updatePinStatusOffline,
    isOffline: !syncStatus.isOnline
  }
}

// Hook for photo operations with offline support
export function useOfflinePhotoOperations() {
  const { queueOperation, syncStatus } = useOfflineSync()
  
  const uploadPhotoOffline = useCallback(async (pinId: string, file: File, type: string) => {
    // Convert file to base64 for storage
    const base64 = await fileToBase64(file)
    
    await queueOperation({
      type: 'photo-upload',
      data: { 
        pinId, 
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        },
        uploadType: type
      },
      maxRetries: 3
    })
  }, [queueOperation])
  
  return {
    uploadPhotoOffline,
    isOffline: !syncStatus.isOnline
  }
}

// Hook for chat operations with offline support
export function useOfflineChatOperations() {
  const { queueOperation, syncStatus } = useOfflineSync()
  
  const sendMessageOffline = useCallback(async (chatData: any) => {
    await queueOperation({
      type: 'chat-message',
      data: chatData,
      maxRetries: 3
    })
  }, [queueOperation])
  
  return {
    sendMessageOffline,
    isOffline: !syncStatus.isOnline
  }
}

// Service Worker registration and management
export function useServiceWorkerManager() {
  const [swStatus, setSWStatus] = useState<{
    isSupported: boolean
    isRegistered: boolean
    isInstalling: boolean
    needsUpdate: boolean
    version: string | null
  }>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    needsUpdate: false,
    version: null
  })

  useEffect(() => {
    if (!swStatus.isSupported) return

    const registerSW = async () => {
      try {
        setSWStatus(prev => ({ ...prev, isInstalling: true }))
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        setSWStatus(prev => ({ 
          ...prev, 
          isRegistered: true, 
          isInstalling: false 
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New SW is available
                  setSWStatus(prev => ({ ...prev, needsUpdate: true }))
                  
                  toast.info('Update available', {
                    description: 'A new version of SmartPin TPO is ready',
                    action: {
                      label: 'Update',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }
                    },
                    duration: 10000
                  })
                } else {
                  // First time installation
                  console.log('Service Worker installed for the first time')
                }
              }
            })
          }
        })

        console.log('Service Worker registered successfully')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        setSWStatus(prev => ({ ...prev, isInstalling: false }))
      }
    }

    registerSW()
  }, [swStatus.isSupported])

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [])

  return {
    swStatus,
    updateServiceWorker
  }
}

// Utility functions
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = error => reject(error)
  })
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    // Get connection info if available
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setConnectionType(connection?.effectiveType || 'unknown')
      }
    }
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', updateConnectionInfo)
      updateConnectionInfo()
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection?.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])
  
  return { isOnline, connectionType }
}