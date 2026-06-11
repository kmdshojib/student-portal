import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('sessionToken')?.value
  console.log('Proxy - sessionToken:', token)
  if (!token) return false

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  if (!secret) {
    console.error('Proxy - JWT_SECRET is not configured')
    return false
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    console.log('Proxy - Token is valid:', payload)
    return true
  } catch (err: unknown) {
    console.error('Proxy - Invalid token:', (err as Error).message)
    return false
  }
}

export const config = {
  matcher: [
    '/dashboard', '/dashboard/:path*', '/admin', '/attendance', '/attendance/:path*', '/batches', '/batches/:path*', '/payments', '/payments/:path*', '/exam-marks', '/guardian-report',
    '/api/students/batches', '/api/dashboard', '/api/guardian-report','/api/notify',
    '/api/payments', '/api/attendance', '/api/students', '/add-exam-marks', '/api/exam-marks'
  ],
  // Note: /api/public/* routes are NOT in the matcher, so they remain public
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname } = request.nextUrl

  console.log('Proxy triggered for:', pathname)

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next()
  }


  if (pathname === '/admin/login') {
    return NextResponse.next()
  }


  if (pathname === '/result') {
    return NextResponse.next()
  }

  const authOk = await isAuthenticated(request)
  if (!authOk) {
    url.pathname = '/admin/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}