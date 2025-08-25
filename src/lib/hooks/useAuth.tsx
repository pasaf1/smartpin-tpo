// Authentication hooks for production Supabase integration
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isDemoMode } from '../supabase'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { User, UserRole, UserInsert } from '../database.types'

interface AuthState {
  user: AuthUser | null
  userProfile: User | null
  isLoading: boolean
  isAuthenticated: boolean
  role: UserRole | null
}

interface SignUpData {
  email: string
  password: string
  fullName: string
  role?: UserRole
}

interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
    role: null,
  })

  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (isDemoMode) {
        // Demo mode - create mock auth state
        setAuthState({
          user: {
            id: 'demo-auth-user',
            email: 'demo@smartpintpo.com',
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            confirmation_sent_at: null,
            confirmed_at: new Date().toISOString(),
            email_change_sent_at: null,
            email_confirmed_at: new Date().toISOString(),
            invited_at: null,
            last_sign_in_at: new Date().toISOString(),
            phone: null,
            phone_change_sent_at: null,
            phone_confirmed_at: null,
            recovery_sent_at: null,
            role: 'authenticated',
            updated_at: new Date().toISOString()
          },
          userProfile: {
            id: 'demo-user',
            auth_user_id: 'demo-auth-user',
            full_name: 'Demo User',
            email: 'demo@smartpintpo.com',
            role: 'Admin',
            address: null,
            birth_date: null,
            created_at: new Date().toISOString()
          },
          isLoading: false,
          isAuthenticated: true,
          role: 'Admin',
        })
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setAuthState(prev => ({ ...prev, isLoading: false }))
          return
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id)
          setAuthState({
            user: session.user,
            userProfile,
            isLoading: false,
            isAuthenticated: true,
            role: userProfile?.role || null,
          })
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isDemoMode) return

        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id)
            setAuthState({
              user: session.user,
              userProfile,
              isLoading: false,
              isAuthenticated: true,
              role: userProfile?.role || null,
            })
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            userProfile: null,
            isLoading: false,
            isAuthenticated: false,
            role: null,
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch user profile from our custom users table
  const fetchUserProfile = async (authUserId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // User profile doesn't exist, this might be a new user
          console.log('User profile not found for auth user:', authUserId)
          return null
        }
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Create user profile after successful signup
  const createUserProfile = async (authUser: AuthUser, additionalData: Partial<UserInsert>): Promise<User | null> => {
    try {
      const userProfile: UserInsert = {
        auth_user_id: authUser.id,
        email: authUser.email!,
        full_name: additionalData.full_name || authUser.user_metadata?.full_name || '',
        role: additionalData.role || 'Viewer',
        ...additionalData
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      return null
    }
  }

  // Sign up new user
  const signUp = async (signUpData: SignUpData) => {
    if (isDemoMode) {
      throw new Error('Cannot sign up in demo mode')
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            role: signUpData.role || 'Viewer'
          }
        }
      })

      if (error) {
        console.error('Error signing up:', error)
        throw error
      }

      // Create user profile if signup was successful
      if (data.user && !data.user.identities?.length) {
        // User already exists
        throw new Error('User with this email already exists')
      }

      if (data.user) {
        await createUserProfile(data.user, {
          full_name: signUpData.fullName,
          role: signUpData.role
        })
      }

      return data
    } catch (error) {
      console.error('Error in signUp:', error)
      throw error
    }
  }

  // Sign in existing user
  const signIn = async (signInData: SignInData) => {
    if (isDemoMode) {
      // In demo mode, simulate successful sign in
      return {
        user: authState.user,
        session: null
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      })

      if (error) {
        console.error('Error signing in:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in signIn:', error)
      throw error
    }
  }

  // Sign out user
  const signOut = async () => {
    if (isDemoMode) {
      // In demo mode, just redirect to login
      router.push('/login')
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }

      router.push('/login')
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    if (isDemoMode) {
      throw new Error('Cannot update profile in demo mode')
    }

    if (!authState.userProfile) {
      throw new Error('No user profile to update')
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authState.userProfile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        userProfile: data,
        role: data.role
      }))

      return data
    } catch (error) {
      console.error('Error in updateProfile:', error)
      throw error
    }
  }

  // Check if user has specific role
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!authState.role) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(authState.role)
  }

  // Check if user can perform action based on role hierarchy
  const canPerformAction = (requiredRole: UserRole): boolean => {
    if (!authState.role) return false

    const roleHierarchy: Record<UserRole, number> = {
      'Viewer': 1,
      'Foreman': 2,
      'Supervisor': 3,
      'QA_Manager': 4,
      'Admin': 5
    }

    const userRoleLevel = roleHierarchy[authState.role]
    const requiredRoleLevel = roleHierarchy[requiredRole]

    return userRoleLevel >= requiredRoleLevel
  }

  // Reset password
  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      throw new Error('Cannot reset password in demo mode')
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        console.error('Error resetting password:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in resetPassword:', error)
      throw error
    }
  }

  // Update password
  const updatePassword = async (newPassword: string) => {
    if (isDemoMode) {
      throw new Error('Cannot update password in demo mode')
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('Error updating password:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updatePassword:', error)
      throw error
    }
  }

  return {
    // State
    ...authState,
    
    // Actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    
    // Permissions
    hasRole,
    canPerformAction,
    
    // Utilities
    isAdmin: authState.role === 'Admin',
    isQAManager: authState.role === 'QA_Manager',
    isSupervisor: authState.role === 'Supervisor',
    isForeman: authState.role === 'Foreman',
    isViewer: authState.role === 'Viewer',
    
    // Can manage users (Admin or QA Manager)
    canManageUsers: authState.role === 'Admin' || authState.role === 'QA_Manager',
    
    // Can create/edit pins (not just Viewer)
    canEditPins: authState.role !== 'Viewer',
    
    // Can close pins (Supervisor and above)
    canClosePins: canPerformAction('Supervisor'),
    
    // Can manage projects (QA Manager and above)  
    canManageProjects: canPerformAction('QA_Manager')
  }
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    const auth = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!auth.isLoading && !auth.isAuthenticated) {
        router.push('/login')
      } else if (requiredRole && !auth.canPerformAction(requiredRole)) {
        router.push('/unauthorized')
      }
    }, [auth.isLoading, auth.isAuthenticated, auth.role, router])

    if (auth.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )
    }

    if (!auth.isAuthenticated) {
      return null // Will redirect to login
    }

    if (requiredRole && !auth.canPerformAction(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Hook for checking authentication in components
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login')
    } else if (requiredRole && !auth.canPerformAction(requiredRole)) {
      router.push('/unauthorized')
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.role, router, requiredRole])

  return {
    ...auth,
    isAuthorized: auth.isAuthenticated && (!requiredRole || auth.canPerformAction(requiredRole))
  }
}

// Demo users for development/demo mode
const demoUsers = [
  { id: '1', name: 'Asaf Peer', email: 'asaf6peer@gmail.com', role: 'Admin' as const, status: 'active' as const },
  { id: '2', name: 'John Doe', email: 'john@contractor.com', role: 'Foreman' as const, status: 'active' as const },
  { id: '3', name: 'Sarah Miller', email: 'sarah@qa.com', role: 'Supervisor' as const, status: 'active' as const },
  { id: '4', name: 'Mike Smith', email: 'mike@contractor.com', role: 'Foreman' as const, status: 'active' as const }
]

// Legacy compatibility exports (for existing components that might still use them)
export { demoUsers as CONSTRUCTION_TEAM }
export function useCurrentUser() {
  const auth = useAuth()
  return {
    data: auth.userProfile,
    isLoading: auth.isLoading,
    error: null
  }
}

export function useUsers() {
  return {
    data: demoUsers,
    isLoading: false,
    error: null
  }
}