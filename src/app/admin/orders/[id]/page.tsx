'use client'

import { useEffect, useState } from 'react'
import { useAdminGuard } from '@/lib/useAdminGuard'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ORDER_ITEM_STATUSES,
  ORDER_ITEM_STATUS_LABEL_VI,
  sortOrderItemsByStatus,
  type OrderItemStatus,
} from '@/lib/order-item-status'

type OrderItemRow = {
  id: string
  line_index: number
  po_number: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  length_mm: number | null
  width_mm: number | null
  item_status?: string
}

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
  order_items?: OrderItemRow[]
}

export default function AdminOrderDetailPage() {
  const params = useParams() as { id: string }
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null)

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
    setLoading(false)
  }

  const updateItemStatus = async (itemId: string, item_status: OrderItemStatus) => {
    setItemUpdatingId(itemId)
    setError('')
    const res = await fetch(`/api/admin/order-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_status }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể cập nhật trạng thái dòng đơn.')
      setItemUpdatingId(null)
      return
    }
    await loadOrder()
    setItemUpdatingId(null)
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

      {error ? (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Thông tin đơn hàng</h2>
          <p className="mt-4 text-sm text-slate-600"><span className="font-semibold">Tóm tắt:</span> {order.summary}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Ngày:</span> {new Date(order.date).toLocaleDateString('vi-VN')}</p>
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

      {order.order_items && order.order_items.length > 0 && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Dòng đơn & hóa đơn (mỗi dòng một PO)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Cùng một lần mua có thể có nhiều dòng; mỗi dòng có hóa đơn PDF riêng. Sắp xếp: chờ xử lý → đang giao → đã giao → đã hủy.
          </p>
          <ul className="mt-4 space-y-3">
            {sortOrderItemsByStatus(
              order.order_items.map((r) => ({
                ...r,
                item_status: r.item_status ?? 'pending',
              }))
            ).map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-end lg:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.product_name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    PO: <span className="font-mono font-semibold">{row.po_number}</span> · SL {row.quantity} ·{' '}
                    {row.total_price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="flex flex-col text-xs font-medium text-slate-700">
                    Trạng thái dòng
                    <select
                      value={row.item_status ?? 'pending'}
                      disabled={itemUpdatingId === row.id}
                      onChange={(e) => updateItemStatus(row.id, e.target.value as OrderItemStatus)}
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
                    className="inline-flex shrink-0 justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Xem / tải PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
