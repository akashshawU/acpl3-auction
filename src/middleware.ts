import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string | undefined;

  if (pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'SUPER_ADMIN') return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/captain')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    if (role !== 'CAPTAIN') return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname === '/login') {
    if (token) {
      const dest = role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/captain/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auction/live).*)'],
};
