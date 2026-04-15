'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import { countOrderItemsByStatus } from '@/lib/order-item-status'

function deriveEffectiveStatus(items: { item_status: string | null }[], fallbackStatus: string): string {
  if (items.length === 0) return fallbackStatus || 'pending'
  const statuses = items.map((item) => item.item_status || 'pending')
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled'
  if (statuses.every((s) => s === 'delivered')) return 'delivered'
  if (statuses.some((s) => s === 'on_delivery')) return 'on_delivery'
  if (statuses.some((s) => s === 'pending')) return 'pending'
  return fallbackStatus || 'pending'
}

/** Per-customer order activity for /admin/orders (the former “users + orders” overview). */
export async function GET(request: NextRequest) {
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

  const [
    { data: profiles, error: profilesError },
    { data: orders, error: ordersError },
    { data: cartItems, error: cartItemsError },
    { data: designRequests, error: designRequestsError },
    { data: orderItems, error: orderItemsError },
  ] = await Promise.all([
    adminSupabase
      .from('user_profiles')
      .select(
        `
        id,
        company_name,
        contact_name,
        phone,
        role,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('orders')
      .select('id,user_id,status,summary,date')
      .order('date', { ascending: false }),
    adminSupabase
      .from('cart_items')
      .select('id,user_id,quantity,total_price,products(name)')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('design_requests')
      .select('id,cart_item_id,user_id,status,admin_notes,customer_notes,customer_confirmed,created_at,updated_at')
      .order('created_at', { ascending: false }),
    adminSupabase.from('order_items').select('order_id,user_id,item_status'),
  ])

  if (profilesError || ordersError || cartItemsError || designRequestsError || orderItemsError) {
    const error =
      profilesError || ordersError || cartItemsError || designRequestsError || orderItemsError
    return NextResponse.json({ error: error?.message ?? 'Failed to load customers' }, { status: 500 })
  }

  const ordersByUser = (orders || []).reduce<Record<string, any[]>>((acc, order) => {
    if (!order.user_id) return acc
    acc[order.user_id] = [...(acc[order.user_id] || []), order]
    return acc
  }, {})

  const orderItemsByOrder = (orderItems || []).reduce<Record<string, { item_status: string | null }[]>>(
    (acc, row) => {
      if (!row.order_id) return acc
      acc[row.order_id] = [...(acc[row.order_id] || []), row]
      return acc
    },
    {}
  )

  const normalizedOrdersByUser = Object.entries(ordersByUser).reduce<Record<string, any[]>>(
    (acc, [userId, userOrders]) => {
      acc[userId] = userOrders.map((order) => {
        const effectiveStatus = deriveEffectiveStatus(orderItemsByOrder[order.id] || [], order.status)
        return {
          ...order,
          status: effectiveStatus,
          raw_status: order.status,
          effective_status: effectiveStatus,
        }
      })
      return acc
    },
    {}
  )

  const orderItemsByUser = (orderItems || []).reduce<Record<string, { item_status: string | null }[]>>(
    (acc, row) => {
      if (!row.user_id) return acc
      acc[row.user_id] = [...(acc[row.user_id] || []), row]
      return acc
    },
    {}
  )

  const cartItemsByUser = (cartItems || []).reduce<Record<string, any[]>>((acc, item) => {
    if (!item.user_id) return acc
    acc[item.user_id] = [...(acc[item.user_id] || []), item]
    return acc
  }, {})

  const designRequestsByUser = (designRequests || []).reduce<Record<string, any[]>>((acc, request) => {
    if (!request.user_id) return acc
    acc[request.user_id] = [...(acc[request.user_id] || []), request]
    return acc
  }, {})

  const profileById = (profiles || []).reduce<Record<string, any>>((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const activityUserIds = new Set<string>()
  ;[...(orders || []), ...(cartItems || []), ...(designRequests || [])].forEach((record) => {
    if (record.user_id) {
      activityUserIds.add(record.user_id)
    }
  })

  const missingUserIds = Array.from(activityUserIds).filter((id) => !profileById[id])
  let emailById: Record<string, string> = {}

  if (missingUserIds.length > 0) {
    const { data: authUsers, error: authError } = await adminSupabase
      .from('auth.users')
      .select('id,email')
      .in('id', missingUserIds)

    if (!authError && authUsers) {
      emailById = authUsers.reduce<Record<string, string>>((acc, authUser) => {
        if (authUser.id && authUser.email) {
          acc[authUser.id] = authUser.email
        }
        return acc
      }, {})
    }
  }

  const fallbackUsers = missingUserIds.map((id) => ({
    id,
    company_name: null,
    contact_name: null,
    phone: null,
    role: 'customer',
    email: emailById[id] || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const customers = [
    ...(profiles || []).map((profile) => ({
      ...profile,
      orders: normalizedOrdersByUser[profile.id] || [],
      cart_items: cartItemsByUser[profile.id] || [],
      design_requests: designRequestsByUser[profile.id] || [],
      itemLineCounts: countOrderItemsByStatus(orderItemsByUser[profile.id] || []),
    })),
    ...fallbackUsers.map((u) => ({
      ...u,
      orders: normalizedOrdersByUser[u.id] || [],
      cart_items: cartItemsByUser[u.id] || [],
      design_requests: designRequestsByUser[u.id] || [],
      itemLineCounts: countOrderItemsByStatus(orderItemsByUser[u.id] || []),
    })),
  ]

  return NextResponse.json(customers)
}
