// React Query hooks for production Supabase integration
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseService, db } from '../supabase-production'
import { supabase } from '../supabase'
import type { 
  Project, 
  Roof, 
  Pin, 
  PinChild, 
  Photo, 
  Chat,
  ProjectInsert,
  PinInsert,
  PinChildInsert,
  PhotoInsert,
  ChatInsert
} from '../database.types'

// Query keys factory
export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  
  roofs: ['roofs'] as const,
  roofsByProject: (projectId: string) => ['roofs', 'project', projectId] as const,
  roof: (id: string) => ['roofs', id] as const,
  
  pins: ['pins'] as const,
  pinsByRoof: (roofId: string) => ['pins', 'roof', roofId] as const,
  pin: (id: string) => ['pins', id] as const,
  pinWithChildren: (id: string) => ['pins', id, 'children'] as const,
  
  photos: ['photos'] as const,
  photosByPin: (pinId: string) => ['photos', 'pin', pinId] as const,
  photosByChild: (childId: string) => ['photos', 'child', childId] as const,
  photoAnalytics: (pinId?: string) => ['photos', 'analytics', pinId || 'all'] as const,
  
  chat: ['chat'] as const,
  chatMessages: (scope: Chat['scope'], scopeId?: string) => 
    ['chat', scope, scopeId || 'global'] as const
}

// Project hooks
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => db.projects.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => db.projects.getById(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (project: ProjectInsert) => db.projects.create(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
    }
  })
}

// Roof hooks
export function useRoofsByProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.roofsByProject(projectId),
    queryFn: () => db.roofs.listByProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoof(roofId: string) {
  return useQuery({
    queryKey: queryKeys.roof(roofId),
    queryFn: () => db.roofs.getById(roofId),
    enabled: !!roofId,
    staleTime: 5 * 60 * 1000,
  })
}

// Pin hooks
export function usePinsByRoof(roofId: string) {
  return useQuery({
    queryKey: queryKeys.pinsByRoof(roofId),
    queryFn: () => db.pins.listByRoof(roofId),
    enabled: !!roofId,
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
  })
}

export function usePinWithChildren(pinId: string) {
  return useQuery({
    queryKey: queryKeys.pinWithChildren(pinId),
    queryFn: () => db.pins.getWithChildren(pinId),
    enabled: !!pinId,
    staleTime: 1 * 60 * 1000, // 1 minute for active pin management
  })
}

export function useCreatePin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ pin, roofId }: { pin: PinInsert; roofId: string }) => db.pins.create(pin),
    onSuccess: (data, { roofId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
    },
    onError: (error) => {
      console.error('Failed to create pin:', error)
    }
  })
}

// Pin children hooks
export function useCreatePinChild() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (pinChild: PinChildInsert) => db.pinChildren.create(pinChild),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.pinWithChildren(data.pin_id) })
      queryClient.invalidateQueries({ 
        queryKey: ['pins', 'roof'], 
        predicate: (query) => query.queryKey.includes(data.pin_id)
      })
    },
    onError: (error) => {
      console.error('Failed to create pin child:', error)
    }
  })
}

export function useUpdatePinChildStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ childId, status }: { childId: string; status: PinChild['status_child'] }) =>
      db.pinChildren.updateStatus(childId, status),
    onSuccess: (data) => {
      // Invalidate related queries to trigger re-aggregation
      queryClient.invalidateQueries({ queryKey: queryKeys.pinWithChildren(data.pin_id) })
      queryClient.invalidateQueries({ 
        queryKey: ['pins', 'roof'],
        predicate: (query) => query.queryKey.includes('roof')
      })
    },
    onError: (error) => {
      console.error('Failed to update pin child status:', error)
    }
  })
}

// Photo hooks  
export function usePhotosByChild(childId: string) {
  return useQuery({
    queryKey: queryKeys.photosByChild(childId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('child_id', childId)
      if (error) throw error
      return data
    },
    enabled: !!childId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (photo: PhotoInsert) => {
      const { data, error } = await supabase
        .from('photos')
        .insert([photo])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate photos query for this child
      if (data.child_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.photosByChild(data.child_id) 
        })
        
        // If it's a closure photo, might affect pin status
        if (data.type === 'ClosurePIC') {
          queryClient.invalidateQueries({ 
            queryKey: ['pins', 'children'],
            predicate: (query) => query.queryKey.includes(data.pin_id)
          })
        }
      }
    },
    onError: (error) => {
      console.error('Failed to upload photo:', error)
    }
  })
}

// Chat hooks
export function useChatMessages(scope: Chat['scope'], scopeId?: string) {
  return useQuery({
    queryKey: queryKeys.chatMessages(scope, scopeId),
    queryFn: () => db.chat.getMessages(scope, scopeId),
    staleTime: 30 * 1000, // 30 seconds - chat should be relatively fresh
    refetchInterval: 30 * 1000, // Poll every 30 seconds when active
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (chat: ChatInsert) => db.chat.send(chat),
    onSuccess: (data) => {
      // Invalidate the relevant chat query
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.chatMessages(data.scope, data.scope_id ?? undefined)
      })
    },
    onError: (error) => {
      console.error('Failed to send chat message:', error)
    }
  })
}

export function useEditChatMessage(scope: Chat['scope'], scopeId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) => db.chat.update(messageId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(scope, scopeId) })
    },
    onError: (error) => {
      console.error('Failed to edit chat message:', error)
    }
  })
}

export function useDeleteChatMessage(scope: Chat['scope'], scopeId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => db.chat.remove(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(scope, scopeId) })
    },
    onError: (error) => {
      console.error('Failed to delete chat message:', error)
    }
  })
}

// Photo management hooks
export function usePhotosByPin(pinId: string) {
  return useQuery({
    queryKey: queryKeys.photosByPin(pinId),
    queryFn: () => db.photos.getByPin(pinId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePhotoAnalytics(pinId?: string) {
  return useQuery({
    queryKey: queryKeys.photoAnalytics(pinId),
    queryFn: () => pinId ? db.photos.getAnalytics(pinId) : db.photos.getGlobalAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (photoId: string) => db.photos.delete(photoId),
    onSuccess: (_, photoId) => {
      // Invalidate all photo-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.photos })
      console.log(`Photo ${photoId} deleted successfully`)
    },
    onError: (error) => {
      console.error('Failed to delete photo:', error)
    }
  })
}

// Advanced hooks for specific UI needs
export function useProjectDashboard() {
  const projectsQuery = useProjects()
  
  // Derive dashboard statistics from projects
  const dashboardStats = projectsQuery.data ? {
    totalProjects: projectsQuery.data.length,
    openProjects: projectsQuery.data.filter(p => p.status === 'Open').length,
    inProgressProjects: projectsQuery.data.filter(p => p.status === 'InProgress').length,
    completedProjects: projectsQuery.data.filter(p => p.status === 'Completed').length,
  } : null
  
  return {
    projects: projectsQuery.data || [],
    stats: dashboardStats,
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
  }
}

export function useRoofDashboard(roofId: string) {
  const roofQuery = useRoof(roofId)
  const pinsQuery = usePinsByRoof(roofId)
  
  // Derive roof statistics from pins
  const roofStats = pinsQuery.data ? {
    totalPins: pinsQuery.data.length,
    openPins: pinsQuery.data.filter(p => p.status === 'Open').length,
    readyPins: pinsQuery.data.filter(p => p.status === 'ReadyForInspection').length,
    closedPins: pinsQuery.data.filter(p => p.status === 'Closed').length,
    totalChildren: pinsQuery.data.reduce((sum, pin) => sum + pin.children_total, 0),
    openChildren: pinsQuery.data.reduce((sum, pin) => sum + pin.children_open, 0),
    readyChildren: pinsQuery.data.reduce((sum, pin) => sum + pin.children_ready, 0),
    closedChildren: pinsQuery.data.reduce((sum, pin) => sum + pin.children_closed, 0),
  } : null
  
  return {
    roof: roofQuery.data,
    pins: pinsQuery.data || [],
    stats: roofStats,
    isLoading: roofQuery.isLoading || pinsQuery.isLoading,
    error: roofQuery.error || pinsQuery.error,
  }
}

// Real-time hooks - Enhanced with live subscriptions
export function useRealTimeProject(projectId: string) {
  const queryClient = useQueryClient()
  const projectQuery = useProject(projectId)
  const roofQuery = useRoofsByProject(projectId)
  
  useEffect(() => {
    if (!projectId) return

    // Subscribe to project-level changes
    const subscription = db.realtime.subscribeToProject(projectId, (payload) => {
      console.log('Real-time project update:', payload)
      
      // Invalidate and refetch related queries on any change
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.roofsByProject(projectId) })
      
      // Handle specific events for better UX
      if (payload.eventType === 'INSERT') {
        // New project created (shouldn't happen for this hook, but good to handle)
      } else if (payload.eventType === 'UPDATE') {
        // Project updated - could show a toast notification
        console.log(`Project ${projectId} was updated`)
      } else if (payload.eventType === 'DELETE') {
        // Project deleted - redirect user or show appropriate message
        console.log(`Project ${projectId} was deleted`)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [projectId, queryClient])
  
  return {
    project: projectQuery.data,
    roofs: roofQuery.data || [],
    isLoading: projectQuery.isLoading || roofQuery.isLoading,
    error: projectQuery.error || roofQuery.error,
  }
}

export function useRealTimeRoof(roofId: string) {
  const queryClient = useQueryClient()
  const roofQuery = useRoof(roofId)
  const pinsQuery = usePinsByRoof(roofId)
  
  useEffect(() => {
    if (!roofId) return

    // Subscribe to roof-level changes (pins, pin children, etc.)
    const subscription = db.realtime.subscribeToRoof(roofId, (payload) => {
      console.log('Real-time roof update:', payload)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.roof(roofId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
      
      // Handle specific table updates
      if (payload.table === 'pins') {
        // Pin was added/updated/deleted
        queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
        
        // Also invalidate any specific pin queries that might be cached
        if (payload.new?.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.pinWithChildren(payload.new.id) })
        }
      } else if (payload.table === 'pin_children') {
        // Pin child status changed - need to recompute parent aggregations
        if (payload.new?.pin_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.pinWithChildren(payload.new.pin_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [roofId, queryClient])

  return {
    roof: roofQuery.data,
    pins: pinsQuery.data || [],
    isLoading: roofQuery.isLoading || pinsQuery.isLoading,
    error: roofQuery.error || pinsQuery.error,
  }
}

// Presence hooks for showing who's online
export function usePresence(channel: string, userInfo: { id: string; name: string; role: string }) {
  const [presenceState, setPresenceState] = useState<any[]>([])
  
  useEffect(() => {
    if (!channel || !userInfo.id) return

    const presenceChannel = supabase
      .channel(`presence:${channel}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const users = Object.values(presenceState).flat()
        setPresenceState(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          await presenceChannel.track(userInfo)
        }
      })

    return () => {
      presenceChannel.untrack()
      presenceChannel.unsubscribe()
    }
  }, [channel, userInfo])

  return {
    users: presenceState,
    onlineCount: presenceState.length
  }
}

// Real-time chat with presence
export function useRealTimeChat(scope: Chat['scope'], scopeId?: string, userInfo?: { id: string; name: string; role: string }) {
  const queryClient = useQueryClient()
  const chatQuery = useChatMessages(scope, scopeId)
  const { users: onlineUsers, onlineCount } = usePresence(
    `chat:${scope}:${scopeId || 'global'}`,
    userInfo || { id: 'anonymous', name: 'Anonymous', role: 'Viewer' }
  )

  useEffect(() => {
    if (!scope) return

    const subscription = db.chat.subscribe(scope, scopeId || null, (payload) => {
      console.log('Real-time chat message:', payload)
      
      // Invalidate chat messages query to fetch new message
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.chatMessages(scope, scopeId) 
      })
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [scope, scopeId, queryClient])

  return {
    messages: chatQuery.data || [],
    onlineUsers,
    onlineCount,
    isLoading: chatQuery.isLoading,
    error: chatQuery.error,
  }
}

// Enhanced real-time pin management
export function useRealTimePinManagement(roofId: string, pinId?: string) {
  const queryClient = useQueryClient()
  const pinQuery = usePinWithChildren(pinId || '')
  const pinsQuery = usePinsByRoof(roofId)

  useEffect(() => {
    if (!roofId) return

    const subscription = db.realtime.subscribeToRoof(roofId, (payload) => {
      console.log('Real-time pin management update:', payload)
      
      // Handle different types of updates
      if (payload.table === 'pins') {
        queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
        
        // If we're viewing a specific pin and it was updated
        if (pinId && payload.new?.id === pinId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.pinWithChildren(pinId) })
        }
      } else if (payload.table === 'pin_children') {
        // Child item updated - invalidate parent pin and roof overview
        queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
        
        if (payload.new?.pin_id) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.pinWithChildren(payload.new.pin_id) 
          })
        }
      } else if (payload.table === 'photos') {
        // Photo added/updated - might affect pin status
        if (payload.new?.pin_id) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.pinWithChildren(payload.new.pin_id) 
          })
          queryClient.invalidateQueries({ queryKey: queryKeys.pinsByRoof(roofId) })
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [roofId, pinId, queryClient])

  return {
    pin: pinQuery?.data || null,
    pins: pinsQuery.data || [],
    isLoading: (pinQuery?.isLoading ?? false) || pinsQuery.isLoading,
    error: pinQuery?.error || pinsQuery.error,
  }
}

// Utility hooks for common patterns
export function useOptimisticUpdate<T>(
  queryKey: any[],
  updateFn: (oldData: T | undefined, newData: any) => T | undefined
) {
  const queryClient = useQueryClient()
  
  return {
    mutate: (newData: any) => {
      queryClient.setQueryData(queryKey, (oldData: T | undefined) => 
        updateFn(oldData, newData)
      )
    },
    rollback: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  }
}

// Error boundary hook for handling Supabase errors
export function useSupabaseError() {
  return {
    handleError: (error: any) => {
      console.error('Supabase error:', error)
      
      // Handle specific error types
      if (error?.code === 'PGRST301') {
        // Row Level Security violation
        console.error('Authentication required or insufficient permissions')
      } else if (error?.code === 'PGRST116') {
        // Not found
        console.error('Resource not found')
      } else if (error?.message?.includes('JWT')) {
        // JWT/Auth issues
        console.error('Authentication token expired or invalid')
      }
      
      // Could integrate with toast notifications here
      return error
    }
  }
}