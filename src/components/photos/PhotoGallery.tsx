// PhotoGallery.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePhotoUpload } from '@/lib/hooks/usePhotoUpload';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Camera, Upload, MoreVertical, Download, Trash2, Eye,
  ZoomIn, Calendar, User, FileText, Wifi, WifiOff
} from 'lucide-react';
import { format } from 'date-fns';

export interface PinPhoto {
  id: string;
  pin_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_type: 'defect' | 'completion' | 'general';
  storage_url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  uploaded_at: string;
  metadata?: {
    originalName?: string;
    originalSize?: number;
    compressed?: boolean;
    hasThumbnail?: boolean;
    _offline?: boolean;
    _cachedAt?: string;
  };
  uploader?: {
    name: string;
    avatar_url?: string;
  };
}

interface PhotoGalleryProps {
  pinId: string;
  photos: PinPhoto[];
  onRefresh?: () => void;
  className?: string;
}

export function PhotoGallery({ pinId, photos, onRefresh, className }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PinPhoto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PinPhoto | null>(null);
  const { deletePhoto, isOffline } = usePhotoUpload();
  const { user, profile } = useAuth();
  
  const canPerformAction = (requiredRole: string) => {
    return profile?.role === requiredRole || profile?.role === 'Admin';
  };

  const handleDelete = useCallback(async (photo: PinPhoto) => {
    const success = await deletePhoto(photo.id);
    if (success) {
      setDeleteConfirm(null);
      onRefresh?.();
    }
  }, [deletePhoto, onRefresh]);

  const handleDownload = useCallback(async (photo: PinPhoto) => {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch(photo.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }, []);

  const canUpload = canPerformAction('Foreman');
  const canDelete = canPerformAction('Foreman');

  if (!canUpload && !canDelete) {
    return (
      <Card className={cn("p-4 border-dashed border-2 text-center text-muted-foreground", className)}>
        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">You do not have permission to upload or delete photos.</p>
      </Card>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {photos.map(photo => (
        <Card key={photo.id} className="relative">
          <CardContent className="p-0 overflow-hidden">
            <img src={photo.thumbnail_url || photo.storage_url} alt={photo.file_name} className="w-full h-24 object-cover" />
            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setSelectedPhoto(photo)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleDownload(photo)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onSelect={() => setDeleteConfirm(photo)}>
                      <Trash2 className="h-4 w-4 mr-2 text-red-500" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm">{format(new Date(photo.uploaded_at), 'MMM d, yyyy')}</div>
              <Badge variant="outline" className="text-xs">{formatFileSize(photo.file_size)}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* תצוגת דיאלוג תצוגה */}
      {selectedPhoto && (
        <Dialog open={true} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedPhoto.file_name}</DialogTitle>
              <DialogDescription>Uploaded by {selectedPhoto.uploader?.name}</DialogDescription>
            </DialogHeader>
            <img src={selectedPhoto.storage_url} alt={selectedPhoto.file_name} className="w-full" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPhoto(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* דיאלוג אישור מחיקה */}
      {deleteConfirm && (
        <Dialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Photo</DialogTitle>
              <DialogDescription>Are you sure you want to delete this photo?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
