'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: designRequestId } = await params
  const formData = await request.formData()
  const adminNotes = formData.get('admin_notes')?.toString() || null
  const status = formData.get('status')?.toString() || 'review_ready'
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File)

  const { data: designRequest, error: findError } = await supabase
    .from('design_requests')
    .select('cart_item_id, user_id')
    .eq('id', designRequestId)
    .single()

  if (findError || !designRequest) {
    return NextResponse.json({ error: 'Design request not found' }, { status: 404 })
  }

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

    const { error: fileInsertError } = await supabase.from('design_files').insert({
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

  const { data: updatedRequest, error: updateError } = await supabase
    .from('design_requests')
    .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
    .eq('id', designRequestId)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updatedRequest)
}
