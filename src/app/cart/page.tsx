"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  length_mm: number;
  width_mm: number;
  unit_price: number;
  total_price: number;
  options: Record<string, string | null>;
  products: {
    name: string;
    category: string;
    layers: string;
    description: string;
  };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUserEmail(session.user.email ?? null);

      const res = await fetch('/api/cart');
      if (!res.ok) {
        setError('Không thể tải giỏ hàng.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setItems(data);
      setLoading(false);
    }

    load();
  }, []);

  const subtotal = items.reduce((total, item) => total + item.total_price, 0);

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty <= 0) return;
    const res = await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: newQty }),
    });

    if (!res.ok) return;
    const updated = await res.json();
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: updated.quantity, total_price: updated.total_price } : item)));
  };

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/cart?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setItems(items.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">Đang tải giỏ hàng...</p>
        </div>
      </section>
    )
  }

  if (!userEmail) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-lg font-semibold text-slate-900">Bạn cần đăng nhập để xem giỏ hàng</p>
          <p className="mt-3 text-sm text-slate-600">Vui lòng đăng nhập để lưu và đồng bộ giỏ hàng của bạn.</p>
          <a
            href="/auth"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Đăng nhập
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Giỏ hàng</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Mặt hàng của bạn</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            {items.length} sản phẩm trong giỏ hàng. Đây là số liệu hóa đơn tạm tính và trạng thái thanh toán.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {items.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-12">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Giỏ hàng trống</p>
                <p className="mt-2 text-sm text-slate-600">Thêm sản phẩm từ cửa hàng để bắt đầu.</p>
                <a href="/store" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Mua ngay
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.products.name}</p>
                      <p className="mt-1 text-sm text-slate-600">Loại: {item.products.layers} · Kích thước: {item.length_mm} x {item.width_mm} mm</p>
                      <p className="mt-2 text-sm text-slate-600">Chi tiết: {Object.entries(item.options).map(([key, value]) => value ? `${key}: ${value}` : null).filter(Boolean).join(', ')}</p>
                    </div>
                    <div className="flex flex-col gap-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm text-slate-600">Đơn giá: {item.unit_price.toLocaleString()}đ</p>
                      <p className="text-base font-semibold text-slate-900">Tổng: {item.total_price.toLocaleString()}đ</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-600 transition hover:text-red-900"
                      >
                        Xóa sản phẩm
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hóa đơn</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-4 text-base font-semibold text-slate-900 flex items-center justify-between">
                <span>Tổng</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Phương thức thanh toán</p>
              <ul className="mt-3 space-y-2">
                <li>• Chuyển khoản ngân hàng</li>
                <li>• Thanh toán khi nhận hàng (COD)</li>
                <li>• Thẻ tín dụng / ATM</li>
              </ul>
            </div>

            <button
              disabled={items.length === 0}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
