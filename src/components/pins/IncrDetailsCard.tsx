'use client'

import { useMemo, useState, useId, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { format, getISOWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  Camera, 
  Edit3, 
  Plus, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText,
  Share2,
  Download,
  Upload,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import type { PinWithRelations } from '@/lib/hooks/usePins'
import type { PinStatus, Severity as PinSeverity } from '@/lib/database.types'

interface IncrDetailsCardProps {
  pin: PinWithRelations
  roofId: string
  roofName?: string
  backgroundImageUrl?: string
  onClosurePhoto?: (pinId: string, file: File) => Promise<void>
  onStatusChange?: (pinId: string, status: string) => Promise<void>
  onSeverityChange?: (pinId: string, severity: string) => Promise<void>
  onChildPinCreate?: (parentPinId: string, x: number, y: number) => Promise<void>
  onUpdate?: (pin: any) => Promise<void>
  onDelete?: (pinId: string) => Promise<void>
  className?: string
}

interface ChildPin {
  id: string
  title?: string
  description?: string
  status: PinStatus
  severity: PinSeverity
  created_at?: string
  completed_at?: string
  x_position?: number
  y_position?: number
  photos?: Array<{ id: string; url: string; type: 'opening' | 'closure' }>
}

export function IncrDetailsCard({
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
}: IncrDetailsCardProps) {
  const uid = useId()
  const [isEditing, setIsEditing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['details', 'roof-plan']))
  const [globalCompletionCounter, setGlobalCompletionCounter] = useState(0)

  // Normalize children data
  const children = useMemo<ChildPin[]>(
    () => (((pin as any)?.children ?? (pin as any)?.child_pins) ?? []) as ChildPin[],
    [pin]
  )

  // Generate INCR ID
  const openedAt = ((pin as any).opened_at ?? (pin as any).created_at) as string | undefined
  const openedDate = openedAt ? new Date(openedAt) : new Date()
  const incrId = useMemo(() => {
    const seq = String((pin as any).seq_number ?? 1).padStart(3, '0')
    return `INCR-${openedDate.getFullYear()}-${seq}`
  }, [pin, openedDate])

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const totalPins = 1 + children.length // Include parent pin
    const closedPins = [pin, ...children].filter((p: any) => p.status === 'Closed').length
    const readyPins = [pin, ...children].filter((p: any) => p.status === 'ReadyForInspection').length
    const openPins = [pin, ...children].filter((p: any) => p.status === 'Open').length
    
    return {
      total: totalPins,
      closed: closedPins,
      ready: readyPins,
      open: openPins,
      percentage: totalPins > 0 ? Math.round((closedPins / totalPins) * 100) : 0
    }
  }, [pin, children])

  // Update global counter when pins are closed
  useEffect(() => {
    setGlobalCompletionCounter(completionStats.closed)
  }, [completionStats.closed])

  // Section toggle functionality
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Handle closure photo upload with automatic status change
  const handleClosurePhotoUpload = async (pinId: string, file: File) => {
    try {
      toast.loading('Uploading closure photo...', { id: 'closure-upload' })
      
      // Upload photo
      await onClosurePhoto?.(pinId, file)
      
      // Auto-change status to Ready for Inspection if currently Open
      const targetPin = pinId === (pin as any).id ? pin : children.find(c => c.id === pinId)
      if (targetPin && (targetPin as any).status === 'Open') {
        await onStatusChange?.(pinId, 'ReadyForInspection')
      }
      
      toast.success('Closure photo uploaded! Status updated to Ready for Inspection.', { id: 'closure-upload' })
    } catch (error) {
      toast.error('Failed to upload closure photo', { id: 'closure-upload' })
      console.error('Closure photo upload error:', error)
    }
  }

  // Handle pin closure with global counter update
  const handleClosureComplete = async (pinId: string) => {
    try {
      toast.loading('Closing pin...', { id: 'pin-closure' })
      
      await onStatusChange?.(pinId, 'Closed')
      
      // Update global completion counter
      setGlobalCompletionCounter(prev => prev + 1)
      
      toast.success('Pin closed successfully! Global counter updated.', { id: 'pin-closure' })
    } catch (error) {
      toast.error('Failed to close pin', { id: 'pin-closure' })
      console.error('Pin closure error:', error)
    }
  }

  // Add child pin functionality
  const handleAddChild = useCallback(async () => {
    try {
      const parentX = Number((pin as any).x_position ?? 0.5)
      const parentY = Number((pin as any).y_position ?? 0.5)
      
      // Add slight offset for child pin
      const childX = Math.max(0, Math.min(1, parentX + 0.02))
      const childY = Math.max(0, Math.min(1, parentY + 0.02))
      
      await onChildPinCreate?.((pin as any).id, childX, childY)
      toast.success('Child pin created successfully!')
    } catch (error) {
      toast.error('Failed to create child pin')
      console.error('Child pin creation error:', error)
    }
  }, [pin, onChildPinCreate])

  // Pin container component for consistent styling
  const PinContainer = ({ 
    pinData, 
    isPrimary = false, 
    children: containerChildren 
  }: { 
    pinData: any
    isPrimary?: boolean
    children: React.ReactNode 
  }) => (
    <Card className={cn(
      "border-2 transition-all duration-200",
      isPrimary 
        ? "border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50" 
        : "border-slate-200 bg-white hover:border-slate-300"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
              isPrimary 
                ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                : "bg-gradient-to-br from-slate-500 to-slate-600"
            )}>
              {isPrimary ? (pin as any).seq_number : `${(pin as any).seq_number}.${children.indexOf(pinData) + 1}`}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {isPrimary ? `Primary Pin ${(pin as any).seq_number}` : pinData.title || `Sub-Pin ${children.indexOf(pinData) + 1}`}
              </h3>
              <p className="text-sm text-slate-600">{pinData.description || 'No description provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={pinData.status} />
            <SeverityBadge severity={pinData.severity} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {containerChildren}
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <ScrollArea className="h-full max-h-[95vh]">
        <div className="p-4 space-y-4">

          {/* Mobile-First Header */}
          <Card className="border-2 border-blue-500/20 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-blue-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {incrId}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base font-medium text-blue-700">
                    Internal Non-Conformance Record
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Badge variant="outline" className="bg-white/50">
                    {roofName}
                  </Badge>
                </div>
              </div>
              
              {/* Global Completion Counter */}
              <div className="mt-3 p-3 bg-white/60 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Completion Progress</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{globalCompletionCounter}</div>
                    <div className="text-xs text-slate-600">of {completionStats.total} closed</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionStats.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-1 text-center">
                    {completionStats.percentage}% Complete
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Collapsible Basic Details Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer pb-2"
              onClick={() => toggleSection('details')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Basic Details
                </CardTitle>
                {expandedSections.has('details') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            {expandedSections.has('details') && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">INCR ID</Label>
                      <div className="font-mono text-blue-700 bg-slate-50 px-2 py-1 rounded">{incrId}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Date of Opening</Label>
                      <div className="text-slate-800">{format(openedDate, 'dd/MM/yyyy')}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Week / Year</Label>
                      <div className="text-slate-800">{getISOWeek(openedDate)} / {openedDate.getFullYear()}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Coordinates</Label>
                      <div className="font-mono text-slate-700 text-xs">
                        X: {((pin as any).x_position ?? 0).toFixed(3)}, Y: {((pin as any).y_position ?? 0).toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Inspector</Label>
                      <div className="text-slate-800">Asaf Peer</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Contractor</Label>
                      <div className="text-slate-800">Rafed Ltd.</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Roof Plan with Parent Pin Visualization */}
          <Card>
            <CardHeader 
              className="cursor-pointer pb-2"
              onClick={() => toggleSection('roof-plan')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Roof Plan & Pin Location
                </CardTitle>
                {expandedSections.has('roof-plan') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            {expandedSections.has('roof-plan') && (
              <CardContent className="pt-0">
                <div className="relative w-full h-48 sm:h-64 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200">
                  {backgroundImageUrl ? (
                    <img
                      src={backgroundImageUrl}
                      alt="Roof plan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No roof plan image available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Parent Pin Marker */}
                  <div
                    className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 flex items-center justify-center"
                    style={{
                      left: `${((pin as any).x_position ?? 0.5) * 100}%`,
                      top: `${((pin as any).y_position ?? 0.5) * 100}%`
                    }}
                  >
                    <span className="text-white text-xs font-bold">{(pin as any).seq_number}</span>
                  </div>
                  
                  {/* Child Pin Markers */}
                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      className="absolute w-4 h-4 bg-orange-500 rounded-full border border-white shadow-md transform -translate-x-2 -translate-y-2 flex items-center justify-center"
                      style={{
                        left: `${(child.x_position ?? 0.5) * 100}%`,
                        top: `${(child.y_position ?? 0.5) * 100}%`
                      }}
                    >
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>Primary Pin</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Child Pins</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Primary Pin Container */}
          <PinContainer pinData={pin} isPrimary={true}>
            <div className="space-y-4">
              
              {/* Primary Pin Actions */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleClosurePhotoUpload((pin as any).id, file)
                  }}
                  className="hidden"
                  id={`primary-closure-${uid}`}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <label htmlFor={`primary-closure-${uid}`} className="cursor-pointer">
                    <Camera className="w-4 h-4 mr-1" />
                    Closure Photo
                  </label>
                </Button>
                
                {(pin as any).status === 'ReadyForInspection' && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    onClick={() => handleClosureComplete((pin as any).id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Close Pin
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>

              {/* Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Status</Label>
                  <Select 
                    value={(pin as any).status} 
                    onValueChange={(value) => onStatusChange?.((pin as any).id, value)}
                  >
                    <SelectTrigger className="h-8">
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
                  <Label className="text-xs font-medium text-slate-600">Severity</Label>
                  <Select 
                    value={(pin as any).severity} 
                    onValueChange={(value) => onSeverityChange?.((pin as any).id, value)}
                  >
                    <SelectTrigger className="h-8">
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
              </div>
            </div>
          </PinContainer>

          {/* Child Pins Section */}
          {children.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Child Pins ({children.length})
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={handleAddChild}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {children.map((child, index) => (
                    <PinContainer key={child.id} pinData={child}>
                      <div className="space-y-3">
                        
                        {/* Child Pin Actions */}
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleClosurePhotoUpload(child.id, file)
                            }}
                            className="hidden"
                            id={`child-closure-${uid}-${child.id}`}
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            asChild
                            className="flex-1 sm:flex-none"
                          >
                            <label htmlFor={`child-closure-${uid}-${child.id}`} className="cursor-pointer">
                              <Camera className="w-4 h-4 mr-1" />
                              Closure Photo
                            </label>
                          </Button>
                          
                          {child.status === 'ReadyForInspection' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                              onClick={() => handleClosureComplete(child.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Close
                            </Button>
                          )}
                        </div>

                        {/* Child Pin Details */}
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>Created: {child.created_at ? format(new Date(child.created_at), 'dd/MM/yyyy HH:mm') : 'Unknown'}</div>
                          <div>Location: X:{(child.x_position ?? 0).toFixed(3)}, Y:{(child.y_position ?? 0).toFixed(3)}</div>
                          {child.completed_at && (
                            <div>Completed: {format(new Date(child.completed_at), 'dd/MM/yyyy HH:mm')}</div>
                          )}
                        </div>
                      </div>
                    </PinContainer>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Child Pin if no children exist */}
          {children.length === 0 && !(pin as any).parent_pin_id && (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="py-8 text-center">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h3 className="font-medium text-slate-700 mb-2">No Child Pins</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Create sub-defects for more detailed tracking
                </p>
                <Button 
                  onClick={handleAddChild}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Child Pin
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mobile-Optimized Action Bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 mt-6 -mx-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit INCR
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                  onClick={() => toast.success('INCR saved successfully!')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit INCR Details</DialogTitle>
            <DialogDescription>
              Update the information for {incrId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input 
                id="edit-title" 
                defaultValue={(pin as any).title || ''} 
                placeholder="Enter pin title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                defaultValue={(pin as any).description || ''} 
                placeholder="Enter detailed description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false)
                toast.success('INCR updated successfully!')
              }}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
