'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [profileState, setProfileState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function debug() {
      try {
        console.log('=== DEBUG: Starting auth check ===');
        
        // 1. Проверить текущую сессию
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session:', { sessionData, sessionError });
        setAuthState({
          session: sessionData.session,
          user: sessionData.session?.user,
          error: sessionError
        });

        if (!sessionData.session) {
          setError('No active session');
          setLoading(false);
          return;
        }

        // 2. Попробовать загрузить профиль
        console.log('=== DEBUG: Loading profile for user:', sessionData.session.user.id);
        const startTime = Date.now();
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
        
        const duration = Date.now() - startTime;
        console.log(`Profile query took ${duration}ms`);
        console.log('Profile result:', { profileData, profileError });

        setProfileState({
          data: profileData,
          error: profileError,
          duration
        });

        if (profileError) {
          setError(`Profile error: ${profileError.message} (code: ${profileError.code})`);
        } else if (!profileData) {
          setError('Profile data is null but no error');
        }

        // 3. Попробовать простой запрос без фильтров
        console.log('=== DEBUG: Loading all profiles (test RLS) ===');
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('id, display_name, role')
          .limit(5);
        
        console.log('All profiles test:', { count: allProfiles?.length, allError });

      } catch (err: any) {
        console.error('Debug error:', err);
        setError(`Exception: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    debug();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🔍 Auth Debug Page</h1>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
            <p className="text-blue-800">Loading debug info...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-red-900 mb-2">❌ Error</h2>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Auth State */}
        {authState && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔐 Auth State</h2>
            <div className="space-y-2">
              <div>
                <strong>Has Session:</strong> {authState.session ? '✅ Yes' : '❌ No'}
              </div>
              {authState.user && (
                <>
                  <div>
                    <strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{authState.user.id}</code>
                  </div>
                  <div>
                    <strong>Email:</strong> {authState.user.email}
                  </div>
                  <div>
                    <strong>Confirmed:</strong> {authState.user.confirmed_at ? '✅ Yes' : '❌ No'}
                  </div>
                </>
              )}
              {authState.error && (
                <div className="text-red-800">
                  <strong>Error:</strong> {JSON.stringify(authState.error)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile State */}
        {profileState && (
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Profile State</h2>
            <div className="space-y-2">
              <div>
                <strong>Query Duration:</strong> {profileState.duration}ms
              </div>
              <div>
                <strong>Has Data:</strong> {profileState.data ? '✅ Yes' : '❌ No'}
              </div>
              {profileState.data && (
                <>
                  <div>
                    <strong>Display Name:</strong> {profileState.data.display_name}
                  </div>
                  <div>
                    <strong>Role:</strong> {profileState.data.role}
                  </div>
                  <div>
                    <strong>Family ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{profileState.data.family_id}</code>
                  </div>
                </>
              )}
              {profileState.error && (
                <div className="text-red-800">
                  <strong>Error:</strong> {JSON.stringify(profileState.error, null, 2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Data */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Raw Data (Check Console)</h2>
          <p className="text-gray-700">
            Open browser console (F12) to see detailed logs
          </p>
          <pre className="mt-4 bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify({ authState, profileState }, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
