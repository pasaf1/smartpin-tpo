'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CSVExporter } from '@/lib/export/CSVExporter'
import { PDFExporter } from '@/lib/export/PDFExporter'
import { ActivityLogger } from '@/lib/activity/ActivityLogger'
import type { PinWithRelations } from '@/lib/database.types'

// Define PinChild type locally (must match database schema)
interface PinChild {
  child_id: string
  child_code: string | null
  defect_type: string | null
  created_at: string | null
}

interface ExportOptions {
  includePhotos?: boolean
  includeTechnicalDetails?: boolean
  includeTimestamps?: boolean
  dateFormat?: 'ISO' | 'US' | 'EU'
  projectName?: string
  contractorName?: string
  companyLogo?: string
}

interface UseExportProps {
  projectId?: string
  roofId?: string
  activityLogger?: ActivityLogger
}

export function useExport({ projectId, roofId, activityLogger }: UseExportProps = {}) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Fetch project data for exports
  const { data: projectData } = useQuery({
    queryKey: ['export-project', projectId],
    queryFn: async () => {
      if (!projectId) return null
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          roofs (
            id,
            name,
            pins (
              *,
              pin_children (*)
            )
          )
        `)
        .eq('id', projectId)
        .single()
        
      if (error) throw error
      return data
    },
    enabled: !!projectId
  })

  // Fetch roof-specific data
  const { data: roofData } = useQuery({
    queryKey: ['export-roof', roofId],
    queryFn: async () => {
      if (!roofId) return null
      
      const { data, error } = await supabase
        .from('roofs')
        .select(`
          *,
          project:projects(*),
          pins (
            *,
            pin_children (*)
          )
        `)
        .eq('id', roofId)
        .single()
        
      if (error) throw error
      return data
    },
    enabled: !!roofId
  })

  // Helper function to convert severity string to number
  const getSeverityNumber = (severity: string | null | undefined): number | undefined => {
    if (!severity) return undefined
    switch (severity) {
      case 'Low': return 1
      case 'Medium': return 2
      case 'High': return 3
      case 'Critical': return 4
      default: return undefined
    }
  }

  // Prepare pin data for export
  const preparePinData = useCallback((pins: PinWithRelations[], includeChildren = true) => {
    return pins.map(pin => {
      const projectInfo = projectData || roofData?.project
      const roofInfo = roofData || projectData?.roofs?.find(r => r.id === pin['roof_id'])
      
      // Calculate MTTR if closed
      let mttrHours = undefined
      if (pin.status === 'Closed' && (pin as any).created_at && (pin as any).updated_at) {
        const created = new Date((pin as any).created_at)
        const closed = new Date((pin as any).updated_at)
        mttrHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
      }

      const severity = getSeverityNumber((pin as any).severity)
      const roofName = roofInfo?.name
      const projectName = projectInfo?.name
      const contractor = projectInfo?.contractor

      return {
        id: pin.id,
        seq_number: pin.seq_number,
        status: pin.status ?? 'Open',
        issue_type: (pin as any).issue_type,
        defect_type: (pin as any).defect_type,
        defect_layer: (pin as any).defect_layer,
        ...(severity !== undefined ? { severity } : {}),
        created_at: (pin as any).created_at,
        closed_at: pin.status === 'Closed' ? (pin as any).updated_at : undefined,
        ...(mttrHours !== undefined ? { mttr_hours: mttrHours } : {}),
        x_position: pin.x || 0,
        y_position: pin.y || 0,
        created_by: (pin as any).created_by,
        updated_at: (pin as any).updated_at,
        ...(roofName ? { roof_name: roofName } : {}),
        ...(projectName ? { project_name: projectName } : {}),
        ...(contractor ? { contractor } : {})
      }
    })
  }, [projectData, roofData])

  // Prepare project data for export
  const prepareProjectData = useCallback((projects: any[]) => {
    return projects.map(project => {
      const pins = project.roofs?.flatMap((roof: any) => roof.pins || []) || []
      const totalPins = pins.length
      const openPins = pins.filter((p: any) => p.status === 'Open').length
      const closedPins = pins.filter((p: any) => p.status === 'Closed').length

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        contractor: project.contractor,
        created_at: project.created_at,
        total_pins: totalPins,
        open_pins: openPins,
        closed_pins: closedPins
      }
    })
  }, [])

  // Export pins to CSV
  const exportPinsCSV = useCallback(async (
    pins: PinWithRelations[], 
    filename?: string,
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exporter = new CSVExporter()
      const exportData = preparePinData(pins)
      
      setExportProgress(50)
      
      exporter.exportPins(exportData, filename, {
        ...(options.includePhotos !== undefined ? { includePhotos: options.includePhotos } : {}),
        ...(options.includeTechnicalDetails !== undefined ? { includeTechnicalDetails: options.includeTechnicalDetails } : {}),
        ...(options.includeTimestamps !== undefined ? { includeTimestamps: options.includeTimestamps } : {}),
        ...(options.dateFormat ? { dateFormat: options.dateFormat } : {})
      })

      setExportProgress(100)

      // Log export activity
      if (activityLogger) {
        await activityLogger.logExportGenerated('csv', {
          format: 'pins',
          pin_count: pins.length,
          filters: options
        })
      }

      return true
    } catch (error) {
      console.error('Failed to export pins CSV:', error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }, [preparePinData, activityLogger])

  // Export project summary to CSV
  const exportProjectCSV = useCallback(async (
    filename?: string,
    options: ExportOptions = {}
  ) => {
    if (!projectData) throw new Error('No project data available')
    
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exporter = new CSVExporter()
      const exportData = prepareProjectData([projectData])
      
      setExportProgress(50)
      
      exporter.exportProjects(exportData, filename, {
        ...(options.includeTimestamps !== undefined ? { includeTimestamps: options.includeTimestamps } : {}),
        ...(options.dateFormat ? { dateFormat: options.dateFormat } : {})
      })

      setExportProgress(100)

      // Log export activity
      if (activityLogger) {
        await activityLogger.logExportGenerated('csv', {
          format: 'project_summary',
          pin_count: projectData.roofs?.flatMap(r => r.pins || []).length || 0
        })
      }

      return true
    } catch (error) {
      console.error('Failed to export project CSV:', error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }, [projectData, prepareProjectData, activityLogger])

  // Export detailed analytics report
  const exportAnalyticsCSV = useCallback(async (
    filename?: string,
    timeRange?: string
  ) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exporter = new CSVExporter()
      const projects = projectData ? [projectData] : []
      const pins = projectData?.roofs?.flatMap((r: any) => r.pins || []) || 
                   roofData?.pins || []

      setExportProgress(30)

      const projectsData = prepareProjectData(projects)
      const pinsData = preparePinData(pins)

      setExportProgress(60)

      exporter.exportAnalytics({
        projects: projectsData,
        pins: pinsData,
        ...(timeRange ? { timeRange } : {})
      }, filename)

      setExportProgress(100)

      // Log export activity
      if (activityLogger) {
        await activityLogger.logExportGenerated('csv', {
          format: 'analytics',
          pin_count: pinsData.length,
          filters: { timeRange }
        })
      }

      return true
    } catch (error) {
      console.error('Failed to export analytics CSV:', error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }, [projectData, roofData, preparePinData, prepareProjectData, activityLogger])

  // Export single pin to PDF
  const exportPinPDF = useCallback(async (
    pin: PinWithRelations,
    children: PinChild[] = [],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exporter = new PDFExporter()
      
      setExportProgress(30)

      // Convert pin data to PDF format
      const severity = getSeverityNumber((pin as any).severity)
      const mttrHours = pin.status === 'Closed' && (pin as any).created_at && (pin as any).updated_at ?
        (new Date((pin as any).updated_at).getTime() - new Date((pin as any).created_at).getTime()) / (1000 * 60 * 60) :
        undefined

      const pdfPin = {
        id: pin.id,
        seq_number: pin.seq_number,
        status: pin.status ?? 'Open',
        issue_type: (pin as any).issue_type,
        defect_type: (pin as any).defect_type,
        defect_layer: (pin as any).defect_layer,
        ...(severity !== undefined ? { severity } : {}),
        created_at: (pin as any).created_at,
        x_position: pin.x || 0,
        y_position: pin.y || 0,
        opening_photo_url: (pin as any).opening_photo_url,
        closing_photo_url: (pin as any).closing_photo_url,
        ...(mttrHours !== undefined ? { mttr_hours: mttrHours } : {})
      }

      const pdfChildren = children.map(child => ({
        id: child.child_id,
        child_seq: child.child_code || `${pin.seq_number}.${child.child_id.slice(-2)}`,
        status: (child as any).status || 'Open',
        opening_photo_url: (child as any).opening_photo_url,
        closing_photo_url: (child as any).closing_photo_url,
        ...(child.defect_type ? { defect_type: child.defect_type } : {}),
        created_at: child.created_at ?? new Date().toISOString()
      }))

      setExportProgress(70)

      await exporter.exportPin(pdfPin, pdfChildren, {
        includeMap: true,
        includePhotos: options.includePhotos ?? true,
        includeDetails: options.includeTechnicalDetails ?? true,
        ...(options.projectName ? { projectName: options.projectName } : {}),
        ...(options.contractorName ? { contractorName: options.contractorName } : {}),
        ...(options.companyLogo ? { companyLogo: options.companyLogo } : {})
      })

      setExportProgress(100)

      // Log export activity
      if (activityLogger) {
        await activityLogger.logExportGenerated('pdf', {
          format: 'single_pin',
          pin_count: 1,
          filters: options
        })
      }

      return true
    } catch (error) {
      console.error('Failed to export pin PDF:', error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }, [activityLogger])

  // Export multiple pins to PDF
  const exportPinsPDF = useCallback(async (
    pins: PinWithRelations[],
    options: ExportOptions = {}
  ) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const exporter = new PDFExporter()
      
      setExportProgress(20)

      // Convert pins data to PDF format
      const pdfPins = pins.map(pin => {
        const severity = getSeverityNumber((pin as any).severity)
        const mttrHours = pin.status === 'Closed' && (pin as any).created_at && (pin as any).updated_at ?
          (new Date((pin as any).updated_at).getTime() - new Date((pin as any).created_at).getTime()) / (1000 * 60 * 60) :
          undefined

        return {
          id: pin.id,
          seq_number: pin.seq_number,
          status: pin.status ?? 'Open',
          issue_type: (pin as any).issue_type,
          defect_type: (pin as any).defect_type,
          defect_layer: (pin as any).defect_layer,
          ...(severity !== undefined ? { severity } : {}),
          created_at: (pin as any).created_at,
          x_position: pin.x || 0,
          y_position: pin.y || 0,
          opening_photo_url: (pin as any).opening_photo_url,
          closing_photo_url: (pin as any).closing_photo_url,
          ...(mttrHours !== undefined ? { mttr_hours: mttrHours } : {})
        }
      })

      setExportProgress(60)

      await exporter.exportMultiplePins(pdfPins, {
        includeMap: false,
        includePhotos: options.includePhotos ?? false,
        includeDetails: options.includeTechnicalDetails ?? true,
        includeSummary: true,
        ...(options.projectName ? { projectName: options.projectName } : {}),
        ...(options.contractorName ? { contractorName: options.contractorName } : {}),
        ...(options.companyLogo ? { companyLogo: options.companyLogo } : {})
      })

      setExportProgress(100)

      // Log export activity
      if (activityLogger) {
        await activityLogger.logExportGenerated('pdf', {
          format: 'multiple_pins',
          pin_count: pins.length,
          filters: options
        })
      }

      return true
    } catch (error) {
      console.error('Failed to export pins PDF:', error)
      throw error
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }, [activityLogger])

  return {
    // Data
    projectData,
    roofData,
    
    // State
    isExporting,
    exportProgress,
    
    // CSV Export Functions
    exportPinsCSV,
    exportProjectCSV,
    exportAnalyticsCSV,
    
    // PDF Export Functions  
    exportPinPDF,
    exportPinsPDF,
    
    // Utility Functions
    preparePinData,
    prepareProjectData
  }
}