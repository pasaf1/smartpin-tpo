import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="mb-4">
              The authentication process encountered an error. This could be due to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Network connectivity issues</li>
              <li>Expired or invalid authorization code</li>
              <li>Google OAuth configuration problems</li>
              <li>Session timeout</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            If this problem persists, please contact your system administrator or try signing in with email and password instead.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}