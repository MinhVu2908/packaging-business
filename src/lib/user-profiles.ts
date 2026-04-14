import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingError) {
    return null
  }

  if (existing) {
    return existing
  }

  const contact_name = user.email?.split('@')[0] ?? null
  const rawMeta = user.user_metadata || {}
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: user.id,
      company_name: rawMeta.company_name || null,
      contact_name,
      phone: rawMeta.phone || null,
      role: 'customer',
    })
    .select()
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.role
}

export async function requireAdmin(supabase: SupabaseClient, userId: string) {
  const role = await getUserRole(supabase, userId)
  return role === 'admin'
}
