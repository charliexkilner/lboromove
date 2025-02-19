import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect landlord routes
    if (path.startsWith('/landlord') && token?.role !== 'LANDLORD') {
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
    }

    // Protect admin routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/landlord/:path*', '/admin/:path*', '/profile/:path*'],
};
