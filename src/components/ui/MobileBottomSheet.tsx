'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  snapPoints?: number[] // Array of snap points as percentages (0-100)
  initialSnap?: number // Initial snap point index
  className?: string
  backdrop?: boolean
  title?: string
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [20, 50, 90], // Default: peek, half, full
  initialSnap = 1, // Default to half-open
  className,
  backdrop = true,
  title
}: MobileBottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  // Calculate sheet height based on snap point
  const getHeightFromSnap = (snapIndex: number) => {
    return `${snapPoints[snapIndex]}vh`
  }

  // Find closest snap point to current position
  const findClosestSnap = (yPosition: number, velocity: number) => {
    const windowHeight = window.innerHeight
    const currentPercent = ((windowHeight - yPosition) / windowHeight) * 100
    
    let closestIndex = 0
    let closestDistance = Math.abs(snapPoints[0] - currentPercent)

    snapPoints.forEach((snap, index) => {
      const distance = Math.abs(snap - currentPercent)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    // Consider velocity for swipe gestures
    if (Math.abs(velocity) > 0.5) {
      if (velocity > 0 && closestIndex > 0) {
        closestIndex -= 1 // Swipe up - go to higher snap point
      } else if (velocity < 0 && closestIndex < snapPoints.length - 1) {
        closestIndex += 1 // Swipe down - go to lower snap point
      }
    }

    // If swiping down on the lowest snap point, close the sheet
    if (velocity < -1 && closestIndex === 0) {
      return -1 // Indicate close
    }

    return closestIndex
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setCurrentY(touch.clientY)
    setDragStartTime(Date.now())
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const touch = e.touches[0]
    setCurrentY(touch.clientY)
    
    const sheet = sheetRef.current
    if (sheet) {
      const deltaY = touch.clientY - startY
      const windowHeight = window.innerHeight
      const currentHeight = snapPoints[currentSnap] / 100 * windowHeight
      const newY = windowHeight - currentHeight + deltaY
      
      // Constrain movement
      const minY = windowHeight - (snapPoints[snapPoints.length - 1] / 100 * windowHeight)
      const maxY = windowHeight - (snapPoints[0] / 100 * windowHeight)
      const constrainedY = Math.max(minY, Math.min(maxY, newY))
      
      sheet.style.transform = `translateY(${constrainedY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const dragDuration = Date.now() - dragStartTime
    const dragDistance = currentY - startY
    const velocity = dragDistance / dragDuration // pixels per ms
    
    const sheet = sheetRef.current
    if (sheet) {
      const newSnapIndex = findClosestSnap(currentY, velocity)
      
      if (newSnapIndex === -1) {
        onClose()
      } else {
        setCurrentSnap(newSnapIndex)
        sheet.style.transform = 'translateY(0)' // Reset transform for CSS height transition
      }
    }
    
    setIsDragging(false)
  }

  // Mouse event handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartY(e.clientY)
    setCurrentY(e.clientY)
    setDragStartTime(Date.now())
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    handleTouchMove(e as any)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    handleTouchEnd()
  }

  // Effect to handle backdrop clicks
  useEffect(() => {
    const handleBackdropClick = (e: MouseEvent) => {
      if (backdrop && sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleBackdropClick, { capture: true })
      return () => document.removeEventListener('click', handleBackdropClick, { capture: true })
    }
  }, [isOpen, backdrop, onClose])

  // Effect to handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, onClose])

  // Effect to prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          style={{ opacity: isOpen ? 1 : 0 }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-all duration-300 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          height: getHeightFromSnap(currentSnap),
          transform: isDragging ? undefined : 'translateY(0)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Drag Handle */}
        <div 
          ref={dragHandleRef}
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Snap indicators */}
        <div className="absolute right-4 top-16 flex flex-col gap-1">
          {snapPoints.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSnap(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentSnap === index ? "bg-blue-500" : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </>
  )
}