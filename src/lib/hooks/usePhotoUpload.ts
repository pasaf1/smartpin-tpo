// usePhotoUpload.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UploadResult {
  success: boolean;
  file: File;
  error?: string;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export function usePhotoUpload() {
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // מאזין לשינויים במצב הרשת
  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // העלאת תמונה יחידה ל־Supabase Storage
  const uploadPhoto = async (file: File, path: string) => {
    const id = `${path}-${Date.now()}`;
    setUploads(prev => [...prev, {
      id,
      file,
      success: false,
      progress: 0,
      status: 'uploading'
    }]);
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(path, file);
      if (error || !data) throw error || new Error('Upload failed');
      // לאחר העלאה, ניתן לקבל URL ציבורי
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(data.path);
      // עדכון סטטוס הצלחה
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, success: true, status: 'completed', progress: 100 } : u
      ));
      return publicUrl || '';
    } catch (err: any) {
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, success: false, error: err.message || 'Error', status: 'error' } : u
      ));
      return '';
    }
  };

  // העלאה מקבצת של תמונות עם סיומת
  const uploadMultiplePhotos = async (
    files: File[], pinId: string, type: 'defect'|'completion'|'general',
    options?: {
      compress?: boolean;
      generateThumbnail?: boolean;
      onProgress?: (completed: number, total: number) => void;
    }
  ) => {
    const results: UploadResult[] = [];
    let completed = 0;
    for (const file of files) {
      const path = `${type}/${pinId}/${file.name}`;
      await uploadPhoto(file, path);
      completed += 1;
      options?.onProgress?.(completed, files.length);
      results.push({ success: true, file, id: '', progress: 100, status: 'completed' });
    }
    return results;
  };

  // מחיקת תמונה מהמסד (למשל לפי מזהה)
  const deletePhoto = async (photoId: string) => {
    const { error } = await supabase.from('photos').delete().eq('id', photoId);
    return !error;
  };

  // ביטול ועדכון תקלה בפעולה
  const clearUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  return { uploads, uploadMultiplePhotos, deletePhoto, clearUpload, isOffline };
}
