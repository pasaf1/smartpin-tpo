'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MentionInput } from '@/components/ui/mention-input'
import { usePinStatusManager } from '@/lib/hooks/usePinStatusManager'
import PhotoDashboard from '@/components/photos/PhotoDashboard'
import PhotoUploadZone from '@/components/photos/PhotoUploadZone'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { PinItemsTable } from '@/components/tables/PinItemsTable'
import { PinCanvas } from '@/components/canvas/PinCanvas'
import { format, getISOWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'

interface PinDetailsCardProps {
  pin: PinWithRelations
  roofId: string
  roofName?: string
  backgroundImageUrl?: string
  onClosurePhoto?: (pinId: string) => void
  onStatusChange?: (pinId: string, status: string) => void
  onSeverityChange?: (pinId: string, severity: string) => void
  onChildPinCreate?: (parentPinId: string, x: number, y: number) => void
  className?: string
}

export function PinDetailsCard({ 
  pin, 
  roofId, 
  roofName = 'E1 Demo Roof',
  backgroundImageUrl,
  onClosurePhoto, 
  onStatusChange, 
  onSeverityChange,
  onChildPinCreate,
  className 
}: PinDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [openingImage, setOpeningImage] = useState<File | null>(null)
  const [closureImage, setClosureImage] = useState<File | null>(null)
  const [pinChatMessage, setPinChatMessage] = useState('')
  
  // Pin status management
  const {
    isUpdating,
    lastUpdateResult,
    handleChildPinClosurePhoto,
    handleCloseChildPin,
    getStatusSummary,
    validateClosure,
    clearLastResult
  } = usePinStatusManager()

  // Demo users for mentions
  const demoUsers = [
    { id: '1', name: 'Asaf Peer', email: 'asaf6peer@gmail.com', role: 'Inspector', status: 'active' as const },
    { id: '2', name: 'John Doe', email: 'john@contractor.com', role: 'Foreman', status: 'active' as const },
    { id: '3', name: 'Sarah Miller', email: 'sarah@qa.com', role: 'Supervisor', status: 'active' as const },
    { id: '4', name: 'Mike Smith', email: 'mike@contractor.com', role: 'Contractor', status: 'active' as const }
  ]

  // Auto-generated fields
  const currentDate = new Date()
  const incrId = `INCR-${currentDate.getFullYear()}-${String(pin.seq_number || 1).padStart(3, '0')}`
  const dateOfOpening = format(currentDate, 'dd/MM/yyyy')
  const weekWW = getISOWeek(currentDate)
  const yearYYYY = currentDate.getFullYear()

  // INCR State
  const [incrData, setIncrData] = useState({
    contractor_name: 'Rafed Ltd.',
    foreman_name: 'John Doe',
    zone_detail: 'Zone 4 – Drainage Area',
    defect_layer: 'Insulation',
    defect_type: 'Poor Adhesion',
    defect_category: 'INCR' as const,
    quantity_area_affected: '12 m²',
    responsible_party: 'Contractor QC',
    inspection_notes: '',
    inspector_name: 'Asaf Peer'
  })

  const handleSave = () => {
    console.log('Save INCR changes:', incrData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleImageUpload = (type: 'opening' | 'closure', file: File | null) => {
    if (type === 'opening') {
      setOpeningImage(file)
    } else {
      setClosureImage(file)
      // When a closure photo is uploaded, automatically change status to Ready for Inspection
      if (file && pin.status === 'Open') {
        onStatusChange?.(pin.id, 'ReadyForInspection')
      }
    }
  }

  const handleChildPinClosurePhotoUpload = async (childPinId: string, file: File | null) => {
    if (!file || !pin.children) return

    try {
      // Find the child pin
      const childPin = pin.children.find(child => child.id === childPinId)
      if (!childPin) return

      // Process the closure photo with enhanced status management
      const result = await handleChildPinClosurePhoto(
        childPin,
        pin,
        pin.children,
        file
      )

      // Show notifications to user
      result.notifications.forEach(notification => {
        console.log('Status Update:', notification)
      })

      // In a real implementation, this would trigger:
      // - Database updates
      // - Real-time notifications to mentioned users
      // - UI state updates
      
    } catch (error) {
      console.error('Failed to process child pin closure photo:', error)
      alert('Failed to upload closure photo. Please try again.')
    }
  }

  const handleCloseChildPinClick = async (child: any) => {
    if (!pin.children) return

    try {
      // Close the child pin with enhanced status management
      const result = await handleCloseChildPin(
        child,
        pin,
        pin.children
      )

      // Show notifications to user
      result.notifications.forEach(notification => {
        console.log('Status Update:', notification)
      })

      // Show success message
      alert(`Child pin "${child.title}" has been successfully closed!`)
      
    } catch (error) {
      console.error('Failed to close child pin:', error)
      alert(error instanceof Error ? error.message : 'Failed to close child pin. Please try again.')
    }
  }

  const handleSendPinMessage = (message: string) => {
    console.log(`Sending message for pin ${pin.id}:`, message)
    // In a real implementation, this would send the message to your chat system
    // with the mentioned users extracted for notifications
  }

  return (
    <ScrollArea className={cn("h-full max-h-[90vh]", className)}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        
        {/* INCR HEADER */}
        <Card className="border-2 border-blue-500/20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-blue-900">{incrId}</CardTitle>
                <CardDescription className="text-lg font-medium text-blue-700">
                  Internal Non-Conformance Record
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={pin.status} />
                <SeverityBadge severity={pin.severity} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📋 Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-slate-600">INCR ID</Label>
              <Input value={incrId} disabled className="bg-slate-50 font-mono text-blue-700" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Roof Name</Label>
              <Input value={roofName} disabled className="bg-slate-50" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Contractor Name</Label>
              <Select value={incrData.contractor_name} onValueChange={(value) => 
                setIncrData(prev => ({...prev, contractor_name: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rafed Ltd.">Rafed Ltd.</SelectItem>
                  <SelectItem value="BuildCorp Inc.">BuildCorp Inc.</SelectItem>
                  <SelectItem value="Elite Construction">Elite Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Foreman Name</Label>
              <Select value={incrData.foreman_name} onValueChange={(value) => 
                setIncrData(prev => ({...prev, foreman_name: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Mike Smith">Mike Smith</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Zone / Detail</Label>
              <Input 
                value={incrData.zone_detail}
                onChange={(e) => setIncrData(prev => ({...prev, zone_detail: e.target.value}))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Location (Coordinates)</Label>
              <Input 
                value={`X: ${pin.x_position?.toFixed(2) || 0}, Y: ${pin.y_position?.toFixed(2) || 0}`} 
                disabled 
                className="bg-slate-50 font-mono"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Date of Opening</Label>
              <Input value={dateOfOpening} disabled className="bg-slate-50" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Week (WW) / Year</Label>
              <Input value={`${weekWW} / ${yearYYYY}`} disabled className="bg-slate-50" />
            </div>
          </CardContent>
        </Card>

        {/* DEFECT INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">🔧 Defect Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-slate-600">Defect Layer</Label>
              <Select value={incrData.defect_layer} onValueChange={(value) => 
                setIncrData(prev => ({...prev, defect_layer: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Insulation">Insulation</SelectItem>
                  <SelectItem value="Membrane">Membrane</SelectItem>
                  <SelectItem value="Flashing">Flashing</SelectItem>
                  <SelectItem value="Vapor Barrier">Vapor Barrier</SelectItem>
                  <SelectItem value="Drainage">Drainage</SelectItem>
                  <SelectItem value="Structural">Structural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Defect Type</Label>
              <Select value={incrData.defect_type} onValueChange={(value) => 
                setIncrData(prev => ({...prev, defect_type: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Poor Adhesion">Poor Adhesion</SelectItem>
                  <SelectItem value="Membrane Separation">Membrane Separation</SelectItem>
                  <SelectItem value="Water Penetration">Water Penetration</SelectItem>
                  <SelectItem value="Seam Failure">Seam Failure</SelectItem>
                  <SelectItem value="Surface Damage">Surface Damage</SelectItem>
                  <SelectItem value="Installation Error">Installation Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Defect Category</Label>
              <Select value={incrData.defect_category} onValueChange={(value: any) => 
                setIncrData(prev => ({...prev, defect_category: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCR">INCR</SelectItem>
                  <SelectItem value="Punchlist">Punchlist</SelectItem>
                  <SelectItem value="Trade Damage">Trade Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Severity</Label>
              <Select value={pin.severity} onValueChange={(value) => onSeverityChange?.(pin.id, value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">🔴 Critical</SelectItem>
                  <SelectItem value="High">🟠 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-600">Quantity / Area Affected</Label>
              <Input 
                value={incrData.quantity_area_affected}
                onChange={(e) => setIncrData(prev => ({...prev, quantity_area_affected: e.target.value}))}
                placeholder="e.g., 12 m², 5 linear meters, 1 unit"
              />
            </div>
          </CardContent>
        </Card>

        {/* ENHANCED PHOTO MANAGEMENT */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📸 Photo Management</CardTitle>
            <CardDescription>
              Upload, manage, and organize photos for this pin with automatic compression and cloud storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoDashboard pinId={pin.id} />
          </CardContent>
        </Card>

        {/* STATUS & TRACKING */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📊 Status & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-slate-600">Current Status</Label>
              <Select value={pin.status} onValueChange={(value) => onStatusChange?.(pin.id, value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">🔴 Open</SelectItem>
                  <SelectItem value="ReadyForInspection">🟡 Ready for Inspection</SelectItem>
                  <SelectItem value="Closed">🟢 Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Responsible Party</Label>
              <Select value={incrData.responsible_party} onValueChange={(value) => 
                setIncrData(prev => ({...prev, responsible_party: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contractor QC">Contractor QC</SelectItem>
                  <SelectItem value="Site Supervisor">Site Supervisor</SelectItem>
                  <SelectItem value="Quality Inspector">Quality Inspector</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Inspector Name</Label>
              <Input 
                value={incrData.inspector_name}
                onChange={(e) => setIncrData(prev => ({...prev, inspector_name: e.target.value}))}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-600">Inspection Notes / Comments</Label>
              <Textarea 
                value={incrData.inspection_notes}
                onChange={(e) => setIncrData(prev => ({...prev, inspection_notes: e.target.value}))}
                placeholder="e.g., Gap between insulation boards > ¼'"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* CHILD PINS (SUB-PINS) SECTION */}
        {!pin.parent_pin_id && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-800">👥 Child Pins (Sub-Pins)</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => onChildPinCreate?.(pin.id, pin.x_position + 10, pin.y_position + 10)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  ➕ Add Child Pin
                </Button>
              </div>
              <CardDescription>
                Manage sub-defects related to this main pin. Each child pin has independent status tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Summary */}
              {pin.children && pin.children.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 border mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3">Status Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const summary = getStatusSummary(pin, pin.children || [])
                      return (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-800">{summary.totalChildren}</div>
                            <div className="text-xs text-slate-600">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{summary.open}</div>
                            <div className="text-xs text-slate-600">Open</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-amber-600">{summary.readyForInspection}</div>
                            <div className="text-xs text-slate-600">Ready</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{summary.closed}</div>
                            <div className="text-xs text-slate-600">Closed</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                      <span>Completion Progress</span>
                      <span>{getStatusSummary(pin, pin.children || []).completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getStatusSummary(pin, pin.children || []).completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              {pin.children && pin.children.length > 0 ? (
                <div className="space-y-4">
                  {pin.children.map((child, index) => (
                    <div key={child.id} className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">
                            {pin.seq_number}.{index + 1}
                          </span>
                          <h4 className="font-medium text-slate-800">{child.title}</h4>
                          <StatusBadge status={child.status} />
                          <SeverityBadge severity={child.severity} />
                        </div>
                        <div className="flex items-center gap-2">
                          {child.status !== 'Closed' && (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleChildPinClosurePhotoUpload(child.id, e.target.files?.[0] || null)}
                                className="hidden"
                                id={`child-closure-${child.id}`}
                              />
                              <Button size="sm" variant="outline" asChild>
                                <label htmlFor={`child-closure-${child.id}`} className="cursor-pointer">
                                  📷 Closure Photo
                                </label>
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            ✏️ Edit
                          </Button>
                          {child.status === 'ReadyForInspection' && (
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={isUpdating}
                              onClick={() => handleCloseChildPinClick(child)}
                            >
                              {isUpdating ? '⏳ Closing...' : '✅ Close'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{child.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Created: {format(new Date(child.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        <span>Location: X:{child.x_position}, Y:{child.y_position}</span>
                        {child.completed_at && (
                          <span>Completed: {format(new Date(child.completed_at), 'dd/MM/yyyy HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-sm">No child pins created yet</p>
                  <p className="text-xs mt-1">Click "Add Child Pin" to create sub-defects</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PIN LOCATION VISUALIZATION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">📍 Pin Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="text-center text-slate-600 text-sm mb-4">
                Pin Location: X: {pin.x_position?.toFixed(2) || 0}, Y: {pin.y_position?.toFixed(2) || 0}
                {pin.parent_pin_id && (
                  <div className="text-xs text-blue-600 mt-1">
                    Child of Pin #{pin.parent?.seq_number}
                  </div>
                )}
              </div>
              {backgroundImageUrl && (
                <div className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden">
                  <img 
                    src={backgroundImageUrl} 
                    alt="Roof plan" 
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-2 -translate-y-2"
                    style={{
                      left: `${(pin.x_position || 0) * 100}%`,
                      top: `${(pin.y_position || 0) * 100}%`
                    }}
                  />
                  {/* Show parent pin if this is a child */}
                  {pin.parent_pin_id && pin.parent && (
                    <div 
                      className="absolute w-3 h-3 bg-blue-500 rounded-full border border-white shadow-md transform -translate-x-1.5 -translate-y-1.5"
                      style={{
                        left: `${(pin.parent.x_position || 0) * 100}%`,
                        top: `${(pin.parent.y_position || 0) * 100}%`
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PIN CHAT HISTORY - Each Father Pin has its own chat */}
        {!pin.parent_pin_id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">💬 Pin Chat & History</CardTitle>
              <CardDescription>
                Communication history for Pin #{pin.seq_number} - includes all activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample messages - in real implementation this would come from your chat system */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    AP
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-50 rounded-lg p-3 border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">Asaf Peer</span>
                        <span className="text-xs text-slate-500">Inspector • 2 hours ago</span>
                      </div>
                      <p className="text-slate-700 text-sm">Pin created with initial defect assessment. Priority: {pin.severity}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-3 border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">John Doe</span>
                        <span className="text-xs text-slate-500">Foreman • 1 hour ago</span>
                      </div>
                      <p className="text-slate-700 text-sm">@AsafPeer Acknowledged. Will address this during next maintenance window.</p>
                    </div>
                  </div>
                </div>

                {pin.children && pin.children.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      SYS
                    </div>
                    <div className="flex-1">
                      <div className="bg-purple-50 rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800">System</span>
                          <span className="text-xs text-slate-500">30 minutes ago</span>
                        </div>
                        <p className="text-slate-700 text-sm">
                          {pin.children.length} child pin{pin.children.length > 1 ? 's' : ''} created for this defect
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="border-t pt-4">
                <MentionInput
                  value={pinChatMessage}
                  onChange={setPinChatMessage}
                  onSubmit={handleSendPinMessage}
                  placeholder="Add a comment... use @username to mention team members"
                  users={demoUsers}
                  className="bg-white border-slate-300 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              ❌ Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              💾 Save INCR
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              📄 Export PDF
            </Button>
            <Button variant="outline">
              📧 Send Report
            </Button>
          </div>
        </div>

      </div>
    </ScrollArea>
  )
}