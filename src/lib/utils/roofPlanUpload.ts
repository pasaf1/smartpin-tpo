export interface RoofPlanUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export async function uploadRoofPlanImage(file: File): Promise<RoofPlanUploadResult> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/roofplans/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Upload failed'
      }
    }

    return {
      success: true,
      url: result.url,
      path: result.path
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}