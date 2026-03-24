import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/offline']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('dtc_token')?.value
  const { pathname } = request.nextUrl

  // Kalau sudah login dan akses login page → redirect ke dashboard
  if (token && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Kalau belum login dan akses protected route → redirect ke login
  if (!token && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
