'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const orderId = resolvedParams.id
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      summary,
      date,
      created_at
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select(
      'id, line_index, po_number, product_name, quantity, unit_price, total_price, length_mm, width_mm, options, item_status'
    )
    .eq('order_id', orderId)
    .order('line_index', { ascending: true })

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,company_name,contact_name,phone')
    .eq('id', order.user_id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    ...order,
    user_profile: profile || null,
    order_items: orderItems || [],
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const orderId = resolvedParams.id
  const body = await request.json()
  const { status } = body

  if (typeof status !== 'string' || status.length === 0) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error || !updatedOrder) {
    return NextResponse.json({ error: error?.message ?? 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(updatedOrder)
}
