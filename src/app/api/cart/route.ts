import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ensureUserProfile } from '@/lib/user-profiles'

async function createSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
        },
        setAll() {
          return undefined
        },
      },
    }
  )
}

export async function GET() {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureUserProfile(supabase, user.id, user.email ?? undefined)

  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity, length_mm, width_mm, unit_price, total_price, options, products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 })
  }

  const { data: designRequests, error: designError } = await supabase
    .from('design_requests')
    .select('id, cart_item_id, status, admin_notes, customer_notes, customer_confirmed')
    .eq('user_id', user.id)

  if (designError) {
    return NextResponse.json({ error: designError.message }, { status: 500 })
  }

  const requestIds = designRequests?.map((request) => request.id) || []
  let designFilesData: any[] = []
  let filesError: any = null
  
  if (requestIds.length > 0) {
    const result = await supabase.from('design_files').select('*').in('design_request_id', requestIds)
    designFilesData = result.data || []
    filesError = result.error
  }

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 })
  }

  const signedFiles = await Promise.all(
    designFilesData.map(async (file) => {
      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from('designs')
        .createSignedUrl(file.file_url, 60 * 60)

      return {
        ...file,
        file_url: urlData?.signedUrl ?? file.file_url,
      }
    })
  )

  const filesByRequest = signedFiles.reduce<Record<string, typeof signedFiles>>((acc, file) => {
    const requestFiles = acc[file.design_request_id] || []
    return {
      ...acc,
      [file.design_request_id]: [...requestFiles, file],
    }
  }, {})

  const requestsByCartItem = (designRequests || []).reduce<Record<string, any>>((acc, request) => {
    acc[request.cart_item_id] = {
      ...request,
      files: filesByRequest[request.id] || [],
    }
    return acc
  }, {})

  const result = (cartItems || []).map((item) => ({
    ...item,
    design_request: requestsByCartItem[item.id] || null,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureUserProfile(supabase, user.id, user.email ?? undefined)

  const body = await request.json()
  const { product_id, quantity, length_mm, width_mm, unit_price, total_price, options } = body

  const id = `cart-${Date.now()}`
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      id,
      user_id: user.id,
      product_id,
      quantity,
      length_mm,
      width_mm,
      unit_price,
      total_price,
      options,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, quantity } = body

  if (!id || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('unit_price')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity, total_price: existing.unit_price * quantity })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
