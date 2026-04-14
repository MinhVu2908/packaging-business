import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Siêu Thị Giấy',
  description: 'Trang quản trị cho Siêu Thị Giấy',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-slate-900">Siêu Thị Giấy - Admin</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <a
                  href="/admin"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/design-requests"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Yêu Cầu Khách Hàng
                </a>
                <a
                  href="/admin/products"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Sản phẩm
                </a>
                <a
                  href="/admin/orders"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Đơn hàng
                </a>
                <a
                  href="/admin/users"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Người dùng
                </a>
              </div>
            </div>
            <div className="flex items-center">
              {/* <a
                href="/"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                ← Quay lại cửa hàng
              </a> */}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  )
}
