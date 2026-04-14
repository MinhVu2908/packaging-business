import { createClient } from "@/lib/supabase-server";
import { ensureUserProfile } from '@/lib/user-profiles'
import { redirect } from "next/navigation";
import Link from 'next/link'
import ProfileForm from './ProfileForm'
import {
  ORDER_ITEM_STATUSES,
  ORDER_ITEM_STATUS_LABEL_VI,
  countOrderItemsByStatus,
  itemStatusBadgeClass,
} from '@/lib/order-item-status'

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  await ensureUserProfile(supabase, user);

  if (!user) {
    redirect('/auth');
  }

  const [ordersRes, messagesRes, profile] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  const orders = ordersRes.data || []
  const messages = messagesRes.data || []

  const orderIds = orders.map((o) => o.id)
  const itemsByOrderId: Record<string, { item_status: string | null }[]> = {}
  if (orderIds.length > 0) {
    const { data: lineRows } = await supabase
      .from('order_items')
      .select('order_id, item_status')
      .eq('user_id', user.id)
      .in('order_id', orderIds)
    for (const row of lineRows || []) {
      if (!row.order_id) continue
      itemsByOrderId[row.order_id] = [...(itemsByOrderId[row.order_id] || []), row]
    }
  }

  const companyInfo = profile.error || !profile.data ? {
    company: 'Siêu Thị Giấy',
    contactName: user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phone: '',
  } : {
    company: profile.data.company_name || 'Siêu Thị Giấy',
    contactName: profile.data.contact_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phone: profile.data.phone || '',
  }

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tài khoản khách hàng</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Thông tin và đơn hàng</h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Kiểm tra thông tin doanh nghiệp, tin nhắn hợp tác và lịch sử mua hàng. Dễ mở rộng cho chức năng đăng nhập và quản lý đơn sau này.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Thông tin công ty</h2>
            <p className="mt-4 text-xs text-slate-700">
              <span className="font-semibold">Tên công ty:</span> {companyInfo.company}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Người liên hệ:</span> {companyInfo.contactName}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Email:</span> {companyInfo.email}
            </p>
            <p className="mt-2 text-xs text-slate-700">
              <span className="font-semibold">Điện thoại:</span> {companyInfo.phone}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Tin nhắn mới</h2>
            <div className="mt-4 space-y-3">
              {messages.map((message) => (
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

      <ProfileForm initialProfile={companyInfo} />

      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Đơn hàng trước đây</h2>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600">
          Trạng thái giao hàng theo từng dòng (mỗi dòng là một PO):{' '}
          <span className="font-medium text-slate-800">Chờ xử lý</span> — chưa gửi;{' '}
          <span className="font-medium text-slate-800">Đang giao</span> — đang vận chuyển;{' '}
          <span className="font-medium text-slate-800">Đã giao</span> — hoàn tất;{' '}
          <span className="font-medium text-slate-800">Đã hủy</span> — dòng đã hủy.
        </p>
        <div className="mt-6 space-y-3">
          {orders.map((order) => {
            const lineCounts = countOrderItemsByStatus(itemsByOrderId[order.id] || [])
            const hasLines = ORDER_ITEM_STATUSES.some((s) => lineCounts[s] > 0)
            return (
            <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{order.summary}</p>
                <p className="mt-1 text-xs text-slate-600">Mã đơn: {order.id}</p>
                <p className="mt-2 text-xs font-medium text-slate-700">Trạng thái giao từng dòng</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hasLines ? (
                    ORDER_ITEM_STATUSES.map((s) =>
                      lineCounts[s] > 0 ? (
                        <span
                          key={s}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${itemStatusBadgeClass(s)}`}
                        >
                          {ORDER_ITEM_STATUS_LABEL_VI[s]} ({lineCounts[s]})
                        </span>
                      ) : null
                    )
                  ) : (
                    <span className="text-xs text-slate-500">Chưa có dòng chi tiết.</span>
                  )}
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-3 text-xs text-slate-600 sm:flex-col sm:items-end">
                <span>{order.date}</span>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Chi tiết & hóa đơn
                </Link>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
