'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useRoofs } from '@/lib/hooks/useRoofs'
import { cn } from '@/lib/utils'

function CompletionProgress({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-300',
            percentage >= 90 ? 'bg-emerald-500' : 
            percentage >= 70 ? 'bg-blue-500' : 
            percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right text-white/80">
        {percentage}%
      </span>
    </div>
  )
}

function RoofCard({ roof }: { roof: any }) {
  const hasBaseMap = roof.base_map_url && roof.base_map_url.length > 0
  const criticalDefects = roof.critical_defects || 0
  const openDefects = roof.open_defects || 0

  return (
    <Link href={`/roofs/${roof.id}`}>
      <Card className="cursor-pointer card-3d bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-white hover:text-blue-300 transition-colors">
                {roof.name}
              </CardTitle>
              <CardDescription className="mt-1 text-white/70">
                {roof.description}
              </CardDescription>
            </div>
            
            {criticalDefects > 0 && (
              <Badge className="ml-2 bg-red-500/20 text-red-200 border-red-400/30">
                {criticalDefects} Critical
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60 mt-2">
            <span>{roof.project_number}</span>
            <span>•</span>
            <span>{roof.location}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Base map preview */}
          <div className="relative">
            {hasBaseMap ? (
              <div className="aspect-[3/2] rounded-lg overflow-hidden bg-muted">
                <img 
                  src={roof.base_map_url} 
                  alt={`${roof.name} base map`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="text-xs bg-blue-500/20 text-blue-200 border-blue-400/30">
                    Base Map
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/2] rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                <div className="text-center text-white/50">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No base map uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-300">
                {roof.total_pins || 0}
              </div>
              <div className="text-xs text-white/60">Total Pins</div>
            </div>
            
            <div>
              <div className={cn(
                'text-2xl font-bold',
                openDefects > 0 ? 'text-red-400' : 'text-emerald-400'
              )}>
                {openDefects}
              </div>
              <div className="text-xs text-white/60">Open Defects</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {roof.closed_pins || 0}
              </div>
              <div className="text-xs text-white/60">Closed</div>
            </div>
          </div>

          {/* Completion progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white/80">Completion</span>
            </div>
            <CompletionProgress percentage={roof.completion_percentage || 0} />
          </div>

          {/* Project info */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                Project: {roof.project_name}
              </div>
              <div className="text-white/60">
                {roof.last_activity && formatDistanceToNow(new Date(roof.last_activity), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function RoofsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: roofs = [], isLoading, error } = useRoofs()

  const filteredRoofs = roofs.filter(roof =>
    roof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roof.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roof.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roof.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate overview statistics
  const totalPins = roofs.reduce((sum, roof) => sum + (roof.total_pins || 0), 0)
  const totalOpenDefects = roofs.reduce((sum, roof) => sum + (roof.open_defects || 0), 0)
  const totalCriticalDefects = roofs.reduce((sum, roof) => sum + (roof.critical_defects || 0), 0)
  const avgCompletion = roofs.length > 0 
    ? Math.round(roofs.reduce((sum, roof) => sum + (roof.completion_percentage || 0), 0) / roofs.length)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" style={{backgroundSize: '100px 100px'}}></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Loading roofs...
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" style={{backgroundSize: '100px 100px'}}></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-white/70">
              <p>Failed to load roofs</p>
              <p className="text-sm mt-1">Please try again later</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" style={{backgroundSize: '100px 100px'}}></div>
      
      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">SmartPin TPO</h1>
              <p className="text-white/80">Quality Management Platform</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/demo/dual-save">
                <Button className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200" size="sm">
                  🎨 Image Editor
                </Button>
              </Link>
              <Link href="/demo/analytics">
                <Button className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200" size="sm">
                  📊 Analytics
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200" size="sm">
                  👥 Users
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:from-emerald-700 hover:to-green-800 transition-all duration-300 shadow-lg" size="sm">
                  + New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-6 space-y-6">
        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="kpi card-3d bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm font-medium text-white/80 mb-2">
              Total Roofs
            </div>
            <div className="text-3xl font-bold text-white">{roofs.length}</div>
          </div>

          <div className="kpi card-3d bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm font-medium text-white/80 mb-2">
              Total Pins
            </div>
            <div className="text-3xl font-bold text-blue-300">{totalPins}</div>
          </div>

          <div className="kpi card-3d bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm font-medium text-white/80 mb-2">
              Open Defects
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'text-3xl font-bold',
                totalOpenDefects > 0 ? 'text-red-400' : 'text-emerald-400'
              )}>
                {totalOpenDefects}
              </div>
              {totalCriticalDefects > 0 && (
                <Badge className="bg-red-500/20 text-red-200 border-red-400/30 text-xs">
                  {totalCriticalDefects} Critical
                </Badge>
              )}
            </div>
          </div>

          <div className="kpi card-3d bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm font-medium text-white/80 mb-2">
              Avg Completion
            </div>
            <div className={cn(
              'text-3xl font-bold',
              avgCompletion >= 80 ? 'text-emerald-400' : 
              avgCompletion >= 60 ? 'text-amber-400' : 'text-red-400'
            )}>
              {avgCompletion}%
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search roofs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder-white/60 focus:ring-blue-500/50 focus:border-blue-400"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">
              {filteredRoofs.length} of {roofs.length} roofs
            </span>
          </div>
        </div>

        {/* Roofs grid */}
        {filteredRoofs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/50">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21v4H3V3h7.5z" />
              </svg>
              <p className="text-lg font-semibold text-white">No roofs found</p>
              <p className="text-sm mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first roof to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRoofs.map((roof) => (
              <RoofCard key={roof.id} roof={roof} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}