'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'
import type { ProductMessage } from '@/types/messages'

interface DesignRequestWithMessages {
  id: string
  cart_item_id: string
  user_id: string
  status: string
  admin_notes: string | null
  customer_notes: string | null
  customer_confirmed: boolean
  created_at: string
  updated_at: string
  messages: ProductMessage[]
}

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

  const designRequestId = request.nextUrl.searchParams.get('design_request_id')

  if (!designRequestId) {
    return NextResponse.json({ error: 'design_request_id is required' }, { status: 400 })
  }

  // Get the design request
  const { data: designRequest, error: designError } = await adminSupabase
    .from('design_requests')
    .select('cart_item_id')
    .eq('id', designRequestId)
    .single()

  if (designError || !designRequest) {
    return NextResponse.json({ error: 'Design request not found' }, { status: 404 })
  }

  // Get messages for the cart item
  const { data: messages, error: messagesError } = await adminSupabase
    .from('product_messages')
    .select('*')
    .eq('cart_item_id', designRequest.cart_item_id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { cart_item_id, message } = body

  if (!cart_item_id || !message) {
    return NextResponse.json({ error: 'cart_item_id and message are required' }, { status: 400 })
  }

  // Verify the cart item exists and admin has access
  const { data: cartItem, error: cartError } = await adminSupabase
    .from('cart_items')
    .select('id')
    .eq('id', cart_item_id)
    .single()

  if (cartError || !cartItem) {
    return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
  }

  // Insert message
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const { data: messageData, error: insertError } = await adminSupabase
    .from('product_messages')
    .insert({
      id: messageId,
      cart_item_id,
      sender_id: user.id,
      sender_role: 'admin',
      message,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: messageData })
}
