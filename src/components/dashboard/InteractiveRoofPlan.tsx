'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Pin {
  id: string
  x: number
  y: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'ready' | 'closed'
  issueType: string
  title?: string
}

interface PinPreview {
  id: string
  title: string
  issueType: string
  status: 'open' | 'ready' | 'closed'
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface Layer {
  id: string
  name: string
  visible: boolean
  color: string
  pins: Pin[]
}

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  active: boolean
}

interface InteractiveRoofPlanProps {
  pins: Pin[]
  onPinClick: (pin: Pin) => void
  onAddPin?: (x: number, y: number) => void
  highlightedPinId?: string
  className?: string
  planImageUrl?: string | null
  fallbackText?: string
  showToolbar?: boolean
  showMiniMap?: boolean
  enableMeasurement?: boolean
  layers?: Layer[]
  onLayerToggle?: (layerId: string) => void
}

export function InteractiveRoofPlan({ 
  pins, 
  onPinClick, 
  onAddPin, 
  highlightedPinId, 
  className,
  planImageUrl,
  fallbackText = "No roof plan image available",
  showToolbar = true,
  showMiniMap = true,
  enableMeasurement = false,
  layers = [],
  onLayerToggle
}: InteractiveRoofPlanProps) {
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentTool, setCurrentTool] = useState<string>('select')
  const [showLayers, setShowLayers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<any>(null)

  // Tools configuration
  const tools: Tool[] = [
    { id: 'select', name: 'Select', icon: <Search className="w-4 h-4" />, active: currentTool === 'select' },
    { id: 'pin', name: 'Add Pin', icon: <ZoomIn className="w-4 h-4" />, active: currentTool === 'pin' },
    { id: 'measure', name: 'Measure', icon: <Maximize2 className="w-4 h-4" />, active: currentTool === 'measure' },
  ]

  // Filter pins based on search term
  const filteredPins = pins.filter(pin => 
    pin.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pin.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pin.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pinData: Record<string, PinPreview> = {
    '1': {
      id: 'PIN-001',
      title: 'Membrane Defect',
      issueType: 'Membrane Defect',
      status: 'open',
      severity: 'critical'
    },
    '2': {
      id: 'PIN-002',
      title: 'Seam Issue',
      issueType: 'Seam Issue',
      status: 'ready',
      severity: 'high'
    },
    '3': {
      id: 'PIN-003',
      title: 'Insulation Problem',
      issueType: 'Insulation Problem',
      status: 'closed',
      severity: 'low'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'ready': return 'bg-amber-100 text-amber-800'
      case 'closed': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'low': return 'bg-luxury-100 text-luxury-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePinHover = (pin: Pin, event: React.MouseEvent) => {
    setHoveredPin(pin)
    const rect = (event.target as Element).getBoundingClientRect()
    setPreviewPosition({
      x: rect.right + 10,
      y: rect.top
    })
  }

  const handlePinLeave = () => {
    setHoveredPin(null)
  }

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onAddPin || currentTool !== 'pin' || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100 // Convert to percentage
    const y = ((event.clientY - rect.top) / rect.height) * 100 // Convert to percentage
    
    // Only allow adding pins if there's an image loaded and we're in pin mode
    if (imageLoaded && !imageError) {
      onAddPin(x, y)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const handleToolChange = (toolId: string) => {
    setCurrentTool(toolId)
  }

  const handleZoomIn = () => {
    transformRef.current?.zoomIn(0.5)
  }

  const handleZoomOut = () => {
    transformRef.current?.zoomOut(0.5)
  }

  const handleResetTransform = () => {
    transformRef.current?.resetTransform()
  }

  const handleCenterView = () => {
    transformRef.current?.centerView()
  }

  return (
    <div className={cn("relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-2"
        >
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetTransform}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCenterView}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolChange(tool.id)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    tool.active 
                      ? "bg-blue-100 text-blue-600" 
                      : "hover:bg-gray-100"
                  )}
                  title={tool.name}
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            {/* Layers Toggle */}
            <button
              onClick={() => setShowLayers(!showLayers)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showLayers ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              )}
              title="Layers"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search pins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-32"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Layer Panel */}
      <AnimatePresence>
        {showLayers && layers.length > 0 && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4 w-64"
          >
            <h3 className="font-semibold text-gray-800 mb-3">Layers</h3>
            {layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border-2"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="text-sm">{layer.name}</span>
                </div>
                <button
                  onClick={() => onLayerToggle?.(layer.id)}
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    layer.visible 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {layer.visible ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Transform Container */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={8}
        centerOnInit
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: "reset" }}
        panning={{ disabled: currentTool === 'pin' }}
      >
        <TransformComponent>
          <div 
            ref={containerRef}
            className={cn(
              "relative w-full aspect-[4/3] min-h-[600px]",
              currentTool === 'pin' && imageLoaded && !imageError && "cursor-crosshair"
            )}
            onClick={handleContainerClick}
          >
            {/* Roof Plan Image */}
            {planImageUrl && !imageError ? (
              <Image
                src={planImageUrl}
                alt="Roof Plan"
                fill
                className="object-contain bg-white rounded-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                <div className="text-center p-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </motion.div>
                  <p className="text-gray-600 font-medium">{fallbackText}</p>
                  <p className="text-gray-400 text-sm mt-2">Upload a roof plan image when creating a project</p>
                </div>
              </div>
            )}

            {/* Pin Overlay Layer */}
            {(imageLoaded && !imageError) && (
              <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                  {/* Sample pins with percentage positioning */}
                  <motion.div 
                    key="sample-pin-1"
                    initial={{ scale: 0, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={cn(
                      "absolute transform -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto",
                      highlightedPinId === '1' && "z-10"
                    )}
                    style={{ left: '23%', top: '33%' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPinClick({ id: '1', x: 23, y: 33, severity: 'critical', status: 'open', issueType: 'membrane' })
                    }}
                    onMouseEnter={(e) => handlePinHover({ id: '1', x: 23, y: 33, severity: 'critical', status: 'open', issueType: 'membrane' }, e)}
                    onMouseLeave={handlePinLeave}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="w-10 h-12 flex items-center justify-center"
                        animate={highlightedPinId === '1' ? { 
                          scale: [1, 1.2, 1], 
                          rotate: [0, 5, -5, 0] 
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg className="w-10 h-12 drop-shadow-lg" viewBox="0 0 24 28" fill="none">
                          <path 
                            d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" 
                            fill="#dc2626" 
                            stroke="#ffffff" 
                            strokeWidth="2"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                          />
                        </svg>
                        <span className="absolute text-white font-bold text-sm top-2">1</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div 
                    key="sample-pin-2"
                    initial={{ scale: 0, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                    className={cn(
                      "absolute transform -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto",
                      highlightedPinId === '2' && "z-10"
                    )}
                    style={{ left: '50%', top: '48%' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPinClick({ id: '2', x: 50, y: 48, severity: 'high', status: 'ready', issueType: 'seam' })
                    }}
                    onMouseEnter={(e) => handlePinHover({ id: '2', x: 50, y: 48, severity: 'high', status: 'ready', issueType: 'seam' }, e)}
                    onMouseLeave={handlePinLeave}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="w-10 h-12 flex items-center justify-center"
                        animate={highlightedPinId === '2' ? { 
                          scale: [1, 1.2, 1], 
                          rotate: [0, 5, -5, 0] 
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg className="w-10 h-12 drop-shadow-lg" viewBox="0 0 24 28" fill="none">
                          <path 
                            d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" 
                            fill="#f97316" 
                            stroke="#ffffff" 
                            strokeWidth="2"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                          />
                        </svg>
                        <span className="absolute text-white font-bold text-sm top-2">2</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div 
                    key="sample-pin-3"
                    initial={{ scale: 0, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
                    className={cn(
                      "absolute transform -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto",
                      highlightedPinId === '3' && "z-10"
                    )}
                    style={{ left: '77%', top: '63%' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPinClick({ id: '3', x: 77, y: 63, severity: 'low', status: 'closed', issueType: 'insulation' })
                    }}
                    onMouseEnter={(e) => handlePinHover({ id: '3', x: 77, y: 63, severity: 'low', status: 'closed', issueType: 'insulation' }, e)}
                    onMouseLeave={handlePinLeave}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <motion.div 
                        className="w-10 h-12 flex items-center justify-center"
                        animate={highlightedPinId === '3' ? { 
                          scale: [1, 1.2, 1], 
                          rotate: [0, 5, -5, 0] 
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg className="w-10 h-12 drop-shadow-lg" viewBox="0 0 24 28" fill="none">
                          <path 
                            d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" 
                            fill="#10b981" 
                            stroke="#ffffff" 
                            strokeWidth="2"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                          />
                        </svg>
                        <span className="absolute text-white font-bold text-sm top-2">3</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Dynamic pins with filtering */}
                  {filteredPins.map((pin, index) => (
                    <motion.div
                      key={pin.id}
                      initial={{ scale: 0, y: -50 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 + index * 0.1 }}
                      className={cn(
                        "absolute transform -translate-x-1/2 -translate-y-full cursor-pointer pointer-events-auto",
                        highlightedPinId === pin.id && "z-10"
                      )}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onPinClick(pin)
                      }}
                      onMouseEnter={(e) => handlePinHover(pin, e)}
                      onMouseLeave={handlePinLeave}
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="relative">
                        <motion.div 
                          className="w-10 h-12 flex items-center justify-center"
                          animate={highlightedPinId === pin.id ? { 
                            scale: [1, 1.2, 1], 
                            rotate: [0, 5, -5, 0] 
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <svg className="w-10 h-12 drop-shadow-lg" viewBox="0 0 24 28" fill="none">
                            <path 
                              d="M12 0C5.373 0 0 5.373 0 12c0 9 12 16 12 16s12-7 12-16c0-6.627-5.373-12-12-12z" 
                              fill={getSeverityColor(pin.severity)} 
                              stroke="#ffffff" 
                              strokeWidth="2"
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                            />
                          </svg>
                          <span className="absolute text-white font-bold text-xs top-2">
                            {pin.id.slice(-1)}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Enhanced Pin Legend */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md rounded-xl p-4 text-white shadow-xl border border-white/10"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Pin Legend</span>
            <span className="text-xs opacity-75">{pins.length + 3} pins</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 bg-orange-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 bg-yellow-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
              />
              <span>Low</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Pin Preview Tooltip */}
      <AnimatePresence>
        {hoveredPin && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-4 max-w-sm z-50 pointer-events-none"
            style={{ left: previewPosition.x, top: previewPosition.y }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <motion.div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: getSeverityColor(hoveredPin.severity) }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-white font-bold text-sm">{hoveredPin.id.slice(-1)}</span>
              </motion.div>
              <div>
                <div className="font-semibold text-gray-900">
                  {pinData[hoveredPin.id]?.id || `PIN-${hoveredPin.id}`}
                </div>
                <div className="text-xs text-gray-600">
                  {pinData[hoveredPin.id]?.issueType || hoveredPin.issueType}
                </div>
              </div>
            </div>
            
            {/* Preview Image Placeholder */}
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
              <motion.svg 
                className="w-8 h-8 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </motion.svg>
            </div>
            
            {/* Status and Severity Badges */}
            <div className="flex justify-between items-center">
              <motion.span 
                className={cn("px-3 py-1 text-xs font-semibold rounded-full", getStatusColors(hoveredPin.status))}
                whileHover={{ scale: 1.05 }}
              >
                {hoveredPin.status.charAt(0).toUpperCase() + hoveredPin.status.slice(1)}
              </motion.span>
              <motion.span 
                className={cn("px-3 py-1 text-xs font-semibold rounded-full", getSeverityColors(hoveredPin.severity))}
                whileHover={{ scale: 1.05 }}
              >
                {hoveredPin.severity.charAt(0).toUpperCase() + hoveredPin.severity.slice(1)}
              </motion.span>
            </div>
            
            {/* Coordinates Display */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Position:</span>
                <span>({hoveredPin.x.toFixed(1)}%, {hoveredPin.y.toFixed(1)}%)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}