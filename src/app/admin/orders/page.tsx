'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminGuard } from '@/lib/useAdminGuard'
import Link from 'next/link'

type Order = {
  id: string
  user_id: string
  status: string
  summary: string
  date: string
  created_at: string
  user_profile?: {
    contact_name: string | null
    company_name: string | null
    phone: string | null
  } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isLoading: isAdminLoading } = useAdminGuard()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/orders')
    if (!res.ok) {
      setError('Không thể tải danh sách đơn hàng.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setOrders(data)
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
        <h1 className="text-3xl font-bold text-slate-900">Quản lý đơn hàng</h1>
        <p className="mt-2 text-sm text-slate-600">Xem và quản lý tất cả đơn hàng</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-slate-900">{order.summary}</h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">Khách hàng:</span>{' '}
                    {order.user_profile?.contact_name || order.user_profile?.company_name || order.user_id}
                  </p>
                  {order.user_profile?.phone && (
                    <p><span className="font-medium">Điện thoại:</span> {order.user_profile.phone}</p>
                  )}
                  <p><span className="font-medium">Ngày đặt:</span> {new Date(order.date).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="ml-6">
                <Link href={`/admin/orders/${order.id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
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
