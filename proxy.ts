// proxy.ts (в корне проекта или в src/)

import { NextRequest, NextResponse } from 'next/server'

// Разрешённые origin'ы для локальной разработки
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  return (
    origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
  )
}

// Обработка preflight-запросов (OPTIONS)
function handleOptions(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') ?? ''

  const response = new NextResponse(null, { status: 204 })

  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // кэшируем на сутки
  }

  return response
}

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'

export async function proxy(request: NextRequest) {
  const { method, nextUrl } = request

  if (method === 'OPTIONS') {
    return handleOptions(request)
  }

  if (
    MAINTENANCE_MODE &&
    nextUrl.pathname !== '/maintenance' &&
    !nextUrl.pathname.startsWith('/_next/') &&
    !nextUrl.pathname.startsWith('/favicon')
  ) {
    return NextResponse.rewrite(new URL('/maintenance', request.url))
  }

  const response = NextResponse.next()

  const origin = request.headers.get('origin') ?? ''
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}
