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

const PROFILE_LOAD_TIMEOUT = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoadingProfileRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadProfile(userId: string, retryCount = 0) {
      if (isLoadingProfileRef.current) return;
      isLoadingProfileRef.current = true;

      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        isLoadingProfileRef.current = false;
        setLoading(false);
      }, PROFILE_LOAD_TIMEOUT);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }

        if (error) {
          if (error.message?.includes('AbortError')) {
            setLoading(false);
            isLoadingProfileRef.current = false;
            return;
          }
          if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
            setProfile(null);
            setLoading(false);
            isLoadingProfileRef.current = false;
            return;
          }
          if (retryCount === 0) {
            isLoadingProfileRef.current = false;
            await new Promise(resolve => setTimeout(resolve, 500));
            return loadProfile(userId, 1);
          }
        }

        if (data) {
          setProfile(data);
        }
      } catch (_err) {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
      } finally {
        isLoadingProfileRef.current = false;
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
      else setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return;
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else {
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
