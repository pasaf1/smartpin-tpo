'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  full_name: string
  avatar?: string
  role: 'CEO' | 'Project_Manager' | 'Foreman' | 'Admin'
  status: 'active' | 'inactive'
  phone?: string
  last_login?: string
  created_at: string
  company?: string
  department?: string
}

// Construction team members (3 CEOs, 2 Project Managers, 3 Foremen, 1 Admin)
const CONSTRUCTION_TEAM: User[] = [
  // Admin
  {
    id: 'admin-001',
    email: 'admin@smartpin.com',
    full_name: 'Sarah Chen',
    avatar: '👩‍💼',
    role: 'Admin',
    status: 'active',
    phone: '+1-555-0100',
    company: 'SmartPin Systems',
    department: 'Administration',
    last_login: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00Z'
  },
  
  // CEOs
  {
    id: 'ceo-001',
    email: 'michael.thompson@constructco.com',
    full_name: 'Michael Thompson',
    avatar: '👨‍💼',
    role: 'CEO',
    status: 'active',
    phone: '+1-555-0101',
    company: 'ConstructCo Elite',
    department: 'Executive',
    last_login: new Date(Date.now() - 1800000).toISOString(),
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'ceo-002',
    email: 'elizabeth.brooks@rooftech.com',
    full_name: 'Elizabeth Brooks',
    avatar: '👩‍💼',
    role: 'CEO',
    status: 'active',
    phone: '+1-555-0102',
    company: 'RoofTech Solutions',
    department: 'Executive',
    last_login: new Date(Date.now() - 3600000).toISOString(),
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'ceo-003',
    email: 'robert.williams@premiumroofs.com',
    full_name: 'Robert Williams',
    avatar: '👨‍💼',
    role: 'CEO',
    status: 'active',
    phone: '+1-555-0103',
    company: 'Premium Roofing Corp',
    department: 'Executive',
    last_login: new Date(Date.now() - 5400000).toISOString(),
    created_at: '2024-01-04T00:00:00Z'
  },

  // Project Managers
  {
    id: 'pm-001',
    email: 'jennifer.davis@constructco.com',
    full_name: 'Jennifer Davis',
    avatar: '👩‍🏗️',
    role: 'Project_Manager',
    status: 'active',
    phone: '+1-555-0201',
    company: 'ConstructCo Elite',
    department: 'Project Management',
    last_login: new Date(Date.now() - 1200000).toISOString(),
    created_at: '2024-01-05T00:00:00Z'
  },
  {
    id: 'pm-002',
    email: 'david.martinez@rooftech.com',
    full_name: 'David Martinez',
    avatar: '👨‍🏗️',
    role: 'Project_Manager',
    status: 'active',
    phone: '+1-555-0202',
    company: 'RoofTech Solutions',
    department: 'Project Management',
    last_login: new Date(Date.now() - 2400000).toISOString(),
    created_at: '2024-01-06T00:00:00Z'
  },

  // Foremen
  {
    id: 'foreman-001',
    email: 'carlos.rodriguez@constructco.com',
    full_name: 'Carlos Rodriguez',
    avatar: '👷‍♂️',
    role: 'Foreman',
    status: 'active',
    phone: '+1-555-0301',
    company: 'ConstructCo Elite',
    department: 'Field Operations',
    last_login: new Date(Date.now() - 600000).toISOString(),
    created_at: '2024-01-07T00:00:00Z'
  },
  {
    id: 'foreman-002',
    email: 'maria.gonzalez@rooftech.com',
    full_name: 'Maria Gonzalez',
    avatar: '👷‍♀️',
    role: 'Foreman',
    status: 'active',
    phone: '+1-555-0302',
    company: 'RoofTech Solutions',
    department: 'Field Operations',
    last_login: new Date(Date.now() - 900000).toISOString(),
    created_at: '2024-01-08T00:00:00Z'
  },
  {
    id: 'foreman-003',
    email: 'james.wilson@premiumroofs.com',
    full_name: 'James Wilson',
    avatar: '👷‍♂️',
    role: 'Foreman',
    status: 'active',
    phone: '+1-555-0303',
    company: 'Premium Roofing Corp',
    department: 'Field Operations',
    last_login: new Date(Date.now() - 1800000).toISOString(),
    created_at: '2024-01-09T00:00:00Z'
  }
]

// Current user state
let currentUser: User | null = CONSTRUCTION_TEAM[0] // Default to admin for demo

const QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
  users: ['auth', 'users'] as const,
  user: (id: string) => ['auth', 'user', id] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: async (): Promise<User | null> => {
      // In demo mode, return current demo user
      if (process.env.NODE_ENV === 'development') {
        return currentUser
      }

      // In production, get user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Get user profile from database
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) return null

      return {
        id: profile.id,
        email: user.email || profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        status: profile.status,
        last_login: profile.last_login,
        created_at: profile.created_at
      }
    },
  })
}

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: async (): Promise<User[]> => {
      if (process.env.NODE_ENV === 'development') {
        return CONSTRUCTION_TEAM
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: async (): Promise<User | null> => {
      if (process.env.NODE_ENV === 'development') {
        return CONSTRUCTION_TEAM.find(user => user.id === id) || null
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return null
      return data
    },
    enabled: !!id,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }): Promise<User> => {
      if (process.env.NODE_ENV === 'development') {
        // Demo login - find user by email
        const user = CONSTRUCTION_TEAM.find(u => u.email === email)
        if (!user) throw new Error('Invalid email or password')
        
        currentUser = { ...user, last_login: new Date().toISOString() }
        return currentUser
      }

      // Production login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error('Login failed')

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return {
        id: profile.id,
        email: data.user.email || profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: profile.role,
        status: profile.status,
        last_login: profile.last_login,
        created_at: profile.created_at
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (process.env.NODE_ENV === 'development') {
        currentUser = null
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }): Promise<User> => {
      if (process.env.NODE_ENV === 'development') {
        const userIndex = CONSTRUCTION_TEAM.findIndex(u => u.id === userId)
        if (userIndex === -1) throw new Error('User not found')
        
        CONSTRUCTION_TEAM[userIndex] = { ...CONSTRUCTION_TEAM[userIndex], status }
        return CONSTRUCTION_TEAM[userIndex]
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ status })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
    },
  })
}

// Helper functions
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function canManageUsers(user: User | null): boolean {
  return isAdmin(user)
}

export function canAccessRoof(user: User | null, roofId: string): boolean {
  // In this simplified system, all active users can access all roofs
  return user?.status === 'active'
}

// Demo helper - switch current user (for development only)
export function switchDemoUser(userId: string): void {
  if (process.env.NODE_ENV === 'development') {
    const user = CONSTRUCTION_TEAM.find(u => u.id === userId)
    if (user) {
      currentUser = user
    }
  }
}