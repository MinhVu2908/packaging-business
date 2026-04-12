import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
        },
        setAll() {
          return undefined
        },
      },
    }
  )
}

export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (serviceRoleKey) {
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          return undefined
        },
      },
    })
  }

  return createClient()
}