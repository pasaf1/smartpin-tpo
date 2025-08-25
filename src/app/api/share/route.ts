import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect('/auth?error=unauthorized')
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const text = formData.get('text') as string
    const url = formData.get('url') as string
    const images = formData.getAll('images') as File[]

    console.log('Share target received:', {
      title,
      text,
      url,
      imageCount: images.length
    })

    if (images.length > 0) {
      const params = new URLSearchParams()
      
      if (title) params.set('title', title)
      if (text) params.set('description', text)
      if (url) params.set('source', url)
      
      const uploadUrl = `/upload/shared?${params.toString()}`
      
      const response = NextResponse.redirect(new URL(uploadUrl, request.url))
      
      response.headers.set('X-Shared-Images', images.length.toString())
      
      return response
    }

    let redirectUrl = '/'
    if (title || text) {
      const params = new URLSearchParams()
      if (title) params.set('title', title)
      if (text) params.set('text', text)
      if (url) params.set('url', url)
      redirectUrl = `/share/text?${params.toString()}`
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('Share handler error:', error)
    return NextResponse.redirect('/share/error')
  }
}