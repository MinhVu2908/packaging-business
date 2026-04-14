"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CartItemDetail from "@/components/CartItemDetail";

type DesignFile = {
  id: string;
  type: string;
  file_url: string;
  filename: string;
  mime_type: string | null;
  size: number | null;
  uploaded_by: string;
  uploaded_at: string;
};

type DesignRequest = {
  id: string;
  status: string;
  admin_notes: string | null;
  customer_notes: string | null;
  customer_confirmed: boolean;
  files: DesignFile[];
};

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
  design_request?: DesignRequest | null;
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedDesignFiles, setSelectedDesignFiles] = useState<Record<string, File[]>>({});
  const [designNotes, setDesignNotes] = useState<Record<string, string>>({});
  const [uploadingDesignId, setUploadingDesignId] = useState<string | null>(null);
  const [confirmingDesignId, setConfirmingDesignId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const loadCart = async () => {
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
    setSelectedItemIds([]);
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
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
    setSelectedItemIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const handleFileChange = (id: string, files: FileList | null) => {
    setSelectedDesignFiles((prev) => ({
      ...prev,
      [id]: files ? Array.from(files) : [],
    }));
  };

  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const selectedTotal = selectedItems.reduce((total, item) => total + item.total_price, 0);
  const selectedAllConfirmed = selectedItems.length > 0 && selectedItems.every((item) => item.design_request?.status === 'confirmed');

  const toggleSelectItem = (itemId: string, available: boolean) => {
    if (!available) return;
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handlePurchaseSelected = async () => {
    if (!selectedAllConfirmed || selectedItemIds.length === 0) return;

    setError('');
    const res = await fetch('/api/cart/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_item_ids: selectedItemIds }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error ?? 'Không thể tạo đơn hàng.');
      return;
    }

    const data = await res.json();
    const orderId = data?.order?.id as string | undefined;
    await loadCart();
    if (orderId) {
      router.push(`/account/orders/${orderId}`);
    }
  };

  const handleUploadDesign = async (cartItemId: string) => {
    const files = selectedDesignFiles[cartItemId];
    if (!files?.length) return;

    setUploadingDesignId(cartItemId);
    setError('');

    const formData = new FormData();
    formData.append('cart_item_id', cartItemId);
    formData.append('customer_notes', designNotes[cartItemId] ?? '');
    files.forEach((file) => formData.append('files', file));

    const res = await fetch('/api/cart/design', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error ?? 'Không thể gửi thiết kế. Xin thử lại.');
      setUploadingDesignId(null);
      return;
    }

    setSelectedDesignFiles((prev) => ({ ...prev, [cartItemId]: [] }));
    await loadCart();
    setUploadingDesignId(null);
  };

  const handleConfirmDesign = async (cartItemId: string, confirmed: boolean) => {
    setConfirmingDesignId(cartItemId);
    setError('');

    const res = await fetch('/api/cart/design', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_item_id: cartItemId, confirmed }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error ?? 'Không thể cập nhật trạng thái thiết kế.');
      setConfirmingDesignId(null);
      return;
    }

    await loadCart();
    setConfirmingDesignId(null);
  };

  const designStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đã gửi thiết kế, chờ kiểm tra';
      case 'review_ready':
        return 'Thiết kế đã được gửi lại cho bạn';
      case 'confirmed':
        return 'Thiết kế đã được xác nhận';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">Đang tải giỏ hàng...</p>
        </div>
      </section>
    );
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
    );
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
              {items.map((item) => {
                const customerFiles = item.design_request?.files.filter((file) => file.type === 'customer_upload') || [];
                const adminFiles = item.design_request?.files.filter((file) => file.type === 'admin_response') || [];
                const isConfirmed = item.design_request?.status === 'confirmed';
                const isSelected = selectedItemIds.includes(item.id);

                return (
                  <div key={item.id} className="rounded-3xl border border-slate-200 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!isConfirmed}
                              onChange={() => toggleSelectItem(item.id, isConfirmed)}
                              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                            />
                            Chọn mua
                          </label>
                          {!isConfirmed && (
                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                              Chỉ mua khi đã xác nhận
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900">{item.products.name}</p>
                          <p className="mt-1 text-sm text-slate-600">Loại: {item.products.layers} · Kích thước: {item.length_mm} x {item.width_mm} mm</p>
                          <p className="mt-2 text-sm text-slate-600">Chi tiết: {Object.entries(item.options).map(([key, value]) => value ? `${key}: ${value}` : null).filter(Boolean).join(', ')}</p>
                        </div>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-sm text-slate-900 underline hover:text-slate-600"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-sm text-red-600 transition hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      {item.design_request ? (
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-slate-900">Trạng thái thiết kế: {designStatusLabel(item.design_request.status)}</p>
                          {item.design_request.customer_notes && (
                            <p className="text-sm text-slate-600">Ghi chú của bạn: {item.design_request.customer_notes}</p>
                          )}
                          {customerFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Tệp đã gửi</p>
                              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                {customerFiles.map((file) => (
                                  <li key={file.id}>
                                    <a href={file.file_url} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                                      {file.filename}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {adminFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Tệp phản hồi từ admin</p>
                              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                {adminFiles.map((file) => (
                                  <li key={file.id}>
                                    <a href={file.file_url} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                                      {file.filename}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.design_request.status === 'review_ready' && !item.design_request.customer_confirmed && (
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-sm text-slate-600">Kiểm tra lại thiết kế được admin gửi và xác nhận nếu đúng.</p>
                              <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                  onClick={() => handleConfirmDesign(item.id, true)}
                                  disabled={confirmingDesignId === item.id}
                                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                  {confirmingDesignId === item.id ? 'Đang xác nhận...' : 'Xác nhận thiết kế'}
                                </button>
                                <button
                                  onClick={() => handleConfirmDesign(item.id, false)}
                                  disabled={confirmingDesignId === item.id}
                                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
                                >
                                  Yêu cầu chỉnh sửa
                                </button>
                              </div>
                            </div>
                          )}
                          {item.design_request.status === 'confirmed' && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                              Thiết kế đã được xác nhận. Bạn có thể tiếp tục thanh toán.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-slate-900">Gửi thiết kế của bạn cho admin</p>
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">Chọn tệp thiết kế</label>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.stl,.obj,.fbx,.glb,.gltf,.zip"
                              onChange={(e) => handleFileChange(item.id, e.target.files)}
                              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Ghi chú thiết kế</label>
                            <textarea
                              value={designNotes[item.id] ?? ''}
                              onChange={(e) => setDesignNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              rows={3}
                              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                              placeholder="Mô tả thiết kế hoặc yêu cầu đặc biệt"
                            />
                          </div>
                          <button
                            onClick={() => handleUploadDesign(item.id)}
                            disabled={uploadingDesignId === item.id || !(selectedDesignFiles[item.id]?.length)}
                            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {uploadingDesignId === item.id ? 'Đang gửi...' : 'Gửi thiết kế'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              <p className="font-semibold text-slate-900">Mua sản phẩm đã chọn</p>
              <p className="mt-2">Số mục đã chọn: {selectedItems.length}</p>
              <p className="mt-1">Tổng chọn: {selectedTotal.toLocaleString()}đ</p>
              <p className="mt-2 text-xs text-slate-500">
                Chỉ những sản phẩm có thiết kế đã xác nhận mới có thể mua.
              </p>
            </div>

            <button
              onClick={handlePurchaseSelected}
              disabled={!selectedAllConfirmed || selectedItems.length === 0}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedItems.length === 0
                ? 'Chọn sản phẩm để mua'
                : selectedAllConfirmed
                ? 'Mua sản phẩm đã chọn'
                : 'Có sản phẩm chưa xác nhận'}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Item Detail Modal */}
      {selectedItem && (
        <CartItemDetail
          item={selectedItem}
          onUpdate={(updatedItem) => {
            setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item))
            setSelectedItem(updatedItem)
          }}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </section>
  );
}
