'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import {
  countOrderItemsByStatus,
  orderSortKeyFromItemStatuses,
  sortOrderItemsByStatus,
} from '@/lib/order-item-status'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
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

  const { userId } = await params

  // Use the same DB client as GET /api/admin/users (service role when configured) so
  // results match the list view and are not hidden by RLS edge cases.
  const db = adminSupabase

  const { data: profile, error: profileError } = await db
    .from('user_profiles')
    .select('id, company_name, contact_name, phone, role, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  let email: string | undefined
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: authData } = await adminSupabase.auth.admin.getUserById(userId)
    if (authData.user?.email) email = authData.user.email
  }

  const { data: ordersByUserId, error: ordersError } = await db
    .from('orders')
    .select('id, user_id, status, summary, date, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  const { data: itemsRaw, error: itemsError } = await db
    .from('order_items')
    .select(
      'id, order_id, line_index, po_number, product_name, quantity, unit_price, total_price, length_mm, width_mm, item_status, created_at'
    )
    .eq('user_id', userId)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const orderIdsFromItems = new Set((itemsRaw || []).map((row) => row.order_id).filter(Boolean))
  const orderIdsLoaded = new Set((ordersByUserId || []).map((o) => o.id))
  const missingOrderIds = [...orderIdsFromItems].filter((id) => !orderIdsLoaded.has(id))

  let ordersRaw = [...(ordersByUserId || [])]
  if (missingOrderIds.length > 0) {
    const { data: extraOrders, error: extraErr } = await db
      .from('orders')
      .select('id, user_id, status, summary, date, created_at')
      .in('id', missingOrderIds)

    if (extraErr) {
      return NextResponse.json({ error: extraErr.message }, { status: 500 })
    }
    ordersRaw = [...ordersRaw, ...(extraOrders || [])]
  }

  const uniqueByOrderId = new Map(ordersRaw.map((o) => [o.id, o]))
  ordersRaw = [...uniqueByOrderId.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const itemsByOrder = (itemsRaw || []).reduce<Record<string, NonNullable<typeof itemsRaw>>>(
    (acc, row) => {
    if (!row.order_id) return acc
    acc[row.order_id] = [...(acc[row.order_id] || []), row]
    return acc
  }, {})

  const orders = (ordersRaw || []).map((order) => {
    const items = sortOrderItemsByStatus(itemsByOrder[order.id] || [])
    return { ...order, order_items: items }
  })

  orders.sort((a, b) => {
    const ka = orderSortKeyFromItemStatuses(a.order_items)
    const kb = orderSortKeyFromItemStatuses(b.order_items)
    if (ka !== kb) return ka - kb
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const itemLineCounts = countOrderItemsByStatus(itemsRaw || [])

  return NextResponse.json({
    profile: profile
      ? { ...profile, email: email ?? undefined }
      : {
          id: userId,
          company_name: null,
          contact_name: null,
          phone: null,
          role: 'customer',
          created_at: null,
          updated_at: null,
          email,
        },
    orders,
    itemLineCounts,
  })
}
