/**
 * Cache unificado do mapa: mesma fonte para heatmap (contagem por UF) e lista de órgãos.
 * Pré-computado no backend de tempos em tempos; ao selecionar estado retorna do cache (sem PNCP).
 */
import { searchContratacoes } from '@/lib/pncpClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { BrasilApiCnpj, MapaOrgao, PNCPContratacao } from '@licita/shared-types'

/** Termos que indicam compra de mobiliário escolar/corporativo (objeto do edital). Exclusões removem falsos positivos. */
export const KEYWORDS = [
  'MOBILIARIO', 'MOBILIÁRIO', 'MOBILIARIOS', 'MOBILIÁRIOS',
  'CARTEIRA ESCOLAR', 'CARTEIRA UNIVERSITARIA', 'CADEIRA ESCOLAR', 'MESA ESCOLAR',
  'ARMARIO', 'ARMÁRIO', 'ARMARIOS', 'ARMÁRIOS',
  'ESTANTE', 'ESTANTES',
  'GUARDAROUPA', 'GUARDA-ROUPA', 'GUARDA ROUPA',
  'ASSENTO', 'ASSENTOS',
  'CADEIRA', 'CADEIRAS', 'MESA', 'MESAS', // genéricos; exclusions removem cadeira de rodas, mesa de cirurgia etc.
]

/** Expressões que indicam NÃO ser mobiliário de interesse (excluir para reduzir ruído). */
export const EXCLUSIONS = [
  'CADEIRA DE RODAS', 'CADEIRAS DE RODAS',
  'MESA DE CIRURGIA', 'MESA CIRURGICA', 'MESA CIRÚRGICA',
  'MESA DE OPERAÇÃO', 'MESA DE OPERAÇÕES', 'MESA OPERACIONAL',
  'MESA DE NEGOCIAÇÃO', 'MESA DE NEGOCIACAO',
  'CADEIRA DE PRAIA',
  'MESA ELETRONICA', 'MESA ELETRÔNICA', // mesa de votação
  'CADEIRA ELETRONICA', 'CADEIRA ELETRÔNICA', // urna/cadeira de votação
]

export const CACHE_TTL_MINUTES = 30
export const DATE_RANGE_MONTHS = 6
export const MAX_PAGINAS = 5
export const TAMANHO_PAGINA = 50

function normalize(t: string): string {
  return (t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function contemKeyword(texto: string): boolean {
  if (!texto || typeof texto !== 'string') return false
  const upper = normalize(texto)
  if (EXCLUSIONS.some((ex) => upper.includes(normalize(ex)))) return false
  return KEYWORDS.some((kw) => upper.includes(normalize(kw)))
}

export function getDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - DATE_RANGE_MONTHS)
  return {
    dataInicial: start.toISOString().slice(0, 10).replace(/-/g, ''),
    dataFinal: end.toISOString().slice(0, 10).replace(/-/g, ''),
  }
}

export interface BuildOrgaosResult {
  orgaos: MapaOrgao[]
  totalEditaisUf: number
  totalFetched: number
}

const NOMINATIM_DELAY_MS = 1100
const BRASIL_API_DELAY_MS = 400

/** Busca dados do CNPJ na Brasil API (logradouro para geocodificar endereço real) */
async function fetchBrasilApiCnpj(cnpj: string): Promise<BrasilApiCnpj | null> {
  const digits = cnpj.replace(/\D/g, '')
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return (await res.json()) as BrasilApiCnpj
  } catch {
    return null
  }
}

/** Geocodifica endereço completo (logradouro, cidade, UF) no Nominatim */
async function geocodeEndereco(enderecoCompleto: string): Promise<{ lat: number; lng: number } | null> {
  const q = `${enderecoCompleto.trim()}, Brasil`
  if (!q.replace(/,?\s*Brasil\s*$/, '').trim()) return null
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'LICITA-Pro/1.0 (mapa geocodificacao)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first || first.lat == null || first.lon == null) return null
    return { lat: Number(first.lat), lng: Number(first.lon) }
  } catch {
    return null
  }
}

/** Normaliza nome para chave única: minúsculo, sem acentos (evita duplicar geocode "São Paulo" vs "Sao Paulo") */
function normalizeMunicipioKey(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Geocodifica município pelo nome e UF (Nominatim/OSM).
 * Respeita 1 req/s; resultado deve ser persistido em municipios para reuso.
 */
async function geocodeMunicipio(
  municipioNome: string,
  uf: string
): Promise<{ lat: number; lng: number } | null> {
  if (!municipioNome?.trim() || !uf?.trim()) return null
  const q = `${municipioNome.trim()}, ${uf.trim().toUpperCase()}, Brasil`
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'LICITA-Pro/1.0 (mapa geocodificacao)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first || first.lat == null || first.lon == null) return null
    return { lat: Number(first.lat), lng: Number(first.lon) }
  } catch {
    return null
  }
}

/**
 * Busca no PNCP (até 5 páginas, 6 meses), filtra por keywords, agrupa por órgão e geocodifica.
 * Usado para popular mapa_orgaos_cache (heatmap e lista usam essa mesma base).
 * Coordenadas somente por município (IBGE ou Nominatim); nunca fallback em centroide da UF.
 */
export async function buildOrgaosForUf(uf: string): Promise<BuildOrgaosResult> {
  const { dataInicial, dataFinal } = getDateRange()
  const allData: PNCPContratacao[] = []

  const ufNormalized = uf.toUpperCase().slice(0, 2)
  const baseParams = { dataInicial, dataFinal, uf: ufNormalized, tamanhoPagina: TAMANHO_PAGINA }

  // Buscar página 1 para descobrir totalPaginas
  const firstResult = await searchContratacoes({ ...baseParams, pagina: 1 })
  allData.push(...firstResult.data)

  // Buscar páginas restantes em paralelo (sem rate limit no PNCP)
  const totalPaginas = Math.min(firstResult.totalPaginas ?? 1, MAX_PAGINAS)
  if (firstResult.data.length === TAMANHO_PAGINA && totalPaginas > 1) {
    const remainingResults = await Promise.all(
      Array.from({ length: totalPaginas - 1 }, (_, i) =>
        searchContratacoes({ ...baseParams, pagina: i + 2 })
      )
    )
    for (const r of remainingResults) allData.push(...r.data)
  }

  const totalFetched = allData.length
  const matchingEditais = allData.filter((c) => contemKeyword(c.objetoCompra ?? ''))

  const orgaosMap = new Map<string, {
    nome: string
    municipio: string
    codigoIBGE: string
    count: number
    ultimoEdital: string | null
  }>()

  for (const edital of matchingEditais) {
    const cnpj = edital.orgaoEntidade?.cnpj
    if (!cnpj) continue

    const existing = orgaosMap.get(cnpj)
    const dataEdital = edital.dataPublicacaoPncp ?? null

    if (existing) {
      existing.count++
      if (dataEdital && (!existing.ultimoEdital || dataEdital > existing.ultimoEdital)) {
        existing.ultimoEdital = dataEdital
      }
    } else {
      orgaosMap.set(cnpj, {
        nome: edital.orgaoEntidade?.razaoSocial ?? edital.unidadeOrgao?.nomeUnidade ?? 'Órgão desconhecido',
        municipio: edital.unidadeOrgao?.municipioNome ?? '',
        codigoIBGE: edital.unidadeOrgao?.codigoIBGE ?? '',
        count: 1,
        ultimoEdital: dataEdital,
      })
    }
  }

  const codigosIBGE = [...new Set([...orgaosMap.values()].map((o) => o.codigoIBGE).filter(Boolean))]
  const municipiosCoords: Record<string, { lat: number; lng: number }> = {}
  const municipioUfCoords: Record<string, { lat: number; lng: number }> = {}

  if (codigosIBGE.length > 0) {
    const { data: municipios } = await supabaseAdmin
      .from('municipios')
      .select('codigo_ibge, lat, lng')
      .in('codigo_ibge', codigosIBGE)

    for (const m of municipios ?? []) {
      if (m.lat != null && m.lng != null) {
        municipiosCoords[m.codigo_ibge] = { lat: Number(m.lat), lng: Number(m.lng) }
      }
    }
  }

  const ufNorm = ufNormalized

  // Geocodificar por (município + UF) quando não há coords no banco; chave normalizada (sem acento)
  const toGeocode = new Map<string, { codigoIBGE: string; municipio: string }>()
  for (const org of orgaosMap.values()) {
    if (municipiosCoords[org.codigoIBGE]) continue
    if (!org.municipio?.trim()) continue
    const key = `${normalizeMunicipioKey(org.municipio)}|${ufNorm}`
    if (!toGeocode.has(key)) toGeocode.set(key, { codigoIBGE: org.codigoIBGE || '', municipio: org.municipio.trim() })
  }

  for (const [key, { codigoIBGE, municipio }] of toGeocode) {
    await new Promise((r) => setTimeout(r, NOMINATIM_DELAY_MS))
    const coords = await geocodeMunicipio(municipio, ufNorm)
    if (coords) {
      municipioUfCoords[key] = coords
      if (codigoIBGE) {
        municipiosCoords[codigoIBGE] = coords
        await supabaseAdmin
          .from('municipios')
          .upsert(
            {
              codigo_ibge: codigoIBGE,
              nome: municipio,
              uf: ufNorm,
              lat: coords.lat,
              lng: coords.lng,
            },
            { onConflict: 'codigo_ibge' }
          )
      }
    }
  }

  const cnpjToCoords: Record<string, { lat: number; lng: number } | null> = {}
  for (const [cnpj, org] of orgaosMap.entries()) {
    cnpjToCoords[cnpj] =
      municipiosCoords[org.codigoIBGE] ??
      municipioUfCoords[`${normalizeMunicipioKey(org.municipio)}|${ufNorm}`] ??
      null
  }

  const byMunicipio = new Map<string, Array<{ cnpj: string; org: (typeof orgaosMap extends Map<string, infer V> ? V : never) }>>()
  for (const [cnpj, org] of orgaosMap.entries()) {
    if (!org.municipio?.trim()) continue
    const key = `${normalizeMunicipioKey(org.municipio)}|${ufNorm}`
    if (!byMunicipio.has(key)) byMunicipio.set(key, [])
    byMunicipio.get(key)!.push({ cnpj, org })
  }

  for (const [, group] of byMunicipio) {
    if (group.length <= 1) continue
    for (const { cnpj, org } of group) {
      await new Promise((r) => setTimeout(r, BRASIL_API_DELAY_MS))
      const dados = await fetchBrasilApiCnpj(cnpj)
      const logradouro = dados?.logradouro?.trim()
      const mun = (dados?.municipio ?? org.municipio ?? '').trim()
      const uf = (dados?.uf ?? ufNorm).trim().toUpperCase()
      if (logradouro && mun && uf) {
        const endereco = `${logradouro}, ${mun}, ${uf}`
        await new Promise((r) => setTimeout(r, NOMINATIM_DELAY_MS))
        const coords = await geocodeEndereco(endereco)
        if (coords) cnpjToCoords[cnpj] = coords
      }
    }
  }

  const orgaos: MapaOrgao[] = [...orgaosMap.entries()]
    .map(([cnpj, org]) => {
      const coords = cnpjToCoords[cnpj] ?? null
      return {
        cnpj,
        nome: org.nome,
        municipio: org.municipio,
        municipio_ibge: org.codigoIBGE || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        total_editais: org.count,
        ultimo_edital: org.ultimoEdital,
      }
    })
    .sort((a, b) => b.total_editais - a.total_editais)

  const totalEditaisUf = orgaos.reduce((sum, o) => sum + o.total_editais, 0)
  return { orgaos, totalEditaisUf, totalFetched }
}
