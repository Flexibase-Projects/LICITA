// GET /api/mapa/orgao/[cnpj]
// Retorna detalhe completo de um órgão: dados CNPJ + editais PNCP + análise IA
import { NextRequest, NextResponse } from 'next/server'
import { searchContratacoes, formatCnpjForPncp } from '@/lib/pncpClient'
import { ollamaGenerate, DEFAULT_MODEL } from '@/lib/ollamaClient'
import { getDateRange, contemKeyword } from '@/lib/mapaCache'
import type { BrasilApiCnpj, MapaOrgaoDetailResponse, OrgaoDetalhe, PNCPContratacao } from '@licita/shared-types'

async function fetchBrasilApiCnpj(cnpj: string): Promise<BrasilApiCnpj | null> {
  const digits = cnpj.replace(/\D/g, '')
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json() as BrasilApiCnpj
  } catch {
    return null
  }
}

/** Mesmo período do cache (6 meses) para que os editais encontrados coincidam com a lista do mapa. */
async function fetchEditalsPncp(cnpj: string, uf?: string): Promise<PNCPContratacao[]> {
  const { dataInicial, dataFinal } = getDateRange()
  const tamanhoPagina = 50
  const maxPaginas = 5
  const allData: PNCPContratacao[] = []

  try {
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const result = await searchContratacoes({
        dataInicial,
        dataFinal,
        ...(uf && { uf: uf.toUpperCase().slice(0, 2) }),
        tamanhoPagina,
        pagina,
      })
      allData.push(...result.data)
      if (pagina >= (result.totalPaginas ?? 1) || result.data.length < tamanhoPagina) break
    }
  } catch {
    // silenciar erro de PNCP — retornar o que tiver
  }

  const cnpjDigits = cnpj.replace(/\D/g, '')
  return allData.filter((c) => {
    const orgCnpj = (c.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '')
    return orgCnpj === cnpjDigits && contemKeyword(c.objetoCompra ?? '')
  })
}

async function gerarResumoIA(orgao: {
  cnpj: string
  nome: string
  municipio: string
  uf: string
  dadosCnpj: BrasilApiCnpj | null
  editais: PNCPContratacao[]
}): Promise<{ resumo: string; potencial: 'alto' | 'medio' | 'baixo'; recomendacao: string }> {
  const editaisInfo = orgao.editais
    .slice(0, 5)
    .map((e) => `- ${e.objetoCompra} (R$ ${e.valorTotalEstimado?.toLocaleString('pt-BR') ?? 'N/D'}) - ${e.dataPublicacaoPncp?.slice(0, 10) ?? ''}`)
    .join('\n')

  const prompt = `Você é um analista de prospecção comercial especializado em mobiliário corporativo e escolar.
Analise o perfil deste órgão público brasileiro e determine o potencial comercial.

CNPJ: ${formatCnpjForPncp(orgao.cnpj.replace(/\D/g, ''))}
Razão Social: ${orgao.dadosCnpj?.razao_social ?? orgao.nome}
Município/UF: ${orgao.municipio}/${orgao.uf}
Natureza Jurídica: ${orgao.dadosCnpj?.natureza_juridica?.descricao ?? 'Não informado'}
Atividade Principal: ${orgao.dadosCnpj?.atividade_principal?.[0]?.descricao ?? 'Não informado'}

Editais recentes de mobiliário/assento/cadeira:
${editaisInfo || '(nenhum edital recente encontrado)'}

Responda APENAS com JSON no formato:
{
  "potencial": "alto" | "medio" | "baixo",
  "resumo": "resumo em 2-3 frases sobre o perfil de compras deste órgão",
  "recomendacao": "recomendação comercial objetiva de 1-2 frases"
}`

  try {
    const result = await ollamaGenerate({
      model: DEFAULT_MODEL,
      prompt,
      temperature: 0.15,
      numCtx: 4096,
      maxRetries: 2,
    })

    const json = result.json as { potencial?: string; resumo?: string; recomendacao?: string } | null
    if (json && json.potencial && json.resumo) {
      return {
        potencial: (['alto', 'medio', 'baixo'].includes(json.potencial ?? '') ? json.potencial : 'medio') as 'alto' | 'medio' | 'baixo',
        resumo: json.resumo ?? '',
        recomendacao: json.recomendacao ?? '',
      }
    }
  } catch {
    // Ollama falhou — retornar resposta padrão
  }

  // Fallback se IA falhar
  const potencial = orgao.editais.length >= 3 ? 'alto' : orgao.editais.length >= 1 ? 'medio' : 'baixo'
  return {
    potencial,
    resumo: `${orgao.nome} possui ${orgao.editais.length} edital(is) de mobiliário nos últimos 2 anos.`,
    recomendacao: orgao.editais.length > 0
      ? 'Órgão com histórico de compras. Recomenda-se contato proativo antes da abertura de novos editais.'
      : 'Sem histórico recente. Monitorar para futuras licitações.',
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params
  const ufParam = req.nextUrl.searchParams.get('uf') ?? undefined
  const preview = req.nextUrl.searchParams.get('preview') === '1'

  if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    // Buscar em paralelo: dados CNPJ + editais PNCP (com UF quando disponível = mais eficiente)
    const [dadosCnpj, editais] = await Promise.all([
      fetchBrasilApiCnpj(cnpj),
      fetchEditalsPncp(cnpj, ufParam),
    ])

    const nome = dadosCnpj?.razao_social ?? editais[0]?.unidadeOrgao?.razaoSocial ?? 'Órgão público'
    const municipio = dadosCnpj?.municipio ?? editais[0]?.unidadeOrgao?.municipioNome ?? ''
    const ufResolved = dadosCnpj?.uf ?? editais[0]?.unidadeOrgao?.ufSigla ?? ufParam ?? ''

    // Preview (dialog "Ver edital"): só dados básicos, sem IA — evita timeout/erro de Ollama
    if (preview) {
      const orgao: OrgaoDetalhe = {
        cnpj,
        nome,
        municipio,
        uf: ufResolved,
        lat: null,
        lng: null,
        editais,
        ai_resumo: '',
        ai_potencial: 'medio',
        ai_recomendacao: '',
        dados_cnpj: dadosCnpj,
      }
      return NextResponse.json<MapaOrgaoDetailResponse>({ orgao })
    }

    // Detalhe completo: inclui análise IA
    const ia = await gerarResumoIA({ cnpj, nome, municipio, uf: ufResolved, dadosCnpj, editais })

    const orgao: OrgaoDetalhe = {
      cnpj,
      nome,
      municipio,
      uf: ufResolved,
      lat: null,
      lng: null,
      editais,
      ai_resumo: ia.resumo,
      ai_potencial: ia.potencial,
      ai_recomendacao: ia.recomendacao,
      dados_cnpj: dadosCnpj,
    }

    return NextResponse.json<MapaOrgaoDetailResponse>({ orgao })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao buscar órgão: ${msg}` }, { status: 502 })
  }
}
