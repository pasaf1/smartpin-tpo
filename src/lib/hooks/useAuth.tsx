// useAuth.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// טיפוס לפרופיל משתמש
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// טיפוס התוצאה מ-useAuth
interface AuthContext {
  user: any | null;
  session: any | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  canPerformAction: (requiredRole: string) => boolean;
  canManageUsers: boolean;
}

// הוק useAuth
export function useAuth(): AuthContext {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // אתחול והאזנה לשינויים ב-session
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // שליפת פרופיל המשתמש ממסד הנתונים כשה־user משתנה
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('auth_user_id', user.id)
        .single();
      if (!error && data) {
        setUserProfile({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
        });
      }
    };
    fetchUserProfile();
  }, [user]);

  const canPerformAction = useCallback((requiredRole: string) => {
    // בדיקת הרשאות פשוטה לפי תפקיד (ניתן להרחיב לפי לוגיקה ארגונית)
    return userProfile?.role === requiredRole;
  }, [userProfile]);

  // לדוגמה, רק מנהלים ומנהלי QA יכולים לנהל משתמשים
  const canManageUsers = userProfile?.role === 'Admin' || userProfile?.role === 'QA_Manager';

  return { user, session, userProfile, isLoading, canPerformAction, canManageUsers };
}

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
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) router.replace('/login');
    }, [isLoading, user, router]);

    if (isLoading || !user) return <div>Loading...</div>;
    return <Component {...props} />;
  };

  Wrapped.displayName = `withAuth(${(Component as any).displayName || Component.name || 'Component'})`;
  return Wrapped;
};

// הוק שמחזיר מידע על המשתמש הנוכחי (לדוגמה לשימוש בדיאלוג ייצוא)
export function useCurrentUser() {
  const { userProfile, isLoading } = useAuth();
  // מחזירים אובייקט של הנתונים
  return {
    data: userProfile,
    isLoading,
    error: null,
  };
}
