'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminGuard } from '@/lib/useAdminGuard'
import {
  ORDER_ITEM_STATUSES,
  ORDER_ITEM_STATUS_LABEL_VI,
  emptyOrderItemCounts,
  type OrderItemStatus,
} from '@/lib/order-item-status'

type Profile = {
  id: string
  company_name: string | null
  contact_name: string | null
  phone: string | null
  role?: string
  email?: string
  created_at: string | null
  updated_at: string | null
}

type OrderItemRow = {
  id: string
  order_id: string
  line_index: number
  po_number: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  length_mm: number | null
  width_mm: number | null
  item_status: string
  created_at: string
}

type OrderWithItems = {
  id: string
  user_id: string
  status: string
  summary: string
  date: string
  created_at: string
  order_items: OrderItemRow[]
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-900'
    case 'on_delivery':
      return 'bg-sky-100 text-sky-900'
    case 'delivered':
      return 'bg-emerald-100 text-emerald-900'
    case 'cancelled':
      return 'bg-slate-200 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

function statusSummaryCardClass(status: OrderItemStatus) {
  switch (status) {
    case 'pending':
      return 'border-amber-200 bg-amber-50'
    case 'on_delivery':
      return 'border-sky-200 bg-sky-50'
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50'
    case 'cancelled':
      return 'border-slate-200 bg-slate-50'
    default:
      return 'border-slate-200 bg-white'
  }
}

export default function AdminUserDetailPage() {
  const params = useParams() as { userId: string }
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [itemLineCounts, setItemLineCounts] = useState<Record<OrderItemStatus, number>>(emptyOrderItemCounts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [params.userId])

  const loadUser = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/users/${params.userId}`)
    if (!res.ok) {
      setError('Không thể tải thông tin người dùng.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setProfile(data.profile)
    setOrders(data.orders || [])
    setItemLineCounts(data.itemLineCounts ?? emptyOrderItemCounts())
    setLoading(false)
  }

  const updateItemStatus = async (itemId: string, item_status: OrderItemStatus) => {
    setUpdatingId(itemId)
    setError('')
    const res = await fetch(`/api/admin/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_status }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể cập nhật trạng thái dòng đơn.')
      setUpdatingId(null)
      return
    }
    await loadUser()
    setUpdatingId(null)
  }

  if (loading || isAdminLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-600">Không tìm thấy người dùng.</div>
    )
  }

  const displayName =
    profile.contact_name || profile.email || profile.company_name || profile.id

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
          <p className="mt-2 text-sm text-slate-600">Đơn hàng hiện tại và trước đây (sắp xếp theo mức độ ưu tiên giao hàng)</p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Quay lại danh sách
        </Link>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Thông tin liên hệ</h2>
        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {profile.email && (
            <p>
              <span className="font-semibold text-slate-800">Email:</span> {profile.email}
            </p>
          )}
          {profile.company_name && (
            <p>
              <span className="font-semibold text-slate-800">Công ty:</span> {profile.company_name}
            </p>
          )}
          {profile.phone && (
            <p>
              <span className="font-semibold text-slate-800">Điện thoại:</span> {profile.phone}
            </p>
          )}
          <p className="sm:col-span-2">
            <span className="font-semibold text-slate-800">ID:</span>{' '}
            <span className="font-mono text-xs">{profile.id}</span>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Dòng đơn theo trạng thái</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tổng số dòng (mỗi dòng = một PO):{' '}
          {ORDER_ITEM_STATUSES.reduce((sum, s) => sum + itemLineCounts[s], 0)}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER_ITEM_STATUSES.map((status) => (
            <div
              key={status}
              className={`rounded-lg border p-4 ${statusSummaryCardClass(status)}`}
            >
              <p className="text-xs font-medium text-slate-600">{ORDER_ITEM_STATUS_LABEL_VI[status]}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{itemLineCounts[status]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Đơn hàng ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-600">Chưa có đơn hàng.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{order.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Đơn #{order.id} · Ngày {new Date(order.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="shrink-0 text-sm font-semibold text-slate-900 underline hover:text-slate-700"
                >
                  Mở trang đơn
                </Link>
              </div>

              <ul className="mt-4 space-y-4">
                {order.order_items.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{row.product_name}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          PO <span className="font-mono font-semibold">{row.po_number}</span> · SL {row.quantity} ·{' '}
                          {row.total_price.toLocaleString('vi-VN')}đ
                        </p>
                        {row.length_mm != null && row.width_mm != null && (
                          <p className="mt-1 text-xs text-slate-500">
                            Kích thước: {row.length_mm} × {row.width_mm} mm
                          </p>
                        )}
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.item_status)}`}
                        >
                          {ORDER_ITEM_STATUS_LABEL_VI[row.item_status as OrderItemStatus] ?? row.item_status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="flex flex-col text-xs font-medium text-slate-700">
                          Trạng thái dòng
                          <select
                            value={row.item_status}
                            disabled={updatingId === row.id}
                            onChange={(e) =>
                              updateItemStatus(row.id, e.target.value as OrderItemStatus)
                            }
                            className="mt-1 min-w-[11rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                          >
                            {ORDER_ITEM_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {ORDER_ITEM_STATUS_LABEL_VI[s]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <a
                          href={`/api/admin/order-items/${row.id}/receipt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Xem / tải PDF
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
