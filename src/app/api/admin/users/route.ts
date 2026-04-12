'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

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

  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }, { data: cartItems, error: cartItemsError }, { data: designRequests, error: designRequestsError }] = await Promise.all([
    adminSupabase
      .from('user_profiles')
      .select(`
        id,
        company_name,
        contact_name,
        phone,
        role,
        created_at,
        updated_at
      `)
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
  ])

  if (profilesError || ordersError || cartItemsError || designRequestsError) {
    const error = profilesError || ordersError || cartItemsError || designRequestsError
    return NextResponse.json({ error: error?.message ?? 'Failed to load users' }, { status: 500 })
  }

  const ordersByUser = (orders || []).reduce<Record<string, any[]>>((acc, order) => {
    if (!order.user_id) return acc
    acc[order.user_id] = [...(acc[order.user_id] || []), order]
    return acc
  }, {})

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

  const usersWithActivity = [
    ...(profiles || []).map((profile) => ({
      ...profile,
      orders: ordersByUser[profile.id] || [],
      cart_items: cartItemsByUser[profile.id] || [],
      design_requests: designRequestsByUser[profile.id] || [],
    })),
    ...fallbackUsers.map((user) => ({
      ...user,
      orders: ordersByUser[user.id] || [],
      cart_items: cartItemsByUser[user.id] || [],
      design_requests: designRequestsByUser[user.id] || [],
    })),
  ]

  return NextResponse.json(usersWithActivity)
}
