'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type { Role } from '../database.types'

interface UserProfile {
  id: string
  auth_user_id: string | null
  email: string
  role: Role | null
  full_name: string
  address: string | null
  birth_date: string | null
  created_at: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    // Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout, proceeding without auth')
      setLoading(false)
      setUser(null)
      setProfile(null)
      setSession(null)
    }, 10000) // 10 second timeout
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(authTimeout)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error) => {
        console.error('❌ Failed to get initial session:', error)
        clearTimeout(authTimeout)
        setLoading(false)
        setUser(null)
        setProfile(null)
        setSession(null)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, { sessionExists: !!session, userExists: !!session?.user })
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user && event === 'SIGNED_IN') {
        console.log('👤 User signed in, fetching profile...')
        try {
          await fetchUserProfile(session.user.id)
        } catch (error) {
          console.error('❌ Failed to fetch profile in auth change:', error)
          // Create minimal fallback profile for OAuth users
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
            console.log('🔧 Creating fallback profile for Google user')
            setProfile({
              id: session.user.id,
              auth_user_id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Google User',
              role: 'Viewer',
              address: null,
              birth_date: null,
              created_at: new Date().toISOString(),
            })
          }
          setLoading(false)
        }
      } else {
        console.log('👻 No user session, clearing profile')
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for userId:', userId)
      
      // Get current user email for fallback lookup
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const userEmail = currentUser?.email
      
      console.log('📧 User email from auth:', userEmail)
      
      // Add timeout to profile fetch using Promise.race
      // Try to find user by auth_user_id, id, or email
      let profilePromise
      if (userEmail) {
        profilePromise = supabase
          .from('users')
          .select('*')
          .or(`auth_user_id.eq.${userId},id.eq.${userId},email.eq.${userEmail}`)
          .limit(1)
          .single()
      } else {
        profilePromise = supabase
          .from('users')
          .select('*')
          .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
          .limit(1)
          .single()
      }
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      })
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Profile fetch error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If user doesn't exist in users table, create them
        if (error.code === 'PGRST116') {
          console.log('🆔 User not found in users table, attempting to create profile...')
          await createUserProfile(userId)
        } else {
          throw error
        }
      } else {
        console.log('✅ User profile found:', data)
        
        // If we found the user but auth_user_id doesn't match, update it
        if (data.auth_user_id !== userId) {
          console.log('🔧 Fixing auth_user_id mismatch:', {
            current: data.auth_user_id,
            expected: userId
          })
          
          try {
            const { error: updateError } = await supabase
              .from('users')
              .update({ auth_user_id: userId })
              .eq('id', data.id)
            
            if (updateError) {
              console.error('❌ Failed to update auth_user_id:', updateError)
            } else {
              console.log('✅ auth_user_id updated successfully')
              // Update the local data
              data.auth_user_id = userId
            }
          } catch (updateErr) {
            console.error('❌ Error updating auth_user_id:', updateErr)
          }
        }
        
        setProfile(data)
      }
    } catch (error) {
      console.error('💥 Critical error fetching user profile:', error)
      
      // If it's a timeout, create a minimal fallback profile
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('⏰ Profile fetch timed out, creating fallback profile')
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (currentUser) {
          setProfile({
            id: userId,
            auth_user_id: userId,
            email: currentUser.email || '',
            full_name: currentUser.email?.split('@')[0] || 'Unknown User',
            role: 'Viewer',
            address: null,
            birth_date: null,
            created_at: new Date().toISOString(),
          })
        }
      } else {
        // Don't block login entirely, but user won't have profile
        setProfile(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      console.log('👤 Creating user profile for:', userId)
      
      // Get user metadata from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

      const userProfile = {
        id: userId,
        auth_user_id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        role: user.user_metadata?.role || 'Viewer',
        address: null,
        birth_date: null,
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userProfile])
        .select()
        .single()

      if (error) throw error

      console.log('✅ User profile created successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('❌ Failed to create user profile:', error)
      // Get current user for fallback
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Fallback to basic profile data
      setProfile({
        id: userId,
        auth_user_id: userId,
        email: currentUser?.email || '',
        full_name: currentUser?.email?.split('@')[0] || 'Unknown User',
        role: 'Viewer',
        address: null,
        birth_date: null,
        created_at: new Date().toISOString(),
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      console.log('🔵 Starting Google OAuth flow...')
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      console.log('🔵 Redirect URL:', `${redirectUrl}/`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      
      console.log('🔵 OAuth response:', { data, error })
      
      if (error) {
        console.error('🔴 OAuth error:', error)
        setLoading(false)
        throw error
      }
      
      if (data?.url) {
        console.log('🔵 Redirecting to:', data.url)
        // Don't set loading to false here - let the auth state change handle it
      }
      
    } catch (error) {
      console.error('🔴 Google sign-in exception:', error)
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })
      if (error) throw error

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              full_name: fullName,
              role,
            }
          ])
        if (profileError) throw profileError
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}