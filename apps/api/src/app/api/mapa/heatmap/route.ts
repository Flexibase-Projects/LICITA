// GET /api/mapa/heatmap
// Retorna intensidade de editais por UF (mesma fonte que a lista: mapa_orgaos_cache).
// Fallback: se cache novo vazio/expirado, usa mapa_heatmap_cache para exibir cores enquanto atualiza.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildOrgaosForUf, CACHE_TTL_MINUTES } from '@/lib/mapaCache'
import type { MapaEstadoHeat, MapaHeatmapResponse } from '@licita/shared-types'

const ESTADO_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AC: { lat: -9.0238, lng: -70.812 },
  AL: { lat: -9.5713, lng: -36.782 },
  AM: { lat: -4.4197, lng: -63.5806 },
  AP: { lat: -1.4102, lng: -51.7703 },
  BA: { lat: -12.5797, lng: -41.7007 },
  CE: { lat: -5.4984, lng: -39.3206 },
  DF: { lat: -15.7217, lng: -47.9292 },
  ES: { lat: -19.1834, lng: -40.3089 },
  GO: { lat: -15.827, lng: -49.8362 },
  MA: { lat: -5.42, lng: -45.4409 },
  MG: { lat: -18.512, lng: -44.555 },
  MS: { lat: -20.7722, lng: -54.7852 },
  MT: { lat: -12.6819, lng: -56.9211 },
  PA: { lat: -3.4168, lng: -52.0 },
  PB: { lat: -7.24, lng: -36.782 },
  PE: { lat: -8.8137, lng: -36.9541 },
  PI: { lat: -7.7183, lng: -42.7289 },
  PR: { lat: -24.7822, lng: -51.9897 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  RN: { lat: -5.8127, lng: -36.2032 },
  RO: { lat: -11.5057, lng: -63.5806 },
  RR: { lat: -1.9905, lng: -61.3306 },
  RS: { lat: -30.0346, lng: -51.2177 },
  SC: { lat: -27.5954, lng: -48.548 },
  SE: { lat: -10.5741, lng: -37.3857 },
  SP: { lat: -23.5505, lng: -46.6333 },
  TO: { lat: -10.2512, lng: -48.3243 },
}

const UFS = Object.keys(ESTADO_CENTROIDS)

export async function GET() {
  try {
    const { data: cached } = await supabaseAdmin
      .from('mapa_orgaos_cache')
      .select('uf, total_editais_uf, updated_at')

    const now = Date.now()
    const ttlMs = CACHE_TTL_MINUTES * 60 * 1000
    const allFresh = cached && cached.length === UFS.length && cached.every((row) => {
      const age = now - new Date(row.updated_at).getTime()
      return age < ttlMs
    })

    if (allFresh && cached && cached.length > 0) {
      const byUf = Object.fromEntries(cached.map((r) => [r.uf, r]))
      const estados: MapaEstadoHeat[] = UFS.map((uf) => ({
        uf,
        count: Number(byUf[uf]?.total_editais_uf ?? 0),
        lat: ESTADO_CENTROIDS[uf].lat,
        lng: ESTADO_CENTROIDS[uf].lng,
        updated_at: byUf[uf]?.updated_at ?? new Date().toISOString(),
      }))
      const ageMinutes = (now - new Date(cached[0].updated_at).getTime()) / 60000
      return NextResponse.json<MapaHeatmapResponse>({
        estados,
        cache_age_minutes: Math.round(ageMinutes),
      })
    }

    // Fallback: quando o novo cache está vazio, usar mapa_heatmap_cache para exibir cores
    const newCacheEmpty = !cached || cached.length === 0
    if (newCacheEmpty) {
      const { data: oldCache } = await supabaseAdmin
        .from('mapa_heatmap_cache')
        .select('uf, count, updated_at')
      if (oldCache && oldCache.length > 0) {
        const byUfOld = Object.fromEntries(oldCache.map((r) => [r.uf, r]))
        const estadosFallback: MapaEstadoHeat[] = UFS.map((uf) => ({
          uf,
          count: Number(byUfOld[uf]?.count ?? 0),
          lat: ESTADO_CENTROIDS[uf].lat,
          lng: ESTADO_CENTROIDS[uf].lng,
          updated_at: byUfOld[uf]?.updated_at ?? new Date().toISOString(),
        }))
        const ageMinutesOld = oldCache[0]?.updated_at
          ? (now - new Date(oldCache[0].updated_at).getTime()) / 60000
          : 999
        return NextResponse.json<MapaHeatmapResponse>({
          estados: estadosFallback,
          cache_age_minutes: Math.round(ageMinutesOld),
        })
      }
    }

    // Cache expirado ou incompleto — atualizar todas as UFs (mesma lógica da lista)
    const BATCH = 4
    for (let i = 0; i < UFS.length; i += BATCH) {
      const batch = UFS.slice(i, i + BATCH)
      await Promise.all(
        batch.map(async (uf) => {
          try {
            const { orgaos, totalEditaisUf } = await buildOrgaosForUf(uf)
            await supabaseAdmin
              .from('mapa_orgaos_cache')
              .upsert({
                uf,
                orgaos_json: orgaos,
                total_editais_uf: totalEditaisUf,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'uf' })
          } catch {
            // manter cache antigo se existir; senão zero
            await supabaseAdmin
              .from('mapa_orgaos_cache')
              .upsert({
                uf,
                orgaos_json: [],
                total_editais_uf: 0,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'uf' })
          }
        })
      )
    }

    const { data: after } = await supabaseAdmin
      .from('mapa_orgaos_cache')
      .select('uf, total_editais_uf, updated_at')

    const byUf = Object.fromEntries((after ?? []).map((r) => [r.uf, r]))
    const estados: MapaEstadoHeat[] = UFS.map((uf) => ({
      uf,
      count: Number(byUf[uf]?.total_editais_uf ?? 0),
      lat: ESTADO_CENTROIDS[uf].lat,
      lng: ESTADO_CENTROIDS[uf].lng,
      updated_at: byUf[uf]?.updated_at ?? new Date().toISOString(),
    }))

    return NextResponse.json<MapaHeatmapResponse>({
      estados,
      cache_age_minutes: 0,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao gerar heatmap: ${msg}` }, { status: 502 })
  }
}
