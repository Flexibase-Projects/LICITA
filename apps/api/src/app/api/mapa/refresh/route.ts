// GET /api/mapa/refresh?uf=GO
// Atualiza o cache de órgãos para um único estado (para refresh progressivo no frontend)
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildOrgaosForUf } from '@/lib/mapaCache'

const QuerySchema = z.object({
  uf: z.string().length(2).toUpperCase(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetro uf inválido (ex: SP, GO)' },
      { status: 400 }
    )
  }

  const { uf } = parsed.data

  try {
    const { orgaos, totalEditaisUf } = await buildOrgaosForUf(uf)
    await supabaseAdmin
      .from('mapa_orgaos_cache')
      .upsert(
        {
          uf,
          orgaos_json: orgaos,
          total_editais_uf: totalEditaisUf,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'uf' }
      )
    return NextResponse.json({ ok: true, uf, total: orgaos.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao atualizar ${uf}: ${msg}` }, { status: 502 })
  }
}
