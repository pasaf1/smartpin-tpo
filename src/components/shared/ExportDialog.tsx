'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pins?: any[]
  selectedPin?: any
}

type ExportType = 'csv-pins' | 'pdf-pins'

export function ExportDialog({
  open,
  onOpenChange,
  pins = [],
  selectedPin
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('csv-pins')
  const [options, setOptions] = useState({
    includePhotos: false,
    includeTechnicalDetails: true,
    includeTimestamps: true
  })

  const handleExport = () => {
    // Simplified export logic
    console.log('Exporting:', exportType, 'with options:', options)
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
              {exportType === 'pdf-pins' && (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}