// useAuth.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

// Re-export the main useAuth from AuthContext
export const useAuth = useAuthContext;

// הוק לקבלת כל המשתמשים (למשל לשימוש בדיאלוגי ייצוא או צ'אט)
export function useUsers() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role');
      if (!cancelled) {
        if (error) {
          console.error('Failed to fetch users:', error);
          setData([]);
          setError(error);
        } else {
          setData(data || []);
        }
        setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, error, isLoading };
}

// HOC שמקיף קומפוננטה ומפנה ל-/login אם אין משתמש מחובר
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [loading, user, router]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!user) {
      return null; // or a fallback component, but router.replace should handle it
    }

    return <Component {...props} />;
  };

  Wrapped.displayName = `withAuth(${(Component as any).displayName || Component.name || 'Component'})`;
  return Wrapped;
};

// הוק שמחזיר מידע על המשתמש הנוכחי (לדוגמה לשימוש בדיאלוג ייצוא)
export function useCurrentUser() {
  const { profile, loading } = useAuth();
  // מחזירים אובייקט של הנתונים
  return {
    data: profile,
    isLoading: loading,
    error: null,
  };
}
