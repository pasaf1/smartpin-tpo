'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PinStatus, Severity as PinSeverity } from '@/lib/database.types'

/* -------------------- types -------------------- */
type PinRowMinimal = {
  id: string
  seq_number: number | null
  status: PinStatus
  severity: PinSeverity | null
  opened_at: string | null
  last_activity_at: string | null
  title: string | null
}

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
  averageResolutionTime: number // hours
  newPinsCreated: number
  pinsResolved: number
}

export interface CategoryAnalysis {
  category: string
  totalCount: number
  criticalCount: number
  averageSeverityScore: number // 1-4
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
  riskScore: number // 0-100
  qualityScore: number // 0-100
  lastUpdated: string
}

/* -------------------- constants -------------------- */
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const
const STATUSES = ['Open', 'ReadyForInspection', 'Closed'] as const

/* -------------------- demo data -------------------- */
const generateDemoRiskMatrix = (): RiskQualityMatrix => {
  const severities = SEVERITIES
  const statuses = STATUSES
  const cells: RiskQualityCell[][] = []
  let totalPins = 0

  severities.forEach((severity) => {
    const row: RiskQualityCell[] = []
    statuses.forEach((status) => {
      let count = 0
      if (severity === 'Critical') count = status === 'Open' ? 8 : status === 'ReadyForInspection' ? 2 : 12
      else if (severity === 'High') count = status === 'Open' ? 15 : status === 'ReadyForInspection' ? 6 : 28
      else if (severity === 'Medium') count = status === 'Open' ? 25 : status === 'ReadyForInspection' ? 8 : 45
      else count = status === 'Open' ? 18 : status === 'ReadyForInspection' ? 5 : 32

      totalPins += count
      row.push({
        severity,
        status,
        count,
        percentage: 0,
        trend: (['up','down','stable'] as const)[Math.floor(Math.random()*3)],
        trendPercentage: Math.floor(Math.random() * 15) + 1,
        items: Array.from({ length: Math.min(count, 5) }, (_, i) => ({
          pin_id: `demo-pin-${severity.toLowerCase()}-${status.toLowerCase()}-${i}`,
          pin_title: `${severity} ${status} Issue #${i + 1}`,
          pin_item_id: Math.random() > 0.5 ? `demo-item-${i}` : undefined,
          pin_item_title: Math.random() > 0.5 ? `Repair Item #${i + 1}` : undefined,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      })
    })
    cells.push(row)
  })

  cells.forEach(row => row.forEach(cell => {
    cell.percentage = totalPins ? Math.round((cell.count / totalPins) * 1000) / 10 : 0
  }))

  const totalOpen = cells.reduce((s, r) => s + r.find(c => c.status === 'Open')!.count, 0)
  const openCritical = cells
    .filter(r => r[0].severity === 'Critical' || r[0].severity === 'High')
    .reduce((s, r) => s + r.find(c => c.status === 'Open')!.count, 0)
  const riskScore = totalOpen ? Math.max(0, 100 - Math.round((openCritical / totalOpen) * 100)) : 100

  const totalPinsClosed = cells.reduce((s, r) => s + r.find(c => c.status === 'Closed')!.count, 0)
  const qualityScore = totalPins ? Math.round((totalPinsClosed / totalPins) * 100) : 0

  return { cells, totalPins, riskScore, qualityScore, lastUpdated: new Date().toISOString() }
}

const generateDemoTrends = (days: number = 30): QualityTrend[] => {
  const trends: QualityTrend[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const totalPins = Math.floor(Math.random() * 20) + 80
    const criticalPins = Math.floor(totalPins * 0.15)
    const openPins = Math.floor(totalPins * 0.4)
    trends.push({
      date: d.toISOString().split('T')[0],
      totalPins,
      openPins,
      criticalPins,
      closedPins: totalPins - openPins,
      averageResolutionTime: Math.floor(Math.random() * 48) + 12,
      newPinsCreated: Math.floor(Math.random() * 8) + 2,
      pinsResolved: Math.floor(Math.random() * 6) + 3
    })
  }
  return trends
}

const generateDemoCategoryAnalysis = (): CategoryAnalysis[] => {
  const categories = [
    'Membrane Defects','Flashing Issues','Seam Problems','Drain Concerns','Equipment Damage','Installation Errors'
  ]
  return categories.map(category => ({
    category,
    totalCount: Math.floor(Math.random() * 50) + 20,
    criticalCount: Math.floor(Math.random() * 8) + 2,
    averageSeverityScore: Math.round((Math.random() * 2 + 2) * 10) / 10,
    averageResolutionTime: Math.floor(Math.random() * 72) + 12,
    trendsLast30Days: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5) + 1,
      severity: Math.round((Math.random() * 3 + 1) * 10) / 10
    })).reverse()
  }))
}

/* -------------------- safe empty shapes -------------------- */
const generateEmptyMatrix = (_roofId: string): RiskQualityMatrix => {
  const cells: RiskQualityCell[][] = SEVERITIES.map(sev =>
    STATUSES.map(st => ({
      severity: sev,
      status: st,
      count: 0,
      percentage: 0,
      trend: 'stable',
      trendPercentage: 0,
      items: []
    }))
  )
  return {
    cells,
    totalPins: 0,
    riskScore: 100,
    qualityScore: 0,
    lastUpdated: new Date().toISOString()
  }
}

/* -------------------- hooks -------------------- */
export function useRiskQualityMatrix(roofId: string) {
  return useQuery({
    queryKey: ['risk-quality-matrix', roofId],
    enabled: !!roofId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<RiskQualityMatrix> => {
      try {
        // fetch minimal fields; adapt to your schema
        const { data: pins, error } = await supabase
          .from('pins')
          .select('id, seq_number, status, severity, opened_at, last_activity_at, title')
          .eq('roof_id', roofId)

        if (error) {
          console.error('Error fetching pins for analytics:', error)
          return generateEmptyMatrix(roofId)
        }
        if (!pins || pins.length === 0) return generateEmptyMatrix(roofId)

        // build cells
        const cells: RiskQualityCell[][] = SEVERITIES.map(severity =>
          STATUSES.map(status => {
            const matchingPins = (pins as any[]).filter((pin: any) =>
              (pin.severity === severity || (!pin.severity && severity === 'Medium')) &&
              pin.status === status
            )
            return {
              severity,
              status,
              count: matchingPins.length,
              percentage: 0,
              trend: 'stable',
              trendPercentage: 0,
              items: matchingPins.slice(0, 50).map((pin) => ({
                pin_id: pin.id,
                pin_title: pin.title ?? `Pin #${pin.seq_number ?? ''}`,
                created_at: pin.opened_at ?? new Date().toISOString(),
                updated_at: pin.last_activity_at ?? (pin.opened_at ?? new Date().toISOString()),
              })),
            }
          })
        )

        // totals & percentages
        const totalPins = pins.length
        cells.forEach(row => row.forEach(cell => {
          cell.percentage = totalPins ? Math.round((cell.count / totalPins) * 1000) / 10 : 0
        }))

        // scores
        const totalOpen = cells.reduce((s, row) => s + row.find(c => c.status === 'Open')!.count, 0)
        const openCritical = cells
          .filter(row => row[0].severity === 'Critical' || row[0].severity === 'High')
          .reduce((s, row) => s + row.find(c => c.status === 'Open')!.count, 0)

        const riskScore = totalOpen ? Math.max(0, 100 - Math.round((openCritical / totalOpen) * 100)) : 100
        const totalClosed = cells.reduce((s, row) => s + row.find(c => c.status === 'Closed')!.count, 0)
        const qualityScore = Math.round((totalClosed / totalPins) * 100)

        return {
          cells,
          totalPins,
          riskScore,
          qualityScore,
          lastUpdated: new Date().toISOString()
        }
      } catch (e) {
        console.error('Error in risk quality matrix:', e)
        return generateEmptyMatrix(roofId)
      }
    }
  })
}

export function useQualityTrends(roofId: string, days: number = 30) {
  return useQuery({
    queryKey: ['quality-trends', roofId, days],
    enabled: !!roofId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        return generateDemoTrends(days) // fixed: was generateEmptyTrends
      }

      const endDate = new Date()
      const startDate = new Date(); startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('pins')
        .select('id, status, severity, opened_at, last_activity_at') // הסר created_at/updated_at אם לא נדרשים
        .eq('roof_id', roofId)
        .gte('opened_at', startDate.toISOString())
        .lte('opened_at', endDate.toISOString())

      if (error) throw error
      return processDataIntoTrends(data ?? [], days)
    }
  })
}

export function useCategoryAnalysis(roofId: string) {
  return useQuery({
    queryKey: ['category-analysis', roofId],
    enabled: !!roofId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        return generateDemoCategoryAnalysis()
      }

      // אם ל־pin_items אין roof_id, בצע join ל־pins וסנן לפי pins.roof_id
      const { data, error } = await supabase
        .from('pin_items')
        .select('id, category, severity, status, created_at, updated_at, pin_id, pins!inner(roof_id)')
        .eq('pins.roof_id', roofId)

      if (error) throw error
      return processDataIntoCategories(data ?? [])
    }
  })
}

/* -------------------- prod processors (stubs today) -------------------- */
function processDataIntoMatrix(_data: any[]): RiskQualityMatrix {
  return generateDemoRiskMatrix()
}
function processDataIntoTrends(_data: any[], days: number): QualityTrend[] {
  return generateDemoTrends(days)
}
function processDataIntoCategories(_data: any[]): CategoryAnalysis[] {
  return generateDemoCategoryAnalysis()
}
