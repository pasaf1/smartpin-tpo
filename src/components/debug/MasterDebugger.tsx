'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Settings, Eye, EyeOff } from 'lucide-react'
import { StyleDebugger } from './StyleDebugger'
import { ResponsiveDebugger } from './ResponsiveDebugger'
import { PerformanceProfiler } from './PerformanceProfiler'
import { ConflictDetector } from './ConflictDetector'

interface DebugFeature {
  id: string
  name: string
  component: React.ComponentType<any>
  enabled: boolean
  props?: Record<string, any>
}

interface MasterDebuggerProps {
  defaultEnabled?: boolean
  persistSettings?: boolean
  className?: string
}

const DEBUG_FEATURES: DebugFeature[] = [
  {
    id: 'style-debugger',
    name: 'Style Inspector',
    component: StyleDebugger,
    enabled: true,
    props: { position: 'top-right' }
  },
  {
    id: 'responsive-debugger', 
    name: 'Responsive Tester',
    component: ResponsiveDebugger,
    enabled: true,
    props: { showBreakpoints: true, showViewportInfo: true }
  },
  {
    id: 'performance-profiler',
    name: 'Performance Monitor',
    component: PerformanceProfiler,
    enabled: true,
    props: { showRealTime: false }
  },
  {
    id: 'conflict-detector',
    name: 'Conflict Detection',
    component: ConflictDetector,
    enabled: true,
    props: { autoScan: true }
  }
]

export default function MasterDebugger({
  defaultEnabled = true,
  persistSettings = true,
  className
}: MasterDebuggerProps) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [features, setFeatures] = useState(DEBUG_FEATURES)

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Load saved settings
  useEffect(() => {
    if (persistSettings) {
      const savedSettings = localStorage.getItem('smartpin-debug-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          setIsEnabled(settings.isEnabled ?? defaultEnabled)
          setFeatures(prev => prev.map(feature => ({
            ...feature,
            enabled: settings.features?.[feature.id] ?? feature.enabled
          })))
        } catch (e) {
          console.warn('Failed to load debug settings:', e)
        }
      }
    }
  }, [persistSettings, defaultEnabled])

  // Save settings when changed
  useEffect(() => {
    if (persistSettings) {
      const settings = {
        isEnabled,
        features: features.reduce((acc, feature) => ({
          ...acc,
          [feature.id]: feature.enabled
        }), {})
      }
      localStorage.setItem('smartpin-debug-settings', JSON.stringify(settings))
    }
  }, [isEnabled, features, persistSettings])

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ))
  }

  const toggleAll = () => {
    const allEnabled = features.every(f => f.enabled)
    setFeatures(prev => prev.map(feature => ({
      ...feature,
      enabled: !allEnabled
    })))
  }

  return (
    <>
      {/* Master Toggle Button */}
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
          "px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-200",
          "flex items-center gap-2 font-medium text-sm",
          isEnabled 
            ? "bg-green-600 text-white hover:bg-green-700" 
            : "bg-gray-600 text-gray-200 hover:bg-gray-700",
          className
        )}
        title="Toggle Style Debugging"
      >
        {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>Debug Tools</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsSettingsOpen(!isSettingsOpen)
          }}
          className="p-1 rounded hover:bg-black/20 transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
      </button>

      {/* Debug Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900 rounded-xl shadow-2xl p-4 w-80 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Debug Settings</h3>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Enable All</span>
              <button
                onClick={toggleAll}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                {features.every(f => f.enabled) ? 'Disable All' : 'Enable All'}
              </button>
            </div>
            
            <div className="border-t border-gray-700 pt-3">
              {features.map(feature => (
                <div key={feature.id} className="flex items-center justify-between py-2">
                  <span className="text-gray-300 text-sm">{feature.name}</span>
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-colors",
                      feature.enabled
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    {feature.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-3">
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Use keyboard shortcut: Cmd/Ctrl + Shift + D to toggle</div>
                <div>• Settings persist across browser sessions</div>
                <div>• Only visible in development mode</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Enabled Debug Components */}
      {isEnabled && features.map(feature => {
        if (!feature.enabled) return null
        
        const Component = feature.component
        return (
          <Component 
            key={feature.id}
            enabled={true}
            {...(feature.props || {})}
          />
        )
      })}

      {/* Global Keyboard Shortcut */}
      {typeof window !== 'undefined' && (
        <GlobalKeyboardShortcut 
          onToggle={() => setIsEnabled(prev => !prev)}
        />
      )}
    </>
  )
}

// Global keyboard shortcut component
function GlobalKeyboardShortcut({ onToggle }: { onToggle: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        onToggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onToggle])

  return null
}