'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildPoNumber, companyPrefixLetters, randomPurchaseBatch } from '@/lib/receipt-po'

function productNameFromRow(products: unknown, fallback: string): string {
  if (products && typeof products === 'object' && !Array.isArray(products) && 'name' in products) {
    return String((products as { name: string }).name)
  }
  return fallback
}

async function createSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
        },
        setAll() {
          return undefined
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const cart_item_ids = body?.cart_item_ids

  if (!Array.isArray(cart_item_ids) || cart_item_ids.length === 0) {
    return NextResponse.json({ error: 'cart_item_ids is required' }, { status: 400 })
  }

  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select(
      'id, quantity, total_price, unit_price, length_mm, width_mm, options, product_id, products(name)'
    )
    .in('id', cart_item_ids)
    .eq('user_id', user.id)

  if (cartError || !cartItems || cartItems.length !== cart_item_ids.length) {
    return NextResponse.json({ error: 'Selected cart items not found' }, { status: 404 })
  }

  const { data: designRequests, error: designError } = await supabase
    .from('design_requests')
    .select('cart_item_id, status')
    .in('cart_item_id', cart_item_ids)

  if (designError) {
    return NextResponse.json({ error: designError.message }, { status: 500 })
  }

  const confirmedIds = (designRequests || [])
    .filter((request) => request.status === 'confirmed')
    .map((request) => request.cart_item_id)
  const missingConfirmed = cart_item_ids.filter((id: string) => !confirmedIds.includes(id))

  if (missingConfirmed.length > 0) {
    return NextResponse.json({ error: 'Only confirmed items can be purchased' }, { status: 400 })
  }

  const summary = cartItems
    .map((item) => `${productNameFromRow(item.products, item.product_id)} x${item.quantity}`)
    .join(', ')

  const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const purchaseDate = new Date()
  const orderDate = purchaseDate.toISOString().split('T')[0]

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: user.id,
      status: 'pending',
      summary,
      date: orderDate,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_name')
    .eq('id', user.id)
    .maybeSingle()

  const companyName = profile?.company_name?.trim() || user.email?.split('@')[0] || 'CONG TY'
  const prefix = companyPrefixLetters(companyName)
  const batch = randomPurchaseBatch()

  const sorted = [...cartItems].sort((a, b) => a.id.localeCompare(b.id))
  const insertedItems: Array<Record<string, unknown>> = []

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]
    const lineIndex = i + 1
    const poNumber = buildPoNumber(prefix, batch, purchaseDate, lineIndex)
    const itemId = `oi-${orderId}-${lineIndex}`
    const productName = productNameFromRow(item.products, item.product_id)

    const { data: inserted, error: insertErr } = await supabase
      .from('order_items')
      .insert({
        id: itemId,
        order_id: orderId,
        user_id: user.id,
        line_index: lineIndex,
        po_number: poNumber,
        product_id: item.product_id,
        product_name: productName,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        length_mm: item.length_mm,
        width_mm: item.width_mm,
        options: item.options,
        item_status: 'pending',
      })
      .select()
      .single()

    if (insertErr) {
      await supabase.from('order_items').delete().eq('order_id', orderId)
      await supabase.from('orders').delete().eq('id', orderId)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    if (inserted) insertedItems.push(inserted)
  }

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .in('id', cart_item_ids)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, order: orderData, order_items: insertedItems })
}
