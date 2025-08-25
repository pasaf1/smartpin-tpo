'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth, useUsers } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function UserManagementPage() {
  const { userProfile, isLoading, canManageUsers } = useAuth()
  const { data: users = [] } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const currentUser = userProfile

  // Mock mutation for status updates
  const updateStatusMutation = {
    mutateAsync: async ({ userId, status }: { userId: string, status: string }) => {
      console.log('Status update:', { userId, status })
      // This would typically call an API endpoint
      return Promise.resolve()
    },
    isPending: false
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Check if current user can manage users
  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium text-destructive mb-2">Access Denied</p>
              <p className="text-sm text-muted-foreground mb-4">
                You need Admin or QA Manager privileges to access user management.
              </p>
              <Button asChild variant="outline">
                <Link href="/roofs">← Back to Roofs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await updateStatusMutation.mutateAsync({ userId, status: newStatus })
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u: any) => u.status === 'active').length
  const adminUsers = users.filter((u: any) => u.role === 'Admin').length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/roofs">← Back to Roofs</Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                <p className="text-muted-foreground">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="destructive">Admin Only</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                  </div>
                  <div className="text-2xl">👥</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                    <p className="text-2xl font-bold text-red-600">{totalUsers - activeUsers}</p>
                  </div>
                  <div className="text-2xl">⛔</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                    <p className="text-2xl font-bold text-blue-600">{adminUsers}</p>
                  </div>
                  <div className="text-2xl">👑</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      Manage user accounts and their access status
                    </CardDescription>
                  </div>

                  <div className="w-80">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">👤</div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'Admin' ? 'destructive' : 'secondary'}
                            className="capitalize"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'outline'}
                            className={cn(
                              'capitalize',
                              user.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : ''
                            )}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Never</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date().toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">⚙️</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusToggle(user.id, user.status)}
                                disabled={user.id === currentUser?.id || updateStatusMutation.isPending}
                              >
                                {user.status === 'active' ? '⛔ Deactivate' : '✅ Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-muted-foreground">
                                📧 Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-muted-foreground">
                                🔄 Reset Password
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      <p>No users found</p>
                      {searchTerm && (
                        <p className="text-sm mt-1">Try adjusting your search terms</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
