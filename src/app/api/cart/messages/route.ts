'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'crypto'
import type { SendMessageRequest, SendMessageResponse } from '@/types/messages'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cartItemId = request.nextUrl.searchParams.get('cart_item_id')

  if (!cartItemId) {
    return NextResponse.json({ error: 'cart_item_id is required' }, { status: 400 })
  }

  // Verify user has access to this cart item
  const { data: cartItem, error: cartError } = await supabase
    .from('cart_items')
    .select('id, user_id')
    .eq('id', cartItemId)
    .single()

  if (cartError || !cartItem) {
    return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
  }

  // Check if user is owner or admin
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (cartItem.user_id !== user.id && userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from('product_messages')
    .select('*')
    .eq('cart_item_id', cartItemId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest): Promise<NextResponse<SendMessageResponse>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body: SendMessageRequest = await request.json()

  if (!body.cart_item_id || !body.message) {
    return NextResponse.json(
      { success: false, error: 'cart_item_id and message are required' },
      { status: 400 }
    )
  }

  // Verify user has access to this cart item
  const { data: cartItem, error: cartError } = await supabase
    .from('cart_items')
    .select('id, user_id')
    .eq('id', body.cart_item_id)
    .single()

  if (cartError || !cartItem) {
    return NextResponse.json({ success: false, error: 'Cart item not found' }, { status: 404 })
  }

  // Get user role
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile) {
    return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 })
  }

  // Check permissions
  if (cartItem.user_id !== user.id && userProfile.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
  }

  // Insert message
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const { data: message, error: insertError } = await supabase
    .from('product_messages')
    .insert({
      id: messageId,
      cart_item_id: body.cart_item_id,
      sender_id: user.id,
      sender_role: userProfile.role === 'admin' ? 'admin' : 'customer',
      message: body.message,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message })
}
