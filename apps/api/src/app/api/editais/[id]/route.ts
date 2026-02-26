import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('editais')
    .select(`
      *,
      orgao:orgaos(*),
      itens:itens_edital(*),
      certificacoes(*),
      requisitos:requisitos_edital(*),
      analises:analises_llm(id, tipo, modelo, sucesso, duracao_ms, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: edital } = await supabaseAdmin
    .from('editais')
    .select('pdf_storage_path')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin.from('editais').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (edital?.pdf_storage_path) {
    await supabaseAdmin.storage.from('editais-pdfs').remove([edital.pdf_storage_path])
  }

  return NextResponse.json({ message: 'Edital removido com sucesso' })
}
