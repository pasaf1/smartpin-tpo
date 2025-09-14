/**
 * Viewport Culling for Konva.js
 *
 * Production-ready viewport culling system to optimize rendering performance
 * by only rendering visible elements within the viewport bounds
 */

interface ViewportBounds {
  x: number
  y: number
  width: number
  height: number
}

interface CullingConfig {
  padding?: number // Extra padding around viewport for smooth scrolling
  enableFrustumCulling?: boolean // Enable advanced frustum culling
  enableOcclusionCulling?: boolean // Enable occlusion culling (basic)
  debug?: boolean // Enable debug visualization
}

interface CullableItem {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  priority?: number // Higher priority items are rendered first
  lastVisible?: number // Timestamp when last visible
}

interface CullingStats {
  totalItems: number
  visibleItems: number
  culledItems: number
  cullingRatio: number
  renderTime: number
}

export class ViewportCuller {
  private config: Required<CullingConfig>
  private lastViewport: ViewportBounds = { x: 0, y: 0, width: 0, height: 0 }
  private lastScale = 1
  private cullingStats: CullingStats = {
    totalItems: 0,
    visibleItems: 0,
    culledItems: 0,
    cullingRatio: 0,
    renderTime: 0
  }

  // Spatial indexing for fast lookups
  private spatialIndex: Map<string, CullableItem[]> = new Map()
  private gridSize = 100 // Size of spatial grid cells

  constructor(config: CullingConfig = {}) {
    this.config = {
      padding: config.padding ?? 100,
      enableFrustumCulling: config.enableFrustumCulling ?? true,
      enableOcclusionCulling: config.enableOcclusionCulling ?? false,
      debug: config.debug ?? false
    }
  }

  /**
   * Check if a point is within the viewport
   */
  isPointInViewport(
    point: { x: number; y: number },
    viewport: ViewportBounds,
    scale: number = 1
  ): boolean {
    const padding = this.config.padding / scale

    // Transform viewport to world coordinates
    const worldViewport = {
      left: -viewport.x / scale - padding,
      right: (-viewport.x + viewport.width) / scale + padding,
      top: -viewport.y / scale - padding,
      bottom: (-viewport.y + viewport.height) / scale + padding
    }

    return (
      point.x >= worldViewport.left &&
      point.x <= worldViewport.right &&
      point.y >= worldViewport.top &&
      point.y <= worldViewport.bottom
    )
  }

  /**
   * Check if a circle is within the viewport
   */
  isCircleInViewport(
    center: { x: number; y: number },
    radius: number,
    viewport: ViewportBounds,
    scale: number = 1
  ): boolean {
    const scaledRadius = radius / scale
    const padding = this.config.padding / scale

    // Transform viewport to world coordinates
    const worldViewport = {
      left: -viewport.x / scale - padding,
      right: (-viewport.x + viewport.width) / scale + padding,
      top: -viewport.y / scale - padding,
      bottom: (-viewport.y + viewport.height) / scale + padding
    }

    // Check if circle intersects with viewport rectangle
    const closestX = Math.max(worldViewport.left, Math.min(center.x, worldViewport.right))
    const closestY = Math.max(worldViewport.top, Math.min(center.y, worldViewport.bottom))

    const distanceX = center.x - closestX
    const distanceY = center.y - closestY
    const distanceSquared = distanceX * distanceX + distanceY * distanceY

    return distanceSquared <= (scaledRadius * scaledRadius)
  }

  /**
   * Check if a rectangle is within the viewport
   */
  isRectInViewport(
    rect: { x: number; y: number; width: number; height: number },
    viewport: ViewportBounds,
    scale: number = 1
  ): boolean {
    const padding = this.config.padding / scale

    // Transform viewport to world coordinates
    const worldViewport = {
      left: -viewport.x / scale - padding,
      right: (-viewport.x + viewport.width) / scale + padding,
      top: -viewport.y / scale - padding,
      bottom: (-viewport.y + viewport.height) / scale + padding
    }

    // Check if rectangles intersect
    return !(
      rect.x > worldViewport.right ||
      rect.x + rect.width < worldViewport.left ||
      rect.y > worldViewport.bottom ||
      rect.y + rect.height < worldViewport.top
    )
  }

  /**
   * Generic method to check if any shape is within viewport
   */
  isInViewport(
    item: { x: number; y: number; width?: number; height?: number; radius?: number },
    viewport: ViewportBounds,
    scale: number = 1
  ): boolean {
    if (item.radius !== undefined) {
      // Circular item
      return this.isCircleInViewport(item, item.radius, viewport, scale)
    } else if (item.width !== undefined && item.height !== undefined) {
      // Rectangular item
      return this.isRectInViewport(
        { x: item.x, y: item.y, width: item.width, height: item.height },
        viewport,
        scale
      )
    } else {
      // Point item
      return this.isPointInViewport(item, viewport, scale)
    }
  }

  /**
   * Cull a list of items based on viewport visibility
   */
  cullItems<T extends CullableItem>(
    items: T[],
    viewport: ViewportBounds,
    scale: number = 1
  ): T[] {
    const startTime = performance.now()

    // Build spatial index if viewport or scale changed significantly
    if (this.hasViewportChangedSignificantly(viewport, scale)) {
      this.buildSpatialIndex(items)
      this.lastViewport = { ...viewport }
      this.lastScale = scale
    }

    // Use spatial index for fast culling if available
    const visibleItems = this.config.enableFrustumCulling && this.spatialIndex.size > 0
      ? this.spatialCull(items, viewport, scale)
      : this.basicCull(items, viewport, scale)

    // Update stats
    const renderTime = performance.now() - startTime
    this.updateStats(items.length, visibleItems.length, renderTime)

    // Sort by priority if specified
    visibleItems.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    return visibleItems
  }

  /**
   * Get current culling statistics
   */
  getStats(): CullingStats {
    return { ...this.cullingStats }
  }

  /**
   * Clear spatial index (call when items change significantly)
   */
  clearSpatialIndex(): void {
    this.spatialIndex.clear()
  }

  /**
   * Basic culling without spatial indexing
   */
  private basicCull<T extends CullableItem>(
    items: T[],
    viewport: ViewportBounds,
    scale: number
  ): T[] {
    return items.filter(item => {
      const isVisible = this.isInViewport(item, viewport, scale)
      if (isVisible) {
        item.lastVisible = Date.now()
      }
      return isVisible
    })
  }

  /**
   * Advanced spatial culling using grid-based indexing
   */
  private spatialCull<T extends CullableItem>(
    items: T[],
    viewport: ViewportBounds,
    scale: number
  ): T[] {
    const visibleItems: T[] = []
    const padding = this.config.padding / scale

    // Calculate which grid cells are visible
    const worldViewport = {
      left: -viewport.x / scale - padding,
      right: (-viewport.x + viewport.width) / scale + padding,
      top: -viewport.y / scale - padding,
      bottom: (-viewport.y + viewport.height) / scale + padding
    }

    const startCellX = Math.floor(worldViewport.left / this.gridSize)
    const endCellX = Math.ceil(worldViewport.right / this.gridSize)
    const startCellY = Math.floor(worldViewport.top / this.gridSize)
    const endCellY = Math.ceil(worldViewport.bottom / this.gridSize)

    // Check all potentially visible grid cells
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`
        const cellItems = this.spatialIndex.get(cellKey)

        if (cellItems) {
          for (const item of cellItems) {
            // Find the original item
            const originalItem = items.find(i => i.id === item.id) as T
            if (originalItem && this.isInViewport(originalItem, viewport, scale)) {
              originalItem.lastVisible = Date.now()
              visibleItems.push(originalItem)
            }
          }
        }
      }
    }

    // Remove duplicates (items might be in multiple cells)
    const uniqueItems = visibleItems.filter((item, index, self) =>
      self.findIndex(i => i.id === item.id) === index
    )

    return uniqueItems
  }

  /**
   * Build spatial index for fast culling
   */
  private buildSpatialIndex<T extends CullableItem>(items: T[]): void {
    this.spatialIndex.clear()

    for (const item of items) {
      // Determine which grid cells this item occupies
      const minX = Math.floor(item.x / this.gridSize)
      const maxX = Math.ceil((item.x + (item.width || item.radius || 0)) / this.gridSize)
      const minY = Math.floor(item.y / this.gridSize)
      const maxY = Math.ceil((item.y + (item.height || item.radius || 0)) / this.gridSize)

      for (let cellX = minX; cellX <= maxX; cellX++) {
        for (let cellY = minY; cellY <= maxY; cellY++) {
          const cellKey = `${cellX},${cellY}`

          if (!this.spatialIndex.has(cellKey)) {
            this.spatialIndex.set(cellKey, [])
          }

          this.spatialIndex.get(cellKey)!.push({
            id: item.id,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            radius: item.radius,
            priority: item.priority
          })
        }
      }
    }
  }

  /**
   * Check if viewport has changed significantly enough to rebuild spatial index
   */
  private hasViewportChangedSignificantly(viewport: ViewportBounds, scale: number): boolean {
    const threshold = 50 // pixels

    return (
      Math.abs(viewport.x - this.lastViewport.x) > threshold ||
      Math.abs(viewport.y - this.lastViewport.y) > threshold ||
      Math.abs(viewport.width - this.lastViewport.width) > threshold ||
      Math.abs(viewport.height - this.lastViewport.height) > threshold ||
      Math.abs(scale - this.lastScale) > 0.1
    )
  }

  /**
   * Update culling statistics
   */
  private updateStats(totalItems: number, visibleItems: number, renderTime: number): void {
    this.cullingStats = {
      totalItems,
      visibleItems,
      culledItems: totalItems - visibleItems,
      cullingRatio: totalItems > 0 ? (totalItems - visibleItems) / totalItems : 0,
      renderTime
    }
  }
}

/**
 * Create a viewport culler with production defaults
 */
export function createViewportCuller(config: CullingConfig = {}): ViewportCuller {
  return new ViewportCuller({
    padding: 50, // Smaller padding for better performance
    enableFrustumCulling: true,
    enableOcclusionCulling: false, // Disabled for performance
    debug: process.env.NODE_ENV === 'development',
    ...config
  })
}

/**
 * Utility function for pins specifically
 */
export function cullPins(
  pins: any[],
  viewport: ViewportBounds,
  scale: number,
  normalizedToCanvas: (pos: { x: number; y: number }) => { x: number; y: number },
  pinRadius: number = 15
): any[] {
  const culler = createViewportCuller({ padding: pinRadius * 2 })

  // Convert pins to cullable items
  const cullableItems = pins.map(pin => {
    const canvasPos = normalizedToCanvas({ x: pin.x, y: pin.y })
    return {
      id: pin.id,
      x: canvasPos.x,
      y: canvasPos.y,
      radius: pinRadius,
      priority: pin.children_total > 0 ? 2 : 1, // Prioritize pins with children
      ...pin
    }
  })

  return culler.cullItems(cullableItems, viewport, scale)
}

/**
 * React hook for viewport culling
 */
export function useViewportCulling<T extends CullableItem>(
  items: T[],
  viewport: ViewportBounds,
  scale: number,
  config?: CullingConfig
) {
  const culler = new ViewportCuller(config)
  return culler.cullItems(items, viewport, scale)
}