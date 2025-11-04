/**
 * SmartPin TPO - Mobile Gesture Utilities
 * Touch gesture recognition and PWA support for mobile devices
 */

import { useCallback, useRef, useState, useEffect, createElement } from 'react'
import { TouchGesture, PWAInstallPrompt } from '../types'

interface MobileGesturesConfig {
  onTap?: (position: { x: number; y: number }) => void
  onDoubleTap?: (position: { x: number; y: number }) => void
  onLongPress?: (position: { x: number; y: number }) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onPan?: (delta: { x: number; y: number }, position: { x: number; y: number }) => void
  enabled?: boolean
  longPressDelay?: number
  swipeThreshold?: number
  doubleTapDelay?: number
}

interface GestureState {
  startTime: number
  startPosition: { x: number; y: number }
  lastPosition: { x: number; y: number }
  isLongPress: boolean
  longPressTimer?: NodeJS.Timeout
  lastTapTime: number
  tapCount: number
  initialDistance?: number
  isMultiTouch: boolean
}

export const useMobileGestures = (config: MobileGesturesConfig) => {
  const gestureState = useRef<GestureState>({
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    isLongPress: false,
    lastTapTime: 0,
    tapCount: 0,
    isMultiTouch: false
  })

  const {
    enabled = true,
    longPressDelay = 500,
    swipeThreshold = 50,
    doubleTapDelay = 300
  } = config

  // Get touch position
  const getTouchPosition = useCallback((e: React.TouchEvent | TouchEvent): { x: number; y: number } => {
    const touch = e.touches[0] || e.changedTouches[0]
    if (!touch) {
      return { x: 0, y: 0 }
    }
    return {
      x: touch.clientX,
      y: touch.clientY
    }
  }, [])

  // Get distance between two touches
  const getTouchDistance = useCallback((e: React.TouchEvent | TouchEvent): number => {
    if (e.touches.length < 2) return 0

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    if (!touch1 || !touch2) return 0

    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }, [])

  // Get center point between two touches
  const getTouchCenter = useCallback((e: React.TouchEvent | TouchEvent): { x: number; y: number } => {
    if (e.touches.length < 2) return getTouchPosition(e)

    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    if (!touch1 || !touch2) return getTouchPosition(e)

    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }, [getTouchPosition])

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      delete gestureState.current.longPressTimer
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return

    const now = Date.now()
    const position = getTouchPosition(e)
    const isMultiTouch = e.touches.length > 1

    // Clear previous long press timer
    clearLongPressTimer()

    // Update gesture state
    gestureState.current = {
      ...gestureState.current,
      startTime: now,
      startPosition: position,
      lastPosition: position,
      isLongPress: false,
      isMultiTouch,
      ...(isMultiTouch ? { initialDistance: getTouchDistance(e) } : {})
    }

    // Handle double tap detection
    if (!isMultiTouch && now - gestureState.current.lastTapTime < doubleTapDelay) {
      gestureState.current.tapCount++
    } else {
      gestureState.current.tapCount = 1
    }

    // Set up long press timer for single touch
    if (!isMultiTouch && config.onLongPress) {
      gestureState.current.longPressTimer = setTimeout(() => {
        gestureState.current.isLongPress = true
        config.onLongPress!(position)

        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }, longPressDelay)
    }

    // Prevent default to avoid scrolling/zooming
    if (isMultiTouch) {
      e.preventDefault()
    }
  }, [enabled, config, getTouchPosition, getTouchDistance, clearLongPressTimer, longPressDelay, doubleTapDelay])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return

    const position = getTouchPosition(e)
    const isMultiTouch = e.touches.length > 1
    const state = gestureState.current

    // Handle pinch gesture
    if (isMultiTouch && config.onPinch && state.initialDistance) {
      const currentDistance = getTouchDistance(e)
      const scale = currentDistance / state.initialDistance
      const center = getTouchCenter(e)

      config.onPinch(scale, center)
      e.preventDefault()
      return
    }

    // Handle pan gesture for single touch
    if (!isMultiTouch && config.onPan && !state.isLongPress) {
      const delta = {
        x: position.x - state.lastPosition.x,
        y: position.y - state.lastPosition.y
      }

      config.onPan(delta, position)
    }

    // Update last position
    gestureState.current.lastPosition = position

    // Clear long press if moved too much
    const moveDistance = Math.sqrt(
      Math.pow(position.x - state.startPosition.x, 2) +
      Math.pow(position.y - state.startPosition.y, 2)
    )

    if (moveDistance > 10) {
      clearLongPressTimer()
    }

    // Prevent default for multi-touch
    if (isMultiTouch) {
      e.preventDefault()
    }
  }, [enabled, config, getTouchPosition, getTouchDistance, getTouchCenter, clearLongPressTimer])

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled) return

    const now = Date.now()
    const position = getTouchPosition(e)
    const state = gestureState.current

    // Clear long press timer
    clearLongPressTimer()

    // Skip if this was a long press
    if (state.isLongPress) {
      return
    }

    // Skip if multi-touch
    if (state.isMultiTouch) {
      return
    }

    const swipeDistance = {
      x: position.x - state.startPosition.x,
      y: position.y - state.startPosition.y
    }

    const swipeMagnitude = Math.sqrt(swipeDistance.x ** 2 + swipeDistance.y ** 2)
    const swipeTime = now - state.startTime

    // Detect swipe gestures (fast movement over threshold)
    if (swipeMagnitude > swipeThreshold && swipeTime < 500) {
      const absX = Math.abs(swipeDistance.x)
      const absY = Math.abs(swipeDistance.y)

      if (absX > absY) {
        // Horizontal swipe
        if (swipeDistance.x > 0 && config.onSwipeRight) {
          config.onSwipeRight()
        } else if (swipeDistance.x < 0 && config.onSwipeLeft) {
          config.onSwipeLeft()
        }
      } else {
        // Vertical swipe
        if (swipeDistance.y > 0 && config.onSwipeDown) {
          config.onSwipeDown()
        } else if (swipeDistance.y < 0 && config.onSwipeUp) {
          config.onSwipeUp()
        }
      }
      return
    }

    // Detect tap gestures (short press without movement)
    if (swipeMagnitude < 10 && swipeTime < 500) {
      gestureState.current.lastTapTime = now

      // Handle double tap
      if (state.tapCount >= 2 && config.onDoubleTap) {
        config.onDoubleTap(position)
        gestureState.current.tapCount = 0
      } else if (config.onTap) {
        // Delay single tap to allow for double tap detection
        setTimeout(() => {
          if (gestureState.current.tapCount === 1) {
            config.onTap!(position)
          }
          gestureState.current.tapCount = 0
        }, doubleTapDelay)
      }
    }
  }, [enabled, config, getTouchPosition, clearLongPressTimer, swipeThreshold, doubleTapDelay])

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

// PWA installation utilities
export const usePWAInstall = (): PWAInstallPrompt => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<PWAInstallPrompt['platform']>('unknown')

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
    } else if (/android/.test(userAgent)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const show = useCallback(async () => {
    if (!deferredPrompt) {
      // For iOS, show custom instructions
      if (platform === 'ios') {
        alert('To install this app on iOS, tap the share button and select "Add to Home Screen"')
      }
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }, [deferredPrompt, platform])

  return {
    show,
    isAvailable: !!deferredPrompt || (platform === 'ios' && !isInstalled),
    isInstalled,
    platform
  }
}

// Mobile device detection
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Touch support detection
export const hasTouchSupport = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Screen orientation utilities
export const useScreenOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

// Haptic feedback utilities
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    }
    navigator.vibrate(patterns[type])
  }
}

export default useMobileGestures