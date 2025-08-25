'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface PinDetails {
  id: string
  title: string
  issueType: string
  status: 'open' | 'ready' | 'closed'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  assignedTo: string
  createdAt: string
  updatedAt: string
  images: string[]
  coordinates: { x: number; y: number }
}

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  avatar: string
}

interface PinDetailsModalProps {
  pin: PinDetails | null
  isOpen: boolean
  onClose: () => void
  onUpdatePin: (pinId: string, updates: Partial<PinDetails>) => void
}

export function PinDetailsModal({ pin, isOpen, onClose, onUpdatePin }: PinDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'media'>('details')
  const [chatMessage, setChatMessage] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Sarah Chen',
      message: 'I\'ve inspected this area. The membrane damage appears to be from UV exposure.',
      timestamp: '10:30 AM',
      avatar: 'SC'
    },
    {
      id: '2',
      user: 'Mike Rodriguez',
      message: 'Confirmed. We\'ll need to schedule a repair team for next week.',
      timestamp: '10:35 AM',
      avatar: 'MR'
    },
    {
      id: '3',
      user: 'John Supervisor',
      message: 'Perfect. I\'ll coordinate with the client.',
      timestamp: '10:40 AM',
      avatar: 'JS'
    }
  ])

  if (!isOpen || !pin) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-amber-500'
      case 'low': return 'bg-emerald-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'ready': return 'bg-amber-100 text-amber-800'
      case 'closed': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = (newStatus: 'open' | 'ready' | 'closed') => {
    onUpdatePin(pin.id, { status: newStatus })
  }

  const handleSeverityChange = (newSeverity: 'critical' | 'high' | 'medium' | 'low') => {
    onUpdatePin(pin.id, { severity: newSeverity })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // Handle file drop logic here
    console.log('Files dropped:', e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      console.log('Files selected:', files)
    }
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle sending message logic
      console.log('Sending message:', chatMessage)
      setChatMessage('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-luxury-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-luxury-50 to-luxury-100 p-6 border-b border-luxury-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold", getSeverityColor(pin.severity))}>
                {pin.id.slice(-1)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-luxury-900">{pin.title}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={cn("px-3 py-1 text-sm font-semibold rounded-full", getStatusColor(pin.status))}>
                    {pin.status.charAt(0).toUpperCase() + pin.status.slice(1)}
                  </span>
                  <span className="text-luxury-600 text-sm">{pin.issueType}</span>
                  <span className="text-luxury-500 text-sm">•</span>
                  <span className="text-luxury-600 text-sm">Created {pin.createdAt}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/80 hover:bg-white rounded-xl flex items-center justify-center text-luxury-500 hover:text-luxury-700 transition-colors shadow-luxury"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="border-b border-luxury-200">
          <div className="flex">
            {['details', 'chat', 'media'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-4 text-sm font-semibold transition-colors capitalize",
                  activeTab === tab
                    ? "text-gold-600 border-b-2 border-gold-500 bg-gold-50"
                    : "text-luxury-600 hover:text-luxury-900"
                )}
              >
                {tab}
                {tab === 'chat' && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-luxury-700 mb-2">Status</label>
                  <select
                    value={pin.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="w-full bg-white border border-luxury-200 rounded-xl px-4 py-3 text-sm font-medium text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="ready">Ready for Inspection</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-luxury-700 mb-2">Severity</label>
                  <select
                    value={pin.severity}
                    onChange={(e) => handleSeverityChange(e.target.value as any)}
                    className="w-full bg-white border border-luxury-200 rounded-xl px-4 py-3 text-sm font-medium text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-luxury-700 mb-2">Description</label>
                <textarea
                  value={pin.description}
                  onChange={(e) => onUpdatePin(pin.id, { description: e.target.value })}
                  rows={4}
                  className="w-full bg-white border border-luxury-200 rounded-xl px-4 py-3 text-sm text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-luxury-700 mb-2">Assigned To</label>
                <input
                  type="text"
                  value={pin.assignedTo}
                  onChange={(e) => onUpdatePin(pin.id, { assignedTo: e.target.value })}
                  className="w-full bg-white border border-luxury-200 rounded-xl px-4 py-3 text-sm text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  placeholder="Enter team member name"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-luxury-700 mb-2">Coordinates</label>
                  <div className="text-sm text-luxury-600 bg-luxury-50 p-3 rounded-xl">
                    X: {pin.coordinates.x.toFixed(1)}, Y: {pin.coordinates.y.toFixed(1)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-luxury-700 mb-2">Last Updated</label>
                  <div className="text-sm text-luxury-600 bg-luxury-50 p-3 rounded-xl">
                    {pin.updatedAt}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-80 flex flex-col">
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {message.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-luxury-900">{message.user}</span>
                        <span className="text-xs text-luxury-500">{message.timestamp}</span>
                      </div>
                      <div className="bg-luxury-50 p-3 rounded-xl text-sm text-luxury-700">
                        {message.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-3 pt-4 border-t border-luxury-200">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white border border-luxury-200 rounded-xl px-4 py-2 text-sm text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl flex items-center justify-center hover:from-gold-600 hover:to-gold-700 transition-colors shadow-luxury"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  isDragOver ? "border-gold-400 bg-gold-50" : "border-luxury-300 bg-luxury-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg className="w-12 h-12 text-luxury-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="text-luxury-600 mb-2">Drag & drop files here or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gold-600 hover:text-gold-700 font-semibold"
                >
                  browse files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {pin.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-luxury-900 mb-4">Uploaded Images</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {pin.images.map((image, index) => (
                      <div key={index} className="relative hover:opacity-90 transition-opacity">
                        <div className="aspect-video bg-luxury-100 rounded-xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-luxury-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-75 hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-luxury-50 px-6 py-4 border-t border-luxury-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-luxury-700 hover:text-luxury-900 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle save logic
              onClose()
            }}
            className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-colors shadow-luxury"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}