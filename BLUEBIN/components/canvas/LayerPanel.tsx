'use client'

import { useState, useEffect } from 'react'
import { useLayers } from '@/hooks/useSupabase'
import { Eye, EyeOff, Lock, Unlock, Layers, Filter, Search, X } from 'lucide-react'

interface LayerPanelProps {
  roofId: string
  activeLayers: Set<string>
  isMobile: boolean
  onToggleLayer: (layerId: string) => void
}

export function LayerPanel({ roofId, activeLayers, isMobile, onToggleLayer }: LayerPanelProps) {
  const { data: layers } = useLayers(roofId)
  const [searchTerm, setSearchTerm] = useState('')
  const [soloLayer, setSoloLayer] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(!isMobile) // Desktop: always open, Mobile: closed by default
  
  // Mobile: close panel when orientation changes
  useEffect(() => {
    if (!isMobile) return
    
    const handleOrientationChange = () => {
      setIsOpen(false)
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)
    return () => window.removeEventListener('orientationchange', handleOrientationChange)
  }, [isMobile])
  
  const filteredLayers = layers?.filter(layer =>
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Mobile bottom sheet implementation
  if (isMobile) {
    return (
      <>
        {/* Mobile: Floating layer button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          aria-label="Open layers panel"
        >
          <Layers className="h-5 w-5 text-gray-700" />
        </button>
        
        {/* Mobile: Bottom sheet overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center p-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-semibold">Layers</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close layers panel"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Mobile layer content */}
              <MobileLayerContent
                layers={filteredLayers}
                activeLayers={activeLayers}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                soloLayer={soloLayer}
                setSoloLayer={setSoloLayer}
                onToggleLayer={onToggleLayer}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    )
  }
  
  // Desktop floating panel implementation
  return (
    <div className="absolute left-4 top-4 z-10 w-80 rounded-xl bg-white shadow-xl border border-gray-200">
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <DesktopLayerContent
        layers={filteredLayers}
        activeLayers={activeLayers}
        soloLayer={soloLayer}
        setSoloLayer={setSoloLayer}
        onToggleLayer={onToggleLayer}
      />
    </div>
  )
}

// Mobile layer content component
function MobileLayerContent({ 
  layers, 
  activeLayers, 
  searchTerm, 
  setSearchTerm,
  soloLayer,
  setSoloLayer,
  onToggleLayer,
  onClose 
}: {
  layers: any[]
  activeLayers: Set<string>
  searchTerm: string
  setSearchTerm: (term: string) => void
  soloLayer: string | null
  setSoloLayer: (layerId: string | null) => void
  onToggleLayer: (layerId: string) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Mobile search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers?.map(layer => (
          <MobileLayerItem
            key={layer.id}
            layer={layer}
            isActive={activeLayers.has(layer.id)}
            isSolo={soloLayer === layer.id}
            onToggle={() => onToggleLayer(layer.id)}
            onSolo={() => setSoloLayer(layer.id === soloLayer ? null : layer.id)}
          />
        ))}
        
        {layers?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No layers found
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={() => {
              // Show only annotation layers
              onClose()
            }}
          >
            Annotations Only
          </button>
          <button 
            className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={() => {
              // Hide closed pins
              onClose()
            }}
          >
            Hide Closed
          </button>
        </div>
      </div>
    </div>
  )
}

// Desktop layer content component  
function DesktopLayerContent({
  layers,
  activeLayers,
  soloLayer,
  setSoloLayer,
  onToggleLayer
}: {
  layers: any[]
  activeLayers: Set<string>
  soloLayer: string | null
  setSoloLayer: (layerId: string | null) => void
  onToggleLayer: (layerId: string) => void
}) {
  return (
    <>
      {/* Layer list */}
      <div className="max-h-96 overflow-y-auto p-2">
        {layers?.map(layer => (
          <DesktopLayerItem
            key={layer.id}
            layer={layer}
            isActive={activeLayers.has(layer.id)}
            isSolo={soloLayer === layer.id}
            onToggle={() => onToggleLayer(layer.id)}
            onSolo={() => setSoloLayer(layer.id === soloLayer ? null : layer.id)}
          />
        ))}
        
        {layers?.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No layers found
          </div>
        )}
      </div>
      
      {/* Quick filters */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors">
            Annotations Only
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors">
            Hide Closed
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors">
            Review Ready
          </button>
        </div>
      </div>
    </>
  )
}

// Mobile layer item component
function MobileLayerItem({ 
  layer, 
  isActive, 
  isSolo, 
  onToggle, 
  onSolo 
}: {
  layer: any
  isActive: boolean
  isSolo: boolean
  onToggle: () => void
  onSolo: () => void
}) {
  return (
    <div className={`mb-2 flex items-center justify-between rounded-lg p-4 border-2 transition-all ${
      isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={`Toggle ${layer.name} layer`}
        >
          {layer.visible && isActive ? 
            <Eye className="h-5 w-5 text-blue-600" /> : 
            <EyeOff className="h-5 w-5 text-gray-400" />
          }
        </button>
        
        <div className="flex-1">
          <div className="font-medium text-gray-900">{layer.name}</div>
          <div className="text-sm text-gray-500 capitalize">{layer.type}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Opacity slider for mobile */}
        <input
          type="range"
          min="0"
          max="100"
          value={layer.opacity * 100}
          className="w-16 accent-blue-500"
          onChange={(e) => {
            // TODO: Update layer opacity
            console.log('Update opacity:', e.target.value)
          }}
        />
        
        <button
          onClick={onSolo}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isSolo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Solo
        </button>
      </div>
    </div>
  )
}

// Desktop layer item component
function DesktopLayerItem({ 
  layer, 
  isActive, 
  isSolo, 
  onToggle, 
  onSolo 
}: {
  layer: any
  isActive: boolean
  isSolo: boolean
  onToggle: () => void
  onSolo: () => void
}) {
  return (
    <div className={`mb-1 flex items-center justify-between rounded-lg p-2 transition-colors ${
      isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={onToggle}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label={`Toggle ${layer.name} layer`}
        >
          {layer.visible && isActive ? 
            <Eye className="h-4 w-4" /> : 
            <EyeOff className="h-4 w-4" />
          }
        </button>
        
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>
        
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">{layer.name}</span>
          <div className="text-xs text-gray-500 capitalize">{layer.type}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={layer.opacity * 100}
          className="w-16 accent-blue-500"
          onChange={(e) => {
            // TODO: Update layer opacity
            console.log('Update opacity:', e.target.value)
          }}
        />
        <button
          onClick={onSolo}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            isSolo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Solo
        </button>
      </div>
    </div>
  )
}