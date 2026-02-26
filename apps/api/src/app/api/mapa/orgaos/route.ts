// GET /api/mapa/orgaos?uf=SP
// Retorna órgãos do estado a partir do cache (mesma fonte do heatmap); sem PNCP ao selecionar
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildOrgaosForUf, CACHE_TTL_MINUTES } from '@/lib/mapaCache'
import type { MapaOrgao, MapaOrgaosResponse } from '@licita/shared-types'

const QuerySchema = z.object({
  uf: z.string().length(2).toUpperCase(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetro uf inválido (ex: SP, RJ, MG)' },
      { status: 400 }
    )
  }

  const { uf } = parsed.data

  try {
    const { data: row } = await supabaseAdmin
      .from('mapa_orgaos_cache')
      .select('orgaos_json, updated_at')
      .eq('uf', uf)
      .single()

    const now = Date.now()
    const ageMs = row?.updated_at ? now - new Date(row.updated_at).getTime() : Infinity
    const isFresh = ageMs < CACHE_TTL_MINUTES * 60 * 1000

    if (row?.orgaos_json != null && isFresh) {
      const orgaos = (Array.isArray(row.orgaos_json) ? row.orgaos_json : []) as MapaOrgao[]
      const withCoords = orgaos.filter((o) => o.lat != null && o.lng != null)
      const uniquePositions = new Set(withCoords.map((o) => `${o.lat},${o.lng}`)).size
      const uniqueMunicipios = new Set(orgaos.map((o) => (o.municipio ?? '').trim().toLowerCase()).filter(Boolean)).size
      const cacheInvalid =
        withCoords.length > 1 &&
        uniquePositions === 1 &&
        uniqueMunicipios > 1
      if (!cacheInvalid) {
        return NextResponse.json<MapaOrgaosResponse>({
          orgaos,
          uf,
          total: orgaos.length,
        })
      }
    }

    // Cache ausente, expirado ou inválido (todos no mesmo lugar) — atualizar só esta UF e devolver
    const { orgaos, totalEditaisUf } = await buildOrgaosForUf(uf)
    await supabaseAdmin
      .from('mapa_orgaos_cache')
      .upsert({
        uf,
        orgaos_json: orgaos,
        total_editais_uf: totalEditaisUf,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'uf' })

    return NextResponse.json<MapaOrgaosResponse>({
      orgaos,
      uf,
      total: orgaos.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao buscar órgãos: ${msg}` }, { status: 502 })
  }
}
