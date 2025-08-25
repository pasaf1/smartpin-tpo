'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth, useUsers } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { data: demoUsers = [] } = useUsers()
  const { signIn, isAuthenticated, isLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showDemoMode, setShowDemoMode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSigningIn(true)
    
    try {
      await signIn({ email, password })
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleDemoLogin = async (userEmail: string) => {
    setError(null)
    setIsSigningIn(true)
    
    try {
      await signIn({ email: userEmail, password: 'demo-password' })
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Demo login failed:', error)
      setError(error.message || 'Demo login failed.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const adminUsers = demoUsers.filter(u => u.role === 'Admin')
  const regularUsers = demoUsers.filter(u => u.role !== 'Admin' && u.status === 'active')
  const inactiveUsers = demoUsers.filter(u => u.status === 'inactive')

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
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@smartpin.com"
                  required
                  disabled={isSigningIn}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isSigningIn}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-lg shadow-indigo-500/30"
                disabled={isSigningIn || isLoading}
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

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={() => setShowDemoMode(!showDemoMode)}
                disabled={isSigningIn}
              >
                {showDemoMode ? '🔒 Hide Demo Mode' : '🚀 Demo Mode'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users - Only show when demo mode is enabled */}
        {showDemoMode && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/40 shadow-xl shadow-slate-500/10">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">🚀 Demo Users</CardTitle>
              <CardDescription>
                Click any user to instantly log in (Development & Testing Mode)
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Admin Users */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="destructive">Admin</Badge>
                <span className="text-sm text-muted-foreground">({adminUsers.length})</span>
              </div>
              <div className="space-y-2">
                {adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      isSigningIn 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-muted/50',
                      selectedUser === user.id ? 'border-primary bg-primary/5' : ''
                    )}
                    onClick={() => {
                      if (!isSigningIn) {
                        setSelectedUser(user.id)
                        handleDemoLogin(user.email)
                      }
                    }}
                  >
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Regular Users */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">Active Users</Badge>
                <span className="text-sm text-muted-foreground">({regularUsers.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                {regularUsers.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md border transition-colors',
                      isSigningIn 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-muted/50',
                      selectedUser === user.id ? 'border-primary bg-primary/5' : ''
                    )}
                    onClick={() => {
                      if (!isSigningIn) {
                        setSelectedUser(user.id)
                        handleDemoLogin(user.email)
                      }
                    }}
                  >
                    <div className="text-lg">{user.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive Users */}
            {inactiveUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Inactive</Badge>
                  <span className="text-sm text-muted-foreground">({inactiveUsers.length})</span>
                </div>
                <div className="space-y-1">
                  {inactiveUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-md border opacity-50"
                    >
                      <div className="text-lg">{user.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        inactive
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
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