'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface KPICard {
  id: string
  title: string
  value: number
  color: string
  bgGradient: string
  icon: React.ReactNode
  filter: string
  hint: string
}

export interface KPICardsProps {
  className?: string
  onFilterChange?: (filter: string) => void
  activeFilter?: string
  kpiKeys?: string[]
}

export function KPICards({ className, onFilterChange, activeFilter, kpiKeys = ['open', 'ready', 'closed', 'parent', 'all'] }: KPICardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const allKpiCards: KPICard[] = [
    {
      id: 'open',
      title: 'Open Issues',
      value: 23,
      color: 'red',
      bgGradient: 'from-red-50 to-red-100',
      filter: 'open',
      hint: 'Click to filter',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      )
    },
    {
      id: 'ready',
      title: 'Ready for Inspection',
      value: 12,
      color: 'amber',
      bgGradient: 'from-amber-50 to-amber-100',
      filter: 'ready',
      hint: 'Click to filter',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      id: 'closed',
      title: 'Closed',
      value: 22,
      color: 'emerald',
      bgGradient: 'from-emerald-50 to-emerald-100',
      filter: 'closed',
      hint: 'Click to filter',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      )
    },
    {
      id: 'parent',
      title: 'Parent Pins',
      value: 15,
      color: 'purple',
      bgGradient: 'from-purple-50 to-purple-100',
      filter: 'parent',
      hint: 'Click to filter',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      )
    },
    {
      id: 'all',
      title: 'All Issues',
      value: 57,
      color: 'blue',
      bgGradient: 'from-blue-50 to-blue-100',
      filter: 'all',
      hint: 'Click to filter',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
        </svg>
      )
    }
  ]

  const kpiCards = allKpiCards.filter(card => kpiKeys.includes(card.id));

  const handleCardClick = (filter: string) => {
    onFilterChange?.(filter)
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-6", className)}>
      {kpiCards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "relative bg-gradient-to-br p-6 rounded-xl border shadow-luxury cursor-pointer hover:shadow-luxury-lg transition-all duration-300",
            card.bgGradient,
            card.color === 'red' && 'border-red-200/50',
            card.color === 'amber' && 'border-amber-200/50',
            card.color === 'emerald' && 'border-emerald-200/50',
            card.color === 'purple' && 'border-purple-200/50',
            card.color === 'blue' && 'border-blue-200/50',
            activeFilter === card.filter && 'ring-2 ring-gold-400 transform scale-102',
            'hover:-translate-y-1 hover:scale-102'
          )}
          onClick={() => handleCardClick(card.filter)}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={cn(
                "text-3xl font-bold mb-1",
                card.color === 'red' && 'text-red-700',
                card.color === 'amber' && 'text-amber-700',
                card.color === 'emerald' && 'text-emerald-700',
                card.color === 'purple' && 'text-purple-700',
                card.color === 'blue' && 'text-blue-700'
              )}>
                {card.value}
              </div>
              <div className={cn(
                "text-sm font-semibold",
                card.color === 'red' && 'text-red-600',
                card.color === 'amber' && 'text-amber-600',
                card.color === 'emerald' && 'text-emerald-600',
                card.color === 'purple' && 'text-purple-600',
                card.color === 'blue' && 'text-blue-600'
              )}>
                {card.title}
              </div>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-luxury",
              card.color === 'red' && 'bg-red-500',
              card.color === 'amber' && 'bg-amber-500',
              card.color === 'emerald' && 'bg-emerald-500',
              card.color === 'purple' && 'bg-purple-500',
              card.color === 'blue' && 'bg-blue-500'
            )}>
              {card.icon}
            </div>
          </div>
          
          {/* Hint tooltip */}
          <div className={cn(
            "absolute -top-2 -right-2 bg-gold-500 text-white text-xs px-2 py-1 rounded-full opacity-0 transition-opacity duration-200",
            hoveredCard === card.id && "opacity-100"
          )}>
            {card.hint}
          </div>
        </div>
      ))}
    </div>
  )
}