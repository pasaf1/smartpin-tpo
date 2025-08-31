'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useExport } from '@/lib/hooks/useExport'
import { ActivityLogger } from '@/lib/activity/ActivityLogger'
import { Download, FileText, Image, Calendar, Settings } from 'lucide-react'
import type { PinWithRelations, PinChild } from '@/lib/database.types'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pins?: PinWithRelations[]
  selectedPin?: PinWithRelations
  pinChildren?: PinChild[]
  projectId?: string
  roofId?: string
  activityLogger?: ActivityLogger
}

type ExportType = 'csv-pins' | 'csv-project' | 'csv-analytics' | 'pdf-pin' | 'pdf-pins'

export function ExportDialog({
  open,
  onOpenChange,
  pins = [],
  selectedPin,
  pinChildren = [],
  projectId,
  roofId,
  activityLogger
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('csv-pins')
  const [customFilename, setCustomFilename] = useState('')
  const [options, setOptions] = useState({
    includePhotos: false,
    includeTechnicalDetails: true,
    includeTimestamps: true,
    dateFormat: 'US' as 'ISO' | 'US' | 'EU'
  })

  const {
    isExporting,
    exportProgress,
    exportPinsCSV,
    exportProjectCSV,
    exportAnalyticsCSV,
    exportPinPDF,
    exportPinsPDF
  } = useExport({ projectId, roofId, activityLogger })

  const handleExport = async () => {
    const filename = customFilename.trim() || undefined
    
    switch (exportType) {
      case 'csv-pins':
        await exportPinsCSV(pins, filename, options)
        break
      case 'csv-project':
        await exportProjectCSV(filename, options)
        break
      case 'csv-analytics':
        await exportAnalyticsCSV(filename)
        break
      case 'pdf-pin':
        if (selectedPin) {
          await exportPinPDF(selectedPin, pinChildren, options)
        }
        break
      case 'pdf-pins':
        await exportPinsPDF(pins, options)
        break
    }
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Choose export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Type */}
          <div className="space-y-3">
            <Label>Export Type</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv-pins" id="csv-pins" />
                <Label htmlFor="csv-pins">CSV - Issues ({pins.length} pins)</Label>
              </div>
              {projectId && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv-project" id="csv-project" />
                  <Label htmlFor="csv-project">CSV - Project Summary</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv-analytics" id="csv-analytics" />
                <Label htmlFor="csv-analytics">CSV - Analytics Report</Label>
              </div>
              {selectedPin && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf-pin" id="pdf-pin" />
                  <Label htmlFor="pdf-pin">PDF - Single Pin</Label>
                </div>
              )}
              {pins.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf-pins" id="pdf-pins" />
                  <Label htmlFor="pdf-pins">PDF - Multiple Pins</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="technical"
                  checked={options.includeTechnicalDetails}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeTechnicalDetails: !!checked }))
                  }
                />
                <Label htmlFor="technical">Technical Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={options.includeTimestamps}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, includeTimestamps: !!checked }))
                  }
                />
                <Label htmlFor="timestamps">Timestamps</Label>
              </div>
              {exportType.startsWith('pdf') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photos"
                    checked={options.includePhotos}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includePhotos: !!checked }))
                    }
                  />
                  <Label htmlFor="photos">Photos</Label>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <Progress value={exportProgress} />
              <div className="text-sm text-center">
                {exportProgress < 100 ? 'Exporting...' : 'Complete!'}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}