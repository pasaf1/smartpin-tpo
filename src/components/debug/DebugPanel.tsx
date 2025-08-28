'use client'

import React from 'react'
import { useDebugInfo, useCanvasStore } from '@/lib/stores/canvas-store'

interface DebugPanelProps {
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function DebugPanel({ 
  className = '', 
  position = 'top-right' 
}: DebugPanelProps) {
  const debugInfo = useDebugInfo()
  const { toggleFeature } = useCanvasStore()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} z-50
        bg-black/90 text-white text-xs p-3 rounded-lg
        font-mono min-w-[200px] max-w-[300px]
        border border-gray-600
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
        <h3 className="font-semibold text-blue-400">🚀 Canvas Debug</h3>
        <div className="text-xs text-gray-400">MVP Mode</div>
      </div>

      {/* Core Stats */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Pins:</span>
          <span className="text-green-400 font-bold">{debugInfo.pinCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Selected:</span>
          <span className="text-blue-400">{debugInfo.selectedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Layers:</span>
          <span className="text-purple-400">{debugInfo.layerCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Active Layer:</span>
          <span className="text-yellow-400 text-[10px]">
            {debugInfo.activeLayer ? debugInfo.activeLayer.slice(0, 8) + '...' : 'None'}
          </span>
        </div>
      </div>

      {/* Viewport Info */}
      <div className="space-y-1 mb-3 pb-2 border-b border-gray-600">
        <div className="text-gray-300 font-semibold text-[10px] mb-1">VIEWPORT</div>
        <div className="flex justify-between">
          <span className="text-gray-400">Zoom:</span>
          <span className="text-cyan-400">{debugInfo.zoom.toFixed(2)}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Pan X:</span>
          <span className="text-cyan-400">{debugInfo.pan.x.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Pan Y:</span>
          <span className="text-cyan-400">{debugInfo.pan.y.toFixed(1)}</span>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="space-y-1 mb-3 pb-2 border-b border-gray-600">
        <div className="text-gray-300 font-semibold text-[10px] mb-1">FEATURES</div>
        {Object.entries(debugInfo.featureFlags).map(([feature, enabled]) => (
          <div key={feature} className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px]">
              {feature.replace('enable', '').toLowerCase()}:
            </span>
            <button
              onClick={() => toggleFeature(feature as any)}
              className={`
                px-1 py-0.5 rounded text-[9px] font-bold
                ${enabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
                }
              `}
            >
              {enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="space-y-1">
        <div className="text-gray-300 font-semibold text-[10px] mb-1">STATUS</div>
        <div className="flex justify-between">
          <span className="text-gray-400">Loading:</span>
          <span className={debugInfo.isLoading ? 'text-yellow-400' : 'text-green-400'}>
            {debugInfo.isLoading ? 'YES' : 'NO'}
          </span>
        </div>
        {debugInfo.error && (
          <div className="text-red-400 text-[10px] mt-1 p-1 bg-red-900/20 rounded">
            {debugInfo.error}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-gray-300 font-semibold text-[10px] mb-1">ACTIONS</div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => useCanvasStore.getState().resetViewport()}
            className="px-2 py-1 bg-blue-600 text-white text-[9px] rounded hover:bg-blue-700"
          >
            Reset
          </button>
          <button
            onClick={() => useCanvasStore.getState().fitToContent()}
            className="px-2 py-1 bg-purple-600 text-white text-[9px] rounded hover:bg-purple-700"
          >
            Fit
          </button>
          <button
            onClick={() => useCanvasStore.getState().clearSelection()}
            className="px-2 py-1 bg-orange-600 text-white text-[9px] rounded hover:bg-orange-700"
          >
            Clear
          </button>
          <button
            onClick={() => console.log('Canvas Store State:', useCanvasStore.getState())}
            className="px-2 py-1 bg-gray-600 text-white text-[9px] rounded hover:bg-gray-700"
          >
            Log
          </button>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel
