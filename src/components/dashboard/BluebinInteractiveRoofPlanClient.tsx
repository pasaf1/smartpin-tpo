'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

// Import the actual component type for proper typing
type BluebinInteractiveRoofPlanProps = ComponentProps<typeof import('./BluebinInteractiveRoofPlan').BluebinInteractiveRoofPlan>

// Dynamic import with SSR disabled to prevent Konva from loading on server
const BluebinInteractiveRoofPlan = dynamic(
  () => import('./BluebinInteractiveRoofPlan').then(mod => ({ default: mod.BluebinInteractiveRoofPlan })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-luxury-50 to-luxury-100 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading interactive roof plan...</p>
        </div>
      </div>
    ),
  }
)

// Re-export with proper typing
export function BluebinInteractiveRoofPlanClient(props: BluebinInteractiveRoofPlanProps) {
  return <BluebinInteractiveRoofPlan {...props} />
}
