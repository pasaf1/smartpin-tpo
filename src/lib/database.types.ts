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
      annotations: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          layer_id: string
          roof_id: string
          style: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          layer_id: string
          roof_id: string
          style?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          layer_id?: string
          roof_id?: string
          style?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_roof_id_fkey"
            columns: ["roof_id"]
            isOneToOne: false
            referencedRelation: "roofs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      child_pins: {
        Row: {
          close_pic_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          open_pic_url: string | null
          parent_id: string
          seq: string
          severity: string | null
          status: string
          title: string | null
          updated_at: string | null
          x: number
          y: number
          zone: string | null
        }
        Insert: {
          close_pic_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          open_pic_url?: string | null
          parent_id: string
          seq: string
          severity?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          x: number
          y: number
          zone?: string | null
        }
        Update: {
          close_pic_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          open_pic_url?: string | null
          parent_id?: string
          seq?: string
          severity?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          x?: number
          y?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_pins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_pins_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_pins_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_parent_pin_status_summary"
            referencedColumns: ["pin_id"]
          },
          {
            foreignKeyName: "child_pins_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_pins_latest_activity"
            referencedColumns: ["pin_id"]
          },
        ]
      }
      layers: {
        Row: {
          created_at: string | null
          id: string
          locked: boolean | null
          name: string
          opacity: number | null
          roof_id: string
          settings: Json | null
          type: string
          updated_at: string | null
          visible: boolean | null
          write_roles: string[] | null
          z_index: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          locked?: boolean | null
          name?: string
          opacity?: number | null
          roof_id: string
          settings?: Json | null
          type?: string
          updated_at?: string | null
          visible?: boolean | null
          write_roles?: string[] | null
          z_index?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          locked?: boolean | null
          name?: string
          opacity?: number | null
          roof_id?: string
          settings?: Json | null
          type?: string
          updated_at?: string | null
          visible?: boolean | null
          write_roles?: string[] | null
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "layers_roof_id_fkey"
            columns: ["roof_id"]
            isOneToOne: false
            referencedRelation: "roofs"
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
          layer_id: string
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
          layer_id: string
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
          layer_id?: string
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
            foreignKeyName: "pins_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
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
      plan_regions: {
        Row: {
          allowed_tools: string[]
          color: string | null
          created_at: string | null
          id: string
          layer_id: string | null
          name: string
          polygon: unknown
          roof_id: string
        }
        Insert: {
          allowed_tools?: string[]
          color?: string | null
          created_at?: string | null
          id?: string
          layer_id?: string | null
          name?: string
          polygon?: unknown
          roof_id: string
        }
        Update: {
          allowed_tools?: string[]
          color?: string | null
          created_at?: string | null
          id?: string
          layer_id?: string | null
          name?: string
          polygon?: unknown
          roof_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_regions_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_regions_roof_id_fkey"
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
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
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
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
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_parent_pin_status: {
        Args: { child_pins: Json }
        Returns: Database["public"]["Enums"]["pin_status"]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
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
        Args: never
        Returns: Database["public"]["Enums"]["role"]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      recompute_parent_aggregates: {
        Args: { p_pin: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_pin_closure: { Args: { pin_uuid: string }; Returns: Json }
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
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
