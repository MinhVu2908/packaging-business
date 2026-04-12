'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
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

  const { data: designRequests, error: requestsError } = await adminSupabase
    .from('design_requests')
    .select(
      'id,cart_item_id,user_id,status,admin_notes,customer_notes,customer_confirmed,created_at,updated_at'
    )
    .order('created_at', { ascending: false })

  if (requestsError) {
    return NextResponse.json({ error: requestsError.message }, { status: 500 })
  }

  const cartItemIds = Array.from(new Set((designRequests || []).map((request) => request.cart_item_id)))
  const requestIds = Array.from(new Set((designRequests || []).map((request) => request.id)))
  const userIds = Array.from(new Set((designRequests || []).map((request) => request.user_id)))

  const { data: cartItems, error: cartItemsError } = await adminSupabase
    .from('cart_items')
    .select('id,product_id,quantity,length_mm,width_mm,unit_price,total_price,options,products(name,category,layers)')
    .in('id', cartItemIds)

  if (cartItemsError) {
    return NextResponse.json({ error: cartItemsError.message }, { status: 500 })
  }

  const { data: designFilesData, error: filesError } = await adminSupabase
    .from('design_files')
    .select('id,design_request_id,type,file_url,filename,mime_type,size,uploaded_by,uploaded_at')
    .in('design_request_id', requestIds)

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 })
  }

  const { data: profiles, error: profilesError } = await adminSupabase
    .from('user_profiles')
    .select('id,company_name,contact_name,phone')
    .in('id', userIds)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const cartItemsMap = (cartItems || []).reduce<Record<string, any>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})

  const filesByRequest = (designFilesData || []).reduce<Record<string, any[]>>((acc, file) => {
    const list = acc[file.design_request_id] || []
    acc[file.design_request_id] = [...list, file]
    return acc
  }, {})

  const profileMap = (profiles || []).reduce<Record<string, any>>((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const filesWithUrls = await Promise.all(
    (designFilesData || []).map(async (file) => {
      const { data: urlData } = await supabase.storage
        .from('designs')
        .createSignedUrl(file.file_url, 60 * 60)

      return {
        ...file,
        file_url: urlData?.signedUrl ?? file.file_url,
      }
    })
  )

  const filesWithUrlsByRequest = filesWithUrls.reduce<Record<string, any[]>>((acc, file) => {
    const list = acc[file.design_request_id] || []
    acc[file.design_request_id] = [...list, file]
    return acc
  }, {})

  const requestsWithDetails = (designRequests || []).map((request) => ({
    ...request,
    cart_items: cartItemsMap[request.cart_item_id] || null,
    design_files: filesWithUrlsByRequest[request.id] || [],
    user_profile: profileMap[request.user_id] || null,
  }))

  return NextResponse.json(requestsWithDetails)
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

  const formData = await request.formData()
  const designRequestId = formData.get('design_request_id')?.toString()
  const adminNotes = formData.get('admin_notes')?.toString() || null
  const status = formData.get('status')?.toString() || 'review_ready'
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File)

  if (!designRequestId) {
    return NextResponse.json({ error: 'Missing design_request_id' }, { status: 400 })
  }

  // Verify the design request exists and get cart_item_id
  const { data: designRequest, error: findError } = await adminSupabase
    .from('design_requests')
    .select('cart_item_id, user_id')
    .eq('id', designRequestId)
    .single()

  if (findError || !designRequest) {
    return NextResponse.json({ error: 'Design request not found' }, { status: 404 })
  }

  // Upload admin response files
  for (const file of files) {
    const safeFilename = sanitizeFilename(file.name)
    const storagePath = `${designRequest.user_id}/${designRequest.cart_item_id}/admin/${safeFilename}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(storagePath, fileBuffer, { upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { error: fileInsertError } = await adminSupabase.from('design_files').insert({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      design_request_id: designRequestId,
      type: 'admin_response',
      file_url: storagePath,
      filename: safeFilename,
      mime_type: file.type || null,
      size: file.size,
      uploaded_by: 'admin',
    })

    if (fileInsertError) {
      return NextResponse.json({ error: fileInsertError.message }, { status: 500 })
    }
  }

  // Update design request status and notes
  const { data: updatedRequest, error: updateError } = await adminSupabase
    .from('design_requests')
    .update({
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', designRequestId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedRequest)
}
