// Unified hooks for Photos and Chat using enhanced services
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photoService } from '../services/PhotoService'
import { chatService } from '../services/ChatService'
import { useRLSErrorHandler } from '@/components/error/RLSErrorBoundary'
import type { 
  PhotoWithContext,
  ChatWithAuthor
} from '../types/relations'
import type { Photo, Chat } from '../database.types'

// ===============================
// PHOTO HOOKS
// ===============================

/**
 * Get photos for a pin
 */
export function usePhotosForPin(pinId: string) {
  const { handleRLSError } = useRLSErrorHandler()

  return useQuery({
    queryKey: ['photos', 'pin', pinId],
    queryFn: () => photoService.getPhotosForPin(pinId),
    enabled: !!pinId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Get photos for pin child
 */
export function usePhotosForPinChild(childId: string) {
  const { handleRLSError } = useRLSErrorHandler()

  return useQuery({
    queryKey: ['photos', 'child', childId],
    queryFn: () => photoService.getPhotosForPinChild(childId),
    enabled: !!childId,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Upload photo mutation
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient()
  const { handleRLSError } = useRLSErrorHandler()

  return useMutation({
    mutationFn: (data: {
      file: File
      pinId?: string
      pinChildId?: string
      type: 'OpenPIC' | 'ClosurePIC'
      metadata?: Record<string, any>
    }) => photoService.uploadPhoto(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.pinId) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'pin', variables.pinId]
        })
        queryClient.invalidateQueries({
          queryKey: ['pins', variables.pinId]
        })
      }
      if (variables.pinChildId) {
        queryClient.invalidateQueries({
          queryKey: ['photos', 'child', variables.pinChildId]
        })
      }
    },
    onError: (error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
      } else {
        throw error
      }
    }
  })
}

/**
 * Delete photo mutation
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient()
  const { handleRLSError } = useRLSErrorHandler()

  return useMutation({
    mutationFn: (photoId: string) => photoService.deletePhoto(photoId),
    onSuccess: () => {
      // Invalidate all photo queries
      queryClient.invalidateQueries({
        queryKey: ['photos']
      })
    },
    onError: (error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
      } else {
        throw error
      }
    }
  })
}

/**
 * Get photo analytics
 */
export function usePhotoAnalytics(filters?: {
  projectId?: string
  roofId?: string
  dateFrom?: string
  dateTo?: string
}) {
  const { handleRLSError } = useRLSErrorHandler()

  return useQuery({
    queryKey: ['photos', 'analytics', filters],
    queryFn: () => photoService.getPhotoAnalytics(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
        return false
      }
      return failureCount < 3
    }
  })
}

// ===============================
// CHAT HOOKS
// ===============================

/**
 * Get chat messages
 */
export function useChatMessages(filters?: {
  scope?: 'global' | 'roof' | 'pin'
  scopeId?: string
  limit?: number
}) {
  const { handleRLSError } = useRLSErrorHandler()

  return useQuery({
    queryKey: ['chats', filters],
    queryFn: () => chatService.getChatMessages(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Send chat message mutation
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient()
  const { handleRLSError } = useRLSErrorHandler()

  return useMutation({
    mutationFn: (data: {
      text: string
      scope: 'global' | 'roof' | 'pin'
      scopeId?: string
      mentions?: string[]
    }) => chatService.sendMessage(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant chat queries
      queryClient.invalidateQueries({
        queryKey: ['chats']
      })
      
      // Optimistic update could be added here
    },
    onError: (error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
      } else {
        throw error
      }
    }
  })
}

/**
 * Edit chat message mutation
 */
export function useEditChatMessage() {
  const queryClient = useQueryClient()
  const { handleRLSError } = useRLSErrorHandler()

  return useMutation({
    mutationFn: ({ messageId, newText }: { messageId: string; newText: string }) => 
      chatService.editMessage(messageId, newText),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chats']
      })
    },
    onError: (error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
      } else {
        throw error
      }
    }
  })
}

/**
 * Delete chat message mutation
 */
export function useDeleteChatMessage() {
  const queryClient = useQueryClient()
  const { handleRLSError } = useRLSErrorHandler()

  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chats']
      })
    },
    onError: (error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
      } else {
        throw error
      }
    }
  })
}

/**
 * Real-time chat hook with subscription
 */
export function useRealTimeChat(filters?: {
  scope?: 'global' | 'roof' | 'pin'
  scopeId?: string
}) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = React.useState(false)

  React.useEffect(() => {
    const subscription = chatService.subscribeToChat(
      (payload) => {
        console.log('Chat update:', payload)
        
        // Invalidate chat queries on any change
        queryClient.invalidateQueries({
          queryKey: ['chats']
        })
      },
      filters
    )

    setIsConnected(true)

    return () => {
      subscription.unsubscribe()
      setIsConnected(false)
    }
  }, [filters?.scope, filters?.scopeId, queryClient])

  return { isConnected }
}

/**
 * Chat statistics hook
 */
export function useChatStatistics(filters?: {
  scope?: 'global' | 'roof' | 'pin'
  scopeId?: string
  dateFrom?: string
  dateTo?: string
}) {
  const { handleRLSError } = useRLSErrorHandler()

  return useQuery({
    queryKey: ['chats', 'statistics', filters],
    queryFn: () => chatService.getChatStatistics(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error?.code)) {
        handleRLSError(error)
        return false
      }
      return failureCount < 3
    }
  })
}
