import { supabaseAdmin } from './supabaseAdmin'
import type { AnaliseTipo } from '@licita/shared-types'

export async function loadTrainingRules(tipo: AnaliseTipo): Promise<string> {
  const { data } = await supabaseAdmin
    .from('regras_treinamento')
    .select('regra')
    .eq('tipo_analise', tipo)
    .eq('ativa', true)
    .order('created_at', { ascending: true })

  if (!data || data.length === 0) return ''

  return data.map((r: { regra: string }) => `- ${r.regra}`).join('\n')
}

export async function loadTrainingExamples(tipo: AnaliseTipo, limit = 3): Promise<string> {
  const { data } = await supabaseAdmin
    .from('exemplos_treinamento')
    .select('entrada_texto, saida_esperada')
    .eq('tipo_analise', tipo)
    .eq('aprovado', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return ''

  return data
    .map((ex: { entrada_texto: string; saida_esperada: unknown }, i: number) =>
      `EXEMPLO ${i + 1}:\nEntrada: ${ex.entrada_texto.slice(0, 500)}...\nSaída esperada: ${JSON.stringify(ex.saida_esperada, null, 2)}`
    )
    .join('\n\n')
}

export async function loadActiveCategories(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('categorias_destaque')
    .select('nome')
    .eq('ativa', true)
    .order('nome')

  if (!data) return ['mobiliario', 'assento']
  return data.map((c: { nome: string }) => c.nome)
}
