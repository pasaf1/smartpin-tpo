'use client'

import { useState, useEffect } from 'react'
import { useToolsAtPoint } from '@/hooks/useSupabase'
import { 
  MousePointer, 
  MapPin, 
  Square, 
  Circle, 
  Type,
  Ruler,
  Hand,
  Trash2,
  Plus,
  X
} from 'lucide-react'

interface ToolChestProps {
  selectedTool: string
  onSelectTool: (tool: string) => void
  mousePosition: { x: number; y: number }
  roofId: string
  isMobile: boolean
}

interface Tool {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  gated?: boolean // Requires spatial permission
  mobileOnly?: boolean
  desktopOnly?: boolean
}

const tools: Tool[] = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'pan', icon: Hand, label: 'Pan' },
  { id: 'pin', icon: MapPin, label: 'Pin', gated: true },
  { id: 'rectangle', icon: Square, label: 'Rectangle', gated: true },
  { id: 'circle', icon: Circle, label: 'Circle', gated: true },
  { id: 'text', icon: Type, label: 'Text', gated: true },
  { id: 'measure', icon: Ruler, label: 'Measure' },
  { id: 'delete', icon: Trash2, label: 'Delete' }
]

export function ToolChest({ selectedTool, onSelectTool, mousePosition, roofId, isMobile }: ToolChestProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableTools, setAvailableTools] = useState<string[]>([])
  
  // Get available tools at current position (with debouncing for mobile performance)
  const { data: toolsAtPoint } = useToolsAtPoint(roofId, mousePosition.x, mousePosition.y)
  
  useEffect(() => {
    setAvailableTools(toolsAtPoint || [])
  }, [toolsAtPoint])
  
  // Auto-collapse on mobile when tool is selected
  useEffect(() => {
    if (isMobile && selectedTool !== 'select') {
      setIsExpanded(false)
    }
  }, [selectedTool, isMobile])
  
  // Filter tools based on availability and platform
  const getAvailableTools = () => {
    return tools.filter(tool => {
      // Platform filtering
      if (tool.mobileOnly && !isMobile) return false
      if (tool.desktopOnly && isMobile) return false
      
      // Spatial gating
      if (tool.gated && !availableTools.includes(tool.id)) {
        return false
      }
      
      return true
    })
  }
  
  const availableToolsFiltered = getAvailableTools()
  const selectedToolData = tools.find(tool => tool.id === selectedTool)
  
  // Mobile Floating Action Button implementation
  if (isMobile) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        {/* Expanded tool options */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
            {availableToolsFiltered.map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id)
                  setIsExpanded(false)
                }}
                disabled={tool.gated && !availableTools.includes(tool.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
                  selectedTool === tool.id
                    ? 'bg-blue-500 text-white scale-110'
                    : tool.gated && !availableTools.includes(tool.id)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105'
                }`}
                aria-label={tool.label}
              >
                <tool.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        )}
        
        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all ${
            isExpanded 
              ? 'bg-red-500 text-white rotate-45' 
              : selectedTool === 'select'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border-2 border-blue-500'
          }`}
          aria-label={isExpanded ? 'Close tool menu' : 'Open tool menu'}
        >
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : selectedToolData ? (
            <selectedToolData.icon className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
        
        {/* Tool availability indicator */}
        {selectedTool === 'pin' && (
          <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center">
            <div className={`h-4 w-4 rounded-full ${
              availableTools.includes('pin') ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
        )}
      </div>
    )
  }
  
  // Desktop floating panel implementation
  return (
    <div className="absolute right-4 top-4 z-10 rounded-xl bg-white p-3 shadow-xl border border-gray-200">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Tools</h3>
        
        {/* Current position info */}
        <div className="text-xs text-gray-500 mb-2">
          Position: ({mousePosition.x.toFixed(3)}, {mousePosition.y.toFixed(3)})
        </div>
        
        {/* Available tools indicator */}
        {availableTools.length > 0 && (
          <div className="text-xs text-green-600 mb-2">
            Available: {availableTools.join(', ')}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {availableToolsFiltered.map(tool => {
          const isAvailable = !tool.gated || availableTools.includes(tool.id)
          
          return (
            <button
              key={tool.id}
              onClick={() => isAvailable && onSelectTool(tool.id)}
              disabled={!isAvailable}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-all text-center ${
                selectedTool === tool.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : isAvailable
                  ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              }`}
              title={!isAvailable ? `${tool.label} not available at this location` : tool.label}
            >
              <tool.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tool.label}</span>
              
              {/* Spatial availability indicator */}
              {tool.gated && (
                <div className={`w-2 h-2 rounded-full ${
                  availableTools.includes(tool.id) ? 'bg-green-500' : 'bg-red-500'
                }`} />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Quick actions for desktop */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
            onClick={() => onSelectTool('select')}
          >
            Clear Selection
          </button>
          <button 
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
            onClick={() => {
              // TODO: Reset canvas view
              console.log('Reset view')
            }}
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  )
}