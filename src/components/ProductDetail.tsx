'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const materialOptions = [
  { id: 'kraft100', label: 'Kraft 100', price: 780, factor: 1.0 },
  { id: 'kraft150', label: 'Kraft 150', price: 980, factor: 1.08 },
  { id: 'medium200', label: 'Medium 200', price: 1200, factor: 1.15 },
  { id: 'medium250', label: 'Medium 250', price: 1450, factor: 1.2 },
]

function getOption(id: string) {
  return materialOptions.find((item) => item.id === id) ?? materialOptions[0]
}

export default function ProductDetail({ product }: { product: any }) {
  const router = useRouter()
  const [lengthMm, setLengthMm] = useState(500)
  const [widthMm, setWidthMm] = useState(750)
  const [quantity, setQuantity] = useState(1)
  const [face1, setFace1] = useState('kraft100')
  const [flute1, setFlute1] = useState('kraft100')
  const [face2, setFace2] = useState('kraft100')
  const [flute2, setFlute2] = useState('kraft100')
  const [face3, setFace3] = useState('kraft100')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isFiveLayer = product.layers.includes('5')

  const area = useMemo(() => {
    return Math.max(0, lengthMm * widthMm) / 1000000
  }, [lengthMm, widthMm])

  const unitPrice = useMemo(() => {
    const p1 = getOption(face1).price
    const p2 = getOption(flute1).price
    const p3 = getOption(face2).price
    const result = area * (p1 + p2 * getOption(flute1).factor + p3)

    if (!isFiveLayer) {
      return Math.round(result)
    }

    const p4 = getOption(flute2).price
    const p5 = getOption(face3).price
    return Math.round(area * (p1 + p2 * getOption(flute1).factor + p3 + p4 * getOption(flute2).factor + p5))
  }, [area, face1, flute1, face2, flute2, face3, isFiveLayer])

  const totalPrice = useMemo(() => {
    return Math.round(unitPrice * quantity)
  }, [unitPrice, quantity])

  const handleAddCart = async () => {
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
      },
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
