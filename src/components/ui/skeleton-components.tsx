// Application-Specific Skeleton Components
// Provides realistic loading placeholders for SmartPin TPO interfaces

import React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './loading-states'

// Project Card Skeleton
export function ProjectCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-8" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-8" />
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  )
}

// Roof Plan Canvas Skeleton
export function RoofPlanCanvasSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden', className)}>
      {/* Canvas area */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative">
        {/* Simulate roof outline */}
        <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
          {/* Simulate pins */}
          <Skeleton variant="circular" className="absolute top-4 left-4 w-3 h-3" />
          <Skeleton variant="circular" className="absolute top-4 right-4 w-3 h-3" />
          <Skeleton variant="circular" className="absolute bottom-4 left-4 w-3 h-3" />
          <Skeleton variant="circular" className="absolute bottom-4 right-4 w-3 h-3" />
          <Skeleton variant="circular" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3" />
        </div>
      </div>
      
      {/* Toolbar skeleton */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      
      {/* Loading overlay */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
        <div className="text-center">
          <Skeleton variant="circular" className="w-8 h-8 mx-auto mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// Pin Details Panel Skeleton
export function PinDetailsPanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      
      {/* Details */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        </div>
      </div>
      
      {/* Photos section */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Skeleton className="h-4 w-16 mb-2" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
        </div>
      </div>
    </div>
  )
}

// Chat Interface Skeleton
export function ChatInterfaceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col', className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" className="w-8 h-8" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="w-6 h-6" />
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 min-h-[300px]">
        {/* User message */}
        <div className="flex justify-end">
          <div className="space-y-1 max-w-xs">
            <Skeleton className="h-10 w-48 rounded-2xl rounded-br-sm" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
        
        {/* Other user message */}
        <div className="flex justify-start">
          <div className="flex space-x-2 max-w-xs">
            <Skeleton variant="circular" className="w-6 h-6" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-40 rounded-2xl rounded-bl-sm" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
        
        {/* Another user message */}
        <div className="flex justify-end">
          <div className="space-y-1 max-w-xs">
            <Skeleton className="h-16 w-56 rounded-2xl rounded-br-sm" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
        
        {/* System message */}
        <div className="flex justify-center">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-2">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Data Table Skeleton
export function DataTableSkeleton({ rows = 5, columns = 4, className }: { 
  rows?: number, 
  columns?: number, 
  className?: string 
}) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden', className)}>
      {/* Table Header */}
      <div className="grid gap-4 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-24" : // First column (usually ID/name)
                  colIndex === columns - 1 ? "w-16" : // Last column (usually actions)
                  "w-full" // Middle columns
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// KPI Cards Skeleton
export function KPICardsSkeleton({ count = 4, className }: { count?: number, className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton variant="circular" className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Photo Gallery Skeleton
export function PhotoGallerySkeleton({ count = 6, className }: { count?: number, className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden aspect-square relative">
          <Skeleton className="absolute inset-0" />
          {/* Photo overlay skeleton */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
            <Skeleton className="h-3 w-16 bg-white/20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Dashboard Layout Skeleton
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
      
      {/* KPI Cards */}
      <KPICardsSkeleton />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart/Analytics */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="w-24 h-8 rounded" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton variant="circular" className="w-8 h-8" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Project Table */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <DataTableSkeleton rows={6} columns={5} />
      </div>
    </div>
  )
}

// Mobile-optimized skeleton components
export function MobileProjectCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4', className)}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        <Skeleton className="h-2 w-full rounded-full" />
        
        <div className="flex justify-between pt-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}

// Optimistic update skeleton (shows briefly during mutations)
export function OptimisticUpdateSkeleton({ children, isLoading }: { 
  children: React.ReactNode, 
  isLoading: boolean 
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-lg px-4 py-2 shadow-lg border border-slate-200 dark:border-slate-700">
            <Skeleton variant="circular" className="w-4 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      )}
    </div>
  )
}