// GET /api/mapa/geojson-estados
// Retorna GeoJSON com um feature por estado (UF), cada um com properties.sigla
// A API v3 do IBGE (paises/BR?divisao=estados) retorna só o país inteiro; usamos v4 por estado.
import { NextResponse } from 'next/server'
import type { Feature, FeatureCollection } from 'geojson'

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

const IBGE_V4_BASE = 'https://servicodados.ibge.gov.br/api/v4/malhas/estados'

// Cache em memória (TTL 24h) para não bater no IBGE a cada request
let cached: FeatureCollection | null = null
let cachedAt = 0
const CACHE_MS = 24 * 60 * 60 * 1000

export async function GET() {
  try {
    if (cached && Date.now() - cachedAt < CACHE_MS) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        },
      })
    }

    const results = await Promise.allSettled(
      UFS.map(async (uf) => {
        const res = await fetch(
          `${IBGE_V4_BASE}/${uf}?formato=application/vnd.geo%2Bjson`,
          { signal: AbortSignal.timeout(15000) }
        )
        if (!res.ok) throw new Error(`IBGE ${uf}: ${res.status}`)
        const data = (await res.json()) as FeatureCollection
        const feature = data?.features?.[0]
        if (!feature) throw new Error(`IBGE ${uf}: sem feature`)
        return { ...feature, properties: { ...feature.properties, sigla: uf } } as Feature
      })
    )

    const features: Feature[] = []
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled') features.push(r.value)
      // Se um estado falhar, continuamos com os demais
    }

    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }

    cached = featureCollection
    cachedAt = Date.now()

    return NextResponse.json(featureCollection, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao obter GeoJSON dos estados: ${msg}` }, { status: 502 })
  }
}
