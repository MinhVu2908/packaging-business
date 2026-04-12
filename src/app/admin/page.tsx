'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminGuard } from '@/lib/useAdminGuard'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { isLoading: isAdminLoading } = useAdminGuard()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading || isAdminLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-4 text-slate-600">Bạn cần đăng nhập để truy cập trang quản trị.</p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Chào mừng, {user.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/design-requests"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-slate-900">Yêu cầu thiết kế</h3>
          <p className="mt-2 text-sm text-slate-600">Xem và phản hồi yêu cầu thiết kế từ khách hàng</p>
        </Link>

        <Link
          href="/admin/products"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-slate-900">Quản lý sản phẩm</h3>
          <p className="mt-2 text-sm text-slate-600">Thêm, sửa, xóa sản phẩm trong cửa hàng</p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-slate-900">Quản lý đơn hàng</h3>
          <p className="mt-2 text-sm text-slate-600">Xem và quản lý tất cả đơn hàng</p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-lg border border-slate-200 bg-white p-6 transition hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-slate-900">Quản lý người dùng</h3>
          <p className="mt-2 text-sm text-slate-600">Xem thông tin và hoạt động của người dùng</p>
        </Link>
      </div>
    </div>
  )
}
