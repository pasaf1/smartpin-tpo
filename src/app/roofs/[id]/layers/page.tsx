import { Suspense } from 'react'
import { notFound } from 'next/navigation'

interface LayersPageProps {
  params: {
    id: string
  }
}

export default function LayersPage({ params }: LayersPageProps) {
  const { id } = params

  // Validate the roof ID
  if (!id || typeof id !== 'string') {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Roof Layers - ID: {id}
        </h1>
        <p className="text-gray-600 mt-2">
          Manage and configure roof layer settings
        </p>
      </div>

      <Suspense fallback={<div className="animate-pulse">Loading layers...</div>}>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Layer Configuration
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure the layers for roof ID: {id}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium text-gray-800">Base Layer</h3>
              <p className="text-gray-600 text-sm">
                Foundation layer configuration
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium text-gray-800">Insulation Layer</h3>
              <p className="text-gray-600 text-sm">
                Thermal insulation settings
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium text-gray-800">Surface Layer</h3>
              <p className="text-gray-600 text-sm">
                Outer surface material configuration
              </p>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  )
}

export function generateMetadata({ params }: LayersPageProps) {
  return {
    title: `Roof Layers - ${params.id} | SmartPin TPO`,
    description: `Configure roof layers for roof ID: ${params.id}`,
  }
}