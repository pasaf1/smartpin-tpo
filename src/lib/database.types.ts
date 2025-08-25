export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Viewer'
export type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed'
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          full_name: string
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role: UserRole
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      roofs: {
        Row: {
          id: string
          name: string
          description: string | null
          building_id: string | null
          floor_number: number | null
          total_area: number | null
          completion_percentage: number
          pin_count: number
          open_pins: number
          ready_pins: number
          closed_pins: number
          critical_pins: number
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          building_id?: string | null
          floor_number?: number | null
          total_area?: number | null
          completion_percentage?: number
          pin_count?: number
          open_pins?: number
          ready_pins?: number
          closed_pins?: number
          critical_pins?: number
          created_at?: string
          updated_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          building_id?: string | null
          floor_number?: number | null
          total_area?: number | null
          completion_percentage?: number
          pin_count?: number
          open_pins?: number
          ready_pins?: number
          closed_pins?: number
          critical_pins?: number
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      pins: {
        Row: {
          id: string
          roof_id: string
          seq_number: number
          x_position: number
          y_position: number
          status: PinStatus
          title: string
          description: string | null
          severity: Severity
          group_count: number
          parent_pin_id: string | null
          created_at: string
          updated_at: string
          created_by: string
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          roof_id: string
          seq_number: number
          x_position: number
          y_position: number
          status?: PinStatus
          title: string
          description?: string | null
          severity: Severity
          group_count?: number
          parent_pin_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          roof_id?: string
          seq_number?: number
          x_position?: number
          y_position?: number
          status?: PinStatus
          title?: string
          description?: string | null
          severity?: Severity
          group_count?: number
          parent_pin_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
        }
      }
      pin_items: {
        Row: {
          id: string
          pin_id: string
          seq_number: number
          title: string
          description: string | null
          severity: Severity
          status: PinStatus
          created_at: string
          updated_at: string
          created_by: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          pin_id: string
          seq_number: number
          title: string
          description?: string | null
          severity: Severity
          status?: PinStatus
          created_at?: string
          updated_at?: string
          created_by?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          pin_id?: string
          seq_number?: number
          title?: string
          description?: string | null
          severity?: Severity
          status?: PinStatus
          created_at?: string
          updated_at?: string
          created_by?: string
          completed_at?: string | null
        }
      }
      pin_images: {
        Row: {
          id: string
          pin_id: string | null
          pin_item_id: string | null
          original_url: string
          annotated_url: string | null
          filename: string
          file_size: number
          mime_type: string
          annotations: Json | null
          is_primary: boolean
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          pin_id?: string | null
          pin_item_id?: string | null
          original_url: string
          annotated_url?: string | null
          filename: string
          file_size: number
          mime_type: string
          annotations?: Json | null
          is_primary?: boolean
          created_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          pin_id?: string | null
          pin_item_id?: string | null
          original_url?: string
          annotated_url?: string | null
          filename?: string
          file_size?: number
          mime_type?: string
          annotations?: Json | null
          is_primary?: boolean
          created_at?: string
          created_by?: string
        }
      }
      pin_chat: {
        Row: {
          id: string
          pin_id: string
          message: string
          mentions: string[] | null
          attachments: Json | null
          created_at: string
          created_by: string
          edited_at: string | null
          reply_to_id: string | null
        }
        Insert: {
          id?: string
          pin_id: string
          message: string
          mentions?: string[] | null
          attachments?: Json | null
          created_at?: string
          created_by?: string
          edited_at?: string | null
          reply_to_id?: string | null
        }
        Update: {
          id?: string
          pin_id?: string
          message?: string
          mentions?: string[] | null
          attachments?: Json | null
          created_at?: string
          created_by?: string
          edited_at?: string | null
          reply_to_id?: string | null
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          user_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          timestamp?: string
        }
      }
      user_prefs: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          notifications_enabled: boolean
          email_notifications: boolean
          mobile_notifications: boolean
          default_severity: Severity
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          mobile_notifications?: boolean
          default_severity?: Severity
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          mobile_notifications?: boolean
          default_severity?: Severity
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      pin_status: PinStatus
      severity: Severity
    }
  }
}