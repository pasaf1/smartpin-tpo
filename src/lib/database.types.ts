export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          diff: Json | null
          entity: string
          entity_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity: string
          entity_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          mentions: string[] | null
          message_id: string
          scope: string
          scope_id: string | null
          text: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          mentions?: string[] | null
          message_id?: string
          scope: string
          scope_id?: string | null
          text?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          mentions?: string[] | null
          message_id?: string
          scope?: string
          scope_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          child_id: string | null
          file_name: string | null
          file_size: number | null
          file_url_public: string
          metadata: Json | null
          mime_type: string | null
          photo_id: string
          pin_id: string | null
          project_id: string | null
          roof_id: string | null
          thumbnail_url: string | null
          type: string
          upload_type: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          uploader: Json | null
        }
        Insert: {
          child_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url_public: string
          metadata?: Json | null
          mime_type?: string | null
          photo_id?: string
          pin_id?: string | null
          project_id?: string | null
          roof_id?: string | null
          thumbnail_url?: string | null
          type: string
          upload_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploader?: Json | null
        }
        Update: {
          child_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url_public?: string
          metadata?: Json | null
          mime_type?: string | null
          photo_id?: string
          pin_id?: string | null
          project_id?: string | null
          roof_id?: string | null
          thumbnail_url?: string | null
          type?: string
          upload_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploader?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "pin_children"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "photos_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_parent_pin_status_summary"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "photos_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_pins_latest_activity"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "photos_roof_id_fkey"
            columns: ["roof_id"]
            isOneToOne: false
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_chat: {
        Row: {
          attachments: Json | null
          author_id: string | null
          created_at: string | null
          id: string
          mentions: Json | null
          message: string | null
          pin_item_id: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          created_at?: string | null
          id?: string
          mentions?: Json | null
          message?: string | null
          pin_item_id: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          created_at?: string | null
          id?: string
          mentions?: Json | null
          message?: string | null
          pin_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_chat_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_chat_pin_item_id_fkey"
            columns: ["pin_item_id"]
            isOneToOne: false
            referencedRelation: "pin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_chat_pin_item_id_fkey"
            columns: ["pin_item_id"]
            isOneToOne: false
            referencedRelation: "v_pin_items_with_parent"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_children: {
        Row: {
          child_code: string
          child_id: string
          closed_date: string | null
          closurepic_id: string | null
          created_at: string | null
          defect_type: string | null
          due_date: string | null
          notes: string | null
          open_date: string | null
          openpic_id: string | null
          pin_id: string
          severity: Database["public"]["Enums"]["severity"] | null
          status_child: Database["public"]["Enums"]["pin_status"] | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          child_code: string
          child_id?: string
          closed_date?: string | null
          closurepic_id?: string | null
          created_at?: string | null
          defect_type?: string | null
          due_date?: string | null
          notes?: string | null
          open_date?: string | null
          openpic_id?: string | null
          pin_id: string
          severity?: Database["public"]["Enums"]["severity"] | null
          status_child?: Database["public"]["Enums"]["pin_status"] | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          child_code?: string
          child_id?: string
          closed_date?: string | null
          closurepic_id?: string | null
          created_at?: string | null
          defect_type?: string | null
          due_date?: string | null
          notes?: string | null
          open_date?: string | null
          openpic_id?: string | null
          pin_id?: string
          severity?: Database["public"]["Enums"]["severity"] | null
          status_child?: Database["public"]["Enums"]["pin_status"] | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pin_children_closurepic"
            columns: ["closurepic_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["photo_id"]
          },
          {
            foreignKeyName: "fk_pin_children_openpic"
            columns: ["openpic_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["photo_id"]
          },
          {
            foreignKeyName: "pin_children_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_children_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_parent_pin_status_summary"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "pin_children_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_pins_latest_activity"
            referencedColumns: ["pin_id"]
          },
        ]
      }
      pin_images: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["image_kind"]
          metadata: Json | null
          pin_item_id: string
          uploaded_at: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          id?: string
          kind: Database["public"]["Enums"]["image_kind"]
          metadata?: Json | null
          pin_item_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["image_kind"]
          metadata?: Json | null
          pin_item_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_images_pin_item_id_fkey"
            columns: ["pin_item_id"]
            isOneToOne: false
            referencedRelation: "pin_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_images_pin_item_id_fkey"
            columns: ["pin_item_id"]
            isOneToOne: false
            referencedRelation: "v_pin_items_with_parent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_items: {
        Row: {
          cause: string | null
          closed_at: string | null
          contractor: string | null
          corrective_action: string | null
          defect_layer: string | null
          defect_type: string | null
          description: string | null
          foreman: string | null
          id: string
          last_activity_at: string | null
          opened_at: string | null
          opened_by: string | null
          pin_id: string
          preventive_action: string | null
          seq_suffix: number
          severity: Database["public"]["Enums"]["severity"] | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["pin_status"] | null
        }
        Insert: {
          cause?: string | null
          closed_at?: string | null
          contractor?: string | null
          corrective_action?: string | null
          defect_layer?: string | null
          defect_type?: string | null
          description?: string | null
          foreman?: string | null
          id?: string
          last_activity_at?: string | null
          opened_at?: string | null
          opened_by?: string | null
          pin_id: string
          preventive_action?: string | null
          seq_suffix: number
          severity?: Database["public"]["Enums"]["severity"] | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["pin_status"] | null
        }
        Update: {
          cause?: string | null
          closed_at?: string | null
          contractor?: string | null
          corrective_action?: string | null
          defect_layer?: string | null
          defect_type?: string | null
          description?: string | null
          foreman?: string | null
          id?: string
          last_activity_at?: string | null
          opened_at?: string | null
          opened_by?: string | null
          pin_id?: string
          preventive_action?: string | null
          seq_suffix?: number
          severity?: Database["public"]["Enums"]["severity"] | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["pin_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_items_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_parent_pin_status_summary"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_pins_latest_activity"
            referencedColumns: ["pin_id"]
          },
        ]
      }
      pins: {
        Row: {
          children_closed: number | null
          children_open: number | null
          children_ready: number | null
          children_total: number | null
          group_count: number | null
          id: string
          last_activity_at: string | null
          opened_at: string | null
          opened_by: string | null
          parent_mix_state: string | null
          roof_id: string
          seq_number: number
          status: Database["public"]["Enums"]["pin_status"] | null
          status_parent_manual: Database["public"]["Enums"]["pin_status"] | null
          x: number
          y: number
          zone: string | null
        }
        Insert: {
          children_closed?: number | null
          children_open?: number | null
          children_ready?: number | null
          children_total?: number | null
          group_count?: number | null
          id?: string
          last_activity_at?: string | null
          opened_at?: string | null
          opened_by?: string | null
          parent_mix_state?: string | null
          roof_id: string
          seq_number: number
          status?: Database["public"]["Enums"]["pin_status"] | null
          status_parent_manual?:
            | Database["public"]["Enums"]["pin_status"]
            | null
          x: number
          y: number
          zone?: string | null
        }
        Update: {
          children_closed?: number | null
          children_open?: number | null
          children_ready?: number | null
          children_total?: number | null
          group_count?: number | null
          id?: string
          last_activity_at?: string | null
          opened_at?: string | null
          opened_by?: string | null
          parent_mix_state?: string | null
          roof_id?: string
          seq_number?: number
          status?: Database["public"]["Enums"]["pin_status"] | null
          status_parent_manual?:
            | Database["public"]["Enums"]["pin_status"]
            | null
          x?: number
          y?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pins_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_roof_id_fkey"
            columns: ["roof_id"]
            isOneToOne: false
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          contractor: string | null
          created_at: string | null
          created_by: string | null
          name: string
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contractor?: string | null
          created_at?: string | null
          created_by?: string | null
          name: string
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contractor?: string | null
          created_at?: string | null
          created_by?: string | null
          name?: string
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roofs: {
        Row: {
          building: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          origin_lat: number | null
          origin_lng: number | null
          plan_image_url: string | null
          project_id: string
          roof_plan_url: string | null
          stakeholders: Json | null
          zones: Json | null
        }
        Insert: {
          building?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          origin_lat?: number | null
          origin_lng?: number | null
          plan_image_url?: string | null
          project_id: string
          roof_plan_url?: string | null
          stakeholders?: Json | null
          zones?: Json | null
        }
        Update: {
          building?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          origin_lat?: number | null
          origin_lng?: number | null
          plan_image_url?: string | null
          project_id?: string
          roof_plan_url?: string | null
          stakeholders?: Json | null
          zones?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "roofs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      user_prefs: {
        Row: {
          created_at: string | null
          filter_settings: Json | null
          id: string
          table_columns: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_settings?: Json | null
          id?: string
          table_columns?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_settings?: Json | null
          id?: string
          table_columns?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          auth_user_id: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["role"] | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["role"] | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      v_parent_pin_status_summary: {
        Row: {
          can_be_closed: boolean | null
          children_closed: number | null
          children_open: number | null
          children_ready: number | null
          children_total: number | null
          completion_percentage: number | null
          pin_id: string | null
        }
        Insert: {
          can_be_closed?: never
          children_closed?: number | null
          children_open?: number | null
          children_ready?: number | null
          children_total?: number | null
          completion_percentage?: never
          pin_id?: string | null
        }
        Update: {
          can_be_closed?: never
          children_closed?: number | null
          children_open?: number | null
          children_ready?: number | null
          children_total?: number | null
          completion_percentage?: never
          pin_id?: string | null
        }
        Relationships: []
      }
      v_pin_items_with_parent: {
        Row: {
          building: string | null
          cause: string | null
          closed_at: string | null
          contractor: string | null
          corrective_action: string | null
          defect_layer: string | null
          defect_type: string | null
          description: string | null
          display_id: string | null
          foreman: string | null
          id: string | null
          last_activity_at: string | null
          opened_at: string | null
          opened_by: string | null
          parent_seq_number: number | null
          pin_id: string | null
          pin_x: number | null
          pin_y: number | null
          pin_zone: string | null
          preventive_action: string | null
          roof_code: string | null
          roof_id: string | null
          roof_name: string | null
          seq_suffix: number | null
          severity: Database["public"]["Enums"]["severity"] | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["pin_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_items_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_parent_pin_status_summary"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "pin_items_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "v_pins_latest_activity"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "pins_roof_id_fkey"
            columns: ["roof_id"]
            isOneToOne: false
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pins_latest_activity: {
        Row: {
          latest_activity: string | null
          pin_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_parent_pin_status: {
        Args: { child_pins: Json }
        Returns: Database["public"]["Enums"]["pin_status"]
      }
      get_risk_matrix_data: {
        Args: { filters?: Json; roof_id_param?: string }
        Returns: {
          defect_layer: string
          occurrence_count: number
          risk_score: number
          severity: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recompute_parent_aggregates: {
        Args: { p_pin: string }
        Returns: undefined
      }
      validate_pin_closure: {
        Args: { pin_uuid: string }
        Returns: Json
      }
    }
    Enums: {
      defect_layer:
        | "VaporBarrier"
        | "InsulationBoards"
        | "DensDeck"
        | "TPO_Membrane"
        | "Seams"
        | "Flashing"
        | "Drains"
        | "Curbs"
      image_kind: "Open" | "Close" | "Extra"
      pin_status: "Open" | "ReadyForInspection" | "Closed"
      role: "Admin" | "QA_Manager" | "Supervisor" | "Foreman" | "Viewer"
      severity: "Low" | "Medium" | "High" | "Critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      defect_layer: [
        "VaporBarrier",
        "InsulationBoards",
        "DensDeck",
        "TPO_Membrane",
        "Seams",
        "Flashing",
        "Drains",
        "Curbs",
      ],
      image_kind: ["Open", "Close", "Extra"],
      pin_status: ["Open", "ReadyForInspection", "Closed"],
      role: ["Admin", "QA_Manager", "Supervisor", "Foreman", "Viewer"],
      severity: ["Low", "Medium", "High", "Critical"],
    },
  },
} as const

// Re-export relation types and handlers
export type { PinWithRelations, IssueRowStatus } from './types/relations'
export type { ChildPinWithUIFields, PinClickHandler, AddChildPinHandler, UpdateChildPinHandler, DeleteChildPinHandler, StatusChangeHandler } from './types/handlers'
// TablesInsert is already exported above at line 920
