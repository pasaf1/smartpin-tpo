'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Home Page - Auto-redirects to Roofs List
 *
 * This page automatically redirects users to the roofs list page.
 * It serves as the entry point for the application.
 */
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to roofs page immediately
    router.replace('/roofs')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading SmartPin TPO...</p>
        <p className="text-white/60 text-sm mt-2">Redirecting to projects...</p>
      </div>
    </div>
  )
}
