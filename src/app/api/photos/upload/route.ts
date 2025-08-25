import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ImageOptimizer } from '@/lib/utils/imageOptimization'
import { photoStorage } from '@/lib/storage/photoStorage'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File
    const pinId = formData.get('pinId') as string
    const uploadType = formData.get('uploadType') as string
    const compress = formData.get('compress') === 'true'
    const generateThumbnail = formData.get('generateThumbnail') === 'true'

    if (!file || !pinId || !uploadType) {
      return NextResponse.json(
        { error: 'Missing required fields: photo, pinId, uploadType' },
        { status: 400 }
      )
    }

    const validation = ImageOptimizer.validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await photoStorage.ensureBucketExists()

    const processed = await ImageOptimizer.processImageForUpload(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      generateThumbnail,
      addWatermark: true,
      watermarkText: `SmartPin TPO - ${new Date().toLocaleDateString()}`
    })

    const storagePath = photoStorage.generateStoragePath(
      pinId,
      uploadType as 'defect' | 'completion' | 'general',
      processed.main.file.name
    )

    const uploadResult = await photoStorage.uploadFile(
      processed.main.file,
      storagePath
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      )
    }

    let thumbnailUrl: string | null = null
    let thumbnailPath: string | null = null
    if (processed.thumbnail) {
      thumbnailPath = photoStorage.generateStoragePath(
        pinId,
        uploadType as 'defect' | 'completion' | 'general',
        'thumbnail.jpg',
        true
      )

      const thumbnailResult = await photoStorage.uploadFile(
        processed.thumbnail,
        thumbnailPath
      )

      if (thumbnailResult.success) {
        thumbnailUrl = photoStorage.getPublicUrl(thumbnailPath)
      }
    }

    const publicUrl = photoStorage.getPublicUrl(uploadResult.data.path)

    const { data: photoRecord, error: dbError } = await supabase
      .from('pin_photos')
      .insert({
        pin_id: pinId,
        file_name: processed.main.file.name,
        file_path: uploadResult.data.path,
        file_size: processed.main.file.size,
        mime_type: processed.main.file.type,
        upload_type: uploadType,
        storage_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        uploaded_by: session.user.id,
        file_hash: processed.hash,
        compression_ratio: processed.main.compressionRatio,
        upload_source: 'web',
        processing_status: 'completed',
        metadata: {
          originalName: file.name,
          originalSize: file.size,
          compressed: compress,
          hasThumbnail: !!processed.thumbnail,
          imageMetadata: processed.metadata,
          compressionRatio: processed.main.compressionRatio
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert failed:', dbError)
      await photoStorage.deleteFile(uploadResult.data.path)
      if (thumbnailUrl && thumbnailPath) {
        await photoStorage.deleteFile(thumbnailPath)
      }
      
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photo: photoRecord,
      compression: {
        originalSize: processed.main.originalSize,
        compressedSize: processed.main.compressedSize,
        ratio: processed.main.compressionRatio
      }
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('id')

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    const { data: photo, error: fetchError } = await supabase
      .from('pin_photos')
      .select('*')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const canDelete = userProfile?.role && ['Foreman', 'Supervisor', 'QA_Manager', 'Admin'].includes(userProfile.role)
    const isOwner = photo.uploaded_by === session.user.id

    if (!canDelete && !isOwner) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (photo.file_path) {
      await photoStorage.deleteFile(photo.file_path)
    }

    if (photo.thumbnail_url) {
      const thumbPath = photo.thumbnail_url.split('/pin-photos/')[1]
      if (thumbPath) {
        await photoStorage.deleteFile(thumbPath)
      }
    }

    const { error: deleteError } = await supabase
      .from('pin_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Photo deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}