'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="text-3xl">📚</div>
            <h1 className="text-2xl font-bold text-gray-900">KotoCard</h1>
          </Link>
          
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                {/* Навигация для админа */}
                {profile?.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin/decks" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      Наборы
                    </Link>
                    <Link 
                      href="/admin/children" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      Дети
                    </Link>
                  </>
                )}
                
                {/* Навигация для студента */}
                {profile?.role === 'student' && (
                  <>
                    <Link 
                      href="/student/decks" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      Мои наборы
                    </Link>
                    <Link 
                      href="/student/test" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      🎯 Проверка
                    </Link>
                    <Link 
                      href="/student/test/history" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      📊 Результаты
                    </Link>
                  </>
                )}
                
                <span className="text-gray-800 font-medium">
                  👤 {profile?.display_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition font-medium"
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-gray-900 transition font-medium"
                >
                  Главная
                </Link>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-gray-900 transition font-medium"
                >
                  Вход
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
