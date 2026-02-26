import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get('tipo')

  let query = supabaseAdmin
    .from('exemplos_treinamento')
    .select('*')
    .order('created_at', { ascending: false })

  if (tipo) {
    query = query.eq('tipo_analise', tipo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo_analise, edital_id, entrada_texto, saida_esperada } = body

    if (!tipo_analise || !entrada_texto || !saida_esperada) {
      return NextResponse.json(
        { error: 'tipo_analise, entrada_texto e saida_esperada são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('exemplos_treinamento')
      .insert({
        tipo_analise,
        edital_id: edital_id ?? null,
        entrada_texto,
        saida_esperada,
        aprovado: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 })
  }
}
