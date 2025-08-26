'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'
import { format } from 'date-fns'
import type { ChatMessage } from '@/lib/hooks/useChat'
import type { User } from '@supabase/supabase-js'

// Export types
export interface ExportOptions {
  includeImages?: boolean
  includeAttachments?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  userFilter?: string[]
  messageType?: ('text' | 'mention' | 'attachment' | 'system')[]
}

export interface RoofExportData {
  roof: {
    id: string
    name: string
    description?: string
    project_name?: string
    project_number?: string
    location?: string
    created_at: string
    completion_percentage?: number
    total_pins?: number
    open_defects?: number
    critical_defects?: number
  }
  pins: Array<{
    id: string
    seq_number: number
    title: string
    description?: string
    status: string
    severity: string
    x_position: number
    y_position: number
    created_at: string
    created_by: string
  }>
  messages: ChatMessage[]
  users: User[]
}

// Utility functions
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
}

// Chat Messages Export
export class ChatExporter {
  static async exportToPDF(
    messages: ChatMessage[],
    roofName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    
    // Filter messages based on options
    let filteredMessages = messages
    
    if (options.dateRange) {
      filteredMessages = filteredMessages.filter(msg => {
        const msgDate = new Date(msg.created_at)
        return msgDate >= options.dateRange!.start && msgDate <= options.dateRange!.end
      })
    }
    
    if (options.userFilter && options.userFilter.length > 0) {
      filteredMessages = filteredMessages.filter(msg => 
        options.userFilter!.includes(msg.user_id)
      )
    }
    
    if (options.messageType && options.messageType.length > 0) {
      filteredMessages = filteredMessages.filter(msg => 
        options.messageType!.includes(msg.message_type)
      )
    }

    // Header
    doc.setFontSize(20)
    doc.text('SmartPin TPO - Chat Export', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text(`Roof: ${roofName}`, pageWidth / 2, 35, { align: 'center' })
    
    doc.setFontSize(10)
    const exportDate = format(new Date(), 'PPP p')
    doc.text(`Exported on: ${exportDate}`, pageWidth / 2, 45, { align: 'center' })
    
    // Stats
    doc.text(`Total Messages: ${filteredMessages.length}`, 15, 60)
    const uniqueUsers = new Set(filteredMessages.map(m => m.user_name)).size
    doc.text(`Participants: ${uniqueUsers}`, 15, 70)
    
    if (filteredMessages.length > 0) {
      const dateRange = `${format(new Date(filteredMessages[0].created_at), 'PP')} - ${format(new Date(filteredMessages[filteredMessages.length - 1].created_at), 'PP')}`
      doc.text(`Date Range: ${dateRange}`, 15, 80)
    }

    // Messages table
    const tableData = filteredMessages.map(msg => [
      format(new Date(msg.created_at), 'MM/dd/yyyy HH:mm'),
      msg.user_name,
      msg.message_type,
      msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : ''),
      msg.mentions ? `@${msg.mentions.length}` : '',
      msg.attachments ? msg.attachments.length.toString() : '0'
    ])

    autoTable(doc, {
      head: [['Time', 'User', 'Type', 'Message', 'Mentions', 'Files']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 80 },
        4: { cellWidth: 15 },
        5: { cellWidth: 10 }
      }
    })

    // Detailed messages on new pages
    if (options.includeImages || options.includeAttachments) {
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Detailed Messages', 15, 20)
      
      let yPosition = 40
      
      for (const msg of filteredMessages) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${msg.user_name} - ${format(new Date(msg.created_at), 'PPP p')}`, 15, yPosition)
        
        yPosition += 8
        doc.setFont('helvetica', 'normal')
        
        // Message content
        const splitContent = doc.splitTextToSize(msg.content, pageWidth - 30)
        doc.text(splitContent, 15, yPosition)
        yPosition += splitContent.length * 5 + 5
        
        // Attachments info
        if (msg.attachments && msg.attachments.length > 0) {
          doc.setFontSize(8)
          doc.text(`Attachments: ${msg.attachments.map(a => a.file_name).join(', ')}`, 15, yPosition)
          yPosition += 8
        }
        
        yPosition += 10 // Space between messages
      }
    }

    const filename = `${sanitizeFilename(roofName)}_chat_export_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
    doc.save(filename)
  }

  static async exportToCSV(
    messages: ChatMessage[],
    roofName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    // Filter messages (same logic as PDF)
    let filteredMessages = messages
    
    if (options.dateRange) {
      filteredMessages = filteredMessages.filter(msg => {
        const msgDate = new Date(msg.created_at)
        return msgDate >= options.dateRange!.start && msgDate <= options.dateRange!.end
      })
    }
    
    if (options.userFilter && options.userFilter.length > 0) {
      filteredMessages = filteredMessages.filter(msg => 
        options.userFilter!.includes(msg.user_id)
      )
    }

    const csvData = filteredMessages.map(msg => ({
      timestamp: format(new Date(msg.created_at), 'yyyy-MM-dd HH:mm:ss'),
      date: format(new Date(msg.created_at), 'yyyy-MM-dd'),
      time: format(new Date(msg.created_at), 'HH:mm:ss'),
      user_name: msg.user_name,
      user_id: msg.user_id,
      message_type: msg.message_type,
      content: msg.content,
      mentions_count: msg.mentions ? msg.mentions.length : 0,
      mentioned_users: msg.mentions ? msg.mentions.join(';') : '',
      attachments_count: msg.attachments ? msg.attachments.length : 0,
      attachment_names: msg.attachments ? msg.attachments.map(a => a.file_name).join(';') : '',
      reply_to: msg.reply_to || '',
      is_edited: msg.is_edited || false,
      updated_at: msg.updated_at || ''
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const filename = `${sanitizeFilename(roofName)}_chat_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    
    downloadFile(blob, filename)
  }
}

// Project Data Export
export class ProjectExporter {
  static async exportRoofToPDF(data: RoofExportData): Promise<void> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Header
    doc.setFontSize(20)
    doc.text('SmartPin TPO - Project Report', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(16)
    doc.text(data.roof.name, pageWidth / 2, 35, { align: 'center' })
    
    doc.setFontSize(12)
    if (data.roof.project_name) {
      doc.text(`Project: ${data.roof.project_name} (${data.roof.project_number})`, pageWidth / 2, 50, { align: 'center' })
    }
    
    doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, 60, { align: 'center' })

    // Project Summary
    doc.setFontSize(14)
    doc.text('Project Summary', 15, 80)
    
    let yPos = 95
    doc.setFontSize(10)
    
    const summaryData = [
      ['Location', data.roof.location || 'Not specified'],
      ['Completion', `${data.roof.completion_percentage || 0}%`],
      ['Total Pins', (data.roof.total_pins || 0).toString()],
      ['Open Defects', (data.roof.open_defects || 0).toString()],
      ['Critical Defects', (data.roof.critical_defects || 0).toString()],
      ['Created', format(new Date(data.roof.created_at), 'PPP')],
      ['Total Messages', data.messages.length.toString()],
      ['Team Members', data.users.length.toString()]
    ]

    summaryData.forEach(([label, value]) => {
      doc.text(`${label}:`, 15, yPos)
      doc.text(value, 80, yPos)
      yPos += 8
    })

    // Pins Summary
    if (data.pins.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Defect Pins Summary', 15, 20)

      const pinsTableData = data.pins.map(pin => [
        pin.seq_number.toString(),
        pin.title.substring(0, 40),
        pin.status,
        pin.severity,
        `${pin.x_position}, ${pin.y_position}`,
        format(new Date(pin.created_at), 'MM/dd/yy'),
        pin.created_by
      ])

      autoTable(doc, {
        head: [['#', 'Title', 'Status', 'Severity', 'Position', 'Created', 'By']],
        body: pinsTableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 },
          6: { cellWidth: 25 }
        }
      })
    }

    // Team Members
    if (data.users.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Team Members', 15, 20)

      const usersTableData = data.users.map(user => [
        user.user_metadata?.full_name || user.email,
        user.email,
        user.user_metadata?.role || 'User',
        user.confirmed_at ? 'Active' : 'Pending',
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MM/dd/yy') : 'Never'
      ])

      autoTable(doc, {
        head: [['Name', 'Email', 'Role', 'Status', 'Last Login']],
        body: usersTableData,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    }

    const filename = `${sanitizeFilename(data.roof.name)}_project_report_${format(new Date(), 'yyyyMMdd')}.pdf`
    doc.save(filename)
  }

  static async exportRoofToCSV(data: RoofExportData): Promise<void> {
    // Create separate CSV files for different data types
    const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
    const baseName = sanitizeFilename(data.roof.name)

    // Pins CSV
    if (data.pins.length > 0) {
      const pinsData = data.pins.map(pin => ({
        id: pin.id,
        seq_number: pin.seq_number,
        title: pin.title,
        description: pin.description || '',
        status: pin.status,
        severity: pin.severity,
        x_position: pin.x_position,
        y_position: pin.y_position,
        created_at: format(new Date(pin.created_at), 'yyyy-MM-dd HH:mm:ss'),
        created_by: pin.created_by
      }))

      const pinsCSV = Papa.unparse(pinsData)
      const pinsBlob = new Blob([pinsCSV], { type: 'text/csv;charset=utf-8;' })
      downloadFile(pinsBlob, `${baseName}_pins_${timestamp}.csv`)
    }

    // Messages CSV (if any)
    if (data.messages.length > 0) {
      await ChatExporter.exportToCSV(data.messages, data.roof.name)
    }

    // Project info CSV
    const projectData = [{
      roof_id: data.roof.id,
      name: data.roof.name,
      description: data.roof.description || '',
      project_name: data.roof.project_name || '',
      project_number: data.roof.project_number || '',
      location: data.roof.location || '',
      completion_percentage: data.roof.completion_percentage || 0,
      total_pins: data.roof.total_pins || 0,
      open_defects: data.roof.open_defects || 0,
      critical_defects: data.roof.critical_defects || 0,
      created_at: format(new Date(data.roof.created_at), 'yyyy-MM-dd HH:mm:ss'),
      export_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    }]

    const projectCSV = Papa.unparse(projectData)
    const projectBlob = new Blob([projectCSV], { type: 'text/csv;charset=utf-8;' })
    downloadFile(projectBlob, `${baseName}_project_info_${timestamp}.csv`)
  }
}

// Image Export Utilities
export class ImageExporter {
  static async captureElementAsPNG(
    elementId: string, 
    filename: string,
    options: {
      width?: number
      height?: number
      scale?: number
      backgroundColor?: string
    } = {}
  ): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    const canvas = await html2canvas(element, {
      width: options.width,
      height: options.height,
      scale: options.scale || 2,
      backgroundColor: options.backgroundColor || '#ffffff',
      useCORS: true,
      logging: false
    })

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, filename)
      }
    }, 'image/png')
  }

  static async captureCanvasWithPins(
    canvasElement: SVGSVGElement,
    roofName: string
  ): Promise<void> {
    const filename = `${sanitizeFilename(roofName)}_roof_plan_${format(new Date(), 'yyyyMMdd_HHmm')}.png`
    
    const canvas = await html2canvas(canvasElement.parentElement!, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    })

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, filename)
      }
    }, 'image/png')
  }
}

// Comprehensive Export Manager
export class ExportManager {
  static async exportComplete(
    data: RoofExportData,
    format: 'pdf' | 'csv' | 'both' = 'both',
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      if (format === 'pdf' || format === 'both') {
        await ProjectExporter.exportRoofToPDF(data)
        
        if (data.messages.length > 0) {
          await ChatExporter.exportToPDF(data.messages, data.roof.name, options)
        }
      }

      if (format === 'csv' || format === 'both') {
        await ProjectExporter.exportRoofToCSV(data)
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }
}