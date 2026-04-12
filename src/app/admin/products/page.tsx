'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminGuard } from '@/lib/useAdminGuard'

type Product = {
  id: string
  name: string
  category: string
  layers: string
  linerboard: string
  medium: string
  description: string
  price: number
  created_at: string
  updated_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const { isLoading: isAdminLoading } = useAdminGuard()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    layers: '',
    linerboard: '',
    medium: '',
    description: '',
    price: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/products')
    if (!res.ok) {
      setError('Không thể tải danh sách sản phẩm.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const method = editingProduct ? 'PATCH' : 'POST'
    const url = editingProduct
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products'

    const body: Record<string, unknown> = {
      name: formData.name,
      category: formData.category,
      layers: formData.layers,
      linerboard: formData.linerboard,
      medium: formData.medium,
      description: formData.description,
      price: parseInt(formData.price),
    }

    if (editingProduct) {
      Object.keys(body).forEach((key) => {
        if (body[key] === '' || body[key] === undefined || Number.isNaN(body[key])) {
          delete body[key]
        }
      })
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể lưu sản phẩm.')
      setSubmitting(false)
      return
    }

    setFormData({
      name: '',
      category: '',
      layers: '',
      linerboard: '',
      medium: '',
      description: '',
      price: '',
    })
    setEditingProduct(null)
    setShowAddForm(false)
    await loadProducts()
    setSubmitting(false)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      layers: product.layers,
      linerboard: product.linerboard,
      medium: product.medium,
      description: product.description,
      price: String(product.price),
    })
    setShowAddForm(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return
    }

    setLoading(true)
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data?.error ?? 'Không thể xóa sản phẩm.')
      setLoading(false)
      return
    }

    await loadProducts()
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm</h1>
          <p className="mt-2 text-sm text-slate-600">Thêm, sửa, xóa sản phẩm trong cửa hàng</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Thêm sản phẩm
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{product.category} · {product.layers}</p>
                <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                <p className="mt-4 text-lg font-bold text-slate-900">{product.price.toLocaleString()}đ</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openEditProduct(product)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="3 lớp">3 lớp</option>
                    <option value="5 lớp">5 lớp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Lớp</label>
                  <select
                    value={formData.layers}
                    onChange={(e) => setFormData({ ...formData, layers: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="">Chọn lớp</option>
                    <option value="3 lớp">3 lớp</option>
                    <option value="5 lớp">5 lớp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Linerboard</label>
                  <select
                    value={formData.linerboard}
                    onChange={(e) => setFormData({ ...formData, linerboard: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="">Chọn linerboard</option>
                    <option value="Testliner">Testliner</option>
                    <option value="Kraftliner">Kraftliner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Medium</label>
                  <select
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="">Chọn medium</option>
                    <option value="B-Flute">B-Flute</option>
                    <option value="C-Flute">C-Flute</option>
                    <option value="BC-Flute">BC-Flute</option>
                    <option value="EB-Flute">EB-Flute</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Giá (VNĐ)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
