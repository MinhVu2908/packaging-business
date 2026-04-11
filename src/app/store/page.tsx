import { products } from "@/lib/mock-data";

export default function StorePage() {
  return (
    <section className="space-y-10">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cửa hàng bao bì</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sản phẩm đóng gói</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Xem các mẫu giấy tấm 3 lớp và 5 lớp. Nhấp vào sản phẩm để xem chi tiết linerboard, medium và thêm vào giỏ.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300">
            <div className="flex h-40 items-end justify-center bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-5">
              <div className="flex h-24 w-full items-center justify-center rounded-lg bg-white/80 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
                  <h2 className="mt-2 text-base font-semibold text-slate-900">{product.name}</h2>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs leading-5 text-slate-700">{product.description}</p>
              <dl className="mt-4 grid gap-2 text-xs text-slate-600">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt>Lớp</dt>
                  <dd>{product.layers}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt>Linerboard</dt>
                  <dd>{product.linerboard}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <dt>Medium</dt>
                  <dd>{product.medium}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{product.price.toLocaleString()}đ</span>
                <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
