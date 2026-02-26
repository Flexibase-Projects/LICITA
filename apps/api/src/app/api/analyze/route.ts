import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { extractPDFText } from '@/lib/pdfExtractor'
import { runAnalysisPipeline } from '@/lib/analysisOrchestrator'
import { DEFAULT_MODEL } from '@/lib/ollamaClient'
import type { SSEEvent } from '@licita/shared-types'

const BodySchema = z.object({
  editalId: z.string().uuid(),
  model: z.string().optional(),
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:8080',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
} as const

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'editalId UUID obrigatório' }, {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const { editalId, model = DEFAULT_MODEL } = parsed.data

    const { data: edital, error: editalError } = await supabaseAdmin
      .from('editais')
      .select('id, pdf_storage_path, status')
      .eq('id', editalId)
      .single()

    if (editalError || !edital) {
      return NextResponse.json({ error: 'Edital não encontrado' }, {
        status: 404,
        headers: CORS_HEADERS,
      })
    }

    if (!edital.pdf_storage_path) {
      return NextResponse.json({ error: 'Edital sem PDF associado' }, {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: SSEEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        try {
          await supabaseAdmin
            .from('editais')
            .update({ status: 'extracting' })
            .eq('id', editalId)

          sendEvent({ step: 'extracting', progress: 5, message: 'Baixando PDF do storage...' })

          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('editais-pdfs')
            .download(edital.pdf_storage_path)

          if (downloadError || !fileData) {
            throw new Error(`Falha ao baixar PDF: ${downloadError?.message}`)
          }

          const buffer = Buffer.from(await fileData.arrayBuffer())

          sendEvent({ step: 'extracting', progress: 8, message: 'Extraindo texto do PDF...' })

          const extracted = await extractPDFText(buffer)

          await supabaseAdmin
            .from('editais')
            .update({ total_paginas: extracted.totalPages })
            .eq('id', editalId)

          sendEvent({
            step: 'extracting',
            progress: 12,
            message: `PDF com ${extracted.totalPages} páginas e ~${extracted.totalWords.toLocaleString('pt-BR')} palavras. Iniciando análise...`,
          })

          await runAnalysisPipeline(editalId, extracted, model, sendEvent)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          sendEvent({ step: 'error', progress: 0, message: msg, error: msg })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...CORS_HEADERS,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/analyze] 500:', msg)
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS })
  }
}
