'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

/** User profile + cart + design requests only (no orders — use /admin/orders). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

  const { userId } = await params
  const db = adminSupabase

  const { data: profile, error: profileError } = await db
    .from('user_profiles')
    .select('id, company_name, contact_name, phone, role, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  let email: string | undefined
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: authData } = await adminSupabase.auth.admin.getUserById(userId)
    if (authData.user?.email) email = authData.user.email
  }

  const [{ data: cartItems, error: cartError }, { data: designRequests, error: designError }] = await Promise.all([
    db
      .from('cart_items')
      .select('id,user_id,quantity,total_price,products(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    db
      .from('design_requests')
      .select('id,cart_item_id,user_id,status,admin_notes,customer_notes,customer_confirmed,created_at,updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (cartError || designError) {
    return NextResponse.json({ error: cartError?.message ?? designError?.message }, { status: 500 })
  }

  return NextResponse.json({
    profile: profile
      ? { ...profile, email: email ?? undefined }
      : {
          id: userId,
          company_name: null,
          contact_name: null,
          phone: null,
          role: 'customer',
          created_at: null,
          updated_at: null,
          email,
        },
    cart_items: cartItems || [],
    design_requests: designRequests || [],
  })
}
