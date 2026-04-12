'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminGuard } from '@/lib/useAdminGuard'

type User = {
  id: string
  company_name: string | null
  contact_name: string | null
  email?: string
  phone: string | null
  created_at: string
  updated_at: string
  orders?: {
    id: string
    status: string
    summary: string
    date: string
  }[]
  cart_items?: {
    id: string
    product_id: string
    quantity: number
    total_price: number
    products: {
      name: string
    }
  }[]
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
        <h1 className="text-3xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="mt-2 text-sm text-slate-600">Xem thông tin và hoạt động của tất cả người dùng</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {user.contact_name || user.email || user.company_name || user.id}
                </h3>
                {user.email && (
                  <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                )}
                {user.company_name && (
                  <p className="mt-1 text-sm text-slate-600">Công ty: {user.company_name}</p>
                )}
                {user.phone && (
                  <p className="mt-1 text-sm text-slate-600">SĐT: {user.phone}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Đơn hàng ({user.orders?.length ?? 0})</p>
                    <div className="mt-2 space-y-1">
                      {(user.orders ?? []).slice(0, 3).map((order) => (
                        <p key={order.id} className="text-xs text-slate-600">
                          {order.summary} - {order.status}
                        </p>
                      ))}
                      {(user.orders?.length ?? 0) > 3 && (
                        <p className="text-xs text-slate-500">+{(user.orders?.length ?? 0) - 3} đơn hàng khác</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">Giỏ hàng ({user.cart_items?.length ?? 0})</p>
                    <div className="mt-2 space-y-1">
                      {(user.cart_items ?? []).slice(0, 3).map((item) => (
                        <p key={item.id} className="text-xs text-slate-600">
                          {item.products.name} x{item.quantity}
                        </p>
                      ))}
                      {(user.cart_items?.length ?? 0) > 3 && (
                        <p className="text-xs text-slate-500">+{(user.cart_items?.length ?? 0) - 3} sản phẩm khác</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-6">
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
