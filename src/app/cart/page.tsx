"use client";

import { useState } from "react";
import { cartItems } from "@/lib/mock-data";

export default function CartPage() {
  const [items, setItems] = useState(cartItems);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) return;
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Giỏ hàng</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Mặt hàng của bạn</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            {items.length} sản phẩm đang chuẩn bị mua. Dễ thay đổi giá và chi phí vận chuyển sau này.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {items.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">Giỏ hàng trống</p>
              <p className="mt-2 text-sm text-slate-600">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
              <a href="/store" className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Tiếp tục mua hàng
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.layers} · {item.linerboard} · {item.medium}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-slate-600 transition hover:text-slate-900"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-slate-600 transition hover:text-slate-900"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-24 text-right font-semibold text-slate-900">{(item.price * item.quantity).toLocaleString()}đ</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-slate-500 transition hover:text-red-600"
                  >
                    xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 rounded-lg bg-slate-50 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-600">Tổng số mục</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{items.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Tổng tạm tính</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{subtotal.toLocaleString()}đ</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-600">
              Giá dễ thay đổi trong <code className="inline rounded bg-white px-2 py-1 text-slate-600">src/lib/mock-data.ts</code>. Chi phí vận chuyển và thuế sẽ cộng thêm sau.
            </p>
            <a href="/store" className="mt-4 block rounded-lg bg-slate-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
              Tiếp tục mua hàng
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
