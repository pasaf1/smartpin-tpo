interface ExportablePin {
  id: string
  seq_number: number
  status: string | null
  issue_type?: string
  defect_type?: string
  defect_layer?: string
  severity?: number
  created_at: string
  closed_at?: string
  mttr_hours?: number
  x_position: number
  y_position: number
  created_by?: string
  updated_at?: string
  roof_name?: string
  project_name?: string
  contractor?: string
}

interface ExportableProject {
  id: string
  name: string
  status: string
  start_date?: string
  end_date?: string
  contractor?: string
  created_at: string
  total_pins?: number
  open_pins?: number
  closed_pins?: number
}

interface CSVExportOptions {
  includePhotos?: boolean
  includeTechnicalDetails?: boolean
  includeTimestamps?: boolean
  customFields?: string[]
  dateFormat?: 'ISO' | 'US' | 'EU'
}

export class CSVExporter {
  private readonly DEFAULT_OPTIONS: CSVExportOptions = {
    includePhotos: false,
    includeTechnicalDetails: true,
    includeTimestamps: true,
    customFields: [],
    dateFormat: 'US'
  }

  /**
   * Export pins to CSV format
   */
  exportPins(pins: ExportablePin[], filename?: string, options: CSVExportOptions = {}): void {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    // Define headers based on options
    const headers = this.getPinHeaders(opts)
    
    // Convert pins to rows
    const rows = pins.map(pin => this.pinToRow(pin, opts))
    
    // Generate CSV content
    const csvContent = this.generateCSV(headers, rows)
    
    // Download file
    const defaultFilename = `smartpin_issues_${new Date().toISOString().split('T')[0]}.csv`
    this.downloadCSV(csvContent, filename || defaultFilename)
  }

  /**
   * Export projects summary to CSV
   */
  exportProjects(projects: ExportableProject[], filename?: string, options: CSVExportOptions = {}): void {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    const headers = this.getProjectHeaders(opts)
    const rows = projects.map(project => this.projectToRow(project, opts))
    
    const csvContent = this.generateCSV(headers, rows)
    const defaultFilename = `smartpin_projects_${new Date().toISOString().split('T')[0]}.csv`
    
    this.downloadCSV(csvContent, filename || defaultFilename)
  }

  /**
   * Export detailed report with both projects and pins
   */
  exportDetailedReport(
    projects: ExportableProject[],
    pins: ExportablePin[],
    filename?: string,
    options: CSVExportOptions = {}
  ): void {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    // Create multiple sheets in one CSV (separated by empty rows)
    let csvContent = ''
    
    // Projects summary
    csvContent += 'PROJECTS SUMMARY\n'
    csvContent += this.generateCSV(this.getProjectHeaders(opts), 
                                   projects.map(p => this.projectToRow(p, opts)))
    
    csvContent += '\n\n'
    
    // Issues detail
    csvContent += 'ISSUES DETAIL\n'
    csvContent += this.generateCSV(this.getPinHeaders(opts),
                                   pins.map(p => this.pinToRow(p, opts)))
    
    // Analytics summary
    csvContent += '\n\n'
    csvContent += this.generateAnalyticsSummary(projects, pins)
    
    const defaultFilename = `smartpin_detailed_report_${new Date().toISOString().split('T')[0]}.csv`
    this.downloadCSV(csvContent, filename || defaultFilename)
  }

  /**
   * Export analytics data
   */
  exportAnalytics(
    data: {
      projects: ExportableProject[]
      pins: ExportablePin[]
      timeRange?: string
      filters?: Record<string, any>
    },
    filename?: string
  ): void {
    const analytics = this.generateAnalyticsData(data.projects, data.pins)
    
    // Create analytics CSV
    let csvContent = `SMARTPIN TPO ANALYTICS REPORT\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n`
    
    if (data.timeRange) {
      csvContent += `Time Range: ${data.timeRange}\n`
    }
    
    csvContent += '\n'
    
    // KPIs
    csvContent += 'KEY PERFORMANCE INDICATORS\n'
    csvContent += 'Metric,Value,Unit\n'
    Object.entries(analytics.kpis).forEach(([metric, value]) => {
      csvContent += `"${metric}","${value}","${(analytics.units as any)[metric] || ''}"\n`
    })
    
    csvContent += '\n'
    
    // Trends data
    csvContent += 'ISSUE TRENDS\n'
    csvContent += 'Category,Open,Ready to Inspect,Closed,In Dispute\n'
    Object.entries(analytics.trends).forEach(([category, counts]) => {
      csvContent += `"${category}","${counts.open}","${counts.ready}","${counts.closed}","${counts.dispute}"\n`
    })
    
    const defaultFilename = `smartpin_analytics_${new Date().toISOString().split('T')[0]}.csv`
    this.downloadCSV(csvContent, filename || defaultFilename)
  }

  private getPinHeaders(options: CSVExportOptions): string[] {
    const baseHeaders = [
      'ID',
      'Pin Number',
      'Status',
      'Issue Type',
      'Defect Type',
      'Defect Layer',
      'Severity',
      'Project',
      'Roof',
      'Contractor'
    ]

    if (options.includeTechnicalDetails) {
      baseHeaders.push(
        'X Position (%)',
        'Y Position (%)',
        'Created By'
      )
    }

    if (options.includeTimestamps) {
      baseHeaders.push(
        'Created Date',
        'Closed Date',
        'MTTR (hours)'
      )
    }

    if (options.includePhotos) {
      baseHeaders.push(
        'Has Opening Photo',
        'Has Closing Photo'
      )
    }

    if (options.customFields && options.customFields.length > 0) {
      baseHeaders.push(...options.customFields)
    }

    return baseHeaders
  }

  private getProjectHeaders(options: CSVExportOptions): string[] {
    const baseHeaders = [
      'ID',
      'Project Name',
      'Status',
      'Contractor',
      'Total Issues',
      'Open Issues',
      'Closed Issues'
    ]

    if (options.includeTimestamps) {
      baseHeaders.push(
        'Start Date',
        'End Date',
        'Created Date'
      )
    }

    return baseHeaders
  }

  private pinToRow(pin: ExportablePin, options: CSVExportOptions): string[] {
    const row = [
      pin.id,
      pin.seq_number.toString(),
      pin.status || 'Unknown',
      pin.issue_type || '',
      pin.defect_type || '',
      pin.defect_layer || '',
      pin.severity?.toString() || '',
      pin.project_name || '',
      pin.roof_name || '',
      pin.contractor || ''
    ]

    if (options.includeTechnicalDetails) {
      row.push(
        (pin.x_position * 100).toFixed(2),
        (pin.y_position * 100).toFixed(2),
        pin.created_by || ''
      )
    }

    if (options.includeTimestamps) {
      row.push(
        this.formatDate(pin.created_at, options.dateFormat),
        pin.closed_at ? this.formatDate(pin.closed_at, options.dateFormat) : '',
        pin.mttr_hours?.toString() || ''
      )
    }

    if (options.includePhotos) {
      // Note: In real implementation, you'd check if photos exist
      row.push('Yes', 'Yes') // Placeholder
    }

    if (options.customFields) {
      // Add placeholder values for custom fields
      options.customFields.forEach(() => row.push(''))
    }

    return row
  }

  private projectToRow(project: ExportableProject, options: CSVExportOptions): string[] {
    const row = [
      project.id,
      project.name,
      project.status,
      project.contractor || '',
      project.total_pins?.toString() || '0',
      project.open_pins?.toString() || '0',
      project.closed_pins?.toString() || '0'
    ]

    if (options.includeTimestamps) {
      row.push(
        project.start_date ? this.formatDate(project.start_date, options.dateFormat) : '',
        project.end_date ? this.formatDate(project.end_date, options.dateFormat) : '',
        this.formatDate(project.created_at, options.dateFormat)
      )
    }

    return row
  }

  private generateCSV(headers: string[], rows: string[][]): string {
    // Escape and quote fields that contain commas, quotes, or newlines
    const escapeField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    // Create header row
    const headerRow = headers.map(escapeField).join(',')
    
    // Create data rows
    const dataRows = rows.map(row => 
      row.map(field => escapeField(field.toString())).join(',')
    )

    return [headerRow, ...dataRows].join('\n')
  }

  private downloadCSV(content: string, filename: string): void {
    // Add UTF-8 BOM for proper Excel handling
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
    
    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    URL.revokeObjectURL(url)
  }

  private formatDate(dateString: string, format: CSVExportOptions['dateFormat'] = 'US'): string {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return ''
    }

    switch (format) {
      case 'ISO':
        return date.toISOString().split('T')[0]
      case 'EU':
        return date.toLocaleDateString('en-GB') // DD/MM/YYYY
      case 'US':
      default:
        return date.toLocaleDateString('en-US') // MM/DD/YYYY
    }
  }

  private generateAnalyticsSummary(projects: ExportableProject[], pins: ExportablePin[]): string {
    let summary = 'ANALYTICS SUMMARY\n'
    
    // Project stats
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status !== 'Completed').length
    
    // Pin stats
    const totalPins = pins.length
    const openPins = pins.filter(p => p.status === 'Open').length
    const closedPins = pins.filter(p => p.status === 'Closed').length
    const avgMTTR = pins
      .filter(p => p.mttr_hours && p.mttr_hours > 0)
      .reduce((sum, p) => sum + (p.mttr_hours || 0), 0) / 
      pins.filter(p => p.mttr_hours && p.mttr_hours > 0).length || 0

    summary += `Total Projects,${totalProjects}\n`
    summary += `Active Projects,${activeProjects}\n`
    summary += `Total Issues,${totalPins}\n`
    summary += `Open Issues,${openPins}\n`
    summary += `Closed Issues,${closedPins}\n`
    summary += `Completion Rate,${totalPins > 0 ? ((closedPins / totalPins) * 100).toFixed(1) : 0}%\n`
    summary += `Average MTTR,${avgMTTR > 0 ? avgMTTR.toFixed(1) : 'N/A'} hours\n`
    
    return summary
  }

  private generateAnalyticsData(projects: ExportableProject[], pins: ExportablePin[]) {
    const kpis = {
      'Total Projects': projects.length,
      'Active Projects': projects.filter(p => p.status !== 'Completed').length,
      'Total Issues': pins.length,
      'Open Issues': pins.filter(p => p.status === 'Open').length,
      'Ready to Inspect': pins.filter(p => p.status === 'ReadyToInspect').length,
      'Closed Issues': pins.filter(p => p.status === 'Closed').length,
      'In Dispute': pins.filter(p => p.status === 'InDispute').length,
      'Avg MTTR': pins.filter(p => p.mttr_hours).reduce((sum, p) => sum + (p.mttr_hours || 0), 0) / pins.filter(p => p.mttr_hours).length || 0
    }

    const units = {
      'Total Projects': 'count',
      'Active Projects': 'count',
      'Total Issues': 'count',
      'Open Issues': 'count',
      'Ready to Inspect': 'count',
      'Closed Issues': 'count',
      'In Dispute': 'count',
      'Avg MTTR': 'hours'
    }

    // Trends by issue type
    const trends = pins.reduce((acc, pin) => {
      const type = pin.issue_type || 'Unknown'
      if (!acc[type]) {
        acc[type] = { open: 0, ready: 0, closed: 0, dispute: 0 }
      }
      
      switch (pin.status) {
        case 'Open': acc[type].open++; break
        case 'ReadyToInspect': acc[type].ready++; break
        case 'Closed': acc[type].closed++; break
        case 'InDispute': acc[type].dispute++; break
        default: acc[type].open++; break // Treat null/unknown as Open
      }
      
      return acc
    }, {} as Record<string, { open: number; ready: number; closed: number; dispute: number }>)

    return { kpis, units, trends }
  }

  /**
   * Utility method to prepare pin data for export
   */
  static preparePinData(pins: any[], projects: any[], roofs: any[]): ExportablePin[] {
    return pins.map(pin => {
      const roof = roofs.find(r => r.id === pin.roof_id)
      const project = roof ? projects.find(p => p.id === roof.project_id) : undefined
      return {
        ...pin,
        project_name: project?.name || '',
        roof_name: roof?.name || '',
        contractor: project?.contractor || ''
      }
    })
  }

  /**
   * Utility method to prepare project data for export
   */
  static prepareProjectData(projects: any[], pins: any[], roofs: any[]): ExportableProject[] {
    return projects.map(project => {
      // Get all roofs for this project
      const projectRoofIds = roofs.filter(r => r.project_id === project.id).map(r => r.id)
      // Filter pins by roof_id
      const projectPins = pins.filter(p => projectRoofIds.includes(p.roof_id))
      return {
        ...project,
        total_pins: projectPins.length,
        open_pins: projectPins.filter(p => p.status === 'Open').length,
        closed_pins: projectPins.filter(p => p.status === 'Closed').length
      }
    })
  }
}