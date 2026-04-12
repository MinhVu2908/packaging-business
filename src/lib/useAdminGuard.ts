'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useAdminGuard() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/admin/login')
        return
      }

      const res = await fetch('/api/admin/check')
      if (!res.ok) {
        await supabase.auth.signOut()
        router.replace('/admin/login')
        return
      }

      if (active) {
        setIsLoading(false)
      }
    }

    checkAdmin()

    return () => {
      active = false
    }
  }, [router])

  return { isLoading, error }
}
