'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, session, loading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && session) {
      router.push('/')
    }
  }, [session, loading, router])

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

  const handleDemoLogin = async (_userEmail: string) => {}

  // Demo users removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-white/40 shadow-xl shadow-slate-500/10">
          <CardHeader className="text-center pb-8">
            {/* Company Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center mx-auto mb-4 transform hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 bg-white rounded-lg opacity-90"></div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              SmartPin TPO
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 font-medium">
              Quality Management Platform
            </CardDescription>
            <div className="text-sm text-slate-500 mt-2">
              Roofing Quality Control & Inspection System
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 border border-red-200 bg-red-50 p-4 rounded-md">
                <div className="text-red-700 text-sm">
                  {error}
                </div>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@smartpin.com"
                  required
                  disabled={isSigningIn}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isSigningIn}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-lg shadow-indigo-500/30"
                disabled={isSigningIn || loading}
              >
                {isSigningIn ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>

              {/* Demo mode removed */}
            </form>
          </CardContent>
        </Card>

  {/* Demo user list removed */}
      </div>
      
      {/* Company Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="text-center">
          <p className="text-xs text-slate-500">
            © 2024 SmartPin TPO - Quality Management Platform
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Professional Roofing Inspection & Quality Control System
          </p>
        </div>
      </div>
    </div>
  )
}