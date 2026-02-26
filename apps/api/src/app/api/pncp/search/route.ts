import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchContratacoes } from '@/lib/pncpClient'

const QuerySchema = z.object({
  dataInicial: z.string().regex(/^\d{8}$/).optional(),
  dataFinal: z.string().regex(/^\d{8}$/).optional(),
  modalidade: z.coerce.number().optional(),
  uf: z.string().length(2).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(50).default(20),
  palavraChave: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', debug: { details: parsed.error.flatten() } },
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

  const requestParams = {
    dataInicial,
    dataFinal,
    codigoModalidade: p.modalidade,
    uf: p.uf,
    pagina: p.pagina,
    tamanhoPagina: p.tamanhoPagina,
    palavraChave: p.palavraChave?.trim() || undefined,
  }

  try {
    const result = await searchContratacoes(requestParams)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const debug: Record<string, unknown> = {
      requestParams,
      message: msg,
    }
    if (err && typeof err === 'object') {
      if ('cause' in err) debug.cause = String((err as { cause?: unknown }).cause)
      if ('debug' in err) Object.assign(debug, (err as { debug?: Record<string, unknown> }).debug)
    }
    return NextResponse.json(
      { error: `Falha ao consultar PNCP: ${msg}`, debug },
      { status: 502 }
    )
  }
}
