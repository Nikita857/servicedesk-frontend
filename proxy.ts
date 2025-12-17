// proxy.ts (в корне проекта или в src/)

import { NextRequest, NextResponse } from 'next/server'

// Разрешённые origin'ы для локальной разработки
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false
  return (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('http://192.168.')
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

export async function proxy(request: NextRequest) {
  const { method } = request

  // Всегда отвечаем на preflight-запросы корректно
  if (method === 'OPTIONS') {
    return handleOptions(request)
  }

  // Пропускаем все остальные запросы дальше (на бэкенд или route handlers)
  const response = NextResponse.next()

  // Добавляем CORS-заголовки только для разрешённых локальных origin'ов
  const origin = request.headers.get('origin') ?? ''
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// Применяем proxy ко всем API-запросам (можно расширить при необходимости)
export const config = {
  matcher: '/api/v1/:path*',
}