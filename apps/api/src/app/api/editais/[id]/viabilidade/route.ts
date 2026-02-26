import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { ollamaGenerate, DEFAULT_MODEL } from '@/lib/ollamaClient'
import { SYSTEM_VIABILIDADE, buildPromptViabilidade } from '@/lib/prompts/viabilidade'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Busca dados do edital para re-análise
  const { data: edital, error } = await supabaseAdmin
    .from('editais')
    .select('*, itens:itens_edital(*), certificacoes(*)')
    .eq('id', id)
    .single()

  if (error || !edital) {
    return NextResponse.json({ error: 'Edital não encontrado' }, { status: 404 })
  }

  const dadosParaViabilidade = {
    dados_basicos: {
      objeto: edital.objeto,
      modalidade: edital.modalidade,
      valor_estimado: edital.valor_estimado,
      prazo_execucao_dias: edital.prazo_execucao_dias,
      municipio_entrega: edital.municipio_entrega,
      uf_entrega: edital.uf_entrega,
    },
    itens: edital.itens?.slice(0, 50),
    requisitos: { certificacoes: edital.certificacoes },
  }

  const result = await ollamaGenerate({
    model: DEFAULT_MODEL,
    system: SYSTEM_VIABILIDADE,
    prompt: buildPromptViabilidade(dadosParaViabilidade),
  }).catch((err) => {
    throw new Error(`OLLAMA indisponível: ${err.message}`)
  })

  const dados = result.json ?? {}

  await supabaseAdmin
    .from('editais')
    .update({
      viabilidade_score: typeof dados.score === 'number' ? dados.score : null,
      viabilidade_veredicto: dados.veredicto ? String(dados.veredicto) : null,
    })
    .eq('id', id)

  await supabaseAdmin.from('analises_llm').insert({
    edital_id: id,
    tipo: 'viabilidade',
    modelo: DEFAULT_MODEL,
    prompt_versao: '1.0',
    chunks_processados: 0,
    resultado_json: dados,
    duracao_ms: result.durationMs,
    sucesso: true,
  })

  return NextResponse.json({ viabilidade: dados })
}
