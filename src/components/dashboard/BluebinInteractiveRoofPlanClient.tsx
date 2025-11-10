'use client'

import dynamic from 'next/dynamic'

// Dynamic import with SSR disabled to prevent Konva from loading on server
// Use OptimizedBluebinInteractiveRoofPlan which has better SSR handling
const BluebinInteractiveRoofPlan = dynamic(
  () => import('./OptimizedBluebinInteractiveRoofPlan').then(mod => ({ default: mod.OptimizedBluebinInteractiveRoofPlan })),
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

// Re-export - dynamic import handles SSR prevention
export function BluebinInteractiveRoofPlanClient(props: any) {
  return <BluebinInteractiveRoofPlan {...props} />
}
