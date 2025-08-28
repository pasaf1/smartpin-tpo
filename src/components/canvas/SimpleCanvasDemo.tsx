/**
 * Canvas Core Integration - Simple Example Component
 * Demonstrates proper usage of the fixed Canvas Core service
 */

'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useCanvasCore, pinToScreen, screenToPin } from '@/lib/services/canvas-core'
import { useCanvasStore } from '@/lib/stores/canvas-store'

interface SimpleCanvasProps {
  roofId: string
  backgroundImageUrl?: string
  className?: string
  onPinCreate?: (x: number, y: number) => void
  contentSize?: { width: number; height: number }
}

export const SimpleCanvasDemo: React.FC<SimpleCanvasProps> = ({
  roofId,
  backgroundImageUrl,
  className = '',
  onPinCreate,
  contentSize = { width: 1200, height: 800 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasCore = useCanvasCore()
  const { pins } = useCanvasStore()

  // Initialize Canvas Core
  useEffect(() => {
    if (!containerRef.current) return

    // Set content size (roof plan dimensions)
    canvasCore.setContentSize(contentSize.width, contentSize.height)
    
    // Setup resize observer
    canvasCore.setupResizeObserver(containerRef.current)

    return () => {
      canvasCore.destroy()
    }
  }, [canvasCore, contentSize])

  // Setup HiDPI canvas
  useEffect(() => {
    if (!canvasRef.current) return
    canvasCore.setupHiDPI(canvasRef.current)
  }, [canvasCore])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const pointerX = e.clientX - rect.left
    const pointerY = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.9 : 1.1

    canvasCore.zoomAtPointer(factor, pointerX, pointerY)
    redraw()
  }, [canvasCore])

  // Mouse click - create pin
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const normalized = canvasCore.screenToNormalized(screenX, screenY)

    console.log('Click:', { screenX, screenY, normalized })
    onPinCreate?.(normalized.x, normalized.y)
  }, [canvasCore, onPinCreate])

  // Canvas rendering
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvasCore.getViewportSize()
    const { scale, pan, dpr } = canvasCore.getViewport()

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background (if any)
    if (backgroundImageUrl) {
      // TODO: Draw background image with proper scaling
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw coordinate grid (for debugging)
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    
    // Grid lines every 100 pixels in content space
    for (let x = 0; x <= contentSize.width; x += 100) {
      const screenCoords = canvasCore.normalizedToScreen(x / contentSize.width, 0)
      if (screenCoords.x >= 0 && screenCoords.x <= width) {
        ctx.beginPath()
        ctx.moveTo(screenCoords.x, 0)
        ctx.lineTo(screenCoords.x, height)
        ctx.stroke()
      }
    }

    for (let y = 0; y <= contentSize.height; y += 100) {
      const screenCoords = canvasCore.normalizedToScreen(0, y / contentSize.height)
      if (screenCoords.y >= 0 && screenCoords.y <= height) {
        ctx.beginPath()
        ctx.moveTo(0, screenCoords.y)
        ctx.lineTo(width, screenCoords.y)
        ctx.stroke()
      }
    }

    // Draw pins
    pins.forEach(pin => {
      const screenCoords = pinToScreen(pin, canvasCore)
      
      // Only draw if visible
      if (screenCoords.x >= -20 && screenCoords.x <= width + 20 &&
          screenCoords.y >= -20 && screenCoords.y <= height + 20) {
        
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(screenCoords.x, screenCoords.y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Pin number
        ctx.fillStyle = '#fff'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(pin.seq_number.toString(), screenCoords.x, screenCoords.y + 4)
      }
    })

    // Draw debug info
    ctx.fillStyle = '#333'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Scale: ${scale.toFixed(2)}`, 10, 20)
    ctx.fillText(`Pan: ${pan.x.toFixed(0)}, ${pan.y.toFixed(0)}`, 10, 35)
    ctx.fillText(`DPR: ${dpr}`, 10, 50)
    ctx.fillText(`Pins: ${pins.length}`, 10, 65)

  }, [canvasCore, pins, backgroundImageUrl, contentSize])

  // Redraw on state changes
  useEffect(() => {
    redraw()
  }, [redraw])

  // Navigation buttons
  const handleFitToViewport = () => {
    canvasCore.fitToViewport(0.9)
    redraw()
  }

  const handleReset = () => {
    canvasCore.reset()
    redraw()
  }

  const handleCenter = () => {
    canvasCore.centerOnNormalized(0.5, 0.5)
    redraw()
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onWheel={handleWheel}
        onClick={handleClick}
      />
      
      {/* Navigation Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleFitToViewport}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Fit
        </button>
        <button
          onClick={handleCenter}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Center
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
        >
          Reset
        </button>
      </div>

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
        <div>Click to create pin</div>
        <div>Wheel to zoom</div>
        <div>Drag to pan (TODO)</div>
      </div>
    </div>
  )
}

export default SimpleCanvasDemo
