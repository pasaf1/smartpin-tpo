// Base service class with comprehensive error handling for Supabase operations
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN',
    public details?: string,
    public hint?: string
  ) {
    super(message)
    this.name = 'SupabaseServiceError'
  }
}

export class RLSPermissionError extends SupabaseServiceError {
  action: string
  table: string

  constructor(error: any, action: string, table: string) {
    super(error)
    this.name = 'RLSPermissionError'
    this.action = action
    this.table = table
  }
}

export class ValidationError extends Error {
  field: string
  value: any

  constructor(message: string, field: string, value?: any) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export abstract class BaseService {
  protected supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Enhanced error handler with specific error type detection
   */
  protected handleError(error: any, operation: string, table?: string): never {
    console.error(`[${this.constructor.name}] ${operation} failed:`, error)

    // RLS Permission Errors
    if (this.isRLSError(error)) {
      throw new RLSPermissionError(error, operation, table || 'unknown')
    }

    // Storage Errors
    if (this.isStorageError(error)) {
      throw new SupabaseServiceError(
        this.getStorageErrorMessage(error),
        error.error || 'STORAGE_ERROR',
        error.message
      )
    }

    // Network/Connection Errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_FAILURE') {
      throw new SupabaseServiceError(
        'בעיית רשת. אנא בדקו את החיבור לאינטרנט.',
        'NETWORK_ERROR',
        error.message
      )
    }

    // Validation Errors
    if (error.code === '23505') { // Unique constraint violation
      throw new ValidationError('הערך כבר קיים במערכת', 'unique', error.details)
    }

    if (error.code === '23503') { // Foreign key violation
      throw new ValidationError('אסור למחוק רשומה המקושרת לרשומות אחרות', 'foreign_key', error.details)
    }

    if (error.code === '23502') { // Not null violation
      throw new ValidationError('שדה חובה חסר', 'required', error.details)
    }

    // Generic Supabase Error
    throw new SupabaseServiceError(error)
  }

  /**
   * Check if error is RLS related
   */
  private isRLSError(error: any): boolean {
    return ['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error.code)
  }

  /**
   * Check if error is Storage related
   */
  private isStorageError(error: any): boolean {
    return error.error && (
      error.error.includes('storage') ||
      error.statusCode === 400 ||
      error.statusCode === 413
    )
  }

  /**
   * Get user-friendly storage error message
   */
  private getStorageErrorMessage(error: any): string {
    if (error.statusCode === 413) {
      return 'הקובץ גדול מדי. מקסימום 10MB.'
    }
    if (error.error?.includes('Invalid file type')) {
      return 'סוג קובץ לא נתמך. אנא העלו תמונה בפורמט JPG, PNG או WebP.'
    }
    if (error.error?.includes('Object not found')) {
      return 'הקובץ לא נמצא או נמחק.'
    }
    return 'שגיאה בהעלאת הקובץ. אנא נסו שוב.'
  }

  /**
   * Safe database operation with error handling
   */
  protected async safeOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    table?: string
  ): Promise<T> {
    try {
      const { data, error } = await operation()
      
      if (error) {
        this.handleError(error, operationName, table)
      }

      if (data === null) {
        throw new Error(`${operationName} החזיר נתונים ריקים`)
      }

      return data
    } catch (error: any) {
      if (error instanceof SupabaseServiceError || error instanceof ValidationError) {
        throw error
      }
      this.handleError(error, operationName, table)
    }
  }

  /**
   * Safe array operation - returns empty array instead of null
   */
  protected async safeArrayOperation<T>(
    operation: () => Promise<{ data: T[] | null; error: any }>,
    operationName: string,
    table?: string
  ): Promise<T[]> {
    try {
      const { data, error } = await operation()
      
      if (error) {
        this.handleError(error, operationName, table)
      }

      return data || []
    } catch (error: any) {
      if (error instanceof SupabaseServiceError || error instanceof ValidationError) {
        throw error
      }
      this.handleError(error, operationName, table)
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequired<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new ValidationError(`שדה ${String(field)} הוא שדה חובה`, String(field), data[field])
      }
    }
  }

  /**
   * Handle Supabase-specific errors
   */
  protected handleSupabaseError(error: any): never {
    // RLS Permission Errors
    if (['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error.code)) {
      const messages = {
        PGRST116: 'אין הרשאה לצפות ברשומה זו',
        PGRST301: 'אין הרשאה לעדכן רשומה זו', 
        PGRST204: 'הרשומה לא נמצאה או שאין הרשאה לגשת אליה',
        '42501': 'הרשאות לא מספקות לביצוע פעולה זו'
      }
      
      console.warn(`[RLS Error ${error.code}]:`, {
        message: messages[error.code as keyof typeof messages],
        originalError: error,
        timestamp: new Date().toISOString()
      })
      
      throw new RLSPermissionError(
        error,
        messages[error.code as keyof typeof messages] || 'שגיאת הרשאה',
        'unknown'
      )
    }

    // Validation Errors
    if (error.code === '23505') {
      throw new SupabaseServiceError('הערך כבר קיים במערכת', 'DUPLICATE_KEY', error.details)
    }

    if (error.code === '23503') {
      throw new SupabaseServiceError('רשומה קשורה לא נמצאה', 'FOREIGN_KEY_VIOLATION', error.details)
    }

    // Generic database error
    throw new SupabaseServiceError(
      error.message || 'שגיאה בפעולת מסד נתונים',
      error.code || 'DB_ERROR',
      error.details
    )
  }

  /**
   * Validate UUID format
   */
  protected validateUUID(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new ValidationError(`${fieldName} אינו UUID תקין`, fieldName, id)
    }
  }

  /**
   * Log operation for debugging
   */
  protected logOperation(operation: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.constructor.name}] ${operation}`, data)
    }
  }
}
