'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import { orderSortKeyFromItemStatuses } from '@/lib/order-item-status'

export async function GET(request: NextRequest) {
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

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      summary,
      date,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!orders?.length) {
    return NextResponse.json([])
  }

  const orderIds = orders.map((o) => o.id)
  const userIds = Array.from(new Set(orders.map((order) => order.user_id)))

  const [{ data: profiles, error: profileError }, { data: allItems, error: itemsError }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('user_profiles').select('id,company_name,contact_name,phone').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string | null; contact_name: string | null; phone: string | null }[], error: null }),
    orderIds.length > 0
      ? supabase.from('order_items').select('order_id, item_status').in('order_id', orderIds)
      : Promise.resolve({ data: [] as { order_id: string; item_status: string }[], error: null }),
  ])

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const itemsByOrder = (allItems || []).reduce<Record<string, { item_status: string }[]>>((acc, row) => {
    acc[row.order_id] = [...(acc[row.order_id] || []), row]
    return acc
  }, {})

  const profileMap = (profiles || []).reduce<Record<string, any>>((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const ordersWithProfiles = orders
    .map((order) => ({
      ...order,
      user_profile: profileMap[order.user_id] || null,
      _sortKey: orderSortKeyFromItemStatuses(itemsByOrder[order.id] || []),
    }))
    .sort((a, b) => {
      if (a._sortKey !== b._sortKey) return a._sortKey - b._sortKey
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .map(({ _sortKey: _s, ...order }) => order)

  return NextResponse.json(ordersWithProfiles)
}
