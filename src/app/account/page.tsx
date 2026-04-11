import { accountInfo } from "@/lib/mock-data";

export default function AccountPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tài khoản khách hàng</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Thông tin và đơn hàng</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Kiểm tra thông tin doanh nghiệp, tin nhắn hợp tác và lịch sử mua hàng. Dễ mở rộng cho chức năng đăng nhập và quản lý đơn sau này.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin công ty</h2>
            <p className="mt-4 text-xs text-slate-700">
              <span className="font-semibold">Tên công ty:</span> {accountInfo.company}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Người liên hệ:</span> {accountInfo.contactName}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Email:</span> {accountInfo.email}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Điện thoại:</span> {accountInfo.phone}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Tin nhắn mới</h2>
            <div className="mt-4 space-y-3">
              {accountInfo.messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">{message.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{message.date}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{message.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Đơn hàng trước đây</h2>
        <div className="mt-6 space-y-3">
          {accountInfo.orders.map((order) => (
            <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.summary}</p>
                <p className="mt-1 text-xs text-slate-600">Mã đơn: {order.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">{order.status}</span>
                <span>{order.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
