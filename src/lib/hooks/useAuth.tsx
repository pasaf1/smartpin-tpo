'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

/** ---- Types ---- **/
type UserRole = 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Inspector' | 'Viewer' | 'Contractor'
type UserStatus = 'active' | 'inactive'

type DbUser = {
  id: string
  auth_user_id: string | null
  full_name: string | null
  email: string | null
  role: string | null
  status?: string | null
  created_at?: string | null
  last_login_at?: string | null
}

type UiUser = {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at?: string
  last_login_at?: string
}

/** ---- Normalizers ---- **/
const normalizeRole = (r: string | null | undefined): UserRole => {
  const role = (r || '').trim() as UserRole
  const allowed: UserRole[] = ['Admin','QA_Manager','Supervisor','Foreman','Inspector','Viewer','Contractor']
  return allowed.includes(role) ? role : 'Viewer'
}
const normalizeStatus = (s: string | null | undefined): UserStatus =>
  s === 'inactive' ? 'inactive' : 'active'

const toUiUser = (u: DbUser): UiUser => ({
  id: u.id,
  name: (u.full_name || '').trim() || (u.email || 'User'),
  email: u.email || '',
  role: normalizeRole(u.role),
  status: normalizeStatus(u.status),
  created_at: u.created_at || undefined,
  last_login_at: u.last_login_at || undefined,
})

/** ---- Page ---- **/
export default function UserManagementPage() {
  const { userProfile, isLoading, canManageUsers } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [users, setUsers] = useState<UiUser[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)

  /** Load users from Supabase */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsUsersLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, auth_user_id, full_name, email, role, status, created_at, last_login_at')
        .order('created_at', { ascending: false })
      if (!cancelled) {
        if (error) {
          console.error('Failed to fetch users:', error)
          toast.error('Failed to load users')
          setUsers([])
        } else {
          setUsers((data || []).map(toUiUser))
        }
        setIsUsersLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /** Guards */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

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

  /** Derivations */
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let list = users
    if (q) {
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter)
    }
    return list
  }, [users, searchTerm, roleFilter])

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const adminUsers = users.filter(u => u.role === 'Admin').length

  /** Mutations */
  const handleStatusToggle = async (userId: string, currentStatus: UserStatus) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    const next = currentStatus === 'active' ? 'inactive' : 'active'
    setIsMutating(true)
    try {
      // optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: next } : u))
      const { error } = await supabase.from('users').update({ status: next }).eq('id', userId)
      if (error) {
        // revert on error
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: currentStatus } : u))
        console.error('Failed to update user status:', error)
        toast.error('Failed to update user status')
      } else {
        toast.success('User status updated successfully')
      }
    } finally {
      setIsMutating(false)
    }
  }

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
                    <p className="text-2xl font-bold">{isUsersLoading ? '—' : totalUsers}</p>
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
                    <p className="text-2xl font-bold text-green-600">
                      {isUsersLoading ? '—' : activeUsers}
                    </p>
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
                    <p className="text-2xl font-bold text-red-600">
                      {isUsersLoading ? '—' : totalUsers - activeUsers}
                    </p>
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
                    <p className="text-2xl font-bold text-blue-600">
                      {isUsersLoading ? '—' : adminUsers}
                    </p>
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      Manage user accounts and their access status
                    </CardDescription>
                  </div>

                  <div className="flex w-full md:w-auto items-center gap-2">
                    <div className="w-full md:w-64">
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Role filter */}
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    >
                      <option value="all">All roles</option>
                      <option value="Admin">Admin</option>
                      <option value="QA_Manager">QA Manager</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Foreman">Foreman</option>
                      <option value="Inspector">Inspector</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Contractor">Contractor</option>
                    </select>
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
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex items-center justify-center py-10 text-muted-foreground">
                            Loading users…
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
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
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : ''
                              )}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isMutating}>⚙️</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusToggle(user.id, user.status)}
                                  disabled={isMutating || user.id === userProfile?.id}
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
                      ))
                    )}
                  </TableBody>
                </Table>

                {!isUsersLoading && filteredUsers.length === 0 && (
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
