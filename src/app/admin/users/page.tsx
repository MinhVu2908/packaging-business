'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminGuard } from '@/lib/useAdminGuard'
import {
  ORDER_ITEM_STATUSES,
  ORDER_ITEM_STATUS_LABEL_VI,
  itemStatusBadgeClass,
  type OrderItemStatus,
} from '@/lib/order-item-status'

type User = {
  id: string
  company_name: string | null
  contact_name: string | null
  email?: string
  phone: string | null
  created_at: string
  updated_at: string
  itemLineCounts?: Record<OrderItemStatus, number>
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
                    <p className="text-sm font-medium text-slate-900">
                      Đơn hàng ({user.orders?.length ?? 0}) · dòng đơn (PO)
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Trạng thái giao theo từng dòng</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(() => {
                        const counts = user.itemLineCounts
                        const hasLines =
                          counts && ORDER_ITEM_STATUSES.some((s) => (counts[s] ?? 0) > 0)
                        if (!hasLines || !counts) {
                          return (
                            <span className="text-xs text-slate-500">Chưa có dòng đơn.</span>
                          )
                        }
                        return ORDER_ITEM_STATUSES.map((s) =>
                          (counts[s] ?? 0) > 0 ? (
                            <span
                              key={s}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${itemStatusBadgeClass(s)}`}
                            >
                              {ORDER_ITEM_STATUS_LABEL_VI[s]} ({counts[s]})
                            </span>
                          ) : null
                        )
                      })()}
                    </div>
                    {(user.orders?.length ?? 0) > 0 && (
                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                        <p className="text-xs font-medium text-slate-700">Gần đây</p>
                        {(user.orders ?? []).slice(0, 3).map((order) => (
                          <p key={order.id} className="text-xs text-slate-600">
                            {order.summary}
                            <span className="text-slate-400">
                              {' '}
                              · {new Date(order.date).toLocaleDateString('vi-VN')}
                            </span>
                          </p>
                        ))}
                        {(user.orders?.length ?? 0) > 3 && (
                          <p className="text-xs text-slate-500">+{(user.orders?.length ?? 0) - 3} đơn hàng khác</p>
                        )}
                      </div>
                    )}
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
                <Link
                  href={`/admin/users/${user.id}`}
                  className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
