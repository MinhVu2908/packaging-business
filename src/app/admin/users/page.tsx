'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminGuard } from '@/lib/useAdminGuard'

type User = {
  id: string
  company_name: string | null
  contact_name: string | null
  email?: string
  phone: string | null
  role?: string
  created_at: string
  updated_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isLoading: isAdminLoading } = useAdminGuard()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/users')
    if (!res.ok) {
      setError('Không thể tải danh sách người dùng.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  if (loading || isAdminLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Người dùng</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thông tin tài khoản và liên hệ. Đơn hàng và PO được quản lý tại{' '}
          <Link href="/admin/orders" className="font-medium text-slate-900 underline">
            Đơn hàng
          </Link>
          .
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {user.contact_name || user.email || user.company_name || user.id}
                </h3>
                {user.email && <p className="mt-1 text-sm text-slate-600">{user.email}</p>}
                {user.company_name && (
                  <p className="mt-1 text-sm text-slate-600">Công ty: {user.company_name}</p>
                )}
                {user.phone && <p className="mt-1 text-sm text-slate-600">SĐT: {user.phone}</p>}
                {user.role && (
                  <p className="mt-1 text-xs text-slate-500">Vai trò: {user.role}</p>
                )}
                <p className="mt-2 font-mono text-xs text-slate-400">{user.id}</p>
              </div>
              <Link
                href={`/admin/users/${user.id}`}
                className="inline-flex shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
