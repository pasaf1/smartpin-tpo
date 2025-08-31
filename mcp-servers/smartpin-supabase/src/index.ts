#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

interface PinData {
  roof_id: string
  x: number
  y: number
  seq_number?: number
  zone?: string
  issue_type?: string
  defect_type?: string
  defect_layer?: string
  severity?: string
}

interface PhotoUpload {
  pin_id: string
  child_id?: string
  photo_type: 'opening' | 'closing'
  file_data: string // base64 encoded
  file_name: string
}

class SmartPinMCPServer {
  private server: Server
  private supabase: SupabaseClient

  constructor() {
    this.server = new Server(
      { name: 'smartpin-supabase', version: '1.0.0' },
      { capabilities: { tools: {} } }
    )

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    this.setupToolHandlers()
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_pin',
            description: 'Create a new pin with spatial validation',
            inputSchema: {
              type: 'object',
              properties: {
                roof_id: { type: 'string', description: 'UUID of the roof' },
                x: { type: 'number', description: 'X coordinate (0-1 normalized)' },
                y: { type: 'number', description: 'Y coordinate (0-1 normalized)' },
                seq_number: { type: 'number', description: 'Sequence number (optional)' },
                zone: { type: 'string', description: 'Zone identifier (optional)' },
                issue_type: { type: 'string', description: 'Type of issue' },
                defect_type: { type: 'string', description: 'Specific defect type' },
                defect_layer: { 
                  type: 'string', 
                  enum: ['VaporBarrier', 'InsulationBoards', 'DensDeck', 'TPO_Membrane', 'Seams', 'Flashing', 'Drains', 'Curbs'],
                  description: 'Layer where defect is found' 
                },
                severity: { 
                  type: 'string',
                  enum: ['Low', 'Medium', 'High', 'Critical'],
                  description: 'Severity level'
                }
              },
              required: ['roof_id', 'x', 'y']
            }
          },
          {
            name: 'upload_photo',
            description: 'Upload a photo for a pin or pin child',
            inputSchema: {
              type: 'object',
              properties: {
                pin_id: { type: 'string', description: 'UUID of the pin' },
                child_id: { type: 'string', description: 'UUID of the pin child (optional)' },
                photo_type: { 
                  type: 'string',
                  enum: ['opening', 'closing'],
                  description: 'Type of photo'
                },
                file_data: { type: 'string', description: 'Base64 encoded image data' },
                file_name: { type: 'string', description: 'Original filename' }
              },
              required: ['pin_id', 'photo_type', 'file_data', 'file_name']
            }
          },
          {
            name: 'find_nearby_pins',
            description: 'Find pins within a specified radius',
            inputSchema: {
              type: 'object',
              properties: {
                roof_id: { type: 'string', description: 'UUID of the roof' },
                x: { type: 'number', description: 'X coordinate (0-1 normalized)' },
                y: { type: 'number', description: 'Y coordinate (0-1 normalized)' },
                radius_meters: { type: 'number', description: 'Search radius in meters', default: 10 }
              },
              required: ['roof_id', 'x', 'y']
            }
          },
          {
            name: 'update_pin_status',
            description: 'Update the status of a pin',
            inputSchema: {
              type: 'object',
              properties: {
                pin_id: { type: 'string', description: 'UUID of the pin' },
                status: {
                  type: 'string',
                  enum: ['Open', 'ReadyForInspection', 'Closed'],
                  description: 'New status'
                }
              },
              required: ['pin_id', 'status']
            }
          },
          {
            name: 'get_pin_analytics',
            description: 'Get analytics and statistics for pins',
            inputSchema: {
              type: 'object',
              properties: {
                roof_id: { type: 'string', description: 'UUID of the roof (optional)' },
                project_id: { type: 'string', description: 'UUID of the project (optional)' },
                time_range: { 
                  type: 'string',
                  enum: ['day', 'week', 'month', 'all'],
                  description: 'Time range for analytics'
                }
              }
            }
          },
          {
            name: 'create_pin_child',
            description: 'Create a child issue for an existing pin',
            inputSchema: {
              type: 'object',
              properties: {
                pin_id: { type: 'string', description: 'UUID of the parent pin' },
                child_code: { type: 'string', description: 'Child identifier code' },
                defect_type: { type: 'string', description: 'Type of defect' },
                severity: { 
                  type: 'string',
                  enum: ['Low', 'Medium', 'High', 'Critical'],
                  description: 'Severity level'
                },
                notes: { type: 'string', description: 'Additional notes' },
                due_date: { type: 'string', description: 'Due date in ISO format' }
              },
              required: ['pin_id', 'child_code']
            }
          },
          {
            name: 'search_pins',
            description: 'Search pins with various filters',
            inputSchema: {
              type: 'object',
              properties: {
                roof_id: { type: 'string', description: 'UUID of the roof' },
                status: { 
                  type: 'string',
                  enum: ['Open', 'ReadyForInspection', 'Closed']
                },
                severity: { 
                  type: 'string',
                  enum: ['Low', 'Medium', 'High', 'Critical']
                },
                defect_layer: { type: 'string' },
                zone: { type: 'string' },
                created_after: { type: 'string', description: 'ISO date string' },
                created_before: { type: 'string', description: 'ISO date string' },
                limit: { type: 'number', default: 50 }
              },
              required: ['roof_id']
            }
          },
          {
            name: 'get_spatial_summary',
            description: 'Get spatial summary and statistics for a roof',
            inputSchema: {
              type: 'object',
              properties: {
                roof_id: { type: 'string', description: 'UUID of the roof' }
              },
              required: ['roof_id']
            }
          }
        ] as Tool[]
      }
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'create_pin':
            return await this.createPin(args as PinData)

          case 'upload_photo':
            return await this.uploadPhoto(args as PhotoUpload)

          case 'find_nearby_pins':
            return await this.findNearbyPins(args)

          case 'update_pin_status':
            return await this.updatePinStatus(args)

          case 'get_pin_analytics':
            return await this.getPinAnalytics(args)

          case 'create_pin_child':
            return await this.createPinChild(args)

          case 'search_pins':
            return await this.searchPins(args)

          case 'get_spatial_summary':
            return await this.getSpatialSummary(args)

          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        }
      }
    })
  }

  private async createPin(data: PinData) {
    const { data: result, error } = await this.supabase
      .rpc('create_pin_with_spatial_validation', {
        p_roof_id: data.roof_id,
        p_x: data.x,
        p_y: data.y,
        p_seq_number: data.seq_number || null,
        p_zone: data.zone || null,
        p_severity: data.severity || 'Medium'
      })

    if (error) {
      throw new Error(`Failed to create pin: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Pin created successfully: ${JSON.stringify(result, null, 2)}`
        }
      ]
    }
  }

  private async uploadPhoto(data: PhotoUpload) {
    // Decode base64 data
    const fileBuffer = Buffer.from(data.file_data, 'base64')
    
    // Generate storage path
    const timestamp = Date.now()
    const extension = data.file_name.split('.').pop() || 'jpg'
    const storagePath = data.child_id 
      ? `pins/${data.pin_id}/children/${data.child_id}/${data.photo_type}_${timestamp}.${extension}`
      : `pins/${data.pin_id}/${data.photo_type}_${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data: uploadResult, error: uploadError } = await this.supabase.storage
      .from('pin-photos')
      .upload(storagePath, fileBuffer, {
        contentType: `image/${extension}`,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('pin-photos')
      .getPublicUrl(storagePath)

    // Update pin/child record with photo URL
    const updateData = {
      [`${data.photo_type}pic_id`]: uploadResult.path,
      updated_at: new Date().toISOString()
    }

    if (data.child_id) {
      const { error: updateError } = await this.supabase
        .from('pin_children')
        .update(updateData)
        .eq('child_id', data.child_id)

      if (updateError) {
        throw new Error(`Failed to update child pin: ${updateError.message}`)
      }
    } else {
      // Update photos table
      const { error: photoError } = await this.supabase
        .from('photos')
        .insert({
          type: data.photo_type === 'opening' ? 'OpenPIC' : 'ClosurePIC',
          file_url_public: urlData.publicUrl,
          pin_id: data.pin_id,
          child_id: data.child_id || null,
          file_name: data.file_name,
          file_size: fileBuffer.length,
          mime_type: `image/${extension}`
        })

      if (photoError) {
        throw new Error(`Failed to create photo record: ${photoError.message}`)
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Photo uploaded successfully: ${urlData.publicUrl}`
        }
      ]
    }
  }

  private async findNearbyPins(args: any) {
    const { data, error } = await this.supabase
      .rpc('find_nearby_pins', {
        p_roof_id: args.roof_id,
        p_x: args.x,
        p_y: args.y,
        p_radius_meters: args.radius_meters || 10
      })

    if (error) {
      throw new Error(`Failed to find nearby pins: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${data?.length || 0} nearby pins:\n${JSON.stringify(data, null, 2)}`
        }
      ]
    }
  }

  private async updatePinStatus(args: any) {
    const { data, error } = await this.supabase
      .from('pins')
      .update({
        status: args.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', args.pin_id)
      .select()

    if (error) {
      throw new Error(`Failed to update pin status: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Pin status updated to ${args.status}: ${JSON.stringify(data, null, 2)}`
        }
      ]
    }
  }

  private async getPinAnalytics(args: any) {
    let query = this.supabase.from('pins').select(`
      id,
      status,
      severity,
      zone,
      opened_at,
      pin_children(status_child)
    `)

    if (args.roof_id) {
      query = query.eq('roof_id', args.roof_id)
    }

    if (args.time_range && args.time_range !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (args.time_range) {
        case 'day':
          startDate.setDate(now.getDate() - 1)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
      }
      
      query = query.gte('opened_at', startDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`)
    }

    // Calculate analytics
    const analytics = {
      total_pins: data?.length || 0,
      status_breakdown: data?.reduce((acc, pin) => {
        acc[pin.status] = (acc[pin.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      severity_breakdown: data?.reduce((acc, pin) => {
        acc[pin.severity] = (acc[pin.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      zone_breakdown: data?.reduce((acc, pin) => {
        const zone = pin.zone || 'unassigned'
        acc[zone] = (acc[zone] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      time_range: args.time_range || 'all'
    }

    return {
      content: [
        {
          type: 'text',
          text: `Pin Analytics:\n${JSON.stringify(analytics, null, 2)}`
        }
      ]
    }
  }

  private async createPinChild(args: any) {
    const { data, error } = await this.supabase
      .from('pin_children')
      .insert({
        pin_id: args.pin_id,
        child_code: args.child_code,
        defect_type: args.defect_type,
        severity: args.severity || 'Medium',
        notes: args.notes,
        due_date: args.due_date ? new Date(args.due_date).toISOString() : null
      })
      .select()

    if (error) {
      throw new Error(`Failed to create pin child: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Pin child created successfully: ${JSON.stringify(data, null, 2)}`
        }
      ]
    }
  }

  private async searchPins(args: any) {
    let query = this.supabase
      .from('pins')
      .select(`
        *,
        pin_children(*),
        photos(*)
      `)
      .eq('roof_id', args.roof_id)

    if (args.status) query = query.eq('status', args.status)
    if (args.zone) query = query.eq('zone', args.zone)
    if (args.created_after) query = query.gte('opened_at', args.created_after)
    if (args.created_before) query = query.lte('opened_at', args.created_before)
    
    query = query.limit(args.limit || 50)

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to search pins: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${data?.length || 0} pins:\n${JSON.stringify(data, null, 2)}`
        }
      ]
    }
  }

  private async getSpatialSummary(args: any) {
    const { data, error } = await this.supabase
      .rpc('get_region_statistics', {
        p_roof_id: args.roof_id
      })

    if (error) {
      throw new Error(`Failed to get spatial summary: ${error.message}`)
    }

    return {
      content: [
        {
          type: 'text',
          text: `Spatial Summary:\n${JSON.stringify(data, null, 2)}`
        }
      ]
    }
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('SmartPin Supabase MCP Server running on stdio')
  }
}

// Start the server
const server = new SmartPinMCPServer()
server.start().catch((error) => {
  console.error('Server failed to start:', error)
  process.exit(1)
})