export interface RoofPlanUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export async function uploadRoofPlanImage(file: File): Promise<RoofPlanUploadResult> {
  try {
    console.log('🔍 uploadRoofPlanImage: Starting upload for file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    
    // Check if we have a valid session before attempting upload
    const { supabase } = await import('../supabase')
    let { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('⚠️ No session found, attempting session refresh...')
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session) {
        console.error('❌ Session refresh failed:', refreshError?.message)
        return {
          success: false,
          error: 'No active session - please refresh the page and login again'
        }
      }
      
      session = refreshData.session
      console.log('✅ Session refreshed successfully for user:', session.user.email)
    }
    
    console.log('✅ uploadRoofPlanImage: Valid session found for user:', session.user.email)

    const formData = new FormData()
    formData.append('image', file)

    // Get current session to include in request headers
    const response = await fetch('/api/roofplans/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let browser set it for FormData with boundary
        'Cache-Control': 'no-cache',
        // Include auth header if available
        ...(session.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
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