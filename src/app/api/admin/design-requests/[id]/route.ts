'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const designRequestId = resolvedParams.id
  const { data: designRequest, error } = await adminSupabase
    .from('design_requests')
    .select('id,cart_item_id,user_id,status,admin_notes,customer_notes,customer_confirmed,created_at,updated_at')
    .eq('id', designRequestId)
    .single()

  if (error || !designRequest) {
    return NextResponse.json({ error: 'Design request not found' }, { status: 404 })
  }

  const { data: cartItem, error: cartItemError } = await adminSupabase
    .from('cart_items')
    .select('id,product_id,quantity,length_mm,width_mm,unit_price,total_price,options,products(name,category,layers)')
    .eq('id', designRequest.cart_item_id)
    .single()

  if (cartItemError) {
    return NextResponse.json({ error: cartItemError.message }, { status: 500 })
  }

  const { data: designFilesData, error: filesError } = await adminSupabase
    .from('design_files')
    .select('id,type,file_url,filename,mime_type,size,uploaded_by,uploaded_at')
    .eq('design_request_id', designRequestId)

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 })
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from('user_profiles')
    .select('id,company_name,contact_name,phone')
    .eq('id', designRequest.user_id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

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

  return NextResponse.json({
    ...designRequest,
    cart_items: cartItem || null,
    design_files: filesWithUrls,
    user_profile: profile || null,
  })
}
