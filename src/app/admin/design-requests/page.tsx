'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminGuard } from '@/lib/useAdminGuard'
import Link from 'next/link'

type DesignRequest = {
  id: string
  cart_item_id: string
  user_id: string
  status: string
  admin_notes: string | null
  customer_notes: string | null
  customer_confirmed: boolean
  created_at: string
  updated_at: string
  cart_items: {
    id: string
    product_id: string
    quantity: number
    length_mm: number
    width_mm: number
    unit_price: number
    total_price: number
    options: Record<string, string | null>
    products: {
      name: string
      category: string
      layers: string
    }
  } | null
  design_files: {
    id: string
    type: string
    file_url: string
    filename: string
    mime_type: string | null
    size: number | null
    uploaded_by: string
    uploaded_at: string
  }[]
  user_profile?: {
    company_name: string | null
    contact_name: string | null
    phone: string | null
  } | null
}

type UserGroup = {
  user_id: string
  user_profile: DesignRequest['user_profile'] | null
  pending_count: number
  requests: DesignRequest[]
}

export default function AdminDesignRequestsPage() {
  const [requests, setRequests] = useState<DesignRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null)
  const [responseFiles, setResponseFiles] = useState<File[]>([])
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isLoading: isAdminLoading } = useAdminGuard()

  const userGroups: UserGroup[] = Object.values(
    requests.reduce<Record<string, UserGroup>>((acc, request) => {
      const key = request.user_id || 'unknown'

      if (!acc[key]) {
        acc[key] = {
          user_id: key,
          user_profile: request.user_profile || null,
          pending_count: 0,
          requests: [],
        }
      }

      acc[key].requests.push(request)
      if (request.status === 'pending') {
        acc[key].pending_count += 1
      }

      if (!acc[key].user_profile && request.user_profile) {
        acc[key].user_profile = request.user_profile
      }

      return acc
    }, {})
  ).sort((a, b) => b.pending_count - a.pending_count || b.requests.length - a.requests.length)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/design-requests')
    if (!res.ok) {
      setError('Không thể tải danh sách yêu cầu thiết kế.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }

  const handleFileChange = (files: FileList | null) => {
    setResponseFiles(files ? Array.from(files) : [])
  }

  const handleSubmitResponse = async (requestId: string) => {
    setSubmitting(true)
    setError('')

    const formData = new FormData()
    formData.append('design_request_id', requestId)
    formData.append('admin_notes', adminNotes)
    formData.append('status', 'review_ready')
    responseFiles.forEach((file) => formData.append('files', file))

    const res = await fetch('/api/admin/design-requests', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể gửi phản hồi.')
      setSubmitting(false)
      return
    }

    setSelectedRequest(null)
    setResponseFiles([])
    setAdminNotes('')
    await loadRequests()
    setSubmitting(false)
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý'
      case 'review_ready':
        return 'Đã gửi phản hồi'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'rejected':
        return 'Từ chối'
      default:
        return status
    }
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
        <h1 className="text-3xl font-bold text-slate-900">Yêu cầu thiết kế</h1>
        <p className="mt-2 text-sm text-slate-600">Quản lý các yêu cầu thiết kế từ khách hàng</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {userGroups.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Hiện không có yêu cầu thiết kế nào.
          </div>
        ) : (
          userGroups.map((group) => {
            const customerName =
              group.user_profile?.contact_name || group.user_profile?.company_name || group.user_id

            return (
              <div key={group.user_id} className="rounded-lg border border-slate-200 bg-white p-6">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setSelectedRequest(null)
                    setSelectedUserId(selectedUserId === group.user_id ? null : group.user_id)
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{customerName}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {group.pending_count} yêu cầu chờ xử lý
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Tổng yêu cầu: <span className="font-semibold text-slate-900">{group.requests.length}</span>
                      </p>
                      {group.user_profile?.phone && (
                        <p className="mt-1 text-sm text-slate-600">SĐT: {group.user_profile.phone}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-slate-600">
                      {selectedUserId === group.user_id ? 'Thu gọn' : 'Mở'}
                    </div>
                  </div>
                </button>

                {selectedUserId === group.user_id && (
                  <div className="mt-6 space-y-4">
                    {group.requests.map((request) => (
                      <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {request.cart_items?.products.name ?? 'Yêu cầu thiết kế'}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              #{request.id} · {statusLabel(request.status)}
                            </p>
                            <p className="mt-2 text-xs text-slate-600">
                              Kích thước: {request.cart_items ? `${request.cart_items.length_mm} x ${request.cart_items.width_mm} mm` : 'Không có thông tin'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/design-requests/${request.id}`}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              Xem chi tiết
                            </Link>
                            {request.status === 'pending' && (
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                Phản hồi
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Phản hồi yêu cầu thiết kế</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tải lên tệp thiết kế đã chỉnh sửa và ghi chú cho khách hàng
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Tệp phản hồi</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.stl,.obj,.fbx,.glb,.gltf,.zip,.pdf"
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Mô tả các thay đổi đã thực hiện..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={() => handleSubmitResponse(selectedRequest.id)}
                disabled={submitting || responseFiles.length === 0}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
