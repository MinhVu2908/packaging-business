'use client'

import { useEffect, useState } from 'react'
import { useAdminGuard } from '@/lib/useAdminGuard'
import { useParams } from 'next/navigation'
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

type ProductMessage = {
  id: string
  cart_item_id: string
  sender_id: string
  sender_role: 'customer' | 'admin'
  message: string
  created_at: string
}

export default function AdminDesignRequestDetailPage() {
  const params = useParams() as { id: string }
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [request, setRequest] = useState<DesignRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [responseFiles, setResponseFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('review_ready')
  const [messages, setMessages] = useState<ProductMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    loadRequest()
  }, [params.id])

  const loadRequest = async () => {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/design-requests/${params.id}`)
    if (!res.ok) {
      setError('Không thể tải chi tiết yêu cầu thiết kế.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setRequest(data)
    setLoading(false)
  }

  const loadMessages = async () => {
    if (!request?.cart_item_id) return

    const res = await fetch(`/api/admin/messages?design_request_id=${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
  }

  useEffect(() => {
    if (request) {
      loadMessages()
    }
  }, [request])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !request?.cart_item_id) return

    setSendingMessage(true)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_item_id: request.cart_item_id,
          message: newMessage.trim()
        })
      })

      if (res.ok) {
        setNewMessage('')
        await loadMessages()
      } else {
        const data = await res.json()
        setError(data?.error ?? 'Không thể gửi tin nhắn.')
      }
    } catch (error) {
      setError('Không thể gửi tin nhắn.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFileChange = (files: FileList | null) => {
    setResponseFiles(files ? Array.from(files) : [])
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData()
    formData.append('design_request_id', params.id)
    formData.append('admin_notes', adminNotes)
    formData.append('status', status)
    responseFiles.forEach((file) => formData.append('files', file))

    const res = await fetch(`/api/admin/design-requests/${params.id}/respond`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể gửi phản hồi.')
      setSubmitting(false)
      return
    }

    setAdminNotes('')
    setResponseFiles([])
    await loadRequest()
    setSubmitting(false)
  }

  if (loading || isAdminLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-slate-600">Yêu cầu thiết kế không tồn tại.</div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Yêu cầu thiết kế #{request.id}</h1>
          <p className="mt-2 text-sm text-slate-600">Chi tiết yêu cầu và phản hồi admin</p>
        </div>
        <Link href="/admin/design-requests" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
          Quay lại danh sách
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Thông tin yêu cầu</h2>
          <p className="mt-4 text-sm text-slate-600"><span className="font-semibold">Sản phẩm:</span> {request.cart_items?.products.name ?? 'Không xác định'}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Kích thước:</span> {request.cart_items ? `${request.cart_items.length_mm} x ${request.cart_items.width_mm} mm` : 'Không xác định'}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Số lượng:</span> {request.cart_items?.quantity ?? 'Không xác định'}</p>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Trạng thái:</span> {request.status}</p>
          {request.user_profile && (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold">Khách hàng:</span>{' '}
              {request.user_profile.contact_name || request.user_profile.company_name || request.user_id}
            </p>
          )}
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Ghi chú khách hàng:</span> {request.customer_notes || 'Không có'}</p>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Tệp khách hàng</h3>
            <div className="mt-3 space-y-2">
              {request.design_files.filter((file) => file.type === 'customer_upload').map((file) => (
                <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 underline hover:text-blue-800">
                  {file.filename}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Phản hồi admin</h2>
          <form onSubmit={handleSubmitResponse} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="review_ready">Đã phản hồi</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Tệp phản hồi</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.zip,.stl,.obj,.fbx,.glb,.gltf"
                onChange={(e) => handleFileChange(e.target.files)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </form>
        </div>
      </div>

      {/* Messages Section */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Trò chuyện với khách hàng</h2>

        {/* Messages Display */}
        <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Chưa có tin nhắn nào</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                      message.sender_role === 'admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    <p>{message.message}</p>
                    <p className={`mt-1 text-xs ${
                      message.sender_role === 'admin' ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {new Date(message.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Message */}
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Nhập tin nhắn cho khách hàng..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {sendingMessage ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>

      {request.design_files.some((file) => file.type === 'admin_response') && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Các tệp phản hồi đã gửi</h2>
          <div className="mt-4 space-y-2">
            {request.design_files.filter((file) => file.type === 'admin_response').map((file) => (
              <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="block text-sm text-green-600 underline hover:text-green-800">
                {file.filename}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
