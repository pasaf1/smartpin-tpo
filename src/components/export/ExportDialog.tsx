// ExportDialog.tsx
'use client';

import React, { useState } from 'react';
import { useCurrentUser } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExportManager, ChatExporter, ProjectExporter, ImageExporter, ExportOptions } from '@/lib/utils/exportUtils';

interface ExportDialogProps {
  roofId: string;
  roofName: string;
  messages: any[];
  pins: any[];
  users: any[];
  roofData: any;
  children?: React.ReactNode;
  className?: string;
}

const DATE_PRESETS = [
  { label: 'Last 24 hours', value: 'day', days: 1 },
  { label: 'Last week', value: 'week', days: 7 },
  { label: 'Last month', value: 'month', days: 30 },
  { label: 'Last 3 months', value: '3months', days: 90 },
  { label: 'All time', value: 'all', days: null },
  { label: 'Custom range', value: 'custom', days: null }
];

export default function ExportDialog({
  roofId, roofName, messages, pins, users, roofData, children, className
}: ExportDialogProps) {
  const { data: currentUser } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'project'|'chat'|'both'>('both');
  const [exportFormat, setExportFormat] = useState<'pdf'|'csv'|'both'>('pdf');
  const [datePreset, setDatePreset] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedMessageTypes, setSelectedMessageTypes] = useState<string[]>(['text','mention','attachment','system']);

  if (!currentUser) {
    return null;
  }

  const getDateRange = () => {
    const now = new Date();
    const preset = DATE_PRESETS.find(p => p.value === datePreset);
    if (preset && preset.days) {
      return {
        start: subDays(now, preset.days),
        end: now
      };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate)
      };
    }
    return null;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dateRange = getDateRange();
      const exportOptions: ExportOptions = {
        includeImages,
        includeAttachments,
        dateRange: dateRange || undefined,
        userFilter: selectedUsers.length > 0 ? selectedUsers : undefined,
        messageType: selectedMessageTypes as any
      };
      const exportData = { roof: roofData, pins: pins || [], messages: messages || [], users: users || [] };
      if (exportType === 'project') {
        if (exportFormat === 'pdf') {
          await ProjectExporter.exportRoofToPDF(exportData);
        } else if (exportFormat === 'csv') {
          await ProjectExporter.exportRoofToCSV(exportData);
        } else {
          await ProjectExporter.exportRoofToPDF(exportData);
          await ProjectExporter.exportRoofToCSV(exportData);
        }
      } else if (exportType === 'chat') {
        if (exportFormat === 'pdf') {
          await ChatExporter.exportToPDF(messages, roofName, exportOptions);
        } else if (exportFormat === 'csv') {
          await ChatExporter.exportToCSV(messages, roofName, exportOptions);
        } else {
          await ChatExporter.exportToPDF(messages, roofName, exportOptions);
          await ChatExporter.exportToCSV(messages, roofName, exportOptions);
        }
      } else {
        // both
        await ExportManager.exportComplete(exportData, exportFormat as any, exportOptions);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCaptureRoofPlan = async () => {
    try {
      const canvasElement = document.querySelector('svg.canvas-svg') as SVGSVGElement;
      if (canvasElement) {
        await ImageExporter.captureCanvasWithPins(canvasElement, roofName);
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const messageCount = messages?.length || 0;
  const filteredMessageCount = messages?.filter((msg: any) => {
    const dateRange = getDateRange();
    if (dateRange) {
      const msgDate = new Date(msg.created_at);
    }
    if (selectedUsers.length > 0 && !selectedUsers.includes(msg.user_id)) return false;
    if (!selectedMessageTypes.includes((msg as any).message_type)) return false;
    return true;
  }).length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={cn("gap-2", className)}>
            📄 Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📄 Export Data <Badge variant="outline">{roofName}</Badge>
          </DialogTitle>
          <DialogDescription>
            Export project data, chat messages, and attachments for reporting
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* סוג פורמט הייצוא */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Export Type</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Complete Project', value: 'both', desc: 'Includes all data' },
                  { label: 'Project Only', value: 'project', desc: 'Roof info and team' },
                  { label: 'Chat Only', value: 'chat', desc: 'Team communication' }
                ].map((opt) => (
                  <div key={opt.value}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={opt.value}
                        checked={exportType === opt.value}
                        onChange={(e) => setExportType(e.target.value as any)}
                        className="text-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                      {opt.value === 'both' && <Badge variant="secondary">Recommended</Badge>}
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">{opt.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Export Format</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['pdf', 'csv', 'both'].map((fmt) => (
                  <div key={fmt}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={fmt}
                        checked={exportFormat === fmt}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="text-primary"
                      />
                      <span className="text-sm capitalize">{fmt}</span>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" onClick={handleCaptureRoofPlan} className="w-full justify-start gap-2">
                  📸 Capture Roof Plan
                </Button>
                <p className="text-xs text-muted-foreground">Save roof view with pins as image</p>
              </CardContent>
            </Card>
          </div>

          {/* סינונים ואופציות */}
          <div className="space-y-4">
            {(exportType === 'chat' || exportType === 'both') && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Date Range</CardTitle>
                    <CardDescription className="text-xs">
                      {messageCount} total • {filteredMessageCount} to export
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={datePreset} onValueChange={setDatePreset}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DATE_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {datePreset === 'custom' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-xs">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Message Types</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { value: 'text', label: 'Regular Messages', icon: '💬' },
                      { value: 'mention', label: '@Mentions', icon: '👤' },
                      { value: 'attachment', label: 'File Attachments', icon: '📎' },
                      { value: 'system', label: 'System Messages', icon: '⚙️' }
                    ].map(type => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.value}`}
                          checked={selectedMessageTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedMessageTypes([...selectedMessageTypes, type.value]);
                            else setSelectedMessageTypes(selectedMessageTypes.filter(t => t !== type.value));
                          }}
                        />
                        <Label htmlFor={`type-${type.value}`} className="text-sm flex items-center gap-1">
                          <span>{type.icon}</span>{type.label}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Content Options</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-images"
                        checked={includeImages}
                        onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeImages(Boolean(checked))}
                      />
                      <Label htmlFor="include-images" className="text-sm">
                        Include images in PDF
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-attachments"
                        checked={includeAttachments}
                        onCheckedChange={(checked) => setIncludeAttachments(Boolean(checked))}
                      />
                      <Label htmlFor="include-attachments" className="text-sm">
                        List file attachments
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Export Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Pins:</span><span>{pins?.length || 0}</span></div>
                <div className="flex justify-between"><span>Messages:</span><span>{filteredMessageCount}</span></div>
                <div className="flex justify-between"><span>Team Members:</span><span>{users?.length || 0}</span></div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Format:</span><span className="capitalize">{exportFormat}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Files will be downloaded to your device
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>Cancel</Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? '📤 Exporting...' : '📤 Export'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
