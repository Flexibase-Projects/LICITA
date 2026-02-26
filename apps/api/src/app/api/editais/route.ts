import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const QuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'extracting', 'analyzing', 'completed', 'error']).optional(),
  viabilidade: z.enum(['viavel', 'parcialmente_viavel', 'inviavel']).optional(),
  modalidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const params = QuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!params.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos', details: params.error.flatten() }, { status: 400 })
  }

  const { search, status, viabilidade, modalidade, uf, page, pageSize, orderBy, order } = params.data
  const from = (page - 1) * pageSize

  let query = supabaseAdmin
    .from('editais')
    .select('*, orgao:orgaos(id, nome, uf, municipio)', { count: 'exact' })
    .range(from, from + pageSize - 1)
    .order(orderBy, { ascending: order === 'asc' })

  if (status) query = query.eq('status', status)
  if (viabilidade) query = query.eq('viabilidade_veredicto', viabilidade)
  if (modalidade) query = query.eq('modalidade', modalidade)

  // Filtro de UF via join com orgaos
  if (uf) {
    const { data: orgaoIds } = await supabaseAdmin
      .from('orgaos')
      .select('id')
      .eq('uf', uf.toUpperCase())
    if (orgaoIds) {
      query = query.in('orgao_id', orgaoIds.map((o) => o.id))
    }
  }

  // Busca full-text via função SQL
  if (search) {
    const { data: searchResults, error: searchErr } = await supabaseAdmin
      .rpc('search_editais', { query: search, limit_n: pageSize, offset_n: from })

    if (searchErr) {
      return NextResponse.json({ error: searchErr.message }, { status: 500 })
    }

    return NextResponse.json({
      data: searchResults ?? [],
      total: searchResults?.length ?? 0,
      page,
      pageSize,
    })
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  })
}
