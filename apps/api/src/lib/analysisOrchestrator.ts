import { supabaseAdmin } from './supabaseAdmin'
import { ollamaGenerate, DEFAULT_MODEL } from './ollamaClient'
import { chunkPDFPages, getChunksBySection, getFullTextChunksForItems } from './pdfChunker'
import type { ExtractedPDF } from './pdfExtractor'
import {
  SYSTEM_DADOS_BASICOS,
  buildPromptDadosBasicos,
  PROMPT_VERSION as V_BASICOS,
} from './prompts/dadosBasicos'
import {
  SYSTEM_VALOR_ESTIMADO,
  buildPromptValorEstimado,
  PROMPT_VERSION as V_VALOR,
} from './prompts/valorEstimado'
import {
  SYSTEM_ITENS,
  buildPromptItens,
  PROMPT_VERSION as V_ITENS,
} from './prompts/itensCompletos'
import {
  SYSTEM_REQUISITOS,
  buildPromptRequisitos,
  PROMPT_VERSION as V_REQUISITOS,
} from './prompts/requisitosTecnicos'
import {
  SYSTEM_VIABILIDADE,
  buildPromptViabilidade,
  PROMPT_VERSION as V_VIABILIDADE,
} from './prompts/viabilidade'
import {
  SYSTEM_RESUMO,
  buildPromptResumoExecutivo,
  PROMPT_VERSION as V_RESUMO,
} from './prompts/resumoExecutivo'
import { loadTrainingRules, loadTrainingExamples, loadActiveCategories } from './trainingLoader'

export type ProgressCallback = (event: {
  step: string
  progress: number
  message: string
  editalId?: string
  error?: string
}) => void

export async function runAnalysisPipeline(
  editalId: string,
  extracted: ExtractedPDF,
  model: string = DEFAULT_MODEL,
  onProgress: ProgressCallback = () => {}
): Promise<void> {
  const t0 = Date.now()

  try {
    await supabaseAdmin
      .from('editais')
      .update({ status: 'analyzing' })
      .eq('id', editalId)

    // ─── Chunking ─────────────────────────────────────────────
    onProgress({ step: 'chunking', progress: 5, message: `Criando chunks semânticos do PDF (${extracted.totalPages} páginas)...` })
    const chunks = chunkPDFPages(extracted.pages)

    // ─── Agente 1: Dados Básicos + Nome Curto ─────────────────
    onProgress({ step: 'dados_basicos', progress: 10, message: 'Identificando dados básicos do edital...' })
    const rulesBasicos = await loadTrainingRules('dados_basicos')
    const examplesBasicos = await loadTrainingExamples('dados_basicos')
    const extraBasicos = [rulesBasicos, examplesBasicos].filter(Boolean).join('\n\n')

    const headerChunks = getChunksBySection(chunks, 'header')
    const headerText = headerChunks.length > 0
      ? headerChunks.slice(0, 3).map((c) => c.text).join('\n\n')
      : extracted.pages.slice(0, 5).map((p) => p.text).join('\n\n')

    const resultBasicos = await ollamaGenerate({
      model,
      system: SYSTEM_DADOS_BASICOS,
      prompt: buildPromptDadosBasicos(headerText, extraBasicos),
      temperature: 0.05,
    })
    const dadosBasicos = resultBasicos.json ?? {}

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'dados_basicos',
      modelo: model,
      prompt_versao: V_BASICOS,
      chunks_processados: headerChunks.length,
      resultado_json: dadosBasicos,
      duracao_ms: resultBasicos.durationMs,
      sucesso: true,
    })

    await applyDadosBasicos(editalId, dadosBasicos)

    // ─── Agente 1b: Valor Estimado ────────────────────────────
    onProgress({ step: 'valor_estimado', progress: 18, message: 'Buscando valor estimado...' })
    const rulesValor = await loadTrainingRules('valor_estimado')
    const valorText = extracted.fullText.slice(0, 25000)

    const resultValor = await ollamaGenerate({
      model,
      system: SYSTEM_VALOR_ESTIMADO,
      prompt: buildPromptValorEstimado(valorText, rulesValor),
      temperature: 0.05,
    })
    const dadosValor = resultValor.json ?? {}

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'valor_estimado',
      modelo: model,
      prompt_versao: V_VALOR,
      chunks_processados: 1,
      resultado_json: dadosValor,
      duracao_ms: resultValor.durationMs,
      sucesso: true,
    })

    if (typeof dadosValor.valor_estimado_total === 'number') {
      await supabaseAdmin
        .from('editais')
        .update({ valor_estimado: dadosValor.valor_estimado_total })
        .eq('id', editalId)
    }

    // ─── Agente 2: Itens — percorre TODO o PDF em chunks para não perder itens ─────────────
    onProgress({ step: 'itens_completos', progress: 25, message: 'Extraindo itens do edital (varredura completa)...' })
    const rulesItens = await loadTrainingRules('itens_completos')
    const examplesItens = await loadTrainingExamples('itens_completos')
    const extraItens = [rulesItens, examplesItens].filter(Boolean).join('\n\n')
    const categorias = await loadActiveCategories()

    const targetChunks = getFullTextChunksForItems(extracted.fullText)
    const allItemsRaw: unknown[] = []
    const seenKeys = new Set<string>()

    for (let i = 0; i < targetChunks.length; i++) {
      const { text, index, total } = targetChunks[i]
      const progressPct = 25 + Math.floor((i / targetChunks.length) * 20)
      onProgress({
        step: 'itens_completos',
        progress: progressPct,
        message: `Extraindo itens (bloco ${i + 1}/${targetChunks.length})...`,
      })

      const result = await ollamaGenerate({
        model,
        system: SYSTEM_ITENS,
        prompt: buildPromptItens(text, index, total, categorias, extraItens),
        temperature: 0.05,
      })

      if (result.json && Array.isArray((result.json as { itens?: unknown[] }).itens)) {
        const itens = (result.json as { itens: unknown[] }).itens
        for (const item of itens) {
          if (typeof item !== 'object' || !item) continue
          const rec = item as Record<string, unknown>
          const key = `${rec.numero_lote ?? ''}|${rec.numero_item ?? ''}|${String(rec.descricao ?? '').slice(0, 80)}`
          if (seenKeys.has(key)) continue
          seenKeys.add(key)
          allItemsRaw.push(item)
        }
      }
    }

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'itens_completos',
      modelo: model,
      prompt_versao: V_ITENS,
      chunks_processados: targetChunks.length,
      resultado_json: { itens: allItemsRaw, total: allItemsRaw.length },
      sucesso: true,
    })

    if (allItemsRaw.length > 0) {
      await persistItens(editalId, allItemsRaw)
    }

    // ─── Agente 3: Requisitos Detalhados ──────────────────────
    onProgress({ step: 'requisitos_tecnicos', progress: 50, message: 'Mapeando requisitos e habilitação...' })
    const rulesReq = await loadTrainingRules('requisitos_tecnicos')
    const examplesReq = await loadTrainingExamples('requisitos_tecnicos')
    const extraReq = [rulesReq, examplesReq].filter(Boolean).join('\n\n')

    const habChunks = getChunksBySection(chunks, 'habilitacao')
    const habText = habChunks.length > 0
      ? habChunks.map((c) => c.text).join('\n\n').slice(0, 20000)
      : extracted.fullText.slice(0, 20000)

    const resultRequisitos = await ollamaGenerate({
      model,
      system: SYSTEM_REQUISITOS,
      prompt: buildPromptRequisitos(habText, extraReq),
    })
    const dadosRequisitos = resultRequisitos.json ?? {}

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'requisitos_tecnicos',
      modelo: model,
      prompt_versao: V_REQUISITOS,
      chunks_processados: habChunks.length,
      resultado_json: dadosRequisitos,
      duracao_ms: resultRequisitos.durationMs,
      sucesso: true,
    })

    await persistCertificacoes(editalId, dadosRequisitos)
    await persistRequisitos(editalId, dadosRequisitos)

    // ─── Agente 4: Viabilidade ────────────────────────────────
    onProgress({ step: 'viabilidade', progress: 70, message: 'Analisando viabilidade de participação...' })
    const dadosParaViabilidade = {
      dados_basicos: dadosBasicos,
      valor_estimado: dadosValor,
      itens: allItemsRaw.slice(0, 50),
      requisitos: dadosRequisitos,
    }

    const resultViabilidade = await ollamaGenerate({
      model,
      system: SYSTEM_VIABILIDADE,
      prompt: buildPromptViabilidade(dadosParaViabilidade),
    })
    const dadosViabilidade = resultViabilidade.json ?? {}

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'viabilidade',
      modelo: model,
      prompt_versao: V_VIABILIDADE,
      chunks_processados: 0,
      resultado_json: dadosViabilidade,
      duracao_ms: resultViabilidade.durationMs,
      sucesso: true,
    })

    await applyViabilidade(editalId, dadosViabilidade)

    // ─── Agente 5: Resumo Executivo ───────────────────────────
    onProgress({ step: 'resumo_executivo', progress: 88, message: 'Gerando resumo executivo...' })
    const dadosCompletos = {
      dados_basicos: dadosBasicos,
      valor_estimado: dadosValor,
      itens_resumo: allItemsRaw.slice(0, 30),
      requisitos: dadosRequisitos,
      viabilidade: dadosViabilidade,
    }

    const resultResumo = await ollamaGenerate({
      model,
      system: SYSTEM_RESUMO,
      prompt: buildPromptResumoExecutivo(dadosCompletos),
    })
    const dadosResumo = resultResumo.json ?? {}

    await supabaseAdmin.from('analises_llm').insert({
      edital_id: editalId,
      tipo: 'resumo_executivo',
      modelo: model,
      prompt_versao: V_RESUMO,
      chunks_processados: 0,
      resultado_json: dadosResumo,
      duracao_ms: resultResumo.durationMs,
      sucesso: true,
    })

    const resumoTexto = typeof dadosResumo === 'object' && dadosResumo !== null
      ? (dadosResumo as { resumo_executivo?: string }).resumo_executivo ?? null
      : null

    await supabaseAdmin
      .from('editais')
      .update({ resumo_executivo: resumoTexto, status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', editalId)

    const totalMs = Date.now() - t0
    onProgress({
      step: 'completed',
      progress: 100,
      message: `Análise concluída em ${Math.round(totalMs / 1000)}s`,
      editalId,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    await supabaseAdmin
      .from('editais')
      .update({ status: 'error', error_message: errorMsg })
      .eq('id', editalId)

    onProgress({ step: 'error', progress: 0, message: errorMsg, error: errorMsg })
    throw err
  }
}

// ─── Helpers de persistência ──────────────────────────────────

async function applyDadosBasicos(editalId: string, dados: Record<string, unknown>) {
  const update: Record<string, unknown> = {}

  if (dados.numero_edital) update.numero_edital = dados.numero_edital
  if (dados.numero_processo) update.numero_processo = dados.numero_processo
  if (dados.modalidade) update.modalidade = dados.modalidade
  if (dados.objeto) update.objeto = dados.objeto
  if (dados.valor_estimado) update.valor_estimado = dados.valor_estimado
  if (dados.data_abertura) update.data_abertura_propostas = dados.data_abertura
  if (dados.data_encerramento) update.data_encerramento = dados.data_encerramento
  if (dados.prazo_execucao_dias) update.prazo_execucao_dias = dados.prazo_execucao_dias
  if (dados.endereco_entrega) update.endereco_entrega = dados.endereco_entrega
  if (dados.municipio_entrega) update.municipio_entrega = dados.municipio_entrega
  if (dados.uf_entrega) update.uf_entrega = dados.uf_entrega

  if (dados.orgao && typeof dados.orgao === 'object') {
    const orgao = dados.orgao as Record<string, string>
    const orgaoUpdate: Record<string, unknown> = {
      cnpj: orgao.cnpj,
      nome: orgao.nome,
      municipio: orgao.municipio,
      uf: orgao.uf,
      esfera: orgao.esfera,
    }
    if (orgao.nome_curto) orgaoUpdate.nome_curto = orgao.nome_curto

    const { data: orgaoData } = await supabaseAdmin
      .from('orgaos')
      .upsert(orgaoUpdate, { onConflict: 'cnpj' })
      .select('id')
      .single()

    if (orgaoData) update.orgao_id = orgaoData.id
  }

  if (Object.keys(update).length > 0) {
    await supabaseAdmin.from('editais').update(update).eq('id', editalId)
  }
}

async function persistItens(editalId: string, itensRaw: unknown[]) {
  const seen = new Set<string>()
  const itens = itensRaw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter((item) => {
      const key = `${item.numero_lote ?? ''}-${item.numero_item ?? ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((item) => ({
      edital_id: editalId,
      numero_item: String(item.numero_item ?? 'N/A'),
      numero_lote: item.numero_lote ? String(item.numero_lote) : null,
      nome_lote: item.nome_lote ? String(item.nome_lote) : null,
      descricao: String(item.descricao ?? 'Sem descrição'),
      descricao_detalhada: item.descricao_detalhada ? String(item.descricao_detalhada) : null,
      especificacoes: (item.especificacoes as object) ?? {},
      unidade: item.unidade ? String(item.unidade) : null,
      quantidade: item.quantidade ? Number(item.quantidade) : null,
      valor_unitario_estimado: item.valor_unitario_estimado ? Number(item.valor_unitario_estimado) : null,
      valor_total_estimado: item.valor_total_estimado ? Number(item.valor_total_estimado) : null,
      codigo_item_catalogo: item.codigo_catmat ? String(item.codigo_catmat) : null,
      tipo_item: 'material' as const,
      categoria: item.categoria ? String(item.categoria) : null,
      confianca_quantidade: ['alta', 'media', 'baixa'].includes(String(item.confianca_quantidade ?? ''))
        ? String(item.confianca_quantidade)
        : null,
    }))

  if (itens.length > 0) {
    for (let i = 0; i < itens.length; i += 100) {
      await supabaseAdmin.from('itens_edital').insert(itens.slice(i, i + 100))
    }
  }
}

async function persistCertificacoes(editalId: string, dados: Record<string, unknown>) {
  const certificacoes = Array.isArray(dados.certificacoes) ? dados.certificacoes : []

  const rows = certificacoes
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      edital_id: editalId,
      nome: String(c.nome ?? 'Certificação'),
      tipo: String(c.tipo ?? 'outro'),
      norma: c.norma ? String(c.norma) : null,
      descricao: c.descricao ? String(c.descricao) : null,
      obrigatoria: Boolean(c.obrigatoria ?? true),
    }))

  if (rows.length > 0) {
    await supabaseAdmin.from('certificacoes').insert(rows)
  }
}

const REQUISITO_CATEGORIAS = [
  'habilitacao_juridica',
  'qualificacao_tecnica',
  'qualificacao_economica',
  'documentos_fiscais',
  'requisitos_amostra',
  'garantias',
  'prazos_importantes',
] as const

async function persistRequisitos(editalId: string, dados: Record<string, unknown>) {
  const rows: Array<{
    edital_id: string
    categoria: string
    descricao: string
    obrigatorio: boolean
    dificuldade: string
    observacao: string | null
    data_limite: string | null
  }> = []

  for (const cat of REQUISITO_CATEGORIAS) {
    const items = dados[cat]
    if (!Array.isArray(items)) continue

    for (const item of items) {
      if (typeof item !== 'object' || !item) continue
      const r = item as Record<string, unknown>
      rows.push({
        edital_id: editalId,
        categoria: cat,
        descricao: String(r.descricao ?? ''),
        obrigatorio: r.obrigatorio !== false,
        dificuldade: ['baixa', 'media', 'alta'].includes(String(r.dificuldade ?? ''))
          ? String(r.dificuldade)
          : 'media',
        observacao: r.observacao ? String(r.observacao) : null,
        data_limite: r.data ? String(r.data) : null,
      })
    }
  }

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 100) {
      await supabaseAdmin.from('requisitos_edital').insert(rows.slice(i, i + 100))
    }
  }
}

async function applyViabilidade(editalId: string, dados: Record<string, unknown>) {
  const viabilidadeScore = typeof dados.score === 'number' ? dados.score : null
  const viabilidadeVeredicto = dados.veredicto ? String(dados.veredicto) : null

  await supabaseAdmin
    .from('editais')
    .update({ viabilidade_score: viabilidadeScore, viabilidade_veredicto: viabilidadeVeredicto })
    .eq('id', editalId)

  const itensAnalise = Array.isArray(dados.itens_analise) ? dados.itens_analise : []

  for (const analise of itensAnalise) {
    if (typeof analise !== 'object' || !analise) continue
    const a = analise as Record<string, unknown>

    const { data: item } = await supabaseAdmin
      .from('itens_edital')
      .select('id')
      .eq('edital_id', editalId)
      .eq('numero_item', String(a.numero_item ?? ''))
      .single()

    if (item) {
      await supabaseAdmin
        .from('itens_edital')
        .update({
          pode_produzir: Boolean(a.pode_produzir),
          viabilidade_nota: typeof a.nota_viabilidade === 'number' ? a.nota_viabilidade : null,
          viabilidade_justificativa: a.justificativa ? String(a.justificativa) : null,
          restricoes_producao: Array.isArray(a.restricoes) ? a.restricoes : [],
        })
        .eq('id', item.id)
    }
  }
}
