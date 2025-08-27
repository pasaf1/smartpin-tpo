// src/app/admin/users/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** ===== Types (minimal “dry” user shape) ===== */
type UserRole = 'Admin' | 'QA_Manager' | 'Supervisor' | 'Foreman' | 'Inspector' | 'Viewer' | 'Contractor';

type DbUser = {
  id: string;
  auth_user_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
};

type UiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  last_login_at?: string;
};

/** ===== Normalizers ===== */
const normalizeRole = (r: string | null | undefined): UserRole => {
  const role = (r || '').trim() as UserRole;
  const allowed: UserRole[] = ['Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Inspector', 'Viewer', 'Contractor'];
  return allowed.includes(role) ? role : 'Viewer';
};

const toUiUser = (u: DbUser): UiUser => ({
  id: u.id,
  name: (u.full_name || '').trim() || (u.email || 'User'),
  email: u.email || '',
  role: normalizeRole(u.role),
  created_at: u.created_at || undefined,
  last_login_at: u.last_login_at || undefined,
});

/** ===== Page ===== */
export default function UserManagementPage() {
  const { loading, profile } = useAuth();
  const canManageUsers = profile?.role === 'Admin' || profile?.role === 'QA_Manager';

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UiUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  // Load users (no "status" column — only basic fields)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, auth_user_id, full_name, email, role, created_at') // removed last_login_at
        .order('created_at', { ascending: false });

      if (!cancelled) {
        if (error) {
          console.error('Failed to fetch users:', error);
          setUsers([]);
        } else {
          setUsers((data || []).map(toUiUser));
        }
        setIsUsersLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived (keep hooks before any early returns)
  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
    );
  }, [users, searchTerm]);

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === 'Admin').length;

  // Guards
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-[420px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to manage users.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Admin Only</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                  <p className="text-2xl font-bold text-blue-600">{isUsersLoading ? '—' : adminUsers}</p>
                </div>
                <div className="text-2xl">👑</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-2xl font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-2xl">📅</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Basic info: full name, role, email</CardDescription>
              </div>
                <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search users…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-72 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Use a simple styled Link instead of Button to avoid type issues */}
                <Link
                  href="/admin/users/create"
                  className={cn(
                  'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium',
                  'bg-primary text-primary-foreground hover:opacity-90'
                  )}
                >
                  New User
                </Link>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-10 text-center text-muted-foreground">Loading users…</div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-10 text-center text-muted-foreground">No users found.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === 'Admin' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          {/* Avoid shadcn <Button> here to prevent type mismatch – use the built-in trigger button */}
                          <DropdownMenuTrigger className="h-8 w-8 rounded-md border text-center">⋮</DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/edit/${u.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-muted-foreground">📧 Send Email</DropdownMenuItem>
                            <DropdownMenuItem className="text-muted-foreground">🔄 Reset Password</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
