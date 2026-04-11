import { createBrowserClient } from '@supabase/ssr'

function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !key?.trim()) {
    throw new Error(
      'Supabase: falta NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY. Define em .env.local (NOME=valor), guarda e reinicia o dev server.',
    )
  }
  return { url: url.trim(), key: key.trim() }
}

export function createClient() {
  const { url, key } = getPublicEnv()
  return createBrowserClient(url, key)
}
