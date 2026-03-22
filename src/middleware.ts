import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes (except login and API)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = req.cookies.get('admin-session');
    if (adminSession?.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Protect wholesale dashboard
  if (pathname.startsWith('/wholesale/dashboard')) {
    // NextAuth session check — just look for the session cookie
    const sessionCookie = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/wholesale/login', req.url));
    }
  }
}

export const config = {
  matcher: ['/wholesale/dashboard/:path*', '/admin/:path*'],
};
