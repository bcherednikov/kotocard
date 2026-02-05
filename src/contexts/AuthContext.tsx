'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  display_name: string;
  role: 'admin' | 'student';
  family_id: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isLoadingProfile = false;
    
    // Функция для загрузки профиля с защитой от дублирования
    async function loadProfile(userId: string) {
      if (isLoadingProfile) {
        return;
      }
      
      isLoadingProfile = true;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // Игнорировать известные ошибки в dev режиме
        if (error && 
            !error.message?.includes('AbortError') &&
            !error.message?.includes('Cannot coerce') &&
            error.code !== 'PGRST116') {
          console.error('AuthContext: Profile error:', error.message);
        }
        
        if (data) {
          setProfile(data);
        }
      } catch (err: any) {
        // Тихо игнорировать ошибки в dev режиме
        if (!err.message?.includes('AbortError') && 
            !err.message?.includes('Cannot coerce') &&
            err.code !== 'PGRST116') {
          console.error('AuthContext: Load failed:', err.message);
        }
      } finally {
        isLoadingProfile = false;
        setLoading(false);
      }
    }
    
    // Получить текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      if (user) {
        loadProfile(user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      // Игнорировать AbortError в dev режиме
      if (!err.message?.includes('AbortError')) {
        console.error('AuthContext error:', err.message);
      }
      setLoading(false);
    });
    
    // Подписка на изменения auth состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Игнорировать INITIAL_SESSION (оно дублирует getUser выше)
        if (event === 'INITIAL_SESSION') {
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const isAdmin = profile?.role === 'admin';
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
