import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Check for admin session/auth
    const adminAuth = request.cookies.get('adminAuth')?.value;
    
    // If no admin auth and not the login path, redirect to admin login
    if (!adminAuth && pathname !== '/admin/login') {
      // For now, we'll let the existing admin auth handle this
      // This is where you'd add proper admin session checking
    }
  }

  // Provider routes - ensure they can't access admin
  if (pathname.startsWith('/providers')) {
    // Allow provider routes
    return NextResponse.next();
  }

  // API routes protection
  if (pathname.startsWith('/api/providers/')) {
    // These require provider JWT tokens - handled in the route handlers
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin/')) {
    // These require admin auth - handled in the route handlers
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/providers/:path*',
    '/api/providers/:path*',
    '/api/admin/:path*'
  ]
};