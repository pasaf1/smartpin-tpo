'use client'

import React from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, LogIn, Shield } from 'lucide-react'

interface RLSError {
  code: string
  message: string
  hint?: string
}

interface RLSErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: RLSError; retry: () => void }>
}

interface RLSErrorBoundaryState {
  hasError: boolean
  error: RLSError | null
  retryCount: number
}

// Helper function to detect RLS errors
export function isRLSError(error: any): error is RLSError {
  return error && (
    ['PGRST116', 'PGRST301', 'PGRST204', '42501'].includes(error.code) ||
    error.message?.includes('Row Level Security') ||
    error.message?.includes('permission denied') ||
    error.message?.includes('insufficient privilege')
  )
}

// Helper function to get user-friendly RLS error messages
export function getRLSErrorMessage(error: RLSError): { title: string; description: string; action: string } {
  const errorMessages = {
    'PGRST116': {
      title: 'אין הרשאה לצפייה',
      description: 'אין לך הרשאה לצפות במידע זה. ייתכן שאתה צריך להתחבר מחדש או לבקש הרשאות נוספות.',
      action: 'התחבר מחדש'
    },
    'PGRST301': {
      title: 'אין הרשאה לעדכון',
      description: 'אין לך הרשאה לעדכן מידע זה. פעולה זו מוגבלת למשתמשים עם הרשאות מתאימות.',
      action: 'בדוק הרשאות'
    },
    'PGRST204': {
      title: 'המידע לא נמצא',
      description: 'המידע המבוקש לא נמצא או שאין לך הרשאה לגשת אליו.',
      action: 'חזור למסך הקודם'
    },
    '42501': {
      title: 'הרשאות לא מספקות',
      description: 'אין לך הרשאות מספיקות לביצוע פעולה זו. צור קשר עם מנהל המערכת.',
      action: 'צור קשר עם מנהל'
    }
  }
  
  return errorMessages[error.code as keyof typeof errorMessages] || {
    title: 'שגיאת הרשאות',
    description: 'אירעה שגיאת הרשאות. אנא נסה שוב או צור קשר עם מנהל המערכת.',
    action: 'נסה שוב'
  }
}

// Default RLS Error Component
function DefaultRLSError({ error, retry }: { error: RLSError; retry: () => void }) {
  const { user, signOut } = useAuth()
  const { title, description, action } = getRLSErrorMessage(error)

  const handleAction = () => {
    if (error.code === 'PGRST116' || error.code === '42501') {
      // Permission errors - sign out and redirect to login
      signOut()
    } else {
      // Other errors - retry
      retry()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-900">{title}</CardTitle>
          <CardDescription className="text-red-700">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {user && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">פרטי משתמש:</p>
              <p>שם: {user.user_metadata?.full_name || 'לא זמין'}</p>
              <p>תפקיד: {user.user_metadata?.role || 'לא זמין'}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleAction} variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50">
              {error.code === 'PGRST116' || error.code === '42501' ? (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  התחבר מחדש
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {action}
                </>
              )}
            </Button>
            
            <Button onClick={retry} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              נסה שוב
            </Button>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="text-xs text-gray-500 cursor-pointer">
                מידע טכני (פיתוח)
              </summary>
              <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// RLS Error Boundary Class Component
export class RLSErrorBoundary extends React.Component<RLSErrorBoundaryProps, RLSErrorBoundaryState> {
  constructor(props: RLSErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: any): Partial<RLSErrorBoundaryState> {
    if (isRLSError(error)) {
      return {
        hasError: true,
        error: error
      }
    }
    return { hasError: false }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (isRLSError(error)) {
      console.error('[RLSErrorBoundary] RLS Error caught:', {
        error,
        errorInfo,
        timestamp: new Date().toISOString()
      })
      
      // Report to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
      }
    } else {
      // Re-throw non-RLS errors to be handled by parent error boundary
      throw error
    }
  }

  retry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultRLSError
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

// Hook for handling RLS errors in components
export function useRLSErrorHandler() {
  const { signOut } = useAuth()

  const handleRLSError = React.useCallback((error: any) => {
    if (!isRLSError(error)) {
      throw error // Re-throw non-RLS errors
    }

    const { title, description } = getRLSErrorMessage(error)
    
    // For critical permission errors, sign out the user
    if (['PGRST116', '42501'].includes(error.code)) {
      console.warn('[RLS] Critical permission error, signing out user:', error)
      signOut()
      return
    }

    // For other RLS errors, show user-friendly message
    console.warn('[RLS] Permission error:', { error, title, description })
    
    // You can integrate with your toast/notification system here
    // toast.error(title, { description })
    
    return { title, description, isRLSError: true }
  }, [signOut])

  return { handleRLSError, isRLSError, getRLSErrorMessage }
}

export default RLSErrorBoundary
