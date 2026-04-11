export default function Home() {
  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Thông tin công ty</p>
          <h1 className="text-3xl font-semibold text-slate-900">Thông tin và đơn hàng</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Kiểm tra thông tin doanh nghiệp, tin nhắn hợp tác và lịch sử mua hàng. Dễ mở rộng cho chức năng đăng nhập và quản lý đơn sau này.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex h-20 items-center justify-center rounded-lg bg-amber-100 text-slate-900">
            <span className="text-xl font-semibold">3 Lớp</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Giấy carton 3 lớp</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Thích hợp cho các sản phẩm nhẹ tới trung bình, chi phí tối ưu và thân thiện với nhiều loại thiết kế bao bì khác nhau.
          </p>
        </article>
        <article className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex h-20 items-center justify-center rounded-lg bg-sky-100 text-slate-900">
            <span className="text-xl font-semibold">5 Lớp</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Giấy carton 5 lớp</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dành cho hàng hóa nặng hoặc cần bảo vệ cao. Độ bền tốt, chịu va đập và lý tưởng cho vận chuyển đường dài.
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-1 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Danh mục sản phẩm</h2>
          <div className="mt-4 space-y-3 text-sm">
            <a href="/store" className="block rounded-lg bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              📦 Xem tất cả sản phẩm
            </a>
            <a href="/store#3-layer" className="block rounded-lg bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              📋 Giấy 3 lớp
            </a>
            <a href="/store#5-layer" className="block rounded-lg bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              📋 Giấy 5 lớp
            </a>
          </div>
        </div>
        <article className="col-span-1 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex h-20 items-center justify-center rounded-lg bg-emerald-100 text-slate-900">
            <span className="text-xl font-semibold">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Chất lượng đảm bảo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tư vấn chất liệu linerboard, medium, kích thước dựa trên sản phẩm thực tế của bạn để tiết kiệm chi phí.
          </p>
        </article>
        <div className="col-span-1 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Truy cập nhanh</h2>
          <div className="mt-4 space-y-3 text-sm">
            <a href="/store" className="block rounded-lg bg-slate-50 p-3 text-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              🛒 Cửa hàng
            </a>
            <a href="/cart" className="block rounded-lg bg-slate-50 p-3 text-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              🛍️ Giỏ hàng
            </a>
            <a href="/account" className="block rounded-lg bg-slate-50 p-3 text-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
              👤 Tài khoản
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
