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

    // Get current session to include in request headers
    const response = await fetch('/api/roofplans/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it for FormData with boundary
        'Cache-Control': 'no-cache',
      },
      credentials: 'include' // Ensure cookies are included
    })

    const result = await response.json()

    if (!response.ok) {
      // Enhanced error handling for authentication issues
      if (response.status === 401) {
        return {
          success: false,
          error: result.error || 'Authentication required - please refresh the page and try again'
        }
      } else if (response.status === 403) {
        return {
          success: false,
          error: result.error || 'Insufficient permissions for this operation'
        }
      } else {
        return {
          success: false,
          error: result.error || 'Upload failed'
        }
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