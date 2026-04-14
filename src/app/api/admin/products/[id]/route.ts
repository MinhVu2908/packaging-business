'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/user-profiles'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const productId = resolvedParams.id
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const productId = resolvedParams.id
  const body = await request.json()
  const { name, category, layers, linerboard, medium, flute_a, flute_b, description, price } = body

  const hasAny =
    typeof name === 'string' ||
    typeof category === 'string' ||
    typeof layers === 'string' ||
    typeof linerboard === 'string' ||
    typeof medium === 'string' ||
    flute_a !== undefined ||
    flute_b !== undefined ||
    typeof description === 'string' ||
    typeof price === 'number'

  if (!hasAny) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof name === 'string') updates.name = name
  if (typeof category === 'string') updates.category = category
  if (typeof layers === 'string') updates.layers = layers
  if (typeof linerboard === 'string') updates.linerboard = linerboard
  if (typeof medium === 'string' && medium.trim().length > 0) updates.medium = medium.trim()
  if (flute_a !== undefined) {
    const parsed = typeof flute_a === 'number' ? flute_a : flute_a == null ? null : Number(flute_a)
    if (!(parsed == null || Number.isFinite(parsed))) {
      return NextResponse.json({ error: 'Invalid flute_a' }, { status: 400 })
    }
    updates.flute_a = parsed
  }
  if (flute_b !== undefined) {
    const parsed = typeof flute_b === 'number' ? flute_b : flute_b == null ? null : Number(flute_b)
    if (!(parsed == null || Number.isFinite(parsed))) {
      return NextResponse.json({ error: 'Invalid flute_b' }, { status: 400 })
    }
    updates.flute_b = parsed
  }
  if (typeof description === 'string') updates.description = description
  if (typeof price === 'number') updates.price = price

  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single()

  if (error || !updatedProduct) {
    return NextResponse.json({ error: error?.message ?? 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(updatedProduct)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params
  const productId = resolvedParams.id
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
