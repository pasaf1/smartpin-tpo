'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useLogin, useUsers } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { data: users = [] } = useUsers()
  const loginMutation = useLogin()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await loginMutation.mutateAsync({ email, password })
      router.push('/roofs')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleDemoLogin = async (userEmail: string) => {
    try {
      await loginMutation.mutateAsync({ email: userEmail, password: 'demo' })
      router.push('/roofs')
    } catch (error) {
      console.error('Demo login failed:', error)
    }
  }

  const adminUsers = users.filter(u => u.role === 'admin')
  const regularUsers = users.filter(u => u.role === 'user' && u.status === 'active')
  const inactiveUsers = users.filter(u => u.role === 'user' && u.status === 'inactive')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">SmartPin TPO</CardTitle>
            <CardDescription>
              Quality Management Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Users</CardTitle>
            <CardDescription>
              Click any user to instantly log in (Development Mode)
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
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedUser === user.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                    onClick={() => {
                      setSelectedUser(user.id)
                      handleDemoLogin(user.email)
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
                      'flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors',
                      selectedUser === user.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                    onClick={() => {
                      setSelectedUser(user.id)
                      handleDemoLogin(user.email)
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
      </div>
    </div>
  )
}