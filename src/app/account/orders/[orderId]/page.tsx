'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ORDER_ITEM_STATUS_LABEL_VI,
  itemStatusBadgeClass,
  type OrderItemStatus,
} from '@/lib/order-item-status'

type Order = {
  id: string
  status: string
  summary: string
  date: string
}

type OrderItem = {
  id: string
  line_index: number
  po_number: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  length_mm: number | null
  width_mm: number | null
  options: Record<string, unknown> | null
  item_status?: string
}

export default function AccountOrderDetailPage() {
  const params = useParams() as { orderId: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/account/orders/${params.orderId}`)
      if (!res.ok) {
        if (!cancelled) {
          setError('Không thể tải đơn hàng.')
          setLoading(false)
        }
        return
      }
      const data = await res.json()
      if (!cancelled) {
        setOrder(data.order)
        setItems(data.items || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [params.orderId])

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">Đang tải...</p>
        </div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-red-700">{error || 'Không tìm thấy đơn hàng.'}</p>
          <Link href="/account" className="mt-4 inline-block text-sm text-slate-900 underline">
            Về tài khoản
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chi tiết đơn hàng</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Đơn #{order.id}</h1>
            <p className="mt-2 text-sm text-slate-600">{order.summary}</p>
            <p className="mt-2 text-xs text-slate-500">
              Ngày: {new Date(order.date).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <Link
            href="/account"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Về tài khoản
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Sản phẩm đã mua (cùng lần thanh toán)</h2>
          <p className="text-sm text-slate-600">
            Mỗi dòng có một mã PO và một hóa đơn PDF riêng. Trạng thái giao hàng:{' '}
            <span className="font-medium text-slate-800">Chờ xử lý</span>,{' '}
            <span className="font-medium text-slate-800">Đang giao</span>,{' '}
            <span className="font-medium text-slate-800">Đã giao</span>,{' '}
            <span className="font-medium text-slate-800">Đã hủy</span>.
          </p>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product_name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      PO # <span className="font-mono font-semibold">{item.po_number}</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      SL: {item.quantity} · Đơn giá: {item.unit_price.toLocaleString('vi-VN')}đ · Thành tiền:{' '}
                      {item.total_price.toLocaleString('vi-VN')}đ
                    </p>
                    {item.length_mm != null && item.width_mm != null && (
                      <p className="mt-1 text-xs text-slate-500">
                        Kích thước: {item.length_mm} × {item.width_mm} mm
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-600">
                      Trạng thái giao hàng:{' '}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${itemStatusBadgeClass(item.item_status ?? 'pending')}`}
                      >
                        {ORDER_ITEM_STATUS_LABEL_VI[(item.item_status ?? 'pending') as OrderItemStatus] ??
                          item.item_status ??
                          '—'}
                      </span>
                    </p>
                  </div>
                  <a
                    href={`/api/account/order-items/${item.id}/receipt`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Tải hóa đơn PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
