'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FilterState {
  issueType: string
  status: string[]
  severity: string[]
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void
  className?: string
}

export function FilterPanel({ onFilterChange, className }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    issueType: '',
    status: ['open', 'ready'],
    severity: []
  })

  const statusOptions = [
    { value: 'open', label: 'Open Issues', count: 7, color: 'red' },
    { value: 'ready', label: 'Ready for Inspection', count: 2, color: 'amber' },
    { value: 'closed', label: 'Closed', count: 1, color: 'emerald' }
  ]

  const severityOptions = [
    { value: 'critical', label: 'Critical', count: 3, color: 'bg-red-500' },
    { value: 'high', label: 'High', count: 4, color: 'bg-orange-500' },
    { value: 'medium', label: 'Medium', count: 2, color: 'bg-amber-500' },
    { value: 'low', label: 'Low', count: 1, color: 'bg-luxury-300' }
  ]

  const issueTypes = [
    { value: '', label: 'All Types' },
    { value: 'membrane', label: 'Membrane Defect' },
    { value: 'seam', label: 'Seam Issue' },
    { value: 'insulation', label: 'Insulation Problem' },
    { value: 'flashing', label: 'Flashing Defect' },
    { value: 'drain', label: 'Drain Issue' },
    { value: 'vapor', label: 'Vapor Barrier' },
    { value: 'contamination', label: 'Surface Contamination' }
  ]

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status)
    
    const newFilters = { ...filters, status: newStatus }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSeverityToggle = (severity: string) => {
    const newSeverity = filters.severity.includes(severity)
      ? filters.severity.filter(s => s !== severity)
      : [...filters.severity, severity]
    
    const newFilters = { ...filters, severity: newSeverity }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleIssueTypeChange = (issueType: string) => {
    const newFilters = { ...filters, issueType }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      issueType: '',
      status: ['open', 'ready'],
      severity: []
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <div className={cn("bg-gradient-to-br from-white to-luxury-50 rounded-2xl shadow-luxury-lg border border-luxury-200/50 p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-luxury-900">Filters</h3>
        <div className="flex items-center space-x-3">
          <button 
            onClick={clearAllFilters}
            className="text-luxury-500 hover:text-luxury-700 text-sm font-medium transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 bg-luxury-100 rounded-lg flex items-center justify-center text-luxury-600 hover:text-luxury-900 hover:bg-luxury-200 transition-all"
          >
            <svg 
              className={cn("w-4 h-4 transform transition-transform duration-200", isExpanded && "rotate-180")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={cn("space-y-6 transition-all duration-300", !isExpanded && "hidden")}>
        {/* Issue Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-luxury-700 mb-3">Issue Type</label>
          <div className="relative">
            <select 
              value={filters.issueType}
              onChange={(e) => handleIssueTypeChange(e.target.value)}
              className="w-full bg-white border border-luxury-200 rounded-xl px-4 py-3 text-sm font-medium text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent appearance-none"
            >
              {issueTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-luxury-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-luxury-700 mb-3">Status</label>
          <div className="space-y-3">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center cursor-pointer hover:text-luxury-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.status.includes(option.value)}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-5 h-5 rounded-lg flex items-center justify-center shadow-luxury ml-1 transition-colors",
                  option.color === 'red' && 'bg-red-500',
                  option.color === 'amber' && 'bg-amber-500',
                  option.color === 'emerald' && 'bg-emerald-500',
                  !filters.status.includes(option.value) && 'bg-luxury-200'
                )}>
                  {filters.status.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-sm font-medium text-luxury-700 transition-colors">
                  {option.label}
                </span>
                <span className={cn(
                  "ml-auto text-xs font-semibold px-2 py-1 rounded-full",
                  option.color === 'red' && 'text-red-600 bg-red-100',
                  option.color === 'amber' && 'text-amber-600 bg-amber-100',
                  option.color === 'emerald' && 'text-emerald-600 bg-emerald-100'
                )}>
                  {option.count}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-semibold text-luxury-700 mb-3">Severity</label>
          <div className="grid grid-cols-2 gap-2">
            {severityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSeverityToggle(option.value)}
                className={cn(
                  "text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-luxury transition-all duration-200",
                  option.color,
                  filters.severity.includes(option.value) ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
                )}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}