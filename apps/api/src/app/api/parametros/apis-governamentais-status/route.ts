import { NextResponse } from 'next/server'

export type ApiGovernamentalStatus = {
  id: string
  nome: string
  descricao: string
  url: string
  status: 'ok' | 'erro'
  mensagem?: string
  verificadoEm: string
}

/** Verifica se as APIs governamentais usadas pelo sistema estão acessíveis. */
export async function GET() {
  const verificadoEm = new Date().toISOString()
  const results: ApiGovernamentalStatus[] = []

  // PNCP – Portal Nacional de Contratações Públicas
  try {
    const dataInicial = new Date()
    dataInicial.setDate(dataInicial.getDate() - 1)
    const dataFinal = new Date()
    const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial.toISOString().slice(0, 10).replace(/-/g, '')}&dataFinal=${dataFinal.toISOString().slice(0, 10).replace(/-/g, '')}&codigoModalidadeContratacao=8&pagina=1&tamanhoPagina=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      results.push({
        id: 'pncp',
        nome: 'Portal Nacional de Contratações Públicas (PNCP)',
        descricao: 'Busca de editais e contratações públicas',
        url: 'https://pncp.gov.br/api/consulta/v1',
        status: 'ok',
        verificadoEm,
      })
    } else {
      results.push({
        id: 'pncp',
        nome: 'Portal Nacional de Contratações Públicas (PNCP)',
        descricao: 'Busca de editais e contratações públicas',
        url: 'https://pncp.gov.br/api/consulta/v1',
        status: 'erro',
        mensagem: `Resposta ${res.status}`,
        verificadoEm,
      })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({
      id: 'pncp',
      nome: 'Portal Nacional de Contratações Públicas (PNCP)',
      descricao: 'Busca de editais e contratações públicas',
      url: 'https://pncp.gov.br/api/consulta/v1',
      status: 'erro',
      mensagem: msg,
      verificadoEm,
    })
  }

  // IBGE – Malhas dos estados (GeoJSON)
  try {
    const res = await fetch(
      'https://servicodados.ibge.gov.br/api/v4/malhas/estados/SP?formato=application/vnd.geo%2Bjson',
      { signal: AbortSignal.timeout(10000) }
    )
    if (res.ok) {
      results.push({
        id: 'ibge',
        nome: 'IBGE – Malhas Territoriais',
        descricao: 'Contornos dos estados para o mapa',
        url: 'https://servicodados.ibge.gov.br/api/v4/malhas/estados',
        status: 'ok',
        verificadoEm,
      })
    } else {
      results.push({
        id: 'ibge',
        nome: 'IBGE – Malhas Territoriais',
        descricao: 'Contornos dos estados para o mapa',
        url: 'https://servicodados.ibge.gov.br/api/v4/malhas/estados',
        status: 'erro',
        mensagem: `Resposta ${res.status}`,
        verificadoEm,
      })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({
      id: 'ibge',
      nome: 'IBGE – Malhas Territoriais',
      descricao: 'Contornos dos estados para o mapa',
      url: 'https://servicodados.ibge.gov.br/api/v4/malhas/estados',
      status: 'erro',
      mensagem: msg,
      verificadoEm,
    })
  }

  // Brasil API – CNPJ (CNPJ público de teste da Receita)
  try {
    const res = await fetch('https://brasilapi.com.br/api/cnpj/v1/00000000000191', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      results.push({
        id: 'brasilapi-cnpj',
        nome: 'Brasil API – Consulta CNPJ',
        descricao: 'Dados de órgãos por CNPJ no mapa',
        url: 'https://brasilapi.com.br/api/cnpj/v1',
        status: 'ok',
        verificadoEm,
      })
    } else {
      results.push({
        id: 'brasilapi-cnpj',
        nome: 'Brasil API – Consulta CNPJ',
        descricao: 'Dados de órgãos por CNPJ no mapa',
        url: 'https://brasilapi.com.br/api/cnpj/v1',
        status: 'erro',
        mensagem: `Resposta ${res.status}`,
        verificadoEm,
      })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({
      id: 'brasilapi-cnpj',
      nome: 'Brasil API – Consulta CNPJ',
      descricao: 'Dados de órgãos por CNPJ no mapa',
      url: 'https://brasilapi.com.br/api/cnpj/v1',
      status: 'erro',
      mensagem: msg,
      verificadoEm,
    })
  }

  // Nominatim (OpenStreetMap) – Geocodificação
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', 'São Paulo, Brasil')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'LICITA-Pro/1.0 (contato@licita.local)' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      results.push({
        id: 'nominatim',
        nome: 'OpenStreetMap – Nominatim',
        descricao: 'Geocodificação de endereços e municípios',
        url: 'https://nominatim.openstreetmap.org',
        status: 'ok',
        verificadoEm,
      })
    } else {
      results.push({
        id: 'nominatim',
        nome: 'OpenStreetMap – Nominatim',
        descricao: 'Geocodificação de endereços e municípios',
        url: 'https://nominatim.openstreetmap.org',
        status: 'erro',
        mensagem: `Resposta ${res.status}`,
        verificadoEm,
      })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({
      id: 'nominatim',
      nome: 'OpenStreetMap – Nominatim',
      descricao: 'Geocodificação de endereços e municípios',
      url: 'https://nominatim.openstreetmap.org',
      status: 'erro',
      mensagem: msg,
      verificadoEm,
    })
  }

  return NextResponse.json({
    apis: results,
    verificadoEm,
  })
}
