'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProductMessage } from '@/types/messages'

type DesignFile = {
  id: string
  type: string
  file_url: string
  filename: string
  mime_type: string | null
  size: number | null
  uploaded_by: string
  uploaded_at: string
}

type DesignRequest = {
  id: string
  status: string
  admin_notes: string | null
  customer_notes: string | null
  customer_confirmed: boolean
  files: DesignFile[]
}

type CartItem = {
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
    description: string
  }
  design_request?: DesignRequest | null
}

type CartItemDetailProps = {
  item: CartItem
  onUpdate: (updatedItem: CartItem) => void
  onClose: () => void
}

export default function CartItemDetail({ item, onUpdate, onClose }: CartItemDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    quantity: item.quantity,
    length_mm: item.length_mm,
    width_mm: item.width_mm,
    options: { ...item.options }
  })
  const [messages, setMessages] = useState<ProductMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'files'>('details')

  // Load messages
  useEffect(() => {
    loadMessages()
  }, [item.id])

  const loadMessages = async () => {
    const res = await fetch(`/api/cart/messages?cart_item_id=${item.id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          quantity: editForm.quantity,
          length_mm: editForm.length_mm,
          width_mm: editForm.width_mm,
          options: editForm.options
        })
      })

      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating item:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSendingMessage(true)
    try {
      const res = await fetch('/api/cart/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_item_id: item.id,
          message: newMessage.trim()
        })
      })

      if (res.ok) {
        setNewMessage('')
        await loadMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleUploadAdditionalFiles = async () => {
    if (!additionalFiles.length || !item.design_request) return

    setUploadingFiles(true)
    try {
      const formData = new FormData()
      formData.append('cart_item_id', item.id)
      formData.append('customer_notes', 'Additional files uploaded')
      additionalFiles.forEach(file => formData.append('files', file))

      const res = await fetch('/api/cart/design', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        setAdditionalFiles([])
        // Refresh the item data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploadingFiles(false)
    }
  }

  const designStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Đã gửi thiết kế, chờ kiểm tra'
      case 'review_ready': return 'Thiết kế đã được gửi lại cho bạn'
      case 'confirmed': return 'Thiết kế đã được xác nhận'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{item.products.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Loại: {item.products.layers} · Kích thước: {item.length_mm} x {item.width_mm} mm
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-1">
            {[
              { key: 'details', label: 'Chi tiết sản phẩm' },
              { key: 'messages', label: 'Tin nhắn' },
              { key: 'files', label: 'Tệp thiết kế' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Thông tin sản phẩm</h3>
                <p className="mt-2 text-sm text-slate-600">{item.products.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">Danh mục:</span> {item.products.category}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Lớp:</span> {item.products.layers}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Chỉnh sửa sản phẩm</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Chiều dài (mm)</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.length_mm}
                        onChange={(e) => setEditForm(prev => ({ ...prev, length_mm: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Chiều rộng (mm)</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.width_mm}
                        onChange={(e) => setEditForm(prev => ({ ...prev, width_mm: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Thông số hiện tại</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Chỉnh sửa
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-900">Số lượng:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Kích thước:</span> {item.length_mm} x {item.width_mm} mm
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Đơn giá:</span> {item.unit_price.toLocaleString()}đ
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Tổng:</span> {item.total_price.toLocaleString()}đ
                    </div>
                  </div>

                  {Object.keys(item.options).length > 0 && (
                    <div>
                      <span className="font-medium text-slate-900">Tùy chọn:</span>
                      <div className="mt-2 text-sm text-slate-600">
                        {Object.entries(item.options).map(([key, value]) =>
                          value ? <div key={key}>{key}: {value}</div> : null
                        ).filter(Boolean)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Lịch sử trò chuyện</h3>

              {/* Messages */}
              <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">Chưa có tin nhắn nào</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                          message.sender_role === 'customer'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className={`mt-1 text-xs ${
                          message.sender_role === 'customer' ? 'text-slate-300' : 'text-slate-500'
                        }`}>
                          {new Date(message.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
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
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Tệp thiết kế</h3>

              {item.design_request ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Trạng thái: {designStatusLabel(item.design_request.status)}</p>
                    {item.design_request.customer_notes && (
                      <p className="mt-2 text-sm text-slate-600">Ghi chú: {item.design_request.customer_notes}</p>
                    )}
                  </div>

                  {/* Customer Files */}
                  {item.design_request.files.filter(f => f.type === 'customer_upload').length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900">Tệp đã gửi</h4>
                      <div className="mt-2 space-y-2">
                        {item.design_request.files.filter(f => f.type === 'customer_upload').map((file) => (
                          <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{file.filename}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(file.uploaded_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-900 underline hover:text-slate-600"
                            >
                              Xem
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Files */}
                  {item.design_request.files.filter(f => f.type === 'admin_response').length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900">Tệp từ Admin</h4>
                      <div className="mt-2 space-y-2">
                        {item.design_request.files.filter(f => f.type === 'admin_response').map((file) => (
                          <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{file.filename}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(file.uploaded_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-900 underline hover:text-slate-600"
                            >
                              Tải xuống
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Additional Files */}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900">Thêm tệp mới</h4>
                    <div className="mt-3 space-y-3">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.stl,.obj,.fbx,.glb,.gltf,.zip"
                        onChange={(e) => setAdditionalFiles(Array.from(e.target.files || []))}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      />
                      <button
                        onClick={handleUploadAdditionalFiles}
                        disabled={uploadingFiles || additionalFiles.length === 0}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        {uploadingFiles ? 'Đang tải lên...' : 'Thêm tệp'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 p-6 text-center">
                  <p className="text-slate-600">Chưa có yêu cầu thiết kế nào</p>
                  <p className="mt-2 text-sm text-slate-500">Gửi thiết kế từ trang giỏ hàng chính</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
