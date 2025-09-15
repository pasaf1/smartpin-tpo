'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RoofCardProps {
  roof: {
    id: string
    name: string
    code: string
    area: string
    openCount: number
    readyCount: number
    closedCount: number
    lastUpdated: string
    status: 'active' | 'in-progress' | 'completed'
  }
  onViewDetails: (roofId: string) => void
  className?: string
}

export function RoofCard({ roof, onViewDetails, className }: RoofCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const totalIssues = roof.openCount + roof.readyCount + roof.closedCount

  const statusConfig = {
    active: { bg: 'bg-emerald-500', text: 'Active' },
    'in-progress': { bg: 'bg-amber-500', text: 'In Progress' },
    completed: { bg: 'bg-emerald-500', text: 'Completed' }
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-white to-luxury-50 rounded-2xl shadow-luxury-lg overflow-hidden cursor-pointer transition-all duration-300 border border-luxury-200/30",
        "hover:shadow-luxury-xl hover:-translate-y-1 hover:scale-102",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* SVG Roof Plan */}
      <div className="relative h-48 bg-gradient-to-br from-luxury-100 to-luxury-200">
        <svg className="w-full h-full" viewBox="0 0 300 200">
          <rect x="20" y="20" width="260" height="160" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="8"/>
          <line x1="120" y1="20" x2="120" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,2" opacity="0.6"/>
          <line x1="200" y1="20" x2="200" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,2" opacity="0.6"/>
          
          {/* Sample pins */}
          {roof.openCount > 0 && (
            <g className="cursor-pointer pin-element">
              <path d="M70 60 C65 60, 62 63, 62 66 C62 69, 70 75, 70 75 C70 75, 78 69, 78 66 C78 63, 75 60, 70 60 Z" fill="#dc2626" stroke="#ffffff" strokeWidth="2"/>
              <circle cx="70" cy="66" r="4" fill="#ffffff"/>
              <text x="70" y="69" textAnchor="middle" className="text-red-600 text-xs font-bold">1</text>
            </g>
          )}
          
          {roof.readyCount > 0 && (
            <g className="cursor-pointer pin-element">
              <path d="M150 90 C145 90, 142 93, 142 96 C142 99, 150 105, 150 105 C150 105, 158 99, 158 96 C158 93, 155 90, 150 90 Z" fill="#f97316" stroke="#ffffff" strokeWidth="2"/>
              <circle cx="150" cy="96" r="4" fill="#ffffff"/>
              <text x="150" y="99" textAnchor="middle" className="text-orange-600 text-xs font-bold">2</text>
            </g>
          )}
          
          {roof.closedCount > 0 && (
            <g className="cursor-pointer pin-element">
              <path d="M230 120 C225 120, 222 123, 222 126 C222 129, 230 135, 230 135 C230 135, 238 129, 238 126 C238 123, 235 120, 230 120 Z" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>
              <circle cx="230" cy="126" r="4" fill="#ffffff"/>
              <text x="230" y="129" textAnchor="middle" className="text-emerald-600 text-xs font-bold">3</text>
            </g>
          )}
        </svg>
        
        <div className={cn(
          "absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-bold",
          statusConfig[roof.status].bg
        )}>
          {statusConfig[roof.status].text}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-luxury-900 mb-1">{roof.name}</h3>
            <p className="text-sm text-luxury-600 font-medium">Code: {roof.code} • Area: {roof.area}</p>
          </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{roof.openCount}</div>
            <div className="text-xs text-luxury-600">Open</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">{roof.readyCount}</div>
            <div className="text-xs text-luxury-600">Ready</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{roof.closedCount}</div>
            <div className="text-xs text-luxury-600">Closed</div>
          </div>
        </div>
        
        {/* Meta info */}
        <div className="flex justify-between items-center text-sm text-luxury-600 mb-4">
          <span>Last Updated: {roof.lastUpdated}</span>
          <span className="font-semibold text-luxury-900">{totalIssues} Issues</span>
        </div>
        
        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(roof.id)
          }}
          className={cn(
            "w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-luxury",
            "hover:from-gold-600 hover:to-gold-700 hover:shadow-luxury-lg",
            isHovered && "transform -translate-y-0.5"
          )}
        >
          View Details
        </button>
      </div>
    </div>
  )
}