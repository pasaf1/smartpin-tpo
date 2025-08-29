'use client'

import { useMemo, useState, useId, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MentionInput } from '@/components/ui/mention-input'
import { usePinStatusManager } from '@/lib/hooks/usePinStatusManager'
import { PhotoDashboard } from '@/components/photos/PhotoDashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { format, getISOWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'
import type { PinStatus, Severity as PinSeverity, Pin } from '@/lib/database.types'
import { 
  deriveIssueRowStatusFromPin, 
  getIssueStatusColor, 
  getIssueStatusIcon, 
  formatIssueId 
} from '@/lib/utils/issueStatus'

interface PinDetailsCardProps {
  pin: PinWithRelations
  roofId: string
  roofName?: string
  backgroundImageUrl?: string
  onClosurePhoto?: (pinId: string) => void
  onStatusChange?: (pinId: string, status: string) => void
  onSeverityChange?: (pinId: string, severity: string) => void
  onChildPinCreate?: (parentPinId: string, x: number, y: number) => void
  onUpdate?: (updatedPin: any) => void | Promise<void>
  onDelete?: (pinId: string) => void | Promise<void>
  className?: string
}

export function PinDetailsCard({
  pin,
  roofId,
  roofName = 'Roof',
  backgroundImageUrl,
  onClosurePhoto,
  onStatusChange,
  onSeverityChange,
  onChildPinCreate,
  onUpdate,
  onDelete,
  className
}: PinDetailsCardProps) {
  const uid = useId()
  const [isEditing, setIsEditing] = useState(false)
  const [openingImage, setOpeningImage] = useState<File | null>(null)
  const [closureImage, setClosureImage] = useState<File | null>(null)
  const [pinChatMessage, setPinChatMessage] = useState('')

  // normalize children once + type
  type ChildPin = {
    id: string
    title?: string
    description?: string
    status: PinStatus
    severity: PinSeverity
    created_at?: string
    completed_at?: string
    x_position?: number
    y_position?: number
  }

  const children = useMemo<ChildPin[]>(
    () => (((pin as any)?.children ?? (pin as any)?.child_pins) ?? []) as ChildPin[],
    [pin]
  )

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

  // Get users from database
  // TODO: Implement actual user management
  const users = [
    { id: '1', name: 'Current User', email: 'user@system.com', role: 'Inspector', status: 'active' as const },
  ]

  // derive dates from pin when available
  const openedAt = ((pin as any).opened_at ?? (pin as any).created_at) as string | undefined
  const openedDate = openedAt ? new Date(openedAt) : new Date()
  
  // Generate Issue ID using new format
  const issueId = useMemo(() => {
    const seq = (pin as any).seq_number ?? 1
    return formatIssueId(openedDate.getFullYear(), seq)
  }, [pin, openedDate])
  
  // Derive Issue Row Status from parent + children
  const issueRowStatus = useMemo(() => {
    return deriveIssueRowStatusFromPin(pin as any)
  }, [pin, children])

  const dateOfOpening = format(openedDate, 'dd/MM/yyyy')
  const weekWW = getISOWeek(openedDate)
  const yearYYYY = openedDate.getFullYear()

  // compute status summary once
  const statusSummary = useMemo(() => getStatusSummary(pin as any, children as any), [pin, children])

  // child creation with coordinate clamping
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
  const handleAddChild = useCallback(() => {
    const px = Number((pin as any).x_position ?? 0)
    const py = Number((pin as any).y_position ?? 0)
    const dx = 0.02, dy = 0.02
    onChildPinCreate?.((pin as any).id, clamp01(px + dx), clamp01(py + dy))
  }, [pin, onChildPinCreate])

  // selects with type casting
  const onStatusSel = (v: string) => onStatusChange?.((pin as any).id, v as PinStatus)
  const onSeveritySel = (v: string) => onSeverityChange?.((pin as any).id, v as PinSeverity)

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

  const handleSave = async () => {
    console.log('Save INCR changes:', incrData)
    await onUpdate?.(pin as any)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleImageUpload = async (type: 'opening' | 'closure', file: File | null) => {
    if (type === 'opening') {
      setOpeningImage(file)
    } else {
      setClosureImage(file)
      // AUTOMATION: When a parent closure photo is uploaded, automatically change parent status to Ready for Inspection
      if (file && (pin as any).status !== 'ReadyForInspection' && (pin as any).status !== 'Closed') {
        console.log('🚀 AUTOMATION: Parent closure photo uploaded - setting status to ReadyForInspection')
        await onStatusChange?.((pin as any).id, 'ReadyForInspection')
      }
    }
  }

  const handleChildPinClosurePhotoUpload = async (childPinId: string, file: File | null) => {
    if (!file || children.length === 0) return

    try {
      // Find the child pin
      const childPin = children.find((child: any) => child.id === childPinId)
      if (!childPin) return

      console.log('🚀 AUTOMATION: Child closure photo uploaded - setting child status to ReadyForInspection')

      // AUTOMATION: Upload closure photo and set child status to ReadyForInspection
      const result = await handleChildPinClosurePhoto(
        childPin as any,
        pin as any,
        children as any,
        file
      )

      // Show notifications to user
      result.notifications.forEach((notification: any) => {
        console.log('Status Update:', notification)
      })

      // After child status change, we should trigger recompute_parent_aggregates
      // This would normally be handled by the database trigger or RPC
      console.log('🔄 Should trigger recompute_parent_aggregates for pin:', (pin as any).id)
    } catch (error) {
      console.error('Failed to process child pin closure photo:', error)
      alert('Failed to upload closure photo. Please try again.')
    }
  }

  const handleCloseChildPinClick = async (child: any) => {
    if (children.length === 0) return

    try {
      console.log('🚀 MANUAL CLOSE: Closing child issue and triggering parent aggregates recompute')

      // MANUAL CLOSE: Set child status to Closed and set completion timestamp
      const result = await handleCloseChildPin(
        child,
        pin as any,
        children as any
      )

      // Show notifications to user
      result.notifications.forEach((notification: any) => {
        console.log('Status Update:', notification)
      })

      // After child status change, we should trigger recompute_parent_aggregates
      console.log('🔄 Should trigger recompute_parent_aggregates for pin:', (pin as any).id)

      // Show success message
      alert(`Child issue "${child.title || `Issue ${child.seq_suffix || 'N/A'}`}" has been successfully closed!`)
    } catch (error) {
      console.error('Failed to close child issue:', error)
      alert(error instanceof Error ? error.message : 'Failed to close child issue. Please try again.')
    }
  }

  const handleSendPinMessage = (message: string) => {
    console.log(`Sending message for pin ${(pin as any).id}:`, message)
    setPinChatMessage('')
  }

  return (
    <ScrollArea className={cn('h-full max-h-[90vh]', className)}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* ISSUE HEADER */}
        <Card className="border-2 border-blue-500/20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-blue-900">{issueId}</CardTitle>
                <CardDescription className="text-lg font-medium text-blue-700">
                  Quality Issue Tracker
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Show Issue Row Status (aggregated status) */}
                <div className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border",
                  getIssueStatusColor(issueRowStatus)
                )}>
                  {getIssueStatusIcon(issueRowStatus)}
                  {issueRowStatus}
                </div>
                <SeverityBadge severity={(pin as any).severity} />
              </div>
            </div>
            
            {/* Issue Progress Summary */}
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Issue Progress</span>
                <span className="text-slate-600">
                  {statusSummary.closed} of {statusSummary.totalChildren + 1} items completed
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round(((statusSummary.closed + (pin.status === 'Closed' ? 1 : 0)) / (statusSummary.totalChildren + 1)) * 100)}%` 
                  }}
                />
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
              <Label className="text-sm font-medium text-slate-600">Issue ID</Label>
              <Input value={issueId} disabled className="bg-slate-50 font-mono text-blue-700" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Roof Name</Label>
              <Input value={roofName} disabled className="bg-slate-50" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Contractor Name</Label>
              <Select
                value={incrData.contractor_name}
                onValueChange={(value) => setIncrData((prev) => ({ ...prev, contractor_name: value }))}
              >
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
              <Select
                value={incrData.foreman_name}
                onValueChange={(value) => setIncrData((prev) => ({ ...prev, foreman_name: value }))}
              >
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
                onChange={(e) => setIncrData((prev) => ({ ...prev, zone_detail: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Location (Coordinates)</Label>
              <Input
                value={`X: ${((pin as any).x_position ?? 0).toFixed(2)}, Y: ${((pin as any).y_position ?? 0).toFixed(2)}`}
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
              <Select
                value={incrData.defect_layer}
                onValueChange={(value) => setIncrData((prev) => ({ ...prev, defect_layer: value }))}
              >
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
              <Select
                value={incrData.defect_type}
                onValueChange={(value) => setIncrData((prev) => ({ ...prev, defect_type: value }))}
              >
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
              <Select
                value={incrData.defect_category}
                onValueChange={(value: any) => setIncrData((prev) => ({ ...prev, defect_category: value }))}
              >
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
              <Select value={(pin as any).severity} onValueChange={onSeveritySel}>
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
                onChange={(e) => setIncrData((prev) => ({ ...prev, quantity_area_affected: e.target.value }))}
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
            <PhotoDashboard pinId={(pin as any).id} />
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
              <Select value={(pin as any).status} onValueChange={onStatusSel}>
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
              <Select
                value={incrData.responsible_party}
                onValueChange={(value) => setIncrData((prev) => ({ ...prev, responsible_party: value }))}
              >
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
                onChange={(e) => setIncrData((prev) => ({ ...prev, inspector_name: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-600">Inspection Notes / Comments</Label>
              <Textarea
                value={incrData.inspection_notes}
                onChange={(e) => setIncrData((prev) => ({ ...prev, inspection_notes: e.target.value }))}
                placeholder="e.g., Gap between insulation boards > ¼'"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* CHILD ISSUES SECTION */}
        {!((pin as any).parent_pin_id) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-800">📋 Additional Issues (Same Type)</CardTitle>
                <Button
                  size="sm"
                  onClick={handleAddChild}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  aria-label="Add additional issue of same type"
                >
                  ➕ Add Issue (Same Type)
                </Button>
              </div>
              <CardDescription>
                Manage additional occurrences of the same issue type. Each occurrence has independent status tracking and photos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Summary */}
              {children.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 border mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3">Additional Issues Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">{statusSummary.totalChildren}</div>
                      <div className="text-xs text-slate-600">Total Issues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{statusSummary.open}</div>
                      <div className="text-xs text-slate-600">Open</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">{statusSummary.readyForInspection}</div>
                      <div className="text-xs text-slate-600">Ready</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{statusSummary.closed}</div>
                      <div className="text-xs text-slate-600">Closed</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-1">
                      <span>Individual Issue Progress</span>
                      <span>{statusSummary.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${statusSummary.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child: any, index: number) => (
                    <div key={child.id} className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-800">
                            {(pin as any).seq_number}.{index + 1}
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
                                id={`child-closure-${uid}-${child.id}`}
                              />
                              <Button size="sm" variant="outline" asChild>
                                <label htmlFor={`child-closure-${uid}-${child.id}`} className="cursor-pointer" aria-label="Upload closure photo">
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
                        <span>Created: {child.created_at ? format(new Date(child.created_at), 'dd/MM/yyyy HH:mm') : '-'}</span>
                        <span>Location: X:{(child.x_position ?? 0).toFixed(2)}, Y:{(child.y_position ?? 0).toFixed(2)}</span>
                        {child.completed_at && (
                          <span>Completed: {format(new Date(child.completed_at), 'dd/MM/yyyy HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm">No additional issues created yet</p>
                  <p className="text-xs mt-1">Click &quot;Add Issue (Same Type)&quot; to create additional occurrences</p>
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
                Pin Location: X: {(((pin as any).x_position ?? 0).toFixed(2))}, Y:{' '}
                {(((pin as any).y_position ?? 0).toFixed(2))}
                {(pin as any).parent_pin_id && (
                  <div className="text-xs text-blue-600 mt-1">
                    Child of Pin #{(pin as any).parent?.seq_number}
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
                      left: `${(((pin as any).x_position ?? 0) * 100).toFixed(2)}%`,
                      top: `${(((pin as any).y_position ?? 0) * 100).toFixed(2)}%`
                    }}
                  />
                  {/* Show parent pin if this is a child */}
                  {(pin as any).parent_pin_id && (pin as any).parent && (
                    <div
                      className="absolute w-3 h-3 bg-blue-500 rounded-full border border-white shadow-md transform -translate-x-1.5 -translate-y-1.5"
                      style={{
                        left: `${((((pin as any).parent?.x_position ?? 0) * 100)).toFixed(2)}%`,
                        top: `${((((pin as any).parent?.y_position ?? 0) * 100)).toFixed(2)}%`
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ISSUE COMMUNICATION HISTORY */}
        {!((pin as any).parent_pin_id) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">💬 Issue Communication & History</CardTitle>
              <CardDescription>
                Communication history for {issueId} - includes all activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample messages */}
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
                      <p className="text-slate-700 text-sm">Pin created with initial defect assessment. Priority: {(pin as any).severity}</p>
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

                {children.length > 0 && (
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
                          {children.length} child pin{children.length > 1 ? 's' : ''} created for this defect
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
                  users={users}
                  className="bg-white border-slate-300 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
              ❌ Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              💾 Save Issue
            </Button>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">📄 Export PDF</Button>
            <Button variant="outline" className="flex-1 sm:flex-none">📧 Send Report</Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
