'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  show_russian_transcription?: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isInitialized: false,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const PROFILE_LOAD_TIMEOUT = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Инициализация - один раз при монтировании
  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId: string, signal: AbortSignal): Promise<Profile | null> {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (signal.aborted) return null;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (signal.aborted) return null;

          if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
          }

          return data as Profile;
        } catch (err: any) {
          if (signal.aborted) return null;
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }
      return null;
    }

    async function handleAuthChange(newUser: User | null) {
      if (!mounted) return;

      const newUserId = newUser?.id ?? null;

      // Если тот же пользователь - ничего не делаем
      if (newUserId === currentUserIdRef.current) return;

      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      currentUserIdRef.current = newUserId;
      setUser(newUser);

      if (newUser) {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);

        const timeoutId = setTimeout(() => controller.abort(), PROFILE_LOAD_TIMEOUT);

        try {
          const loadedProfile = await loadProfile(newUser.id, controller.signal);

          if (mounted && !controller.signal.aborted && currentUserIdRef.current === newUser.id) {
            setProfile(loadedProfile);
          }
        } finally {
          clearTimeout(timeoutId);
          if (mounted && currentUserIdRef.current === newUser.id) {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      } else {
        setProfile(null);
        setIsLoading(false);
        setIsInitialized(true);
      }
    }

    // Подписка на auth события
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const signOut = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    currentUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!controller.signal.aborted && currentUserIdRef.current === userId) {
        setProfile(error ? null : data as Profile);
      }
    } finally {
      if (currentUserIdRef.current === userId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isInitialized,
      isLoading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
