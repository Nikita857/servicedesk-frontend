import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''

  // Разрешаем любые локальные IP и localhost
  if (origin.startsWith('http://192') || origin.startsWith('http://localhost')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',
}