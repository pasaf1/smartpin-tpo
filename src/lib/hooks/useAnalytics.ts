'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Define types locally (must match database enums)
type PinStatus = 'Open' | 'ReadyForInspection' | 'Closed' | 'InDispute'
type PinSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export interface RiskQualityCell {
  severity: PinSeverity
  status: PinStatus
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  items: {
    pin_id: string
    pin_title: string
    pin_item_id?: string
    pin_item_title?: string
    created_at: string
    updated_at: string
  }[]
}

export interface QualityTrend {
  date: string
  totalPins: number
  openPins: number
  criticalPins: number
  closedPins: number
  averageResolutionTime: number // in hours
  newPinsCreated: number
  pinsResolved: number
}

export interface CategoryAnalysis {
  category: string
  totalCount: number
  criticalCount: number
  averageSeverityScore: number // 1-4 scale
  averageResolutionTime: number
  trendsLast30Days: {
    date: string
    count: number
    severity: number
  }[]
}

export interface RiskQualityMatrix {
  cells: RiskQualityCell[][]
  totalPins: number
  riskScore: number // 0-100 composite risk score
  qualityScore: number // 0-100 quality management score
  lastUpdated: string
}

// Demo data for Risk Quality Matrix
const generateDemoRiskMatrix = (): RiskQualityMatrix => {
  const severities: PinSeverity[] = ['Critical', 'High', 'Medium', 'Low']
  const statuses: PinStatus[] = ['Open', 'ReadyForInspection', 'Closed']
  
  const cells: RiskQualityCell[][] = []
  let totalPins = 0
  
  severities.forEach((severity, severityIndex) => {
    const row: RiskQualityCell[] = []
    
    statuses.forEach((status, statusIndex) => {
      // Generate realistic distribution
      let count = 0
      if (severity === 'Critical') {
        count = status === 'Open' ? 8 : status === 'ReadyForInspection' ? 2 : 12
      } else if (severity === 'High') {
        count = status === 'Open' ? 15 : status === 'ReadyForInspection' ? 6 : 28
      } else if (severity === 'Medium') {
        count = status === 'Open' ? 25 : status === 'ReadyForInspection' ? 8 : 45
      } else {
        count = status === 'Open' ? 18 : status === 'ReadyForInspection' ? 5 : 32
      }
      
      totalPins += count
      
      const cell: RiskQualityCell = {
        severity,
        status,
        count,
        percentage: 0, // Will calculate after totals
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        trendPercentage: Math.floor(Math.random() * 15) + 1,
        items: Array.from({ length: Math.min(count, 5) }, (_, i) => ({
          pin_id: `demo-pin-${severity.toLowerCase()}-${status.toLowerCase()}-${i}`,
          pin_title: `${severity} ${status} Issue #${i + 1}`,
          ...(Math.random() > 0.5 ? { pin_item_id: `demo-item-${i}` } : {}),
          ...(Math.random() > 0.5 ? { pin_item_title: `Repair Item #${i + 1}` } : {}),
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      }
      
      row.push(cell)
    })
    
    cells.push(row)
  })
  
  // Calculate percentages
  cells.forEach(row => {
    row.forEach(cell => {
      cell.percentage = Math.round((cell.count / totalPins) * 100 * 10) / 10
    })
  })
  
  // Calculate composite scores
  const openCritical = (cells[0]?.[0]?.count || 0) + (cells[1]?.[0]?.count || 0) // Critical + High Open
  const totalOpen = cells.reduce((sum, row) => sum + (row[0]?.count || 0), 0)
  const riskScore = Math.max(0, 100 - Math.round((openCritical / totalOpen) * 100))

  const closedItems = cells.reduce((sum, row) => sum + (row[2]?.count || 0), 0) // Closed is index 2 now
  const qualityScore = Math.round((closedItems / totalPins) * 100)
  
  return {
    cells,
    totalPins,
    riskScore,
    qualityScore,
    lastUpdated: new Date().toISOString()
  }
}

// Demo data for quality trends
const generateDemoTrends = (days: number = 30): QualityTrend[] => {
  const trends: QualityTrend[] = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const totalPins = Math.floor(Math.random() * 20) + 80
    const criticalPins = Math.floor(totalPins * 0.15)
    const openPins = Math.floor(totalPins * 0.4)
    const closedPins = totalPins - openPins
    
    trends.push({
      date: date.toISOString().split('T')[0] || '',
      totalPins,
      openPins,
      criticalPins,
      closedPins,
      averageResolutionTime: Math.floor(Math.random() * 48) + 12,
      newPinsCreated: Math.floor(Math.random() * 8) + 2,
      pinsResolved: Math.floor(Math.random() * 6) + 3
    })
  }
  
  return trends
}

// Demo data for category analysis
const generateDemoCategoryAnalysis = (): CategoryAnalysis[] => {
  const categories = [
    'Membrane Defects',
    'Flashing Issues', 
    'Seam Problems',
    'Drain Concerns',
    'Equipment Damage',
    'Installation Errors'
  ]
  
  return categories.map(category => ({
    category,
    totalCount: Math.floor(Math.random() * 50) + 20,
    criticalCount: Math.floor(Math.random() * 8) + 2,
    averageSeverityScore: Math.round((Math.random() * 2 + 2) * 10) / 10, // 2.0-4.0
    averageResolutionTime: Math.floor(Math.random() * 72) + 12, // 12-84 hours
    trendsLast30Days: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
      count: Math.floor(Math.random() * 5) + 1,
      severity: Math.round((Math.random() * 3 + 1) * 10) / 10
    })).reverse()
  }))
}

export function useRiskQualityMatrix(roofId: string) {
  return useQuery({
    queryKey: ['risk-quality-matrix', roofId],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading risk quality matrix for roof:', roofId)
        return generateDemoRiskMatrix()
      }

      // Production implementation - complex aggregation query
      const { data, error } = await supabase
        .from('pins')
        .select(`
          id,
          title,
          status,
          severity,
          created_at,
          updated_at,
          pin_items(
            id,
            title,
            status,
            severity,
            created_at,
            updated_at
          )
        `)
        .eq('roof_id', roofId)

      if (error) throw error

      // Process data into matrix format
      const matrix = processDataIntoMatrix(data)
      return matrix
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })
}

export function useQualityTrends(roofId: string, days: number = 30) {
  return useQuery({
    queryKey: ['quality-trends', roofId, days],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading quality trends for roof:', roofId, 'days:', days)
        return generateDemoTrends(days)
      }

      // Production implementation - time-series aggregation
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('pins')
        .select('id, status, severity, created_at, updated_at')
        .eq('roof_id', roofId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      return processDataIntoTrends(data, days)
    }
  })
}

export function useCategoryAnalysis(roofId: string) {
  return useQuery({
    queryKey: ['category-analysis', roofId],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Demo: Loading category analysis for roof:', roofId)
        return generateDemoCategoryAnalysis()
      }

      // Production implementation
      const { data, error } = await supabase
        .from('pin_items')
        .select(`
          id,
          category,
          severity,
          status,
          created_at,
          updated_at
        `)
        .eq('roof_id', roofId)

      if (error) throw error

      return processDataIntoCategories(data)
    }
  })
}

// Helper functions for production data processing
function processDataIntoMatrix(data: any[]): RiskQualityMatrix {
  // Implementation would aggregate the raw data into matrix cells
  // This is a simplified version
  return generateDemoRiskMatrix()
}

function processDataIntoTrends(data: any[], days: number): QualityTrend[] {
  // Implementation would group by date and calculate metrics
  return generateDemoTrends(days)
}

function processDataIntoCategories(data: any[]): CategoryAnalysis[] {
  // Implementation would group by category and calculate statistics
  return generateDemoCategoryAnalysis()
}