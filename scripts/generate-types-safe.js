#!/usr/bin/env node

/**
 * Safe TypeScript Type Generation Script for SmartPin TPO
 * 
 * This script generates TypeScript types from Supabase with proper fallbacks
 * and error handling for both local and production environments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TYPES_FILE_PATH = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts');
const BACKUP_TYPES_PATH = path.join(__dirname, 'database.types.backup.ts');
const FALLBACK_TYPES_PATH = path.join(__dirname, 'database.types.fallback.ts');

// Production project ID from environment or default
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'vhtbinssqbzcjmbgkseo';

// Logging utility
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Create fallback types if they don't exist
function createFallbackTypes() {
  const fallbackContent = `// Fallback TypeScript types for SmartPin TPO
// Generated: ${new Date().toISOString()}

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
`;

  if (!fs.existsSync(FALLBACK_TYPES_PATH)) {
    fs.writeFileSync(FALLBACK_TYPES_PATH, fallbackContent);
    log('Created fallback types file');
  }
}

// Backup current types file
function backupCurrentTypes() {
  if (fs.existsSync(TYPES_FILE_PATH)) {
    try {
      const content = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
      fs.writeFileSync(BACKUP_TYPES_PATH, content);
      log('Backed up existing types file');
      return true;
    } catch (error) {
      log(`Failed to backup types: ${error.message}`, 'warn');
      return false;
    }
  }
  return false;
}

// Restore from backup
function restoreFromBackup() {
  if (fs.existsSync(BACKUP_TYPES_PATH)) {
    try {
      const content = fs.readFileSync(BACKUP_TYPES_PATH, 'utf8');
      fs.writeFileSync(TYPES_FILE_PATH, content);
      log('Restored types from backup');
      return true;
    } catch (error) {
      log(`Failed to restore from backup: ${error.message}`, 'warn');
      return false;
    }
  }
  return false;
}

// Use fallback types
function useFallbackTypes() {
  try {
    if (fs.existsSync(FALLBACK_TYPES_PATH)) {
      const content = fs.readFileSync(FALLBACK_TYPES_PATH, 'utf8');
      fs.writeFileSync(TYPES_FILE_PATH, content);
      log('Using fallback types');
      return true;
    }
  } catch (error) {
    log(`Failed to use fallback types: ${error.message}`, 'error');
  }
  return false;
}

// Try to generate types from local Supabase
function generateTypesLocal() {
  try {
    log('Attempting to generate types from local Supabase...');
    execSync('npx supabase gen types typescript --local > ' + TYPES_FILE_PATH, {
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });
    
    // Verify the generated file
    const content = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
    if (content.trim().length < 100) {
      throw new Error('Generated types file appears to be empty or invalid');
    }
    
    log('Successfully generated types from local Supabase');
    return true;
  } catch (error) {
    log(`Local type generation failed: ${error.message}`, 'warn');
    return false;
  }
}

// Try to generate types from production
function generateTypesProduction() {
  try {
    log('Attempting to generate types from production Supabase...');
    execSync(\`npx supabase gen types typescript --project-id \${PROJECT_ID} > \${TYPES_FILE_PATH}\`, {
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });
    
    // Verify the generated file
    const content = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
    if (content.trim().length < 100) {
      throw new Error('Generated types file appears to be empty or invalid');
    }
    
    log('Successfully generated types from production Supabase');
    return true;
  } catch (error) {
    log(\`Production type generation failed: \${error.message}\`, 'warn');
    return false;
  }
}

// Main execution
function main() {
  log('Starting safe TypeScript type generation...');
  
  // Create fallback types if needed
  createFallbackTypes();
  
  // Backup current types
  backupCurrentTypes();
  
  let success = false;
  
  // Strategy 1: Try local Supabase first
  if (!success) {
    success = generateTypesLocal();
  }
  
  // Strategy 2: Try production if local fails
  if (!success && PROJECT_ID) {
    success = generateTypesProduction();
  }
  
  // Strategy 3: Restore from backup if available
  if (!success) {
    log('Type generation failed, attempting to restore from backup...', 'warn');
    success = restoreFromBackup();
  }
  
  // Strategy 4: Use fallback types as last resort
  if (!success) {
    log('All generation methods failed, using fallback types...', 'warn');
    success = useFallbackTypes();
  }
  
  if (success) {
    log('TypeScript type generation completed successfully ✅');
    
    // Verify the final result
    try {
      const content = fs.readFileSync(TYPES_FILE_PATH, 'utf8');
      const lineCount = content.split('\\n').length;
      log(\`Generated types file contains \${lineCount} lines\`);
      
      // Check for key types
      const hasDatabase = content.includes('export interface Database');
      const hasTables = content.includes('Tables:');
      const hasEnums = content.includes('Enums:');
      
      if (hasDatabase && hasTables) {
        log('Types file contains expected Database interface ✅');
      } else {
        log('Warning: Types file may be missing expected content', 'warn');
      }
    } catch (error) {
      log(\`Warning: Could not verify types file: \${error.message}\`, 'warn');
    }
    
    process.exit(0);
  } else {
    log('❌ All type generation strategies failed', 'error');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(\`Uncaught exception: \${error.message}\`, 'error');
  
  // Try to use fallback as last resort
  if (useFallbackTypes()) {
    log('Emergency fallback types applied');
    process.exit(0);
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  log(\`Unhandled rejection at \${promise}: \${reason}\`, 'error');
});

// Run the main function
main();