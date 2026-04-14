'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ensureUserProfile } from '@/lib/user-profiles'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureUserProfile(supabase, user)

  const formData = await request.formData()
  const cart_item_id = formData.get('cart_item_id')?.toString()
  const customer_notes = formData.get('customer_notes')?.toString() || null
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File)

  if (!cart_item_id) {
    return NextResponse.json({ error: 'Missing cart_item_id' }, { status: 400 })
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'Please upload at least one design file.' }, { status: 400 })
  }

  const { data: cartItem, error: cartError } = await supabase
    .from('cart_items')
    .select('id')
    .eq('id', cart_item_id)
    .eq('user_id', user.id)
    .single()

  if (cartError || !cartItem) {
    return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from('design_requests')
    .select('id, status, customer_confirmed')
    .eq('cart_item_id', cart_item_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingRequest?.customer_confirmed) {
    return NextResponse.json({ error: 'Design already confirmed. Create a new cart item to upload another design.' }, { status: 400 })
  }

  const designRequestId = existingRequest?.id ?? `design-${Date.now()}`

  if (!existingRequest) {
    const { error: insertError } = await supabase.from('design_requests').insert({
      id: designRequestId,
      cart_item_id,
      user_id: user.id,
      status: 'pending',
      customer_notes,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  } else {
    const { error: updateError } = await supabase
      .from('design_requests')
      .update({ status: 'pending', customer_notes, updated_at: new Date().toISOString() })
      .eq('id', designRequestId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  for (const file of files) {
    const safeFilename = sanitizeFilename(file.name)
    const storagePath = `${user.id}/${cart_item_id}/customer/${safeFilename}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(storagePath, fileBuffer, { upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error: fileInsertError } = await supabase.from('design_files').insert({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      design_request_id: designRequestId,
      type: 'customer_upload',
      file_url: storagePath,
      filename: safeFilename,
      mime_type: file.type || null,
      size: file.size,
      uploaded_by: 'user',
    })

    if (fileInsertError) {
      return NextResponse.json({ error: fileInsertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureUserProfile(supabase, user)

  const body = await request.json()
  const cart_item_id = body.cart_item_id?.toString()
  const confirmed = Boolean(body.confirmed)

  if (!cart_item_id) {
    return NextResponse.json({ error: 'Missing cart_item_id' }, { status: 400 })
  }

  const { data: designRequest, error: findError } = await supabase
    .from('design_requests')
    .select('*')
    .eq('cart_item_id', cart_item_id)
    .eq('user_id', user.id)
    .single()

  if (findError || !designRequest) {
    return NextResponse.json({ error: 'Design request not found' }, { status: 404 })
  }

  const updatedStatus = confirmed ? 'confirmed' : 'pending'
  const { data: updatedRequest, error: updateError } = await supabase
    .from('design_requests')
    .update({ status: updatedStatus, customer_confirmed: confirmed, updated_at: new Date().toISOString() })
    .eq('id', designRequest.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedRequest)
}
