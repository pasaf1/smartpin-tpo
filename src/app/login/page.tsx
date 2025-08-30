'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'
// Enhanced UI Components
import { LoadingButton } from '@/components/ui/loading-states'
import { SmartCard, IconContainer } from '@/components/ui/design-system'
import { AccessibleField } from '@/components/ui/accessibility'
import { ResponsiveContainer, useBreakpoint, TouchButton } from '@/components/ui/responsive'
import { User, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle, session, loading } = useAuth()
  const { isMobile, isTablet } = useBreakpoint()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && session) {
      router.push('/')
    }
  }, [session, loading, router])

  // Check if Google provider is enabled in Supabase
  useEffect(() => {
    let mounted = true
    fetch('/api/oauth-check')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setGoogleEnabled(Boolean(data.enabled))
        if (data.enabled === false && data.detail) {
          // make the error helpful but non-blocking until user clicks Google sign in
          console.debug('OAuth check:', data.detail)
        }
      })
      .catch((err) => {
        console.debug('OAuth check error:', err)
        if (mounted) setGoogleEnabled(false)
      })
    return () => { mounted = false }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSigningIn(true)
    
    try {
      await signIn(email, password)
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsSigningIn(true)
    
    try {
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google sign-in failed:', error)
      
      // Handle specific Google OAuth error
      if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
        setError('Google sign-in is not configured. Please contact your administrator to enable Google OAuth in the system settings.')
      } else {
        setError(error.message || 'Google sign-in failed. Please try again or use email/password.')
      }
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        {/* Theme Toggle - Top Right */}
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        
        <ResponsiveContainer 
          maxWidth="sm" 
          padding={{ mobile: 'px-4 py-8', tablet: 'px-6 py-12', desktop: 'px-8 py-16' }}
        >
          {/* Enhanced Login Form */}
          <SmartCard 
            variant="glass" 
            size="lg" 
            className="w-full max-w-md mx-auto"
          >
            <CardHeader className="text-center pb-8">
              {/* Enhanced Company Logo */}
              <IconContainer
                icon={User}
                size={isMobile ? "lg" : "xl"}
                variant="rounded"
                background="primary"
                className="mx-auto mb-6 transform hover:scale-105 transition-transform duration-300"
              />
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                SmartPin TPO
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                Quality Management Platform
              </CardDescription>
              <div className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Roofing Quality Control & Inspection System
              </div>
            </CardHeader>
            <CardContent id="login-content">
              {/* Enhanced Error Display */}
              {error && (
                <div className="mb-6 flex items-start gap-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg" role="alert">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <AccessibleField
                  label="Email"
                  required={true}
                  hint="Enter your registered email address"
                >
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@smartpin.com"
                    required
                    disabled={isSigningIn}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </AccessibleField>
                
                <AccessibleField
                  label="Password"
                  required={true}
                  hint="Enter your account password"
                >
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isSigningIn}
                    className="text-slate-900 dark:text-slate-100"
                  />
                </AccessibleField>
                
                <LoadingButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSigningIn || loading}
                  loadingText="Signing in..."
                  disabled={isSigningIn || loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-lg shadow-indigo-500/30"
                >
                  Sign In
                </LoadingButton>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              {googleEnabled === false && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Google sign-in appears to be disabled for this Supabase project. Follow the <Link href="/GOOGLE-OAUTH-SETUP.md" className="underline">setup guide</Link> to enable it.
                </div>
              )}
              </div>
              </form>
            </CardContent>
          </SmartCard>

          {/* Enhanced Footer */}
          <div className="text-center mt-8 space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Need help? <Link href="/support" className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">Contact Support</Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>SmartPin TPO Quality Management System v2.0</span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Enhanced with accessibility and mobile-first design
            </div>
          </div>
        </ResponsiveContainer>
    </div>
  )
}