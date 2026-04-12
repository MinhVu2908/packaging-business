'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

export async function GET(request: NextRequest) {
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

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      summary,
      date,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = Array.from(new Set((orders || []).map((order) => order.user_id)))
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,company_name,contact_name,phone')
    .in('id', userIds)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const profileMap = (profiles || []).reduce<Record<string, any>>((acc, profile) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const ordersWithProfiles = (orders || []).map((order) => ({
    ...order,
    user_profile: profileMap[order.user_id] || null,
  }))

  return NextResponse.json(ordersWithProfiles)
}
