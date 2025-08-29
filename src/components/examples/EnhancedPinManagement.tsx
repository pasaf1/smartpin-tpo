// Example component using the enhanced services and hooks
import React from 'react'
import { usePinsForRoof, useCreatePin, useUpdatePin, useDeletePin, useUploadPhoto, useServiceError } from '../../lib/hooks/useEnhancedPins'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'

interface EnhancedPinManagementProps {
  roofId: string
}

export function EnhancedPinManagement({ roofId }: EnhancedPinManagementProps) {
  const { handleError } = useServiceError()
  
  // Fetch pins with enhanced error handling
  const {
    data: pins,
    isLoading,
    error,
    refetch
  } = usePinsForRoof(roofId)

  // Pin mutations with proper error handling
  const createPinMutation = useCreatePin()
  const updatePinMutation = useUpdatePin()
  const deletePinMutation = useDeletePin()
  const uploadPhotoMutation = useUploadPhoto()

  // Handle create pin with validation
  const handleCreatePin = async (x: number, y: number, zone?: string) => {
    try {
      await createPinMutation.mutateAsync({
        roof_id: roofId,
        x,
        y,
        zone
      })
    } catch (error) {
      const errorInfo = handleError(error, 'CreatePin')
      console.error('Failed to create pin:', errorInfo)
      // Show user-friendly error message
      alert(errorInfo.message)
    }
  }

  // Handle pin status update
  const handleUpdatePinStatus = async (pinId: string, status: 'Open' | 'ReadyForInspection' | 'Closed') => {
    try {
      await updatePinMutation.mutateAsync({
        pinId,
        updates: { status }
      })
    } catch (error) {
      const errorInfo = handleError(error, 'UpdatePin')
      console.error('Failed to update pin:', errorInfo)
      alert(errorInfo.message)
    }
  }

  // Handle pin deletion with confirmation
  const handleDeletePin = async (pinId: string) => {
    if (!confirm('האם אתם בטוחים שברצונכם למחוק את הנקודה?')) {
      return
    }

    try {
      await deletePinMutation.mutateAsync(pinId)
    } catch (error) {
      const errorInfo = handleError(error, 'DeletePin')
      console.error('Failed to delete pin:', errorInfo)
      alert(errorInfo.message)
    }
  }

  // Handle photo upload with progress
  const handleUploadPhoto = async (file: File, pinId: string) => {
    try {
      await uploadPhotoMutation.mutateAsync({
        pin_id: pinId,
        type: 'OpenPIC',
        file,
        notes: 'תמונה נוספה דרך הממשק המשופר'
      })
    } catch (error) {
      const errorInfo = handleError(error, 'UploadPhoto')
      console.error('Failed to upload photo:', errorInfo)
      alert(errorInfo.message)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">טוען נקודות...</div>
      </div>
    )
  }

  // Error state with Hebrew messages
  if (error) {
    const errorInfo = handleError(error, 'LoadPins')
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {errorInfo.message}
          {errorInfo.canRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => refetch()}
            >
              נסה שוב
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ניהול נקודות משופר</h2>
        <Button
          onClick={() => handleCreatePin(100, 100)}
          disabled={createPinMutation.isPending}
        >
          {createPinMutation.isPending ? 'יוצר...' : 'צור נקודה'}
        </Button>
      </div>

      {/* Pins list with enhanced error handling */}
      <div className="grid gap-4">
        {pins?.map((pin) => (
          <div
            key={pin.id}
            className="border rounded-lg p-4 bg-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">נקודה #{pin.seq_number}</h3>
                <p className="text-sm text-muted-foreground">
                  מיקום: {pin.x}, {pin.y}
                </p>
                <p className="text-sm text-muted-foreground">
                  סטטוס: {pin.status}
                </p>
                {pin.zone && (
                  <p className="text-sm text-muted-foreground">
                    אזור: {pin.zone}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {/* Status update buttons */}
                {pin.status !== 'Closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdatePinStatus(pin.id, 'ReadyForInspection')}
                    disabled={updatePinMutation.isPending}
                  >
                    מוכן לבדיקה
                  </Button>
                )}

                {pin.status === 'ReadyForInspection' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdatePinStatus(pin.id, 'Closed')}
                    disabled={updatePinMutation.isPending}
                  >
                    סגור
                  </Button>
                )}

                {/* Photo upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleUploadPhoto(file, pin.id)
                    }
                  }}
                  className="hidden"
                  id={`photo-${pin.id}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById(`photo-${pin.id}`)?.click()}
                  disabled={uploadPhotoMutation.isPending}
                >
                  {uploadPhotoMutation.isPending ? 'מעלה...' : 'העלה תמונה'}
                </Button>

                {/* Delete button */}
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDeletePin(pin.id)}
                  disabled={deletePinMutation.isPending}
                >
                  מחק
                </Button>
              </div>
            </div>

            {/* Upload progress */}
            {uploadPhotoMutation.progress.status === 'uploading' && (
              <div className="mt-2">
                <div className="text-sm text-muted-foreground mb-1">
                  מעלה תמונה... {uploadPhotoMutation.progress.progress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadPhotoMutation.progress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Children pins */}
            {pin.pin_children && pin.pin_children.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">תת-נקודות:</h4>
                <div className="space-y-2">
                  {pin.pin_children.map((child) => (
                    <div
                      key={child.child_id}
                      className="bg-muted p-2 rounded text-sm"
                    >
                      <div className="flex justify-between">
                        <span>{child.child_code}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          child.status_child === 'Closed' ? 'bg-green-100 text-green-800' :
                          child.status_child === 'ReadyForInspection' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {child.status_child}
                        </span>
                      </div>
                      {child.defect_type && (
                        <div className="text-muted-foreground mt-1">
                          סוג ליקוי: {child.defect_type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {pin.photos && pin.photos.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">תמונות ({pin.photos.length}):</h4>
                <div className="flex gap-2">
                  {pin.photos.slice(0, 3).map((photo) => (
                    <div
                      key={photo.photo_id}
                      className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs"
                    >
                      📷
                    </div>
                  ))}
                  {pin.photos.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs">
                      +{pin.photos.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
