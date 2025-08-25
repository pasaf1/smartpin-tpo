// Production Supabase integration utilities
import { supabase, isDemoMode } from './supabase'
import type { 
  Database, 
  Project, 
  Roof, 
  Pin, 
  PinChild, 
  Photo, 
  Chat, 
  User,
  ProjectInsert,
  RoofInsert,
  PinInsert,
  PinChildInsert,
  PhotoInsert,
  ChatInsert
} from './database.types'

// Production-ready database operations with proper error handling and types

export class SupabaseService {
  constructor(private client = supabase) {}

  // Project operations
  async getProjects(): Promise<Project[]> {
    if (isDemoMode) {
      return this.getDemoProjects()
    }

    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }

    return data || []
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    if (isDemoMode) {
      return this.getDemoProjects().find(p => p.project_id === projectId) || null
    }

    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching project:', error)
      throw error
    }

    return data
  }

  async createProject(project: ProjectInsert): Promise<Project> {
    if (isDemoMode) {
      throw new Error('Cannot create projects in demo mode')
    }

    const { data, error } = await this.client
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    return data
  }

  // Roof operations
  async getRoofsByProject(projectId: string): Promise<Roof[]> {
    if (isDemoMode) {
      return this.getDemoRoofs().filter(r => r.project_id === projectId)
    }

    const { data, error } = await this.client
      .from('roofs')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (error) {
      console.error('Error fetching roofs:', error)
      throw error
    }

    return data || []
  }

  async getRoofById(roofId: string): Promise<Roof | null> {
    if (isDemoMode) {
      return this.getDemoRoofs().find(r => r.id === roofId) || null
    }

    const { data, error } = await this.client
      .from('roofs')
      .select('*')
      .eq('id', roofId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching roof:', error)
      throw error
    }

    return data
  }

  // Pin operations with advanced aggregation
  async getPinsByRoof(roofId: string): Promise<Pin[]> {
    if (isDemoMode) {
      return this.getDemoPins().filter(p => p.roof_id === roofId)
    }

    const { data, error } = await this.client
      .from('pins')
      .select('*')
      .eq('roof_id', roofId)
      .order('seq_number', { ascending: true })

    if (error) {
      console.error('Error fetching pins:', error)
      throw error
    }

    return data || []
  }

  async getPinWithChildren(pinId: string): Promise<Pin & { children: PinChild[] } | null> {
    if (isDemoMode) {
      const pin = this.getDemoPins().find(p => p.id === pinId)
      if (!pin) return null
      return { ...pin, children: this.getDemoPinChildren().filter(c => c.pin_id === pinId) }
    }

    const { data: pin, error: pinError } = await this.client
      .from('pins')
      .select('*')
      .eq('id', pinId)
      .single()

    if (pinError) {
      if (pinError.code === 'PGRST116') return null
      console.error('Error fetching pin:', pinError)
      throw pinError
    }

    const { data: children, error: childrenError } = await this.client
      .from('pin_children')
      .select('*')
      .eq('pin_id', pinId)
      .order('child_code', { ascending: true })

    if (childrenError) {
      console.error('Error fetching pin children:', childrenError)
      throw childrenError
    }

    return { ...pin, children: children || [] }
  }

  async createPin(pin: PinInsert): Promise<Pin> {
    if (isDemoMode) {
      throw new Error('Cannot create pins in demo mode')
    }

    const { data, error } = await this.client
      .from('pins')
      .insert(pin)
      .select()
      .single()

    if (error) {
      console.error('Error creating pin:', error)
      throw error
    }

    return data
  }

  // Pin children operations
  async createPinChild(pinChild: PinChildInsert): Promise<PinChild> {
    if (isDemoMode) {
      throw new Error('Cannot create pin children in demo mode')
    }

    const { data, error } = await this.client
      .from('pin_children')
      .insert(pinChild)
      .select()
      .single()

    if (error) {
      console.error('Error creating pin child:', error)
      throw error
    }

    // Trigger parent aggregation recompute
    await this.recomputeParentAggregates(pinChild.pin_id)

    return data
  }

  async updatePinChildStatus(childId: string, status: PinChild['status_child']): Promise<PinChild> {
    if (isDemoMode) {
      throw new Error('Cannot update pin children in demo mode')
    }

    const { data, error } = await this.client
      .from('pin_children')
      .update({ 
        status_child: status,
        closed_date: status === 'Closed' ? new Date().toISOString() : null
      })
      .eq('child_id', childId)
      .select()
      .single()

    if (error) {
      console.error('Error updating pin child status:', error)
      throw error
    }

    // Trigger parent aggregation recompute
    await this.recomputeParentAggregates(data.pin_id)

    return data
  }

  // Photo operations
  async uploadPhoto(photo: PhotoInsert): Promise<Photo> {
    if (isDemoMode) {
      throw new Error('Cannot upload photos in demo mode')
    }

    const { data, error } = await this.client
      .from('photos')
      .insert(photo)
      .select()
      .single()

    if (error) {
      console.error('Error uploading photo:', error)
      throw error
    }

    return data
  }

  async getPhotosByPin(pinId: string): Promise<Photo[]> {
    if (isDemoMode) {
      return []
    }
    
    const { data, error } = await this.client
      .from('pin_photos')
      .select(`
        *,
        uploader:uploaded_by(name, avatar_url)
      `)
      .eq('pin_id', pinId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      throw error
    }
    return data || []
  }

  async getPhotoAnalytics(pinId?: string): Promise<any> {
    if (isDemoMode) {
      return {
        totalPhotos: 0,
        totalSize: 0,
        avgFileSize: 0,
        photosByType: {},
        photosByMonth: {},
        topUploaders: {}
      }
    }

    const { data, error } = await this.client
      .rpc('get_storage_stats', pinId ? { project_uuid: null } : {})

    if (error) {
      console.error('Error fetching photo analytics:', error)
      throw error
    }
    return data?.[0] || {}
  }

  async getGlobalAnalytics(): Promise<any> {
    return this.getPhotoAnalytics()
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    if (isDemoMode) {
      return true
    }

    const { data: photo, error: fetchError } = await this.client
      .from('pin_photos')
      .select('file_path, thumbnail_url')
      .eq('id', photoId)
      .single()

    if (fetchError) {
      console.error('Error fetching photo for deletion:', fetchError)
      throw fetchError
    }

    if (photo.file_path) {
      const { error: storageError } = await this.client.storage
        .from('pin-photos')
        .remove([photo.file_path])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }
    }

    if (photo.thumbnail_url) {
      const thumbPath = photo.thumbnail_url.split('/pin-photos/')[1]
      if (thumbPath) {
        await this.client.storage
          .from('pin-photos')
          .remove([thumbPath])
      }
    }

    const { error: deleteError } = await this.client
      .from('pin_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('Error deleting photo record:', deleteError)
      throw deleteError
    }

    return true
  }

  async getPhotosByChild(childId: string): Promise<Photo[]> {
    if (isDemoMode) {
      return []
    }

    const { data, error } = await this.client
      .from('photos')
      .select('*')
      .eq('child_id', childId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      throw error
    }

    return data || []
  }

  // Chat operations (multi-scope)
  async getChatMessages(scope: Chat['scope'], scopeId?: string): Promise<Chat[]> {
    if (isDemoMode) {
      return this.getDemoChats().filter(c => c.scope === scope && c.scope_id === scopeId)
    }

    const query = this.client
      .from('chats')
      .select(`
        *,
        created_by:users(full_name, email)
      `)
      .eq('scope', scope)
      .order('created_at', { ascending: true })

    if (scopeId) {
      query.eq('scope_id', scopeId)
    } else {
      query.is('scope_id', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching chat messages:', error)
      throw error
    }

    return data || []
  }

  async sendChatMessage(chat: ChatInsert): Promise<Chat> {
    if (isDemoMode) {
      throw new Error('Cannot send messages in demo mode')
    }

    const { data, error } = await this.client
      .from('chats')
      .insert(chat)
      .select()
      .single()

    if (error) {
      console.error('Error sending chat message:', error)
      throw error
    }

    return data
  }

  // Advanced database functions
  async recomputeParentAggregates(pinId: string): Promise<void> {
    if (isDemoMode) return

    const { error } = await this.client.rpc('recompute_parent_aggregates', { p_pin: pinId })

    if (error) {
      console.error('Error recomputing parent aggregates:', error)
      throw error
    }
  }

  async validatePinClosure(pinId: string): Promise<{ canClose: boolean; reason?: string }> {
    if (isDemoMode) {
      return { canClose: false, reason: 'Demo mode - closure validation not available' }
    }

    const { data, error } = await this.client.rpc('validate_pin_closure', { pin_uuid: pinId })

    if (error) {
      console.error('Error validating pin closure:', error)
      throw error
    }

    return data
  }

  // Real-time subscriptions
  subscribeToProjectUpdates(projectId: string, callback: (payload: any) => void) {
    if (isDemoMode) return null

    return this.client
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roofs',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToRoofUpdates(roofId: string, callback: (payload: any) => void) {
    if (isDemoMode) return null

    return this.client
      .channel(`roof:${roofId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pins',
          filter: `roof_id=eq.${roofId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pin_children'
        },
        callback
      )
      .subscribe()
  }

  subscribeToChatUpdates(scope: Chat['scope'], scopeId: string | null, callback: (payload: any) => void) {
    if (isDemoMode) return null

    const filter = scopeId 
      ? `scope=eq.${scope}.and.scope_id=eq.${scopeId}`
      : `scope=eq.${scope}.and.scope_id=is.null`

    return this.client
      .channel(`chat:${scope}:${scopeId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter
        },
        callback
      )
      .subscribe()
  }

  // Demo data (for development/testing)
  private getDemoProjects(): Project[] {
    return [
      {
        project_id: 'demo-project-1',
        name: 'SmartPin Demo Project',
        status: 'InProgress',
        contractor: 'ACME Roofing',
        created_at: '2024-08-25T10:00:00Z',
        updated_at: '2024-08-25T10:00:00Z',
        created_by: 'demo-user'
      },
      {
        project_id: 'demo-project-2', 
        name: 'Downtown Construction Phase 1',
        status: 'Open',
        contractor: 'BuildRight Inc',
        created_at: '2024-08-20T09:00:00Z',
        updated_at: '2024-08-25T09:00:00Z',
        created_by: 'demo-user'
      }
    ]
  }

  private getDemoRoofs(): Roof[] {
    return [
      {
        id: 'roof-e1-demo',
        project_id: 'demo-project-1',
        code: 'E1',
        name: 'Demo Roof',
        building: 'FAB',
        plan_image_url: '/plans/e1.png',
        roof_plan_url: '/plans/e1.png',
        zones: ['Zone A', 'Zone B', 'Zone C'],
        stakeholders: {},
        origin_lat: null,
        origin_lng: null,
        is_active: true,
        created_at: '2024-08-25T10:00:00Z'
      }
    ]
  }

  private getDemoPins(): Pin[] {
    return [
      {
        id: 'demo-pin-1',
        roof_id: 'roof-e1-demo',
        seq_number: 1,
        zone: 'Zone A',
        x: 0.532,
        y: 0.417,
        status: 'Open',
        status_parent_manual: 'Open',
        group_count: 3,
        children_total: 3,
        children_open: 2,
        children_ready: 1,
        children_closed: 0,
        parent_mix_state: 'MIXED',
        opened_by: 'demo-user',
        opened_at: '2024-08-25T10:00:00Z',
        last_activity_at: '2024-08-25T14:30:00Z'
      }
    ]
  }

  private getDemoPinChildren(): PinChild[] {
    return [
      {
        child_id: 'demo-child-1',
        pin_id: 'demo-pin-1',
        child_code: '1.1',
        zone: 'Zone A',
        defect_type: 'TPO seam gap',
        severity: 'High',
        status_child: 'Open',
        due_date: '2024-09-01',
        open_date: '2024-08-25T10:00:00Z',
        closed_date: null,
        openpic_id: null,
        closurepic_id: null,
        notes: 'Gap near drain requiring immediate attention',
        created_at: '2024-08-25T10:00:00Z',
        updated_at: '2024-08-25T10:00:00Z'
      },
      {
        child_id: 'demo-child-2',
        pin_id: 'demo-pin-1',
        child_code: '1.2',
        zone: 'Zone A',
        defect_type: 'Adhesion issue',
        severity: 'Medium',
        status_child: 'ReadyForInspection',
        due_date: '2024-09-15',
        open_date: '2024-08-25T11:00:00Z',
        closed_date: null,
        openpic_id: null,
        closurepic_id: null,
        notes: 'Blister detected in membrane',
        created_at: '2024-08-25T11:00:00Z',
        updated_at: '2024-08-25T14:30:00Z'
      }
    ]
  }

  private getDemoChats(): Chat[] {
    return [
      {
        message_id: 'demo-chat-1',
        scope: 'global',
        scope_id: null,
        text: 'Welcome to SmartPin TPO! System is ready for quality management.',
        mentions: [],
        created_by: 'demo-user',
        created_at: '2024-08-25T10:00:00Z'
      },
      {
        message_id: 'demo-chat-2',
        scope: 'roof',
        scope_id: 'roof-e1-demo',
        text: 'Starting inspection on E1 Demo Roof. Found several issues that need attention.',
        mentions: [],
        created_by: 'demo-user',
        created_at: '2024-08-25T11:00:00Z'
      }
    ]
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()

// Utility functions for common operations
export const db = {
  projects: {
    list: () => supabaseService.getProjects(),
    getById: (id: string) => supabaseService.getProjectById(id),
    create: (project: ProjectInsert) => supabaseService.createProject(project)
  },
  
  roofs: {
    listByProject: (projectId: string) => supabaseService.getRoofsByProject(projectId),
    getById: (id: string) => supabaseService.getRoofById(id)
  },
  
  pins: {
    listByRoof: (roofId: string) => supabaseService.getPinsByRoof(roofId),
    getWithChildren: (pinId: string) => supabaseService.getPinWithChildren(pinId),
    create: (pin: PinInsert) => supabaseService.createPin(pin)
  },
  
  pinChildren: {
    create: (pinChild: PinChildInsert) => supabaseService.createPinChild(pinChild),
    updateStatus: (childId: string, status: PinChild['status_child']) => 
      supabaseService.updatePinChildStatus(childId, status)
  },
  
  photos: {
    upload: (photo: PhotoInsert) => supabaseService.uploadPhoto(photo),
    getByPin: (pinId: string) => supabaseService.getPhotosByPin(pinId),
    getByChild: (childId: string) => supabaseService.getPhotosByChild(childId),
    getAnalytics: (pinId?: string) => supabaseService.getPhotoAnalytics(pinId),
    getGlobalAnalytics: () => supabaseService.getGlobalAnalytics(),
    delete: (photoId: string) => supabaseService.deletePhoto(photoId)
  },
  
  chat: {
    getMessages: (scope: Chat['scope'], scopeId?: string) => 
      supabaseService.getChatMessages(scope, scopeId),
    send: (chat: ChatInsert) => supabaseService.sendChatMessage(chat),
    subscribe: (scope: Chat['scope'], scopeId: string | null, callback: (payload: any) => void) =>
      supabaseService.subscribeToChatUpdates(scope, scopeId, callback)
  },
  
  realtime: {
    subscribeToProject: (projectId: string, callback: (payload: any) => void) =>
      supabaseService.subscribeToProjectUpdates(projectId, callback),
    subscribeToRoof: (roofId: string, callback: (payload: any) => void) =>
      supabaseService.subscribeToRoofUpdates(roofId, callback)
  }
}