// PhotoUploadZone.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { usePhotoUpload } from '@/lib/hooks/usePhotoUpload';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Camera, Upload, X, CheckCircle, AlertCircle,
  FileImage, Smartphone, WifiOff, Wifi
} from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadZoneProps {
  pinId: string;
  defaultType?: 'defect' | 'completion' | 'general';
  onUploadComplete?: () => void;
  className?: string;
  compact?: boolean;
}

export function PhotoUploadZone({
  pinId,
  defaultType = 'defect',
  onUploadComplete,
  className,
  compact = false
}: PhotoUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadType, setUploadType] = useState<'defect'|'completion'|'general'>(defaultType);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploads, uploadMultiplePhotos, clearUpload, isOffline } = usePhotoUpload();
  const { profile } = useAuth();
  
  const canPerformAction = (requiredRole: string) => {
    return profile?.role === requiredRole || profile?.role === 'Admin';
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canUpload = canPerformAction('Foreman');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canUpload) {
      toast.error('Permission denied', { description: 'You do not have permission to upload photos' });
      return;
    }
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) {
      toast.error('Invalid files', { description: 'Please select image files only' });
      return;
    }
    setSelectedFiles(files);
  }, [canUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    try {
      const results = await uploadMultiplePhotos(selectedFiles, pinId, uploadType, {
        compress: true,
        generateThumbnail: true,
        onProgress: (completed, total) => {
          if (completed === total) {
            setSelectedFiles([]);
            onUploadComplete?.();
          }
        }
      });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      if (successCount > 0) {
        toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} upload${failCount > 1 ? 's' : ''} failed`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', { description: 'Please try again' });
    }
  }, [selectedFiles, pinId, uploadType, uploadMultiplePhotos, onUploadComplete]);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  if (!canUpload) {
    return (
      <Card className={cn("p-4 border-dashed border-2 text-center text-muted-foreground", className)}>
        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">You do not have permission to upload photos</p>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex gap-2", className)}>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Gallery
        </Button>
        {isOffline && (
          <Badge variant="secondary" className="ml-2">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload Photos</h3>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <Badge variant="secondary">
              <WifiOff className="h-3 w-3 mr-1" /> Offline Mode
            </Badge>
          ) : (
            <Badge variant="default">
              <Wifi className="h-3 w-3 mr-1" /> Online
            </Badge>
          )}
        </div>
      </div>

      <Card
        className={cn(
          "border-dashed border-2 transition-colors",
          isDragOver && "border-primary bg-primary/5",
          !isDragOver && "border-muted-foreground/25"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className={cn(
                "h-6 w-6",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-lg font-medium">Drop photos here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse from your device
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 max-w-[140px]"
              >
                <Smartphone className="h-4 w-4 mr-2" /> Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 max-w-[140px]"
              >
                <FileImage className="h-4 w-4 mr-2" /> Choose Files
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Select value={uploadType} onValueChange={(val: any) => setUploadType(val)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defect">Defect</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
              </Button>
              <Button variant="outline" onClick={clearSelection}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium">Upload Progress</h4>
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{upload.file.name}</span>
                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearUpload(upload.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={cn("h-full", upload.status === 'error' ? "bg-red-500" : "bg-primary")}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                {upload.error && (
                  <p className="text-xs text-red-500">{upload.error}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isOffline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-2 text-orange-700">
            <WifiOff className="h-4 w-4" />
            <div>
              <p className="font-medium">Working Offline</p>
              <p className="text-xs">
                Photos will be uploaded when connection is restored.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
