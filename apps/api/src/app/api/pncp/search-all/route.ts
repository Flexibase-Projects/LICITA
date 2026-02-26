import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchContratacoes } from '@/lib/pncpClient'
import type { PNCPContratacao } from '@licita/shared-types'

const QuerySchema = z.object({
  dataInicial: z.string().regex(/^\d{8}$/).optional(),
  dataFinal: z.string().regex(/^\d{8}$/).optional(),
  modalidade: z.coerce.number().optional(),
  uf: z.string().length(2).optional(),
  limite: z.coerce.number().int().min(1).max(3000).default(1500),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', debug: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const p = parsed.data
  const dataInicial =
    p.dataInicial ??
    (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      return d.toISOString().slice(0, 10).replace(/-/g, '')
    })()
  const dataFinal = p.dataFinal ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const tamanhoPagina = 50
  const limite = p.limite

  const all: PNCPContratacao[] = []
  let pagina = 1
  let totalRegistros = 0
  let totalPaginas = 1

  try {
    while (true) {
      const result = await searchContratacoes({
        dataInicial,
        dataFinal,
        codigoModalidade: p.modalidade,
        uf: p.uf,
        pagina,
        tamanhoPagina,
      })
      const chunk = Array.isArray(result.data) ? result.data : []
      all.push(...chunk)
      totalRegistros = result.totalRegistros ?? all.length
      totalPaginas = result.totalPaginas ?? 1
      if (chunk.length < tamanhoPagina || all.length >= totalRegistros || all.length >= limite) break
      pagina += 1
      if (pagina > totalPaginas || all.length >= limite) break
    }

    const data = all.slice(0, limite)
    return NextResponse.json({
      data,
      totalRegistros,
      totalCarregados: data.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Falha ao carregar PNCP: ${msg}`, debug: { message: msg } },
      { status: 502 }
    )
  }
}
