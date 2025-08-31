// Generated TypeScript types for the production SmartPin TPO database schema
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
      // Core Production Tables
      projects: {
        Row: {
          project_id: string
          name: string
          status: 'Open' | 'InProgress' | 'Completed'
          contractor: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id?: string
          name: string
          status?: 'Open' | 'InProgress' | 'Completed'
          contractor?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          project_id?: string
          name?: string
          status?: 'Open' | 'InProgress' | 'Completed'
          contractor?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "roofs_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          }
        ]
      }
      pins: {
        Row: {
          id: string
          roof_id: string
          seq_number: number
          zone: string | null
          x: number
          y: number
          status: 'Open' | 'ReadyForInspection' | 'Closed'
          status_parent_manual: 'Open' | 'ReadyForInspection' | 'Closed'
          group_count: number
          children_total: number
          children_open: number
          children_ready: number
          children_closed: number
          parent_mix_state: 'ALL_OPEN' | 'MIXED' | 'ALL_CLOSED' | null
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
          status?: 'Open' | 'ReadyForInspection' | 'Closed'
          status_parent_manual?: 'Open' | 'ReadyForInspection' | 'Closed'
          group_count?: number
          children_total?: number
          children_open?: number
          children_ready?: number
          children_closed?: number
          parent_mix_state?: 'ALL_OPEN' | 'MIXED' | 'ALL_CLOSED' | null
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
          status?: 'Open' | 'ReadyForInspection' | 'Closed'
          status_parent_manual?: 'Open' | 'ReadyForInspection' | 'Closed'
          group_count?: number
          children_total?: number
          children_open?: number
          children_ready?: number
          children_closed?: number
          parent_mix_state?: 'ALL_OPEN' | 'MIXED' | 'ALL_CLOSED' | null
          opened_by?: string | null
          opened_at?: string
          last_activity_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pins_roof_id_fkey"
            columns: ["roof_id"]
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_opened_by_fkey"
            columns: ["opened_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pin_children: {
        Row: {
          child_id: string
          pin_id: string
          child_code: string
          zone: string | null
          defect_type: string | null
          severity: 'Low' | 'Medium' | 'High' | 'Critical'
          status_child: 'Open' | 'ReadyForInspection' | 'Closed'
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
          severity?: 'Low' | 'Medium' | 'High' | 'Critical'
          status_child?: 'Open' | 'ReadyForInspection' | 'Closed'
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
          severity?: 'Low' | 'Medium' | 'High' | 'Critical'
          status_child?: 'Open' | 'ReadyForInspection' | 'Closed'
          due_date?: string | null
          open_date?: string
          closed_date?: string | null
          openpic_id?: string | null
          closurepic_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_children_pin_id_fkey"
            columns: ["pin_id"]
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_children_openpic_id_fkey"
            columns: ["openpic_id"]
            referencedRelation: "photos"
            referencedColumns: ["photo_id"]
          },
          {
            foreignKeyName: "pin_children_closurepic_id_fkey"
            columns: ["closurepic_id"]
            referencedRelation: "photos"
            referencedColumns: ["photo_id"]
          }
        ]
      }
      photos: {
        Row: {
          photo_id: string
          type: 'OpenPIC' | 'ClosurePIC'
          file_url_public: string
          uploaded_by: string | null
          uploaded_at: string
          project_id: string | null
          roof_id: string | null
          pin_id: string | null
          child_id: string | null
          file_name: string | null // חדש
          file_size: number | null // חדש
          upload_type: string | null // חדש
          thumbnail_url: string | null // חדש
          mime_type: string | null // חדש
          uploader: Json | null // חדש, אובייקט
          metadata: Json | null // חדש, אובייקט
        }
        Insert: {
          photo_id?: string
          type: 'OpenPIC' | 'ClosurePIC'
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
          type?: 'OpenPIC' | 'ClosurePIC'
          file_url_public?: string
          uploaded_by?: string | null
          uploaded_at?: string
          project_id?: string | null
          roof_id?: string | null
          pin_id?: string | null
          child_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "photos_roof_id_fkey"
            columns: ["roof_id"]
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_pin_id_fkey"
            columns: ["pin_id"]
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_child_id_fkey"
            columns: ["child_id"]
            referencedRelation: "pin_children"
            referencedColumns: ["child_id"]
          }
        ]
      }
      chats: {
        Row: {
          message_id: string
          scope: 'global' | 'roof' | 'pin'
          scope_id: string | null
          text: string | null
          mentions: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          message_id?: string
          scope: 'global' | 'roof' | 'pin'
          scope_id?: string | null
          text?: string | null
          mentions?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          message_id?: string
          scope?: 'global' | 'roof' | 'pin'
          scope_id?: string | null
          text?: string | null
          mentions?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          auth_user_id: string | null
          full_name: string
          email: string
          role: 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Viewer'
          address: string | null
          birth_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          full_name: string
          email: string
          role?: 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Viewer'
          address?: string | null
          birth_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          full_name?: string
          email?: string
          role?: 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Viewer'
          address?: string | null
          birth_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Legacy tables (maintained for backward compatibility during migration)
      pin_items: {
        Row: {
          id: string
          pin_id: string
          seq_suffix: number
          status: 'Open' | 'ReadyForInspection' | 'Closed'
          severity: 'Low' | 'Medium' | 'High' | 'Critical'
          defect_type: string | null
          defect_layer: string
          description: string | null
          cause: string | null
          corrective_action: string | null
          preventive_action: string | null
          contractor: string | null
          foreman: string | null
          opened_by: string | null
          opened_at: string
          sla_due_date: string | null
          closed_at: string | null
          last_activity_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          seq_suffix: number
          status?: 'Open' | 'ReadyForInspection' | 'Closed'
          severity?: 'Low' | 'Medium' | 'High' | 'Critical'
          defect_type?: string | null
          defect_layer: string
          description?: string | null
          cause?: string | null
          corrective_action?: string | null
          preventive_action?: string | null
          contractor?: string | null
          foreman?: string | null
          opened_by?: string | null
          opened_at?: string
          sla_due_date?: string | null
          closed_at?: string | null
          last_activity_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          seq_suffix?: number
          status?: 'Open' | 'ReadyForInspection' | 'Closed'
          severity?: 'Low' | 'Medium' | 'High' | 'Critical'
          defect_type?: string | null
          defect_layer?: string
          description?: string | null
          cause?: string | null
          corrective_action?: string | null
          preventive_action?: string | null
          contractor?: string | null
          foreman?: string | null
          opened_by?: string | null
          opened_at?: string
          sla_due_date?: string | null
          closed_at?: string | null
          last_activity_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_items_opened_by_fkey"
            columns: ["opened_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pin_images: {
        Row: {
          id: string
          pin_item_id: string
          kind: 'Open' | 'Close' | 'Extra'
          url: string
          uploaded_by: string | null
          uploaded_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          pin_item_id: string
          kind: 'Open' | 'Close' | 'Extra'
          url: string
          uploaded_by?: string | null
          uploaded_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          pin_item_id?: string
          kind?: 'Open' | 'Close' | 'Extra'
          url?: string
          uploaded_by?: string | null
          uploaded_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pin_images_pin_item_id_fkey"
            columns: ["pin_item_id"]
            referencedRelation: "pin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pin_chat: {
        Row: {
          id: string
          pin_item_id: string
          author_id: string | null
          message: string | null
          mentions: Json
          attachments: Json
          created_at: string
        }
        Insert: {
          id?: string
          pin_item_id: string
          author_id?: string | null
          message?: string | null
          mentions?: Json
          attachments?: Json
          created_at?: string
        }
        Update: {
          id?: string
          pin_item_id?: string
          author_id?: string | null
          message?: string | null
          mentions?: Json
          attachments?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_chat_pin_item_id_fkey"
            columns: ["pin_item_id"]
            referencedRelation: "pin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_chat_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          entity: string
          entity_id: string
          action: string
          actor_id: string | null
          diff: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          entity: string
          entity_id: string
          action: string
          actor_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          entity?: string
          entity_id?: string
          action?: string
          actor_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_prefs: {
        Row: {
          id: string
          user_id: string
          filter_settings: Json
          table_columns: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filter_settings?: Json
          table_columns?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filter_settings?: Json
          table_columns?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prefs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_pins_latest_activity: {
        Row: {
          pin_id: string | null
          latest_activity: string | null
        }
        Relationships: []
      }
      v_pin_items_with_parent: {
        Row: {
          id: string | null
          pin_id: string | null
          seq_suffix: number | null
          status: 'Open' | 'ReadyForInspection' | 'Closed' | null
          severity: 'Low' | 'Medium' | 'High' | 'Critical' | null
          defect_type: string | null
          defect_layer: string | null
          description: string | null
          cause: string | null
          corrective_action: string | null
          preventive_action: string | null
          contractor: string | null
          foreman: string | null
          opened_by: string | null
          opened_at: string | null
          sla_due_date: string | null
          closed_at: string | null
          last_activity_at: string | null
          parent_seq_number: number | null
          roof_id: string | null
          pin_zone: string | null
          pin_x: number | null
          pin_y: number | null
          roof_code: string | null
          roof_name: string | null
          building: string | null
          display_id: string | null
        }
        Relationships: []
      }
      v_parent_pin_status_summary: {
        Row: {
          pin_id: string | null
          children_total: number | null
          children_open: number | null
          children_ready: number | null
          children_closed: number | null
          completion_percentage: number | null
          can_be_closed: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_risk_matrix_data: {
        Args: {
          roof_id_param?: string | null
          filters?: Json
        }
        Returns: {
          defect_layer: string | null
          severity: string | null
          occurrence_count: number | null
          risk_score: number | null
        }[]
      }
      recompute_parent_aggregates: {
        Args: {
          p_pin: string
        }
        Returns: void
      }
      calculate_parent_pin_status: {
        Args: {
          child_pins: unknown
        }
        Returns: 'Open' | 'ReadyForInspection' | 'Closed'
      }
      validate_pin_closure: {
        Args: {
          pin_uuid: string
        }
        Returns: Json
      }
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

// Convenience type exports
export type ProjectStatus = Database['public']['Tables']['projects']['Row']['status']
export type PinStatus = Database['public']['Tables']['pins']['Row']['status']
export type Severity = Database['public']['Tables']['pin_children']['Row']['severity']
export type UserRole = Database['public']['Tables']['users']['Row']['role']
export type ChatScope = Database['public']['Tables']['chats']['Row']['scope']
export type PhotoType = Database['public']['Tables']['photos']['Row']['type']

// Table row types for convenience
export type Project = Database['public']['Tables']['projects']['Row']
export type Roof = Database['public']['Tables']['roofs']['Row']
export type Pin = Database['public']['Tables']['pins']['Row']
export type PinChild = Database['public']['Tables']['pin_children']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Chat = Database['public']['Tables']['chats']['Row']
export type User = Database['public']['Tables']['users']['Row']

// Insert types for convenience
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type RoofInsert = Database['public']['Tables']['roofs']['Insert']
export type PinInsert = Database['public']['Tables']['pins']['Insert']
export type PinChildInsert = Database['public']['Tables']['pin_children']['Insert']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']

// Update types for convenience
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type RoofUpdate = Database['public']['Tables']['roofs']['Update']
export type PinUpdate = Database['public']['Tables']['pins']['Update']
export type PinChildUpdate = Database['public']['Tables']['pin_children']['Update']
export type PhotoUpdate = Database['public']['Tables']['photos']['Update']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Unified Pin type with relations - single source of truth
export interface PinWithRelations extends Pin {
  // Optional UI fields for legacy compatibility
  title?: string | null
  description?: string | null
  severity?: Severity | null
  layer_id?: string | null
  
  // Child pin relationships (various naming patterns used across codebase)
  children?: PinChild[]
  child_pins?: PinChild[]
  pin_children?: PinChild[]
  
  // Parent relationship (for legacy compatibility)
  parent_id?: string | null
  
  // Photos relationship
  photos?: Photo[]
  
  // Additional UI fields for legacy components
  has_closure_photo?: boolean
  closure_photo_url?: string | null
  completed_at?: string | null
  
  // UI properties that extend the database fields
  seq?: string // for child pins compatibility
  open_pic_url?: string | null
  close_pic_url?: string | null
}

// Extended child pin type that includes both database fields and UI compatibility fields
export interface ChildPinWithUIFields extends PinChild {
  // UI compatibility fields that components expect
  id?: string // maps to child_id for components expecting this field
  parent_id?: string // maps to pin_id for components expecting this field
  seq?: string // maps to child_code for components expecting this field
  x?: number // UI positioning (not in database)
  y?: number // UI positioning (not in database)
  status?: PinStatus // maps to status_child for components expecting this field
  title?: string | null
  description?: string | null
  open_pic_url?: string | null // maps to openpic_id lookup
  close_pic_url?: string | null // maps to closurepic_id lookup
  metadata?: Record<string, any> // additional UI data
  defect_layer?: string // additional UI field
}

// Handler function type signatures for Pin interactions
export type PinClickHandler = (pin: PinWithRelations) => void
export type ChildPinClickHandler = (childPin: ChildPinWithUIFields, parentPin: PinWithRelations) => void
export type AddChildPinHandler = (parentPin: PinWithRelations, x?: number, y?: number) => void | Promise<void>
export type UpdateChildPinHandler = (childPin: ChildPinWithUIFields) => void
export type DeleteChildPinHandler = (childPinId: string) => void
export type StatusChangeHandler = (pinId: string, newStatus: PinStatus, isChild?: boolean) => void