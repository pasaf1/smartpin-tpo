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
  Calendar,
  Shield
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import type { PinWithRelations } from '@/lib/types/relations'
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
  opening_photo_url?: string
  closure_photo_url?: string
}

interface PhotoContainerProps {
  pinId: string
  pinNumber: string | number
  title: string
  type: 'opening' | 'closure'
  photoUrl?: string
  status: PinStatus
  onPhotoUpload: (file: File) => void
  canUpload: boolean
  isAdminOnly?: boolean
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
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'Admin'

  // Photo Container Component
  const PhotoContainer = ({ 
    pinId, 
    pinNumber, 
    title, 
    type, 
    photoUrl, 
    status, 
    onPhotoUpload, 
    canUpload, 
    isAdminOnly = false 
  }: PhotoContainerProps) => {
    const fileInputId = `${type}-photo-${pinId}-${uid}`
    const canUserUpload = canUpload && (!isAdminOnly || isAdmin)
    
    // Dynamic styling based on status and type
    const getContainerStyle = () => {
      if (type === 'opening') {
        return {
          borderColor: isAdminOnly ? 'border-orange-300' : 'border-orange-200',
          bgColor: photoUrl ? 'bg-orange-100/80' : 'bg-orange-50/50',
          accentColor: 'bg-orange-500',
          textColor: 'text-orange-800'
        }
      } else {
        // Closure photo styling based on status
        switch (status) {
          case 'Open':
            return {
              borderColor: 'border-red-300',
              bgColor: photoUrl ? 'bg-red-100/80' : 'bg-red-50/50',
              accentColor: 'bg-red-500',
              textColor: 'text-red-800'
            }
          case 'ReadyForInspection':
            return {
              borderColor: 'border-yellow-300',
              bgColor: photoUrl ? 'bg-yellow-100/80' : 'bg-yellow-50/50',
              accentColor: 'bg-yellow-500',
              textColor: 'text-yellow-800'
            }
          case 'Closed':
            return {
              borderColor: 'border-green-300',
              bgColor: photoUrl ? 'bg-green-100/80' : 'bg-green-50/50',
              accentColor: 'bg-green-600',
              textColor: 'text-green-800'
            }
          default:
            return {
              borderColor: 'border-slate-300',
              bgColor: photoUrl ? 'bg-slate-100/80' : 'bg-slate-50/50',
              accentColor: 'bg-slate-500',
              textColor: 'text-slate-800'
            }
        }
      }
    }
    
    const containerStyle = getContainerStyle()
    
    return (
      <Card className={cn(
        "border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1",
        containerStyle.borderColor,
        containerStyle.bgColor
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg",
              containerStyle.accentColor
            )}>
              {type === 'opening' ? '📷' : status === 'Closed' ? '✅' : status === 'ReadyForInspection' ? '⏳' : '🔄'}
            </div>
            <div className="flex-1">
              <h4 className={cn("font-semibold text-sm", containerStyle.textColor)}>
                {title} - {type === 'opening' ? 'Opening Photo' : 'Closure Photo'}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-600">Pin #{pinNumber}</p>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Photo Display Area */}
            <div className={cn(
              "relative w-full h-36 rounded-lg overflow-hidden border-2 border-dashed transition-all duration-300",
              photoUrl ? "border-solid" : containerStyle.borderColor,
              photoUrl ? containerStyle.bgColor : "bg-slate-100"
            )}>
              {photoUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={photoUrl}
                    alt={`${type} photo for pin ${pinNumber}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white text-slate-800"
                        onClick={() => window.open(photoUrl, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {canUserUpload && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 hover:bg-white text-slate-800"
                          onClick={() => document.getElementById(fileInputId)?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Replace
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className={cn(
                      "text-xs shadow-lg",
                      containerStyle.accentColor
                    )}>
                      {type === 'opening' ? 'Opening' : 'Closure'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg",
                      containerStyle.accentColor
                    )}>
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <p className={cn("text-sm font-medium", containerStyle.textColor)}>
                      No {type} photo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {type === 'opening' ? 'Admin can upload' : 'Upload to close defect'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upload Controls */}
            <div className="flex gap-2">
              {canUserUpload && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onPhotoUpload(file)
                    }}
                    className="hidden"
                    id={fileInputId}
                  />
                  <Button 
                    size="sm" 
                    className={cn(
                      "flex-1 text-white shadow-lg hover:shadow-xl transition-all duration-200",
                      containerStyle.accentColor,
                      photoUrl ? "hover:opacity-90" : "animate-pulse"
                    )}
                    asChild
                  >
                    <label htmlFor={fileInputId} className="cursor-pointer">
                      <Upload className="w-3 h-3 mr-1" />
                      {photoUrl ? 'Replace Photo' : `Upload ${type === 'opening' ? 'Opening' : 'Closure'}`}
                    </label>
                  </Button>
                </>
              )}
              
              {!canUserUpload && isAdminOnly && (
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled
                  className="flex-1"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Only
                </Button>
              )}
            </div>
            
            {/* Status Info */}
            <div className="text-xs space-y-1">
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                containerStyle.bgColor
              )}>
                <span className={cn("font-medium", containerStyle.textColor)}>
                  Status: {status}
                </span>
                {type === 'closure' && !photoUrl && status === 'Open' && (
                  <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                    Photo Required
                  </Badge>
                )}
                {type === 'closure' && photoUrl && status === 'ReadyForInspection' && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                    Awaiting Review
                  </Badge>
                )}
                {type === 'closure' && status === 'Closed' && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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

  // Auto-expand sections when children are added
  useEffect(() => {
    if (children.length > 0) {
      setExpandedSections(prev => new Set([...prev, 'child-pins']))
    }
  }, [children.length])

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
      
      // Auto-expand child pins section when first child is added
      if (children.length === 0) {
        setExpandedSections(prev => new Set([...prev, 'child-pins']))
        toast.success('First child pin created! Photo containers are now available.')
      } else {
        toast.success('Child pin created successfully!')
      }
    } catch (error) {
      toast.error('Failed to create child pin')
      console.error('Child pin creation error:', error)
    }
  }, [pin, onChildPinCreate, children.length])

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

          {/* Roof Plan with Only Selected Parent Pin */}
          <Card>
            <CardHeader 
              className="cursor-pointer pb-2"
              onClick={() => toggleSection('roof-plan')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Roof Plan & Selected Pin
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
                  
                  {/* Only Show Selected Parent Pin */}
                  <div
                    className="absolute w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-4 -translate-y-4 flex items-center justify-center animate-pulse"
                    style={{
                      left: `${((pin as any).x_position ?? 0.5) * 100}%`,
                      top: `${((pin as any).y_position ?? 0.5) * 100}%`
                    }}
                  >
                    <span className="text-white text-sm font-bold">{(pin as any).seq_number}</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-3 flex items-center justify-center text-xs">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="font-medium">Selected Pin #{(pin as any).seq_number}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Primary Pin Container with Photo Containers */}
          <PinContainer pinData={pin} isPrimary={true}>
            <div className="space-y-4">
              
              {/* Photo Containers for Primary Pin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opening Photo Container */}
                <div className="relative">
                  {/* Glow effect for opening photo */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg blur opacity-25 animate-pulse"></div>
                  <PhotoContainer
                    pinId={(pin as any).id}
                    pinNumber={(pin as any).seq_number}
                    title="Primary Pin"
                    type="opening"
                    photoUrl={(pin as any).opening_photo_url}
                    status={(pin as any).status}
                    onPhotoUpload={(file) => {
                      // Handle opening photo upload
                      console.log('Opening photo uploaded for primary pin:', file.name)
                      toast.success('Opening photo uploaded successfully!')
                    }}
                    canUpload={true}
                    isAdminOnly={true}
                  />
                </div>
                
                {/* Closure Photo Container */}
                <div className="relative">
                  {/* Dynamic glow effect based on status */}
                  <div className={cn(
                    "absolute -inset-1 rounded-lg blur opacity-25 transition-all duration-500",
                    (pin as any).status === 'Open' ? "bg-gradient-to-r from-red-400 to-red-600 animate-pulse" :
                    (pin as any).status === 'ReadyForInspection' ? "bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse" :
                    (pin as any).status === 'Closed' ? "bg-gradient-to-r from-green-400 to-green-600" : ""
                  )}></div>
                  <PhotoContainer
                    pinId={(pin as any).id}
                    pinNumber={(pin as any).seq_number}
                    title="Primary Pin"
                    type="closure"
                    photoUrl={(pin as any).closure_photo_url}
                    status={(pin as any).status}
                    onPhotoUpload={(file) => handleClosurePhotoUpload((pin as any).id, file)}
                    canUpload={true}
                    isAdminOnly={false}
                  />
                </div>
              </div>

              {/* Status Change Actions */}
              {(pin as any).status === 'ReadyForInspection' && (
                <div className="flex justify-center">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleClosureComplete((pin as any).id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Close Primary Pin
                  </Button>
                </div>
              )}

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
                    Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {children.map((child, index) => (
                    <div key={child.id} className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50/50">
                      {/* Child Pin Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(pin as any).seq_number}.{index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {child.title || `Sub-Pin ${index + 1}`}
                            </h3>
                            <p className="text-sm text-slate-600">{child.description || 'No description provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={child.status} />
                          <SeverityBadge severity={child.severity} />
                        </div>
                      </div>
                      
                      {/* Photo Containers for Child Pin */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Opening Photo Container */}
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg blur opacity-20 animate-pulse"></div>
                          <PhotoContainer
                            pinId={child.id}
                            pinNumber={`${(pin as any).seq_number}.${index + 1}`}
                            title={`Sub-Pin ${index + 1}`}
                            type="opening"
                            photoUrl={child.opening_photo_url}
                            status={child.status}
                            onPhotoUpload={(file) => {
                              // Handle opening photo upload for child
                              console.log('Opening photo uploaded for child pin:', file.name)
                              toast.success('Opening photo uploaded successfully!')
                            }}
                            canUpload={true}
                            isAdminOnly={true}
                          />
                        </div>
                        
                        {/* Closure Photo Container */}
                        <div className="relative">
                          <div className={cn(
                            "absolute -inset-1 rounded-lg blur opacity-20 transition-all duration-500",
                            child.status === 'Open' ? "bg-gradient-to-r from-red-400 to-red-600 animate-pulse" :
                            child.status === 'ReadyForInspection' ? "bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse" :
                            child.status === 'Closed' ? "bg-gradient-to-r from-green-400 to-green-600" : ""
                          )}></div>
                          <PhotoContainer
                            pinId={child.id}
                            pinNumber={`${(pin as any).seq_number}.${index + 1}`}
                            title={`Sub-Pin ${index + 1}`}
                            type="closure"
                            photoUrl={child.closure_photo_url}
                            status={child.status}
                            onPhotoUpload={(file) => handleClosurePhotoUpload(child.id, file)}
                            canUpload={true}
                            isAdminOnly={false}
                          />
                        </div>
                      </div>

                      {/* Child Pin Actions */}
                      {child.status === 'ReadyForInspection' && (
                        <div className="flex justify-center mb-4">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleClosureComplete(child.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Close Sub-Pin
                          </Button>
                        </div>
                      )}

                      {/* Child Pin Details */}
                      <div className="text-xs text-slate-600 space-y-1 pt-3 border-t border-slate-200">
                        <div>Created: {child.created_at ? format(new Date(child.created_at), 'dd/MM/yyyy HH:mm') : 'Unknown'}</div>
                        <div>Location: X:{(child.x_position ?? 0).toFixed(3)}, Y:{(child.y_position ?? 0).toFixed(3)}</div>
                        {child.completed_at && (
                          <div>Completed: {format(new Date(child.completed_at), 'dd/MM/yyyy HH:mm')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Child Pin if no children exist */}
          {children.length === 0 && !(pin as any).parent_pin_id && (
            <Card className="border-dashed border-2 border-slate-300 hover:border-emerald-400 transition-all duration-300">
              <CardContent className="py-8 text-center">
                <div className="relative">
                  {/* Animated glow for call-to-action */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur opacity-20 animate-pulse"></div>
                  <Users className="relative w-12 h-12 text-slate-400 mx-auto mb-4" />
                </div>
                <h3 className="font-medium text-slate-700 mb-2">No Child Pins Yet</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Create sub-defects with separate photo containers for detailed tracking
                </p>
                <div className="space-y-2 text-xs text-slate-500 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Each child pin gets opening photo container (Admin only)</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Each child pin gets closure photo container (All users)</span>
                  </div>
                </div>
                <Button 
                  onClick={handleAddChild}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
