'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await params

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, status, summary, date, created_at')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 })
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(
      'id, order_id, line_index, po_number, product_id, product_name, quantity, unit_price, total_price, length_mm, width_mm, options, item_status, created_at'
    )
    .eq('order_id', orderId)
    .order('line_index', { ascending: true })

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ order, items: items || [] })
}
