import {verifyAdminToken} from './lib/admin-session';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if(pathname.startsWith('/wholesale/password')||pathname.startsWith('/invoice-payment')) {
    const response=NextResponse.next();
    response.headers.set('Referrer-Policy','no-referrer');
    response.headers.set('Cache-Control','no-store');
    response.headers.set('X-Robots-Tag','noindex, nofollow');
    response.headers.set('Content-Security-Policy',"frame-ancestors 'none'; form-action 'self'; base-uri 'self'");
    return response;
  }

  // Protect admin routes (except login and API)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminSession = req.cookies.get('admin-session');
    if (!(await verifyAdminToken(adminSession?.value, process.env.AUTH_SECRET || ''))) {
      const login = new URL('/admin/login', req.url);
      login.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(login);
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
  matcher: ['/wholesale/dashboard/:path*', '/wholesale/password/:path*', '/invoice-payment/:path*', '/admin/:path*'],
};
