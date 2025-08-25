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
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PinWithRelations } from '@/lib/hooks/usePins'

interface PinDetailsCardProps {
  pin: PinWithRelations
  roofId: string
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
  backgroundImageUrl,
  onClosurePhoto, 
  onStatusChange, 
  onSeverityChange,
  onChildPinCreate,
  className 
}: PinDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(pin.title)
  const [editedDescription, setEditedDescription] = useState(pin.description || '')
  const [showChildPinForm, setShowChildPinForm] = useState(false)
  const [openImage, setOpenImage] = useState<File | null>(null)
  const [closureImage, setClosureImage] = useState<File | null>(null)

  const handleSave = () => {
    console.log('Save pin changes:', { title: editedTitle, description: editedDescription })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTitle(pin.title)
    setEditedDescription(pin.description || '')
    setIsEditing(false)
  }

  const handleChildPinCreate = (x: number, y: number) => {
    onChildPinCreate?.(pin.id, x, y)
    setShowChildPinForm(true)
  }

  const statusOptions = ['Open', 'ReadyForInspection', 'Closed']
  const severityOptions = ['Low', 'Medium', 'High', 'Critical']

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-6 space-y-6">
        
        {/* TOP SECTION: Defect Details */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-bold text-primary">#{pin.seq_number}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={pin.status} />
                    <SeverityBadge severity={pin.severity} />
                  </div>
                  {pin.parent_pin_id && (
                    <Badge variant="outline" className="text-xs">
                      Child of #{pin.parent_pin_id}
                    </Badge>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="pin-title">Title</Label>
                      <Input
                        id="pin-title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pin-description">Description</Label>
                      <Textarea
                        id="pin-description"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-xl mb-2">{pin.title}</CardTitle>
                    {pin.description && (
                      <CardDescription>{pin.description}</CardDescription>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave}>Save</Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    ✏️ Edit
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={() => onClosurePhoto?.(pin.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📸 Close Pin
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Defect Metadata Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="text-sm font-mono">
                  X: {Math.round(pin.x_position)}, Y: {Math.round(pin.y_position)}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <div className="text-sm">{format(new Date(pin.created_at), 'MMM dd, yyyy')}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <div className="text-sm">{pin.created_by}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Child Pins</Label>
                <div className="text-sm">{pin.children?.length || 0}</div>
              </div>
            </div>

            {/* Status & Severity Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={pin.status} onValueChange={(value) => onStatusChange?.(pin.id, value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status as any} />
                          {status}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Severity</Label>
                <Select value={pin.severity} onValueChange={(value) => onSeverityChange?.(pin.id, value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={severity as any} />
                          {severity}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Defect Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
                <div className="text-sm">{pin.assigned_to || 'Unassigned'}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <div className="text-sm">{pin.due_date ? format(new Date(pin.due_date), 'MMM dd, yyyy') : 'Not set'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROOF PLAN SECTION */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Pin Location</CardTitle>
                <CardDescription>Roof plan showing this pin's location</CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowChildPinForm(!showChildPinForm)}
              >
                + Add Child Pin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg border">
              <PinCanvas
                roofId={roofId}
                backgroundImageUrl={backgroundImageUrl}
                onPinCreate={handleChildPinCreate}
                selectedPinId={pin.id}
                editable={true}
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* IMAGES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Open Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Open Image</CardTitle>
              <CardDescription>Initial defect documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/10">
                {openImage ? (
                  <img 
                    src={URL.createObjectURL(openImage)} 
                    alt="Open defect image"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">No open image</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => document.getElementById('open-image-upload')?.click()}
                    >
                      📷 Upload
                    </Button>
                    <input
                      id="open-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setOpenImage(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>
              {openImage && (
                <div className="mt-2 flex justify-between">
                  <span className="text-xs text-muted-foreground">{openImage.name}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs"
                    onClick={() => setOpenImage(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closure Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Closure Image</CardTitle>
              <CardDescription>Defect resolution documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/10">
                {closureImage ? (
                  <img 
                    src={URL.createObjectURL(closureImage)} 
                    alt="Closure image"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No closure image</p>
                    <Button 
                      size="sm" 
                      className="mt-2 bg-green-600 hover:bg-green-700"
                      onClick={() => document.getElementById('closure-image-upload')?.click()}
                    >
                      ✅ Upload
                    </Button>
                    <input
                      id="closure-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setClosureImage(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>
              {closureImage && (
                <div className="mt-2 flex justify-between">
                  <span className="text-xs text-muted-foreground">{closureImage.name}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs"
                    onClick={() => setClosureImage(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Child Pin Form */}
        {showChildPinForm && (
          <Card className="border-primary/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">New Child Pin</CardTitle>
                  <CardDescription>Upload images for the child pin created</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowChildPinForm(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Open Image</Label>
                  <div className="mt-2 aspect-square rounded-lg border-2 border-dashed border-primary/25 flex items-center justify-center bg-primary/5">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <Button size="sm" variant="outline">📷 Upload Open</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Closure Image</Label>
                  <div className="mt-2 aspect-square rounded-lg border-2 border-dashed border-green-500/25 flex items-center justify-center bg-green-50">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-green-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <Button size="sm" variant="outline" className="border-green-500 text-green-700">
                        ✅ Upload Closure
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowChildPinForm(false)}>
                  Cancel
                </Button>
                <Button size="sm">
                  Save Child Pin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </ScrollArea>
  )
}