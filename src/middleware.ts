import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Публичные роуты (доступны без авторизации)
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/register/success',
    '/test' // test page
  ];
  
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path);
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');
  
  // API роуты и публичные страницы пропускаем
  if (isApiRoute || isPublicPath) {
    return NextResponse.next();
  }

  // Защищенные роуты: /admin/* и /student/*
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/admin/') || 
    req.nextUrl.pathname.startsWith('/student/') ||
    req.nextUrl.pathname.startsWith('/onboarding');

  // Для защищенных роутов проверяем наличие auth cookie
  if (isProtectedRoute) {
    // Получить auth token из cookies
    const token = req.cookies.get('sb-fxcmgapwbqebzcmfkkdy-auth-token');
    
    // Если нет токена - редирект на login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
