'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  display_name: string;
  role: 'admin' | 'student';
  family_id: string;
  avatar_url?: string;
  show_russian_transcription?: boolean;
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

const PROFILE_LOAD_TIMEOUT = 5000; // 5 секунд таймаут
const IS_DEV = process.env.NODE_ENV === 'development';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoadingProfileRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Функция для загрузки профиля с защитой от дублирования и таймаутом
    async function loadProfile(userId: string, retryCount = 0) {
      // Предотвратить одновременные запросы
      if (isLoadingProfileRef.current) {
        if (IS_DEV) console.log('🔄 AuthContext: Profile already loading, skipping...');
        return;
      }
      
      isLoadingProfileRef.current = true;
      
      // Установить таймаут для защиты от зависания
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('⏱️ AuthContext: Profile load timeout, forcing loading=false');
        isLoadingProfileRef.current = false;
        setLoading(false);
      }, PROFILE_LOAD_TIMEOUT);
      
      try {
        if (IS_DEV) console.log('📋 AuthContext: Loading profile for user:', userId);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        // Очистить таймаут при успехе
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        
        if (error) {
          // Игнорировать AbortError в dev режиме
          if (error.message?.includes('AbortError')) {
            if (IS_DEV) console.log('⏭️ AuthContext: AbortError ignored');
            setLoading(false);
            isLoadingProfileRef.current = false;
            return;
          }
          
          // Если профиль не найден
          if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
            console.warn('⚠️ AuthContext: Profile not found');
            setProfile(null);
            setLoading(false);
            isLoadingProfileRef.current = false;
            return;
          }
          
          // Попробовать повторить один раз при других ошибках
          if (retryCount === 0) {
            if (IS_DEV) console.warn('🔄 AuthContext: Retrying profile load...', error.message);
            isLoadingProfileRef.current = false;
            await new Promise(resolve => setTimeout(resolve, 500));
            return loadProfile(userId, 1);
          }
          
          console.error('❌ AuthContext: Profile error:', error.message);
        }
        
        if (data) {
          if (IS_DEV) console.log('✅ AuthContext: Profile loaded:', data.display_name, data.role);
          setProfile(data);
        }
      } catch (err: any) {
        // Очистить таймаут при ошибке
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        
        if (!err.message?.includes('AbortError')) {
          console.error('❌ AuthContext: Load failed:', err.message);
        }
      } finally {
        isLoadingProfileRef.current = false;
        setLoading(false);
      }
    }
    
    // Получить текущего пользователя
    if (IS_DEV) console.log('🔐 AuthContext: Checking current user...');
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      if (user) {
        if (IS_DEV) console.log('✅ AuthContext: User found:', user.email);
        loadProfile(user.id);
      } else {
        if (IS_DEV) console.log('👤 AuthContext: No user');
        setLoading(false);
      }
    }).catch((err) => {
      if (!err.message?.includes('AbortError')) {
        console.error('❌ AuthContext error:', err.message);
      }
      setLoading(false);
    });
    
    // Подписка на изменения auth состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (IS_DEV) console.log('🔐 AuthContext: Auth state changed:', event);
        
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
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
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
