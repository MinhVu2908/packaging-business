import { getProduct } from '@/lib/mock-data'
import ProductDetail from '@/components/ProductDetail'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <section className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-semibold text-slate-900">Sản phẩm không tồn tại</h1>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chi tiết sản phẩm</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Chọn kích thước, chất lượng giấy và số lượng để tính giá tự động.
          </p>
        </div>
      </div>
      <ProductDetail product={product} />
    </section>
  )
}
