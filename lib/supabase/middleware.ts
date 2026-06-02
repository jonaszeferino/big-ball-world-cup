import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUserFromRequestCookies } from '@/lib/supabase/middleware-cookies'

/**
 * Autenticação só via cookies (sem createServerClient / getUser na Edge).
 * Evita "fetch failed" no runtime Edge ao renovar token contra o Supabase.
 * A renovação continua no browser (client) e em Server Components (Node).
 */
export function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const user = getSupabaseUserFromRequestCookies(request, supabaseUrl)

  const isProtected =
    request.nextUrl.pathname.startsWith('/matches') ||
    request.nextUrl.pathname.startsWith('/ranking') ||
    request.nextUrl.pathname.startsWith('/scorers') ||
    request.nextUrl.pathname.startsWith('/groups') ||
    request.nextUrl.pathname.startsWith('/admin')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
