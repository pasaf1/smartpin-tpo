'use client';

// src/app/admin/users/page.tsx

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
// Enhanced UI Components
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading-states';
import { SmartCard, KPICard, ResponsiveGrid, SmartContainer } from '@/components/ui/design-system';
import { SkipLink, AccessibleField, AccessibleTable } from '@/components/ui/accessibility';
import { ResponsiveContainer, useBreakpoint, TouchButton } from '@/components/ui/responsive';
import { Users, Crown, Calendar, Plus, Search, Edit2, Trash2 } from 'lucide-react';

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
  const { isMobile, isTablet } = useBreakpoint();
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
      <LoadingPage
        title="Loading User Management"
        message="Preparing user administration interface..."
        showLogo={true}
        variant="fullscreen"
      />
    );
  }

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SmartCard variant="elevated" size="lg" className="max-w-md w-full text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                You do not have permission to manage users. This feature requires Admin or QA Manager privileges.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/">
                <TouchButton variant="primary">
                  Return to Dashboard
                </TouchButton>
              </Link>
            </div>
          </div>
        </SmartCard>
      </div>
    );
  }

  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      
      <div className="min-h-screen bg-background">
        {/* Enhanced Header */}
        <header className="border-b bg-card shadow-sm">
          <ResponsiveContainer>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-7 h-7 text-indigo-600" />
                  User Management
                </h1>
                <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Admin Only
                </Badge>
                <Link href="/">
                  <TouchButton variant="ghost" size="sm">
                    ← Back to Dashboard
                  </TouchButton>
                </Link>
              </div>
            </div>
          </ResponsiveContainer>
        </header>

        <ResponsiveContainer>
          <main id="main-content" className="py-8 space-y-8">
            {/* Enhanced Stats with KPI Cards */}
            <ResponsiveGrid
              columns={{ xs: 1, sm: 2, lg: 3 }}
              gap="lg"
            >
              <KPICard
                title="Total Users"
                value={isUsersLoading ? '—' : totalUsers}
                subtitle="Registered accounts"
                icon={Users}
                color="primary"
              />
              
              <KPICard
                title="Admin Users"
                value={isUsersLoading ? '—' : adminUsers}
                subtitle="Administrative privileges"
                icon={Crown}
                color="warning"
              />
              
              <KPICard
                title="Last Updated"
                value={new Date().toLocaleDateString()}
                subtitle="System data refresh"
                icon={Calendar}
                color="info"
              />
            </ResponsiveGrid>

            {/* Enhanced Users Table */}
            <SmartCard variant="elevated" size="lg">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Users</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Basic info: full name, role, email
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-72 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Search users"
                      />
                    </div>
                    <Link href="/admin/users/create">
                      <TouchButton
                        variant="primary"
                        size="md"
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        New User
                      </TouchButton>
                    </Link>
                  </div>
                </div>
              </div>
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
        </SmartCard>
          </main>
        </ResponsiveContainer>
      </div>
    </>
  );
}
