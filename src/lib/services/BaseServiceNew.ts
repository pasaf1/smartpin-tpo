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
  constructor(
    error: any,
    message: string,
    public table: string
  ) {
    super(message, error.code || 'RLS_ERROR', error.details, error.hint)
    this.name = 'RLSPermissionError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string, 
    public field: string, 
    public value?: any
  ) {
    super(message)
    this.name = 'ValidationError'
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
   * Handle Supabase-specific errors
   */
  protected handleSupabaseError(error: any): never {
    // RLS Permission Errors
    if (['PGRST116', 'PGRST301', 'PGRST204'].includes(error.code)) {
      const messages = {
        PGRST116: 'אין הרשאה לצפות ברשומה זו',
        PGRST301: 'אין הרשאה לעדכן רשומה זו', 
        PGRST204: 'הרשומה לא נמצאה או שאין הרשאה לגשת אליה'
      }
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
   * Process and handle any error with proper Hebrew messages
   */
  protected handleError(error: any, operation: string): never {
    console.error(`[${this.constructor.name}] ${operation} failed:`, error)

    // If it's already one of our custom errors, just re-throw
    if (error instanceof SupabaseServiceError || error instanceof ValidationError) {
      throw error
    }

    // RLS Errors
    if (this.isRLSError(error)) {
      throw new RLSPermissionError(error, this.getRLSErrorMessage(error), 'unknown')
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
    if (error.code?.startsWith('23')) {
      throw new SupabaseServiceError(
        this.getDatabaseErrorMessage(error),
        error.code,
        error.details
      )
    }

    // Generic error
    throw new SupabaseServiceError(
      error.message || 'שגיאה לא ידועה',
      'UNKNOWN_ERROR'
    )
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
   * Check if error is RLS-related
   */
  private isRLSError(error: any): boolean {
    return ['PGRST116', 'PGRST301', 'PGRST204'].includes(error.code)
  }

  /**
   * Check if error is storage-related
   */
  private isStorageError(error: any): boolean {
    return error.error && typeof error.error === 'string'
  }

  /**
   * Get Hebrew message for RLS errors
   */
  private getRLSErrorMessage(error: any): string {
    const messages = {
      PGRST116: 'אין הרשאה לצפות ברשומה זו',
      PGRST301: 'אין הרשאה לעדכן רשומה זו',
      PGRST204: 'הרשומה לא נמצאה או שאין הרשאה לגשת אליה'
    }
    return messages[error.code as keyof typeof messages] || 'שגיאת הרשאה'
  }

  /**
   * Get Hebrew message for storage errors
   */
  private getStorageErrorMessage(error: any): string {
    const storageMessages = {
      'file_too_large': 'הקובץ גדול מדי',
      'invalid_file_type': 'סוג קובץ לא נתמך',
      'storage_quota_exceeded': 'מכסת האחסון מלאה',
      'upload_failed': 'העלאת הקובץ נכשלה'
    }
    return storageMessages[error.error as keyof typeof storageMessages] || 'שגיאה באחסון קבצים'
  }

  /**
   * Get Hebrew message for database errors
   */
  private getDatabaseErrorMessage(error: any): string {
    const dbMessages = {
      '23505': 'הערך כבר קיים במערכת',
      '23503': 'רשומה קשורה לא נמצאה',
      '23502': 'שדה חובה חסר',
      '23514': 'ערך לא תקין'
    }
    return dbMessages[error.code as keyof typeof dbMessages] || 'שגיאה במסד הנתונים'
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
