'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import { isOrderItemStatus } from '@/lib/order-item-status'

export async function PATCH(
  request: NextRequest,
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

  const { itemId } = await params
  const body = await request.json()
  const item_status = body?.item_status

  if (!isOrderItemStatus(item_status)) {
    return NextResponse.json({ error: 'Invalid item_status' }, { status: 400 })
  }

  const db = await createAdminClient()

  const { data: updated, error } = await db
    .from('order_items')
    .update({ item_status })
    .eq('id', itemId)
    .select(
      'id, order_id, user_id, line_index, po_number, product_name, quantity, unit_price, total_price, length_mm, width_mm, item_status, created_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy dòng đơn.' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
