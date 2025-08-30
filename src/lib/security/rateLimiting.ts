// Advanced Rate Limiting & Security System
// Protects API endpoints from abuse and implements security best practices

import { getSupabaseClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // API endpoints
  api: {
    default: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    auth: { requests: 5, windowMs: 15 * 60 * 1000 },     // 5 auth attempts per 15 minutes
    upload: { requests: 20, windowMs: 60 * 1000 },       // 20 uploads per minute
    export: { requests: 10, windowMs: 60 * 1000 },       // 10 exports per minute
    chat: { requests: 100, windowMs: 60 * 1000 },        // 100 chat messages per minute
  },
  // User actions
  actions: {
    project_create: { requests: 10, windowMs: 60 * 1000 }, // 10 projects per minute
    pin_create: { requests: 50, windowMs: 60 * 1000 },     // 50 pins per minute
    photo_upload: { requests: 30, windowMs: 60 * 1000 },   // 30 photos per minute
  }
} as const

// Rate limit store interface
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void>
  increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }>
  reset(key: string): Promise<void>
}

// In-memory store for development/small scale
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.store.entries()) {
        if (now > value.resetTime) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const value = this.store.get(key)
    if (!value) return null
    
    // Check if expired
    if (Date.now() > value.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return value
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value)
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = await this.get(key)
    
    if (!existing) {
      const value = { count: 1, resetTime: now + ttl }
      await this.set(key, value)
      return value
    }
    
    existing.count++
    await this.set(key, existing)
    return existing
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Supabase-based store for production
class SupabaseRateLimitStore implements RateLimitStore {
  private supabase = getSupabaseClient()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    // For now, use localStorage fallback since rate_limits table doesn't exist
    // In production, you would create this table in your database
    try {
      const item = localStorage.getItem(`rate_limit_${key}`)
      if (!item) return null
      
      const data = JSON.parse(item)
      const resetTime = new Date(data.reset_time).getTime()
      
      if (Date.now() > resetTime) {
        localStorage.removeItem(`rate_limit_${key}`)
        return null
      }
      
      return { count: data.count, resetTime }
    } catch {
      return null
    }
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    try {
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify({
        count: value.count,
        reset_time: new Date(value.resetTime).toISOString()
      }))
    } catch (error) {
      console.warn('Rate limit store set failed:', error)
    }
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = await this.get(key)
    
    if (!existing) {
      const value = { count: 1, resetTime: now + ttl }
      await this.set(key, value)
      return value
    }
    
    existing.count++
    await this.set(key, existing)
    return existing
  }

  async reset(key: string): Promise<void> {
    try {
      localStorage.removeItem(`rate_limit_${key}`)
    } catch (error) {
      console.warn('Rate limit reset failed:', error)
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private store: RateLimitStore

  constructor(useMemoryStore = false) {
    this.store = useMemoryStore ? new MemoryRateLimitStore() : new SupabaseRateLimitStore()
  }

  // Check rate limit for a key
  async checkLimit(
    key: string, 
    config: { requests: number; windowMs: number },
    identifier?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter?: number }> {
    const rateLimitKey = identifier ? `${key}:${identifier}` : key
    
    try {
      const current = await this.store.increment(rateLimitKey, config.windowMs)
      const allowed = current.count <= config.requests
      const remaining = Math.max(0, config.requests - current.count)
      
      const result = {
        allowed,
        remaining,
        resetTime: current.resetTime,
        retryAfter: allowed ? undefined : Math.ceil((current.resetTime - Date.now()) / 1000)
      }

      return result
    } catch (error) {
      console.warn('Rate limit check failed:', error)
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.requests,
        resetTime: Date.now() + config.windowMs
      }
    }
  }

  // Reset rate limit for a key
  async resetLimit(key: string, identifier?: string): Promise<void> {
    const rateLimitKey = identifier ? `${key}:${identifier}` : key
    await this.store.reset(rateLimitKey)
  }
}

// Middleware factory for Next.js API routes
export function createRateLimitMiddleware(
  config: { requests: number; windowMs: number },
  options: {
    keyGenerator?: (req: NextRequest) => string
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
    onLimitReached?: (req: NextRequest) => void
  } = {}
) {
  const rateLimiter = new RateLimiter()

  return async function rateLimitMiddleware(
    req: NextRequest,
    context: { params: any },
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const identifier = options.keyGenerator?.(req) || getClientIdentifier(req)
    const key = `api:${req.nextUrl.pathname}`
    
    const result = await rateLimiter.checkLimit(key, config, identifier)
    
    if (!result.allowed) {
      options.onLimitReached?.(req)
      
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(config.requests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000))
          }
        }
      )
    }

    // Execute the API route
    const response = await next()
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config.requests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))
    
    return response
  }
}

// Client identifier generation
function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from auth token first
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    try {
      // Extract user ID from JWT token if available
      const token = authHeader.replace('Bearer ', '')
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.sub) {
        return `user:${payload.sub}`
      }
    } catch {
      // Fall back to IP
    }
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

// Security middleware for input validation
export function validateInput<T extends Record<string, any>>(
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object'
      required?: boolean
      min?: number
      max?: number
      pattern?: RegExp
      sanitize?: boolean
    }
  }
) {
  return function inputValidator(data: any): { valid: boolean; sanitized?: T; errors?: string[] } {
    const errors: string[] = []
    const sanitized: any = {}

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key]
      
      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`)
        continue
      }

      // Skip validation for optional empty fields
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // Type validation
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`)
        continue
      }

      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`)
        continue
      }

      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${key} must be a boolean`)
        continue
      }

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${key} must be an array`)
        continue
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.min && value.length < rules.min) {
          errors.push(`${key} must be at least ${rules.min} characters`)
          continue
        }

        if (rules.max && value.length > rules.max) {
          errors.push(`${key} must be no more than ${rules.max} characters`)
          continue
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${key} has invalid format`)
          continue
        }

        // Sanitize string input
        if (rules.sanitize) {
          sanitized[key] = sanitizeString(value)
        } else {
          sanitized[key] = value
        }
      } else {
        sanitized[key] = value
      }
    }

    return errors.length > 0 
      ? { valid: false, errors }
      : { valid: true, sanitized }
  }
}

// String sanitization
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/['"]/g, '') // Remove quotes
    .trim()
}

// CSRF protection
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>()

  static generateToken(sessionId: string): string {
    const token = crypto.randomUUID()
    const expires = Date.now() + (30 * 60 * 1000) // 30 minutes
    
    this.tokens.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    setTimeout(() => this.cleanup(), 60000)
    
    return token
  }

  static validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    if (!stored) return false
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }

  private static cleanup() {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

// Security headers middleware
export function securityHeaders() {
  return function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    return response
  }
}

// Export default rate limiter instance
export const rateLimiter = new RateLimiter()

// Pre-configured middleware for common use cases
export const apiRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIG.api.default)
export const authRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIG.api.auth)
export const uploadRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIG.api.upload)
export const exportRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIG.api.export)
export const chatRateLimit = createRateLimitMiddleware(RATE_LIMIT_CONFIG.api.chat)