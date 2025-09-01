// Fallback TypeScript types for SmartPin TPO
// Generated: 2025-09-01T05:52:44.996Z

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          full_name: string
          email: string
          role: UserRole
          address: string | null
          birth_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          full_name: string
          email: string
          role?: UserRole
          address?: string | null
          birth_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          full_name?: string
          email?: string
          role?: UserRole
          address?: string | null
          birth_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          project_id: string
          name: string
          status: string
          contractor: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id?: string
          name: string
          status?: string
          contractor?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          project_id?: string
          name?: string
          status?: string
          contractor?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      roofs: {
        Row: {
          id: string
          project_id: string
          code: string
          name: string
          building: string | null
          plan_image_url: string | null
          roof_plan_url: string | null
          zones: Json
          stakeholders: Json
          origin_lat: number | null
          origin_lng: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          code: string
          name: string
          building?: string | null
          plan_image_url?: string | null
          roof_plan_url?: string | null
          zones?: Json
          stakeholders?: Json
          origin_lat?: number | null
          origin_lng?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          code?: string
          name?: string
          building?: string | null
          plan_image_url?: string | null
          roof_plan_url?: string | null
          zones?: Json
          stakeholders?: Json
          origin_lat?: number | null
          origin_lng?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pins: {
        Row: {
          id: string
          roof_id: string
          seq_number: number
          zone: string | null
          x: number
          y: number
          status: PinStatus
          status_parent_manual: PinStatus
          group_count: number
          children_total: number
          children_open: number
          children_ready: number
          children_closed: number
          parent_mix_state: string | null
          layer_id: string
          opened_by: string | null
          opened_at: string
          last_activity_at: string
        }
        Insert: {
          id?: string
          roof_id: string
          seq_number: number
          zone?: string | null
          x: number
          y: number
          status?: PinStatus
          status_parent_manual?: PinStatus
          group_count?: number
          children_total?: number
          children_open?: number
          children_ready?: number
          children_closed?: number
          parent_mix_state?: string | null
          layer_id: string
          opened_by?: string | null
          opened_at?: string
          last_activity_at?: string
        }
        Update: {
          id?: string
          roof_id?: string
          seq_number?: number
          zone?: string | null
          x?: number
          y?: number
          status?: PinStatus
          status_parent_manual?: PinStatus
          group_count?: number
          children_total?: number
          children_open?: number
          children_ready?: number
          children_closed?: number
          parent_mix_state?: string | null
          layer_id?: string
          opened_by?: string | null
          opened_at?: string
          last_activity_at?: string
        }
        Relationships: []
      }
      pin_children: {
        Row: {
          child_id: string
          pin_id: string
          child_code: string
          zone: string | null
          defect_type: string | null
          severity: Severity
          status_child: PinStatus
          due_date: string | null
          open_date: string
          closed_date: string | null
          openpic_id: string | null
          closurepic_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          child_id?: string
          pin_id: string
          child_code: string
          zone?: string | null
          defect_type?: string | null
          severity?: Severity
          status_child?: PinStatus
          due_date?: string | null
          open_date?: string
          closed_date?: string | null
          openpic_id?: string | null
          closurepic_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          pin_id?: string
          child_code?: string
          zone?: string | null
          defect_type?: string | null
          severity?: Severity
          status_child?: PinStatus
          due_date?: string | null
          open_date?: string
          closed_date?: string | null
          openpic_id?: string | null
          closurepic_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          photo_id: string
          type: string
          file_url_public: string
          uploaded_by: string | null
          uploaded_at: string
          project_id: string | null
          roof_id: string | null
          pin_id: string | null
          child_id: string | null
          file_name: string | null
          file_size: number | null
          upload_type: string | null
          thumbnail_url: string | null
          mime_type: string | null
          uploader: Json | null
          metadata: Json | null
        }
        Insert: {
          photo_id?: string
          type: string
          file_url_public: string
          uploaded_by?: string | null
          uploaded_at?: string
          project_id?: string | null
          roof_id?: string | null
          pin_id?: string | null
          child_id?: string | null
          file_name?: string | null
          file_size?: number | null
          upload_type?: string | null
          thumbnail_url?: string | null
          mime_type?: string | null
          uploader?: Json | null
          metadata?: Json | null
        }
        Update: {
          photo_id?: string
          type?: string
          file_url_public?: string
          uploaded_by?: string | null
          uploaded_at?: string
          project_id?: string | null
          roof_id?: string | null
          pin_id?: string | null
          child_id?: string | null
          file_name?: string | null
          file_size?: number | null
          upload_type?: string | null
          thumbnail_url?: string | null
          mime_type?: string | null
          uploader?: Json | null
          metadata?: Json | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          message_id: string
          scope: string
          scope_id: string | null
          text: string | null
          mentions: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          message_id?: string
          scope: string
          scope_id?: string | null
          text?: string | null
          mentions?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          message_id?: string
          scope?: string
          scope_id?: string | null
          text?: string | null
          mentions?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      layers: {
        Row: {
          id: string
          roof_id: string
          name: string
          type: string
          visible: boolean
          locked: boolean
          z_index: number
          opacity: number
          write_roles: string[]
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          roof_id: string
          name?: string
          type?: string
          visible?: boolean
          locked?: boolean
          z_index?: number
          opacity?: number
          write_roles?: string[]
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          roof_id?: string
          name?: string
          type?: string
          visible?: boolean
          locked?: boolean
          z_index?: number
          opacity?: number
          write_roles?: string[]
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role: 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Viewer'
      pin_status: 'Open' | 'ReadyForInspection' | 'Closed'
      severity: 'Low' | 'Medium' | 'High' | 'Critical'
      image_kind: 'Open' | 'Close' | 'Extra'
      defect_layer: 'VaporBarrier' | 'InsulationBoards' | 'DensDeck' | 'TPO_Membrane' | 'Seams' | 'Flashing' | 'Drains' | 'Curbs'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type UserRole = Database['public']['Enums']['role']
export type PinStatus = Database['public']['Enums']['pin_status']
export type Severity = Database['public']['Enums']['severity']
export type ImageKind = Database['public']['Enums']['image_kind']
export type DefectLayer = Database['public']['Enums']['defect_layer']

// Table types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Roof = Database['public']['Tables']['roofs']['Row']
export type RoofInsert = Database['public']['Tables']['roofs']['Insert']
export type RoofUpdate = Database['public']['Tables']['roofs']['Update']

export type Pin = Database['public']['Tables']['pins']['Row']
export type PinInsert = Database['public']['Tables']['pins']['Insert']
export type PinUpdate = Database['public']['Tables']['pins']['Update']

export type PinChild = Database['public']['Tables']['pin_children']['Row']
export type PinChildInsert = Database['public']['Tables']['pin_children']['Insert']
export type PinChildUpdate = Database['public']['Tables']['pin_children']['Update']

export type Photo = Database['public']['Tables']['photos']['Row']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type PhotoUpdate = Database['public']['Tables']['photos']['Update']

export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']

export type Layer = Database['public']['Tables']['layers']['Row']
export type LayerInsert = Database['public']['Tables']['layers']['Insert']
export type LayerUpdate = Database['public']['Tables']['layers']['Update']

// Extended types for frontend use
export interface PinWithRelations extends Pin {
  children?: PinChild[]
  child_pins?: PinChild[]
  pin_children?: PinChild[]
  parent_id?: string | null
  status_child?: PinStatus
  photos?: Photo[]
  layer?: Layer
}

export interface RoofWithPins extends Roof {
  pins?: PinWithRelations[]
  layers?: Layer[]
}

export interface ProjectWithRoofs extends Project {
  roofs?: RoofWithPins[]
}

// Chat message types with extended fields
export interface ChatMessage extends Chat {
  author?: User
  attachments?: any[]
  reactions?: any[]
}

// Dashboard analytics types
export interface ProjectStats {
  totalRoofs: number
  totalPins: number
  totalIssues: number
  pinStatus: {
    open: number
    ready: number
    closed: number
  }
  issueStatus: {
    open: number
    ready: number
    closed: number
  }
  severityBreakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
  completionRate: number
  lastActivity: string | null
}

// Activity timeline types
export interface ActivityItem {
  entityType: string
  entityId: string
  entityName: string
  action: string
  createdAt: string
  actorId: string
  actorName: string
  details: Json
}

// Export default database type
export default Database
