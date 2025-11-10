'use client'

import { forwardRef, useEffect, useState } from 'react'

// This wrapper ensures Konva is ONLY loaded on the client
// It acts as a firewall to prevent any react-konva imports during SSR
const KonvaStageClient = forwardRef<any, any>((props, ref) => {
  const [ClientKonva, setClientKonva] = useState<any>(null)

  useEffect(() => {
    // Only import on client-side after mount
    import('@/lib/konva/optimized-components')
      .then(mod => setClientKonva(() => mod.default))
      .catch(err => console.error('Failed to load Konva components:', err))
  }, [])

  // Show loading state while Konva is loading
  if (!ClientKonva) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl">
        <div className="flex items-center gap-2 text-luxury-600">
          <div className="w-4 h-4 border-2 border-luxury-600 border-t-transparent rounded-full animate-spin"></div>
          Initializing Canvas...
        </div>
      </div>
    )
  }

  // Render the actual Konva components
  return <ClientKonva ref={ref} {...props} />
})

KonvaStageClient.displayName = 'KonvaStageClient'

export default KonvaStageClient
