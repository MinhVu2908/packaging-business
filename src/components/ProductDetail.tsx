'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const templateDesignOptions = [
  { id: 'tpl-minimal', name: 'Mẫu tối giản', imageUrl: '/design-templates/template-1.svg' },
  { id: 'tpl-brand', name: 'Mẫu nhận diện thương hiệu', imageUrl: '/design-templates/template-2.svg' },
  { id: 'tpl-premium', name: 'Mẫu cao cấp', imageUrl: '/design-templates/template-3.svg' },
]

const materialOptions = [
  { id: 'kraft100', label: 'Kraft 100', price: 780 },
  { id: 'kraft150', label: 'Kraft 150', price: 980 },
  { id: 'medium200', label: 'Medium 200', price: 1200 },
  { id: 'medium250', label: 'Medium 250', price: 1450 },
]

function getOption(id: string) {
  return materialOptions.find((item) => item.id === id) ?? materialOptions[0]
}

type ProductForPricing = {
  id: string
  name?: string
  category?: string
  layers: string
  description?: string
  flute_a?: number | null
  flute_b?: number | null
}

export default function ProductDetail({ product }: { product: ProductForPricing }) {
  const router = useRouter()
  const [lengthMm, setLengthMm] = useState(500)
  const [widthMm, setWidthMm] = useState(750)
  const [quantity, setQuantity] = useState(1)
  const [face1, setFace1] = useState('kraft100')
  const [flute1, setFlute1] = useState('kraft100')
  const [face2, setFace2] = useState('kraft100')
  const [flute2, setFlute2] = useState('kraft100')
  const [face3, setFace3] = useState('kraft100')
  const [designMode, setDesignMode] = useState<'custom' | 'template'>('custom')
  const [designFiles, setDesignFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(templateDesignOptions[0].id)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isFiveLayer = product.layers.includes('5')
  const fluteA = typeof product.flute_a === 'number' ? product.flute_a : product.flute_a != null ? Number(product.flute_a) : 1
  const fluteB = typeof product.flute_b === 'number' ? product.flute_b : product.flute_b != null ? Number(product.flute_b) : 1

  const area = useMemo(() => {
    return Math.max(0, lengthMm * widthMm) / 1000000
  }, [lengthMm, widthMm])

  const unitPrice = useMemo(() => {
    const p1 = getOption(face1).price
    const p2 = getOption(flute1).price
    const p3 = getOption(face2).price
    const result = area * (p1 * 1 + p2 * fluteA + p3 * 1)

    if (!isFiveLayer) {
      return Math.round(result)
    }

    const p4 = getOption(flute2).price
    const p5 = getOption(face3).price
    return Math.round(area * (p1 + p2 * fluteA + p3 + p4 * fluteB + p5))
  }, [area, face1, flute1, face2, flute2, face3, fluteA, fluteB, isFiveLayer])

  const totalPrice = useMemo(() => {
    return Math.round(unitPrice * quantity)
  }, [unitPrice, quantity])

  const handleAddCart = async () => {
    if (designMode === 'custom' && designFiles.length === 0) {
      setMessage('Vui lòng tải lên ít nhất 1 tệp thiết kế hoặc chọn mẫu có sẵn.')
      return
    }

    setLoading(true)
    setMessage('')

    const body = {
      product_id: product.id,
      quantity,
      length_mm: lengthMm,
      width_mm: widthMm,
      unit_price: unitPrice,
      total_price: totalPrice,
      options: {
        face1,
        flute1,
        face2,
        flute2: isFiveLayer ? flute2 : null,
        face3: isFiveLayer ? face3 : null,
        design_mode: designMode,
        design_template: designMode === 'template' ? selectedTemplate : null,
      },
      design_mode: designMode,
      design_template: designMode === 'template' ? selectedTemplate : null,
    }

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json()
      setMessage(json?.error || 'Không thể thêm vào giỏ hàng')
    } else {
      const cartItem = await res.json()

      if (designMode === 'custom' && designFiles.length > 0) {
        const formData = new FormData()
        formData.append('cart_item_id', cartItem.id)
        formData.append('customer_notes', 'Khách gửi thiết kế tùy chỉnh ngay khi thêm vào giỏ.')
        designFiles.forEach((file) => formData.append('files', file))

        const designRes = await fetch('/api/cart/design', {
          method: 'POST',
          body: formData,
        })

        if (!designRes.ok) {
          const designJson = await designRes.json()
          setMessage(designJson?.error || 'Đã thêm vào giỏ, nhưng không thể gửi file thiết kế.')
          setLoading(false)
          return
        }
      }

      setMessage('Đã thêm vào giỏ hàng!')
      router.push('/cart')
    }

    setLoading(false)
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">{product.name}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>

          <div className="mt-8 grid gap-4 rounded-3xl bg-slate-50 p-6">
            <div>
              <p className="text-xs text-slate-500">Kích thước (mm)</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex-1 min-w-[12rem] rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <span className="block text-xs text-slate-500">Dài</span>
                  <input
                    type="number"
                    value={lengthMm}
                    onChange={(event) => setLengthMm(Number(event.target.value))}
                    className="mt-2 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                  />
                </label>
                <label className="flex-1 min-w-[12rem] rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <span className="block text-xs text-slate-500">Rộng</span>
                  <input
                    type="number"
                    value={widthMm}
                    onChange={(event) => setWidthMm(Number(event.target.value))}
                    className="mt-2 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500">Số lượng</p>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                className="mt-3 w-32 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                Mặt 1
                <select
                  value={face1}
                  onChange={(event) => setFace1(event.target.value)}
                  className="mt-2 w-full border-none bg-transparent outline-none"
                >
                  {materialOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                Sóng 1
                <select
                  value={flute1}
                  onChange={(event) => setFlute1(event.target.value)}
                  className="mt-2 w-full border-none bg-transparent outline-none"
                >
                  {materialOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                Mặt 2
                <select
                  value={face2}
                  onChange={(event) => setFace2(event.target.value)}
                  className="mt-2 w-full border-none bg-transparent outline-none"
                >
                  {materialOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              {isFiveLayer && (
                <>
                  <label className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                    Sóng 2
                    <select
                      value={flute2}
                      onChange={(event) => setFlute2(event.target.value)}
                      className="mt-2 w-full border-none bg-transparent outline-none"
                    >
                      {materialOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm">
                    Mặt 3
                    <select
                      value={face3}
                      onChange={(event) => setFace3(event.target.value)}
                      className="mt-2 w-full border-none bg-transparent outline-none"
                    >
                      {materialOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Yêu cầu thiết kế</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="design-mode"
                    checked={designMode === 'custom'}
                    onChange={() => setDesignMode('custom')}
                  />
                  Gửi file thiết kế tùy chỉnh
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="design-mode"
                    checked={designMode === 'template'}
                    onChange={() => setDesignMode('template')}
                  />
                  Chọn mẫu có sẵn
                </label>
              </div>

              {designMode === 'custom' ? (
                <div className="mt-4">
                  <label className="block text-xs text-slate-500">Gửi tệp thiết kế (Bắt Buộc)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.zip,.stl,.obj,.fbx,.glb,.gltf"
                    onChange={(event) => setDesignFiles(Array.from(event.target.files ?? []))}
                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                  {designFiles.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500">Đã chọn {designFiles.length} tệp.</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {templateDesignOptions.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`rounded-lg border p-2 text-left ${
                        selectedTemplate === template.id ? 'border-slate-900' : 'border-slate-200'
                      }`}
                    >
                      <Image
                        src={template.imageUrl}
                        alt={template.name}
                        width={240}
                        height={120}
                        className="h-24 w-full rounded object-cover"
                      />
                      <p className="mt-2 text-xs font-medium text-slate-700">{template.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chi tiết giá</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{unitPrice.toLocaleString()}đ / tấm</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Diện tích</span>
                <span>{area.toFixed(3)} m²</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <span>Số lượng</span>
                <span>{quantity}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">
                <span>Tổng</span>
                <span>{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddCart}
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
            {message && (
              <p className="text-sm text-slate-700">{message}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
