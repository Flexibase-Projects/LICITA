import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { edital_id, tipo_analise, nota, comentario, correcoes } = body

    if (!edital_id || !tipo_analise) {
      return NextResponse.json({ error: 'edital_id e tipo_analise são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('feedbacks_analise')
      .insert({
        edital_id,
        tipo_analise,
        nota: nota ?? null,
        comentario: comentario ?? null,
        correcoes: correcoes ?? {},
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
