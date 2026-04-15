'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminGuard } from '@/lib/useAdminGuard'

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

type CartItem = {
  id: string
  user_id: string
  quantity: number
  total_price: number
  products: { name: string } | null
}

type DesignRequest = {
  id: string
  cart_item_id: string | null
  user_id: string
  status: string
  admin_notes: string | null
  customer_notes: string | null
  customer_confirmed: boolean
  created_at: string
  updated_at: string
}

export default function AdminUserDetailPage() {
  const params = useParams() as { userId: string }
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    setCartItems(data.cart_items || [])
    setDesignRequests(data.design_requests || [])
    setLoading(false)
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
          <p className="mt-2 text-sm text-slate-600">
            Thông tin khách hàng. Đơn hàng:{' '}
            <Link href="/admin/orders" className="font-medium text-slate-900 underline">
              Đơn hàng
            </Link>
            .
          </p>
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
          {profile.role && (
            <p>
              <span className="font-semibold text-slate-800">Vai trò:</span> {profile.role}
            </p>
          )}
          <p className="sm:col-span-2">
            <span className="font-semibold text-slate-800">ID:</span>{' '}
            <span className="font-mono text-xs">{profile.id}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Giỏ hàng ({cartItems.length})</h2>
          {cartItems.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Giỏ trống.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {cartItems.map((item) => (
                <li key={item.id} className="text-sm text-slate-700">
                  {(item.products as { name?: string } | null)?.name ?? 'Sản phẩm'} × {item.quantity}{' '}
                  <span className="text-slate-500">· {item.total_price.toLocaleString('vi-VN')}đ</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Yêu cầu thiết kế ({designRequests.length})</h2>
          {designRequests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Chưa có yêu cầu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {designRequests.map((dr) => (
                <li key={dr.id} className="text-sm text-slate-700">
                  <span className="font-medium">{dr.status}</span>
                  <span className="text-slate-500"> · {new Date(dr.created_at).toLocaleDateString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
