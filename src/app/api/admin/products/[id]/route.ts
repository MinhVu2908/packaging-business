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
  const { name, category, layers, linerboard, medium, description, price } = body

  if (!name && !category && !layers && !linerboard && !medium && !description && typeof price !== 'number') {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof name === 'string') updates.name = name
  if (typeof category === 'string') updates.category = category
  if (typeof layers === 'string') updates.layers = layers
  if (typeof linerboard === 'string') updates.linerboard = linerboard
  if (typeof medium === 'string') updates.medium = medium
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
