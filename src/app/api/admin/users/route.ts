'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

/** Profiles only — order/cart activity lives under GET /api/admin/customers-orders. */
export async function GET(_request: NextRequest) {
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

  const [{ data: profiles, error: profilesError }, { data: orders }, { data: cartItems }, { data: designRequests }] =
    await Promise.all([
      adminSupabase
        .from('user_profiles')
        .select(
          `
        id,
        company_name,
        contact_name,
        phone,
        role,
        created_at,
        updated_at
      `
        )
        .order('created_at', { ascending: false }),
      adminSupabase.from('orders').select('user_id'),
      adminSupabase.from('cart_items').select('user_id'),
      adminSupabase.from('design_requests').select('user_id'),
    ])

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message ?? 'Failed to load users' }, { status: 500 })
  }

  const profileById = (profiles || []).reduce<Record<string, (typeof profiles)[0]>>((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const activityUserIds = new Set<string>()
  ;[...(orders || []), ...(cartItems || []), ...(designRequests || [])].forEach((record) => {
    if (record.user_id) activityUserIds.add(record.user_id)
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

  const users = [...(profiles || []), ...fallbackUsers]

  return NextResponse.json(users)
}
