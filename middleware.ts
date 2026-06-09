import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/matches/:path*', '/odds/:path*', '/palpites/:path*', '/ranking/:path*', '/scorers/:path*', '/groups/:path*', '/admin/:path*'],
}
