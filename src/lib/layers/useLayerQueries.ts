// src/lib/layers/useLayerQueries.ts
// React Query hooks for layer-based pin management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  createEnhancedPin, 
  getEnhancedPinsForRoof, 
  updatePinChild, 
  addPinPhoto, 
  getAvailableLayers, 
  getLayerStatistics 
} from './db-helpers'
import type { LayerKind } from './db-helpers'

// Query keys for layers
export const layerKeys = {
  layers: ['layers'] as const,
  layerStats: (roofId: string) => ['layers', 'stats', roofId] as const,
  enhancedPins: (roofId: string) => ['layers', 'pins', roofId] as const,
}

/** Hook לשליפת שכבות זמינות */
export function useAvailableLayers() {
  return useQuery({
    queryKey: layerKeys.layers,
    queryFn: getAvailableLayers,
    staleTime: 10 * 60 * 1000, // 10 minutes - layers don't change often
  })
}

/** Hook לשליפת פינים משודרגים לרעף */
export function useEnhancedPinsForRoof(roofId: string) {
  return useQuery({
    queryKey: layerKeys.enhancedPins(roofId),
    queryFn: () => getEnhancedPinsForRoof(roofId),
    enabled: !!roofId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/** Hook לסטטיסטיקות שכבות */
export function useLayerStatistics(roofId: string) {
  return useQuery({
    queryKey: layerKeys.layerStats(roofId),
    queryFn: () => getLayerStatistics(roofId),
    enabled: !!roofId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/** Hook ליצירת פין משודרג */
export function useCreateEnhancedPin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createEnhancedPin,
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate enhanced pins query for this roof
        queryClient.invalidateQueries({ 
          queryKey: layerKeys.enhancedPins(variables.roof_id) 
        })
        
        // Invalidate layer statistics
        queryClient.invalidateQueries({ 
          queryKey: layerKeys.layerStats(variables.roof_id) 
        })
        
        console.log(`Enhanced pin created: ${data.pin.seq_number}`)
      }
    },
    onError: (error) => {
      console.error('Failed to create enhanced pin:', error)
    }
  })
}

/** Hook לעדכון pin child */
export function useUpdatePinChild() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ childId, updates }: { childId: string; updates: any }) =>
      updatePinChild(childId, updates),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Need to invalidate the enhanced pins query for the roof
        // Since we don't have roofId directly, invalidate all enhanced pins queries
        queryClient.invalidateQueries({ 
          queryKey: ['layers', 'pins'] 
        })
        
        console.log(`Pin child updated: ${variables.childId}`)
      }
    },
    onError: (error) => {
      console.error('Failed to update pin child:', error)
    }
  })
}

/** Hook להוספת תמונה לפין */
export function useAddPinPhoto() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addPinPhoto,
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate enhanced pins query
        queryClient.invalidateQueries({ 
          queryKey: ['layers', 'pins'] 
        })
        
        console.log(`Photo added to pin: ${variables.pin_id}`)
      }
    },
    onError: (error) => {
      console.error('Failed to add pin photo:', error)
    }
  })
}

/** Hook מתקדם לניהול שכבות בפינים */
export function useLayerManagement(roofId: string) {
  const layersQuery = useAvailableLayers()
  const pinsQuery = useEnhancedPinsForRoof(roofId)
  const statsQuery = useLayerStatistics(roofId)
  
  // Group pins by layer
  const pinsByLayer = pinsQuery.data?.success && pinsQuery.data.pins ? 
    pinsQuery.data.pins.reduce((acc, pinData) => {
      const layerName = pinData.layer?.name || 'Unknown'
      if (!acc[layerName]) acc[layerName] = []
      acc[layerName].push(pinData)
      return acc
    }, {} as Record<string, typeof pinsQuery.data.pins>) : {}
  
  return {
    layers: layersQuery.data?.success ? layersQuery.data.layers : [],
    pins: pinsQuery.data?.success ? pinsQuery.data.pins : [],
    pinsByLayer,
    stats: statsQuery.data?.success ? statsQuery.data.stats : [],
    isLoading: layersQuery.isLoading || pinsQuery.isLoading || statsQuery.isLoading,
    error: layersQuery.error || pinsQuery.error || statsQuery.error,
  }
}

/** Utility hook for filtering pins by layer */
export function useFilteredPins(roofId: string, layerFilter?: LayerKind | null) {
  const pinsQuery = useEnhancedPinsForRoof(roofId)
  
  const filteredPins = pinsQuery.data?.success && pinsQuery.data.pins ?
    pinsQuery.data.pins.filter(pinData => {
      if (!layerFilter) return true
      return pinData.layer?.name === layerFilter
    }) : []
  
  return {
    pins: filteredPins,
    isLoading: pinsQuery.isLoading,
    error: pinsQuery.error,
  }
}
