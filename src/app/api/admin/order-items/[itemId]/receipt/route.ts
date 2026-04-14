'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import { buildSingleLineReceiptPdf } from '@/lib/receipt-pdf'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await requireAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Service role (when configured) bypasses RLS so PDF generation matches other admin APIs.
  const db = await createAdminClient()

  const { itemId } = await params

  const { data: row, error } = await db
    .from('order_items')
    .select(
      'id, order_id, user_id, line_index, po_number, product_name, quantity, unit_price, total_price, length_mm, width_mm'
    )
    .eq('id', itemId)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ error: 'Không tìm thấy dòng đơn.' }, { status: 404 })
  }

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, date, user_id')
    .eq('id', row.order_id)
    .maybeSingle()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 })
  }

  const { data: profile } = await db
    .from('user_profiles')
    .select('company_name, contact_name, phone')
    .eq('id', order.user_id)
    .maybeSingle()

  const company =
    profile?.company_name?.trim() ||
    profile?.contact_name?.trim() ||
    'Khách hàng'
  const extra = [
    profile?.phone && `Điện thoại: ${profile.phone}`,
    `Mã khách (UUID): ${order.user_id}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const orderDate = new Date(order.date)

  const sizeNote =
    row.length_mm != null && row.width_mm != null
      ? `Kích thước: ${row.length_mm} × ${row.width_mm} mm`
      : undefined

  const pdf = await buildSingleLineReceiptPdf({
    vendorName: 'Siêu Thị Giấy',
    customerCompany: company,
    customerExtra: [extra, sizeNote].filter(Boolean).join(' · '),
    orderId: order.id,
    orderDate,
    line: {
      stt: row.line_index,
      poNumber: row.po_number,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      lineTotal: row.total_price,
      productName: row.product_name,
    },
  })

  const filename = `hoa-don-${row.po_number}.pdf`
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
