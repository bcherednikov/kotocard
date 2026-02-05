'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Закрывать меню при изменении размера окна
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрывать меню при нажатии Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Предотвратить скролл страницы когда меню открыто
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  async function handleSignOut() {
    await signOut();
    setIsMobileMenuOpen(false);
    router.push('/');
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const logoHref = !user
    ? '/'
    : profile?.role === 'admin'
      ? '/admin/decks'
      : '/student';

  return (
    <>
      {/* Overlay для мобильного меню */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link 
            href={logoHref}
            className="flex items-center gap-3 hover:opacity-80 transition"
            onClick={closeMobileMenu}
          >
            <div className="text-3xl">📚</div>
            <h1 className="text-2xl font-bold text-gray-900">KotoCard</h1>
          </Link>
          
          {/* Бургер-кнопка (только на мобильных) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-6 bg-gray-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-gray-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-gray-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>

          {/* Десктопное меню (скрыто на мобильных) */}
          <nav className="hidden md:flex items-center gap-6">
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
                    <Link 
                      href="/admin/stats" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      📊 Результаты
                    </Link>
                  </>
                )}
                
                {/* Навигация для студента */}
                {profile?.role === 'student' && (
                  <>
                    <Link 
                      href="/student" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      🏠 Главная
                    </Link>
                    <Link 
                      href="/student/decks" 
                      className="text-gray-700 hover:text-gray-900 transition font-medium"
                    >
                      📚 Наборы
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

        {/* Мобильное меню */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="py-4 space-y-2 border-t mt-4">
            {user ? (
              <>
                {/* Навигация для админа */}
                {profile?.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin/decks" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      📚 Наборы
                    </Link>
                    <Link 
                      href="/admin/children" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      👶 Дети
                    </Link>
                    <Link 
                      href="/admin/stats" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      📊 Результаты
                    </Link>
                  </>
                )}
                
                {/* Навигация для студента */}
                {profile?.role === 'student' && (
                  <>
                    <Link 
                      href="/student" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      🏠 Главная
                    </Link>
                    <Link 
                      href="/student/decks" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      📚 Наборы
                    </Link>
                    <Link 
                      href="/student/test" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      🎯 Проверка
                    </Link>
                    <Link 
                      href="/student/test/history" 
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                      onClick={closeMobileMenu}
                    >
                      📊 Результаты
                    </Link>
                  </>
                )}
                
                <div className="px-4 py-3 text-gray-600 border-t border-gray-200 mt-2 pt-4">
                  👤 {profile?.display_name || user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  🚪 Выход
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  onClick={closeMobileMenu}
                >
                  🏠 Главная
                </Link>
                <Link 
                  href="/login" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  onClick={closeMobileMenu}
                >
                  🔑 Вход
                </Link>
                <Link 
                  href="/register" 
                  className="block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center"
                  onClick={closeMobileMenu}
                >
                  ✨ Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
    </>
  );
}
