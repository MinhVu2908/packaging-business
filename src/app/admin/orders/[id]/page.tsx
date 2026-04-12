'use client'

import { useEffect, useState } from 'react'
import { useAdminGuard } from '@/lib/useAdminGuard'
import { useParams } from 'next/navigation'
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

export default function AdminOrderDetailPage() {
  const params = useParams() as { id: string }
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('pending')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [params.id])

  const loadOrder = async () => {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/orders/${params.id}`)
    if (!res.ok) {
      setError('Không thể tải chi tiết đơn hàng.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setOrder(data)
    setStatus(data.status)
    setLoading(false)
  }

  const handleUpdateStatus = async () => {
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể cập nhật trạng thái.')
      setSubmitting(false)
      return
    }

    await loadOrder()
    setSubmitting(false)
  }

  if (loading || isAdminLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-600">Đơn hàng không tồn tại.</div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Đơn hàng #{order.id}</h1>
          <p className="mt-2 text-sm text-slate-600">Chi tiết đơn hàng và trạng thái</p>
        </div>
        <Link href="/admin/orders" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
          Quay lại danh sách
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Thông tin đơn hàng</h2>
          <p className="mt-4 text-sm text-slate-600"><span className="font-semibold">Tóm tắt:</span> {order.summary}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Ngày:</span> {new Date(order.date).toLocaleDateString('vi-VN')}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Trạng thái hiện tại:</span> {order.status}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Khách hàng</h2>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-semibold">Khách hàng:</span>{' '}
            {order.user_profile?.contact_name || order.user_profile?.company_name || order.user_id}
          </p>
          {order.user_profile?.phone ? (
            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Điện thoại:</span> {order.user_profile.phone}</p>
          ) : null}
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">ID khách hàng:</span> {order.user_id}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Cập nhật trạng thái</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Trạng thái mới</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleUpdateStatus}
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
            </button>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  )
}
