'use client'

import dynamic from 'next/dynamic'

// Dynamic import with SSR disabled to prevent Konva from loading on server
// Use 'any' for props to avoid importing types that reference Konva
const BluebinInteractiveRoofPlan = dynamic(
  () => import('./BluebinInteractiveRoofPlan').then(mod => ({ default: mod.BluebinInteractiveRoofPlan })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading interactive roof plan...</p>
        </div>
      </div>
    ),
  }
)

// Re-export with any type to prevent server-side evaluation
export function BluebinInteractiveRoofPlanClient(props: any) {
  // Only render on client side
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading interactive roof plan...</p>
        </div>
      </div>
    )
  }

  return <BluebinInteractiveRoofPlan {...props} />
}
