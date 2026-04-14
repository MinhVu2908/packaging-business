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

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(products || [])
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

  if (!(await requireAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, category, layers, linerboard, medium, flute_a, flute_b, description, price } = body

  if (!name || !category || !layers || !linerboard || !description || typeof price !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const normalizedMedium = typeof medium === 'string' && medium.trim().length > 0 ? medium.trim() : 'Custom'
  const parsedFluteA = typeof flute_a === 'number' ? flute_a : flute_a != null ? Number(flute_a) : null
  const parsedFluteB = typeof flute_b === 'number' ? flute_b : flute_b != null ? Number(flute_b) : null

  if (!(parsedFluteA == null || Number.isFinite(parsedFluteA))) {
    return NextResponse.json({ error: 'Invalid flute_a' }, { status: 400 })
  }
  if (!(parsedFluteB == null || Number.isFinite(parsedFluteB))) {
    return NextResponse.json({ error: 'Invalid flute_b' }, { status: 400 })
  }

  const id = `prod-${Date.now()}`
  const { data, error } = await supabase
    .from('products')
    .insert({
      id,
      name,
      category,
      layers,
      linerboard,
      medium: normalizedMedium,
      flute_a: parsedFluteA,
      flute_b: parsedFluteB,
      description,
      price,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
