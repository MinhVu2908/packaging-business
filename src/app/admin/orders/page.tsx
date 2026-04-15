'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAdminGuard } from '@/lib/useAdminGuard'
import {
  ORDER_ITEM_STATUSES,
  ORDER_ITEM_STATUS_LABEL_VI,
  itemStatusBadgeClass,
  type OrderItemStatus,
} from '@/lib/order-item-status'

type CustomerOverview = {
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

type OrderRow = {
  id: string
  user_id: string
  status: string
  raw_status?: string
  summary: string
  date: string
  created_at: string
  user_profile?: {
    contact_name: string | null
    company_name: string | null
    phone: string | null
  } | null
}

const ORDER_STATUS_LABEL_VI: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao',
  on_delivery: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  canceled: 'Đã hủy',
}

function orderStatusLabel(status: string) {
  if (!status) return 'Chưa rõ'
  return ORDER_STATUS_LABEL_VI[status] ?? status
}

function orderStatusBadgeClass(status: string) {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 'shipped':
    case 'on_delivery':
    case 'processing':
      return 'bg-blue-50 text-blue-700 ring-blue-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 'cancelled':
    case 'canceled':
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 'paid':
      return 'bg-violet-50 text-violet-700 ring-violet-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<CustomerOverview[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'summary_asc'>('date_desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isLoading: isAdminLoading } = useAdminGuard()

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    const userFromQuery = searchParams.get('userId')
    setSelectedUserId(userFromQuery || 'all')
  }, [searchParams])

  const loadAll = async () => {
    setLoading(true)
    setError('')

    const [cRes, oRes] = await Promise.all([
      fetch('/api/admin/customers-orders'),
      fetch('/api/admin/orders'),
    ])

    if (!cRes.ok || !oRes.ok) {
      setError('Không thể tải dữ liệu đơn hàng.')
      setLoading(false)
      return
    }

    const [cData, oData] = await Promise.all([cRes.json(), oRes.json()])
    setCustomers(cData)
    setOrders(oData)
    setLoading(false)
  }

  const statusOptions = Array.from(new Set(orders.map((order) => order.status).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'vi')
  )

  const userOptions = customers
    .map((user) => ({
      id: user.id,
      label: user.contact_name || user.company_name || user.email || user.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'))

  const filteredOrders = orders
    .filter((order) => (selectedUserId === 'all' ? true : order.user_id === selectedUserId))
    .filter((order) => (selectedStatus === 'all' ? true : order.status === selectedStatus))
    .sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      if (sortBy === 'summary_asc') {
        return a.summary.localeCompare(b.summary, 'vi')
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

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
        <h1 className="text-3xl font-bold text-slate-900">Đơn hàng</h1>
        <p className="mt-2 text-sm text-slate-600">
          Theo khách hàng (dòng PO) và danh sách đơn theo thời gian. Hồ sơ khách:{' '}
          <Link href="/admin/users" className="font-medium text-slate-900 underline">
            Người dùng
          </Link>
          .
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-slate-900">Theo khách hàng</h2>
        <p className="mt-1 text-sm text-slate-600">
          Trạng thái giao theo từng dòng (PO). Mở hồ sơ khách không bao gồm chỉnh sửa đơn tại đây.
        </p>
        <div className="mt-6 space-y-4">
          {customers.map((user) => (
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

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <div key={order.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span>{order.summary}</span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${orderStatusBadgeClass(order.status)}`}
                              >
                                {orderStatusLabel(order.status)}
                              </span>
                              <span className="text-slate-400">
                                · {new Date(order.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          ))}
                          {(user.orders?.length ?? 0) > 3 && (
                            <p className="text-xs text-slate-500">
                              +{(user.orders?.length ?? 0) - 3} đơn hàng khác
                            </p>
                          )}
                          <Link
                            href={`/admin/orders?userId=${encodeURIComponent(user.id)}`}
                            className="inline-flex text-xs font-semibold text-slate-900 underline"
                          >
                            Xem tất cả đơn của khách này
                          </Link>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Giỏ hàng ({user.cart_items?.length ?? 0})
                      </p>
                      <div className="mt-2 space-y-1">
                        {(user.cart_items ?? []).slice(0, 3).map((item) => (
                          <p key={item.id} className="text-xs text-slate-600">
                            {item.products.name} x{item.quantity}
                          </p>
                        ))}
                        {(user.cart_items?.length ?? 0) > 3 && (
                          <p className="text-xs text-slate-500">
                            +{(user.cart_items?.length ?? 0) - 3} sản phẩm khác
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Hồ sơ khách
                  </Link>
                  {(user.orders?.length ?? 0) > 0 && user.orders?.[0] && (
                    <Link
                      href={`/admin/orders/${user.orders[0].id}`}
                      className="inline-flex text-sm font-semibold text-slate-900 underline"
                    >
                      Mở đơn mới nhất
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">Tất cả đơn hàng</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lọc theo khách hàng, trạng thái (pending/cancelled/...) hoặc xem toàn bộ và sắp xếp.
        </p>
        <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            Khách hàng
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="all">Tất cả khách hàng</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Trạng thái đơn
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Sắp xếp
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date_desc' | 'date_asc' | 'summary_asc')}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="date_desc">Ngày đặt mới nhất</option>
              <option value="date_asc">Ngày đặt cũ nhất</option>
              <option value="summary_asc">Tóm tắt A-Z</option>
            </select>
          </label>
        </div>
        <div className="mt-6 space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{order.summary}</h3>
                  <div className="mt-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium">Trạng thái:</span>{' '}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${orderStatusBadgeClass(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Khách hàng:</span>{' '}
                      {order.user_profile?.contact_name ||
                        order.user_profile?.company_name ||
                        order.user_id}
                    </p>
                    {order.user_profile?.phone && (
                      <p>
                        <span className="font-medium">Điện thoại:</span> {order.user_profile.phone}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Ngày đặt:</span>{' '}
                      {new Date(order.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <Link
                    href={`/admin/users/${order.user_id}`}
                    className="text-sm font-medium text-slate-700 underline"
                  >
                    Hồ sơ khách
                  </Link>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Chi tiết đơn
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Không có đơn hàng phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
