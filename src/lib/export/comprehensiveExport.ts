// Comprehensive Data Export & Reporting System
// Generates detailed reports and exports data in multiple formats

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as Papa from 'papaparse'
import { getSupabaseClient } from '@/lib/supabase/client'

// Export format types
export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json' | 'html'

// Report types
export type ReportType = 
  | 'project_summary'
  | 'quality_assessment'
  | 'issue_tracking'
  | 'inspection_report'
  | 'progress_report'
  | 'analytics_dashboard'
  | 'audit_trail'
  | 'photo_inventory'
  | 'compliance_report'
  | 'performance_metrics'

// Export options interface
export interface ExportOptions {
  format: ExportFormat
  reportType: ReportType
  filters?: {
    projectId?: string
    roofId?: string
    dateRange?: { start: Date; end: Date }
    status?: string[]
    userId?: string
  }
  includePhotos?: boolean
  includeCharts?: boolean
  customFields?: string[]
  branding?: {
    companyName?: string
    logo?: string
    colors?: { primary: string; secondary: string }
  }
}

// Data structures for reports
interface ProjectData {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
  roofs: RoofData[]
  pins: PinData[]
  photos: PhotoData[]
  chats: ChatData[]
  progress?: {
    total_pins: number
    open_pins: number
    in_progress_pins: number
    resolved_pins: number
    closed_pins: number
    completion_percentage: number
  }
}

interface RoofData {
  id: string
  name: string
  area: number
  pin_count: number
  status_distribution: Record<string, number>
  quality_score?: number
}

interface PinData {
  id: string
  title: string
  description: string
  status: string
  severity: string
  location: { x: number; y: number }
  created_at: string
  updated_at: string
  resolved_at?: string
  photos: PhotoData[]
  comments_count: number
}

interface PhotoData {
  id: string
  url: string
  filename: string
  size: number
  created_at: string
  metadata?: Record<string, any>
}

interface ChatData {
  id: string
  message: string
  user_name: string
  created_at: string
}

// Main export manager class
export class DataExportManager {
  private supabase = getSupabaseClient()

  // Public export method
  async exportData(options: ExportOptions): Promise<Blob | string> {
    try {
      // Fetch data based on filters
      const data = await this.fetchReportData(options)
      
      // Generate report based on format
      switch (options.format) {
        case 'pdf':
          return await this.generatePDF(data, options)
        case 'csv':
          return this.generateCSV(data, options)
        case 'excel':
          return await this.generateExcel(data, options)
        case 'json':
          return this.generateJSON(data, options)
        case 'html':
          return this.generateHTML(data, options)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Fetch data from Supabase based on filters
  private async fetchReportData(options: ExportOptions): Promise<ProjectData[]> {
    let query = this.supabase
      .from('projects')
      .select(`
        *,
        roofs (*),
        pins (*),
        photos (*),
        chats (*)
      `)

    // Apply filters
    if (options.filters?.projectId) {
      query = query.eq('id', options.filters.projectId)
    }

    if (options.filters?.dateRange) {
      query = query
        .gte('created_at', options.filters.dateRange.start.toISOString())
        .lte('created_at', options.filters.dateRange.end.toISOString())
    }

    if (options.filters?.status) {
      query = query.in('status', options.filters.status as any)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch data: ${error.message}`)
    }

    // Process and enrich data
    return this.processReportData(data || [], options)
  }

  // Process and calculate metrics for the report data
  private processReportData(rawData: any[], options: ExportOptions): ProjectData[] {
    return rawData.map(project => {
      const pins = project.pins || []
      const roofs = project.roofs || []
      
      // Calculate progress metrics
      const progress = {
        total_pins: pins.length,
        open_pins: pins.filter((p: any) => p.status === 'Open').length,
        in_progress_pins: pins.filter((p: any) => p.status === 'In Progress').length,
        resolved_pins: pins.filter((p: any) => p.status === 'Resolved').length,
        closed_pins: pins.filter((p: any) => p.status === 'Closed').length,
        completion_percentage: pins.length > 0 
          ? Math.round((pins.filter((p: any) => p.status === 'Closed').length / pins.length) * 100)
          : 0
      }

      // Process roofs with metrics
      const processedRoofs = roofs.map((roof: any) => {
        const roofPins = pins.filter((p: any) => p.roof_id === roof.id)
        const statusDistribution = roofPins.reduce((acc: any, pin: any) => {
          acc[pin.status] = (acc[pin.status] || 0) + 1
          return acc
        }, {})

        return {
          ...roof,
          pin_count: roofPins.length,
          status_distribution: statusDistribution,
          quality_score: this.calculateQualityScore(roofPins)
        }
      })

      return {
        ...project,
        roofs: processedRoofs,
        pins,
        progress
      }
    })
  }

  // Calculate quality score based on pin statuses and severity
  private calculateQualityScore(pins: any[]): number {
    if (pins.length === 0) return 100

    const weights = {
      'Critical': 0.4,
      'Major': 0.3,
      'Minor': 0.2,
      'Low': 0.1
    }

    const statusMultipliers = {
      'Open': 0,
      'In Progress': 0.3,
      'Resolved': 0.7,
      'Closed': 1.0
    }

    const totalWeight = pins.reduce((sum, pin) => {
      const weight = weights[pin.severity as keyof typeof weights] || 0.2
      const multiplier = statusMultipliers[pin.status as keyof typeof statusMultipliers] || 0
      return sum + (weight * multiplier)
    }, 0)

    const maxWeight = pins.reduce((sum, pin) => {
      return sum + (weights[pin.severity as keyof typeof weights] || 0.2)
    }, 0)

    return Math.round((totalWeight / maxWeight) * 100)
  }

  // Generate PDF report
  private async generatePDF(data: ProjectData[], options: ExportOptions): Promise<Blob> {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('SmartPin TPO Quality Report', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Report metadata
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
    doc.text(`Report Type: ${options.reportType}`, pageWidth / 2, yPosition + 5, { align: 'center' })
    yPosition += 25

    // Process each project
    for (const project of data) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Project header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Project: ${project.name}`, 20, yPosition)
      yPosition += 10

      // Project summary
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const summaryText = [
        `Status: ${project.status}`,
        `Created: ${new Date(project.created_at).toLocaleDateString()}`,
        `Total Pins: ${project.progress?.total_pins || 0}`,
        `Completion: ${project.progress?.completion_percentage || 0}%`
      ]
      
      summaryText.forEach((line, index) => {
        doc.text(line, 20, yPosition + (index * 5))
      })
      yPosition += 30

      // Pins table
      if (project.pins && project.pins.length > 0) {
        const tableData = project.pins.map(pin => [
          pin.title.substring(0, 30) + (pin.title.length > 30 ? '...' : ''),
          pin.status,
          pin.severity,
          new Date(pin.created_at).toLocaleDateString()
        ])

        ;(doc as any).autoTable({
          head: [['Pin', 'Status', 'Severity', 'Created']],
          body: tableData,
          startY: yPosition,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [71, 85, 105] }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      }

      // Roofs summary
      if (project.roofs && project.roofs.length > 0) {
        yPosition += 10
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Roof Summary', 20, yPosition)
        yPosition += 10

        const roofTableData = project.roofs.map(roof => [
          roof.name || roof.id.substring(0, 8),
          roof.pin_count.toString(),
          `${roof.quality_score || 0}%`,
          roof.area ? `${roof.area} sq ft` : 'N/A'
        ])

        ;(doc as any).autoTable({
          head: [['Roof', 'Pins', 'Quality Score', 'Area']],
          body: roofTableData,
          startY: yPosition,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [71, 85, 105] }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 20
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  // Generate CSV export
  private generateCSV(data: ProjectData[], options: ExportOptions): string {
    const csvData: any[] = []

    // Flatten data for CSV
    data.forEach(project => {
      if (options.reportType === 'project_summary') {
        csvData.push({
          project_id: project.id,
          project_name: project.name,
          project_status: project.status,
          created_date: new Date(project.created_at).toLocaleDateString(),
          total_pins: project.progress?.total_pins || 0,
          open_pins: project.progress?.open_pins || 0,
          closed_pins: project.progress?.closed_pins || 0,
          completion_percentage: project.progress?.completion_percentage || 0
        })
      } else if (options.reportType === 'issue_tracking') {
        project.pins.forEach(pin => {
          csvData.push({
            project_id: project.id,
            project_name: project.name,
            pin_id: pin.id,
            pin_title: pin.title,
            pin_description: pin.description,
            pin_status: pin.status,
            pin_severity: pin.severity,
            created_date: new Date(pin.created_at).toLocaleDateString(),
            updated_date: new Date(pin.updated_at).toLocaleDateString(),
            resolved_date: pin.resolved_at ? new Date(pin.resolved_at).toLocaleDateString() : '',
            photo_count: pin.photos?.length || 0,
            comments_count: pin.comments_count || 0
          })
        })
      }
    })

    return Papa.unparse(csvData)
  }

  // Generate Excel export (using CSV format with Excel MIME type)
  private async generateExcel(data: ProjectData[], options: ExportOptions): Promise<Blob> {
    const csvContent = this.generateCSV(data, options)
    return new Blob([csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  }

  // Generate JSON export
  private generateJSON(data: ProjectData[], options: ExportOptions): string {
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        export_type: options.reportType,
        filters: options.filters,
        total_projects: data.length
      },
      projects: data
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Generate HTML report
  private generateHTML(data: ProjectData[], options: ExportOptions): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartPin TPO Quality Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        .metadata { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .project { border: 1px solid #e2e8f0; margin-bottom: 20px; border-radius: 6px; overflow: hidden; }
        .project-header { background: #64748b; color: white; padding: 15px; }
        .project-content { padding: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status-open { background: #fef2f2; color: #dc2626; }
        .status-closed { background: #f0fdf4; color: #16a34a; }
        .status-in-progress { background: #fffbeb; color: #d97706; }
        .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-fill { background: #10b981; height: 100%; transition: width 0.3s; }
        .metric { display: inline-block; margin-right: 20px; }
        .metric-value { font-size: 18px; font-weight: bold; color: #1e293b; }
        .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <h1>SmartPin TPO Quality Report</h1>
        
        <div class="metadata">
            <strong>Generated:</strong> ${new Date().toLocaleDateString()} | 
            <strong>Report Type:</strong> ${options.reportType} | 
            <strong>Total Projects:</strong> ${data.length}
        </div>

        ${data.map(project => `
            <div class="project">
                <div class="project-header">
                    <h2 style="margin: 0; color: white;">${project.name}</h2>
                    <div style="margin-top: 5px; font-size: 14px; opacity: 0.9;">
                        Created: ${new Date(project.created_at).toLocaleDateString()} | 
                        Status: ${project.status}
                    </div>
                </div>
                
                <div class="project-content">
                    <div style="display: flex; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                        <div class="metric">
                            <div class="metric-value">${project.progress?.total_pins || 0}</div>
                            <div class="metric-label">Total Pins</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${project.progress?.closed_pins || 0}</div>
                            <div class="metric-label">Resolved</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${project.progress?.completion_percentage || 0}%</div>
                            <div class="metric-label">Complete</div>
                        </div>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress?.completion_percentage || 0}%"></div>
                    </div>

                    ${project.pins && project.pins.length > 0 ? `
                        <h3>Recent Issues</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Issue</th>
                                    <th>Status</th>
                                    <th>Severity</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${project.pins.slice(0, 10).map(pin => `
                                    <tr>
                                        <td>${pin.title}</td>
                                        <td><span class="status-badge status-${pin.status.toLowerCase().replace(' ', '-')}">${pin.status}</span></td>
                                        <td>${pin.severity}</td>
                                        <td>${new Date(pin.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No pins found for this project.</p>'}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`

    return html
  }

  // Download helper function
  static downloadFile(content: Blob | string, filename: string, format: ExportFormat) {
    let blob: Blob

    if (content instanceof Blob) {
      blob = content
    } else {
      const mimeTypes = {
        csv: 'text/csv',
        json: 'application/json',
        html: 'text/html',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf'
      }
      blob = new Blob([content], { type: mimeTypes[format] })
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Batch export multiple formats
  async batchExport(options: ExportOptions, formats: ExportFormat[]): Promise<void> {
    const data = await this.fetchReportData(options)
    const timestamp = new Date().toISOString().split('T')[0]
    
    for (const format of formats) {
      const content = await this.exportData({ ...options, format })
      const filename = `smartpin-report-${timestamp}.${format}`
      DataExportManager.downloadFile(content, filename, format)
    }
  }
}

// Export manager instance
export const dataExportManager = new DataExportManager()

// Utility functions for common export scenarios
export const exportUtils = {
  // Quick project summary export
  exportProjectSummary: async (projectId?: string, format: ExportFormat = 'pdf') => {
    return dataExportManager.exportData({
      format,
      reportType: 'project_summary',
      ...(projectId ? { filters: { projectId } } : {}),
      includePhotos: false,
      includeCharts: true
    })
  },

  // Quick issue tracking export
  exportIssueTracking: async (filters?: ExportOptions['filters'], format: ExportFormat = 'csv') => {
    return dataExportManager.exportData({
      format,
      reportType: 'issue_tracking',
      ...(filters ? { filters } : {}),
      includePhotos: false
    })
  },

  // Quality assessment report
  exportQualityAssessment: async (projectId: string, format: ExportFormat = 'pdf') => {
    return dataExportManager.exportData({
      format,
      reportType: 'quality_assessment',
      filters: { projectId },
      includePhotos: true,
      includeCharts: true
    })
  },

  // Generate filename with timestamp
  generateFilename: (reportType: string, format: ExportFormat) => {
    const timestamp = new Date().toISOString().split('T')[0]
    return `smartpin-${reportType}-${timestamp}.${format}`
  }
}