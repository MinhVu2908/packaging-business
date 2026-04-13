import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const rawCompanyName = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const rawContactName = typeof body.contact_name === 'string' ? body.contact_name.trim() : ''
  const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''

  const company_name = rawCompanyName.length > 0 ? rawCompanyName : null
  const contact_name = rawContactName.length > 0 ? rawContactName : null
  const phone = rawPhone.length > 0 ? rawPhone : null

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ company_name, contact_name, phone })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: data })
}
