// Unified Chat Service with enhanced error handling
import { BaseService } from './BaseService'
import type { Chat, ChatInsert, ChatUpdate } from '../database.types'
import type { ChatWithAuthor } from '../types/relations'

export class ChatService extends BaseService {
  
  /**
   * Get chat messages with real-time capabilities
   */
  async getChatMessages(filters?: {
    scope?: 'global' | 'roof' | 'pin'
    scopeId?: string
    limit?: number
  }): Promise<ChatWithAuthor[]> {
    this.logOperation('getChatMessages', filters)

    let query = this.supabase
      .from('chats')
      .select(`
        *,
        author:users!chats_created_by_fkey (id, full_name, role)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.scope) {
      query = query.eq('scope', filters.scope)
    }
    if (filters?.scopeId) {
      query = query.eq('scope_id', filters.scopeId)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    return this.safeArrayOperation(
      async () => await query as any,
      'getChatMessages',
      'chats'
    )
  }

  /**
   * Send chat message
   */
  async sendMessage(data: {
    text: string
    scope: 'global' | 'roof' | 'pin'
    scopeId?: string
    mentions?: string[]
  }): Promise<Chat> {
    this.validateRequired(data, ['text', 'scope'])
    this.logOperation('sendMessage', {
      textLength: data.text.length,
      scope: data.scope,
      hasMentions: !!data.mentions?.length
    })

    const messageData: ChatInsert = {
      text: data.text.trim(),
      scope: data.scope,
      scope_id: data.scopeId || null,
      mentions: data.mentions || null
    }

    return this.safeOperation(
      async () => await this.supabase
        .from('chats')
        .insert(messageData)
        .select()
        .single(),
      'sendMessage',
      'chats'
    )
  }

  /**
   * Edit chat message
   */
  async editMessage(messageId: string, newText: string): Promise<Chat> {
    this.validateUUID(messageId, 'messageId')
    this.validateRequired({ text: newText }, ['text'])
    this.logOperation('editMessage', { messageId, textLength: newText.length })

    const updateData: ChatUpdate = {
      text: newText.trim()
    }

    return this.safeOperation(
      async () => await this.supabase
        .from('chats')
        .update(updateData)
        .eq('message_id', messageId)
        .select()
        .single(),
      'editMessage',
      'chats'
    )
  }

  /**
   * Delete chat message
   */
  async deleteMessage(messageId: string): Promise<void> {
    this.validateUUID(messageId, 'messageId')
    this.logOperation('deleteMessage', { messageId })

    await this.safeOperation(
      async () => await this.supabase
        .from('chats')
        .delete()
        .eq('message_id', messageId),
      'deleteMessage',
      'chats'
    )
  }

  /**
   * Get real-time chat subscription
   */
  subscribeToChat(
    callback: (payload: any) => void,
    filters?: {
      scope?: 'global' | 'roof' | 'pin'
      scopeId?: string
    }
  ) {
    this.logOperation('subscribeToChat', filters)

    let channel = this.supabase
      .channel('chat-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chats',
          filter: this.buildFilterString(filters)
        }, 
        callback
      )

    return channel.subscribe()
  }

  /**
   * Get chat statistics
   */
  async getChatStatistics(filters?: {
    scope?: 'global' | 'roof' | 'pin'
    scopeId?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalMessages: number
    messagesThisWeek: number
    activeUsers: number
    averageMessagesPerDay: number
  }> {
    this.logOperation('getChatStatistics', filters)

    let query = this.supabase
      .from('chats')
      .select('message_id, created_at, created_by')

    // Apply filters
    if (filters?.scope) {
      query = query.eq('scope', filters.scope)
    }
    if (filters?.scopeId) {
      query = query.eq('scope_id', filters.scopeId)
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const messages = await this.safeArrayOperation(
      async () => await query,
      'getChatStatistics',
      'chats'
    )

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const messagesThisWeek = messages.filter(m => 
      new Date(m.created_at) > weekAgo
    ).length

    const uniqueUsers = new Set(
      messages.map(m => m.created_by).filter(Boolean)
    ).size

    return {
      totalMessages: messages.length,
      messagesThisWeek,
      activeUsers: uniqueUsers,
      averageMessagesPerDay: messages.length / 7 // Rough calculation
    }
  }

  /**
   * Build filter string for real-time subscriptions
   */
  private buildFilterString(filters?: {
    scope?: 'global' | 'roof' | 'pin'
    scopeId?: string
  }): string {
    const conditions: string[] = []
    
    if (filters?.scope) {
      conditions.push(`scope=eq.${filters.scope}`)
    }
    if (filters?.scopeId) {
      conditions.push(`scope_id=eq.${filters.scopeId}`)
    }

    return conditions.length > 0 ? conditions.join('&') : ''
  }
}

// Export singleton instance
export const chatService = new ChatService()
