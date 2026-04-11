'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const navItems = [
    { href: "/", label: "Trang Chủ" },
    { href: "/store", label: "Cửa Hàng" },
    { href: "/cart", label: "Giỏ Hàng" },
    ...(user ? [{ href: "/account", label: "Tài Khoản" }] : [{ href: "/auth", label: "Đăng nhập" }]),
  ]

  if (loading) {
    return (
      <nav className="flex flex-wrap gap-6 text-sm font-medium">
        <span className="text-slate-500">Loading...</span>
      </nav>
    )
  }

  return (
    <nav className="flex flex-wrap gap-6 text-sm font-medium">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-slate-700 transition hover:text-slate-900"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}