import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes accessible without authentication
const publicRoutes = [
  '/showcase',
  '/login',
  '/register',
  '/forgot-password',
  '/manager-setup',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes - let client-side handle auth
  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For all other routes, let them through
  // Client-side AuthContext will handle authentication
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
