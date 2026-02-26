// Cliente tipado para a API PNCP (Portal Nacional de Contratações Públicas)
// Documentação: https://pncp.gov.br/api/consulta/swagger-ui/index.html
import type { PNCPContratacao, PNCPItem, PNCPSearchResult } from '@licita/shared-types'

const BASE_URL = 'https://pncp.gov.br/api/consulta/v1'

// Mapeamento de modalidade PNCP → enum local
const MODALIDADE_MAP: Record<number, string> = {
  1: 'leilao',
  2: 'concorrencia',
  3: 'concurso',
  4: 'pregao_eletronico',
  5: 'pregao_presencial',
  6: 'dispensa',
  7: 'inexigibilidade',
  8: 'pregao_eletronico',
  9: 'concorrencia',
}

export function mapModalidade(id: number): string {
  return MODALIDADE_MAP[id] ?? 'outro'
}

export interface PNCPSearchParams {
  dataInicial: string    // YYYYMMDD
  dataFinal: string      // YYYYMMDD
  codigoModalidade?: number  // 8 = Pregão Eletrônico
  uf?: string
  codigoMunicipio?: string
  pagina?: number
  tamanhoPagina?: number
  palavraChave?: string
}

// PNCP exige codigoModalidadeContratacao; 8 = Pregão Eletrônico
const DEFAULT_MODALIDADE = 8

/**
 * Busca contratações publicadas no PNCP.
 * Documentação: https://pncp.gov.br/api/consulta/swagger-ui/
 */
export async function searchContratacoes(params: PNCPSearchParams): Promise<PNCPSearchResult> {
  const query = new URLSearchParams({
    dataInicial: params.dataInicial,
    dataFinal: params.dataFinal,
    codigoModalidadeContratacao: String(params.codigoModalidade ?? DEFAULT_MODALIDADE),
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: String(params.tamanhoPagina ?? 20),
  })

  if (params.uf) query.set('uf', String(params.uf).toUpperCase().slice(0, 2))
  if (params.codigoMunicipio) query.set('codigoMunicipioIbge', params.codigoMunicipio)
  // Nota: endpoint publicacao não possui palavraChave; filtro por texto pode ser feito no cliente
  if (params.palavraChave) query.set('palavraChave', params.palavraChave)

  const url = `${BASE_URL}/contratacoes/publicacao?${query}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })

  const responseText = await res.text()

  if (!res.ok) {
    const err = new Error(`PNCP API erro ${res.status}: ${responseText.slice(0, 500)}`) as Error & { debug?: unknown }
    err.debug = { url, status: res.status, body: responseText.slice(0, 1000) }
    throw err
  }

  let data: unknown
  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error(`Resposta PNCP não é JSON: ${responseText.slice(0, 200)}`)
  }

  const obj = data as Record<string, unknown>
  return {
    data: Array.isArray(obj.data) ? obj.data : Array.isArray(obj.content) ? obj.content : [],
    totalRegistros: typeof obj.totalRegistros === 'number' ? obj.totalRegistros : (Array.isArray(obj.data) ? obj.data : obj.content ?? []).length,
    totalPaginas: typeof obj.totalPaginas === 'number' ? obj.totalPaginas : 1,
    numeroPagina: typeof obj.numeroPagina === 'number' ? obj.numeroPagina : (params.pagina ?? 1),
    tamanhoPagina: typeof obj.tamanhoPagina === 'number' ? obj.tamanhoPagina : (params.tamanhoPagina ?? 20),
  } as PNCPSearchResult
}

/** Formata CNPJ 14 dígitos para XX.XXX.XXX/XXXX-XX (API PNCP aceita ambos). */
export function formatCnpjForPncp(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length !== 14) return digits
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Busca detalhe de uma contratação específica.
 * CNPJ pode ser 14 dígitos ou formatado.
 */
export async function getContratacao(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<PNCPContratacao> {
  const cnpjParam = cnpj.length === 14 ? formatCnpjForPncp(cnpj) : cnpj
  const url = `${BASE_URL}/orgaos/${encodeURIComponent(cnpjParam)}/compras/${ano}/${sequencial}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()

  if (!res.ok) {
    const err = new Error(`PNCP API erro ${res.status}: ${text.slice(0, 300)}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }

  try {
    return JSON.parse(text) as PNCPContratacao
  } catch {
    throw new Error(`Resposta PNCP inválida: ${text.slice(0, 200)}`)
  }
}

/**
 * Busca itens de uma contratação.
 */
export async function getItensContratacao(
  cnpj: string,
  ano: number,
  sequencial: number,
  pagina = 1,
  tamanho = 500
): Promise<{ data: PNCPItem[]; totalRegistros: number }> {
  const cnpjParam = cnpj.length === 14 ? formatCnpjForPncp(cnpj) : cnpj
  const query = new URLSearchParams({ pagina: String(pagina), tamanhoPagina: String(tamanho) })
  const res = await fetch(
    `${BASE_URL}/orgaos/${encodeURIComponent(cnpjParam)}/compras/${ano}/${sequencial}/itens?${query}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error(`PNCP API itens erro ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`)
  const json = await res.json()
  const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
  return { data, totalRegistros: json?.totalRegistros ?? data.length }
}

/**
 * Busca arquivos (documentos) de uma contratação.
 * Retorna URL do edital PDF quando disponível.
 */
export async function getArquivosContratacao(
  cnpj: string,
  ano: number,
  sequencial: number
): Promise<Array<{ titulo: string; url: string; tipoDocumentoId: number }>> {
  const cnpjParam = cnpj.length === 14 ? formatCnpjForPncp(cnpj) : cnpj
  const res = await fetch(
    `${BASE_URL}/orgaos/${encodeURIComponent(cnpjParam)}/compras/${ano}/${sequencial}/arquivos`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
}
