import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { UploadResponse } from '@licita/shared-types'

const MAX_SIZE_BYTES = 500 * 1024 * 1024 // 500MB

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
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'Formulário inválido' }, { status: 400, headers: CORS_HEADERS })
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400, headers: CORS_HEADERS })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400, headers: CORS_HEADERS })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo excede 500MB' }, { status: 413, headers: CORS_HEADERS })
    }

    const editalId = crypto.randomUUID()
    const year = new Date().getFullYear()
    const storagePath = `editais/${year}/${editalId}.pdf`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('editais-pdfs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Falha no upload: ${uploadError.message}` }, { status: 500, headers: CORS_HEADERS })
    }

    const { error: dbError } = await supabaseAdmin.from('editais').insert({
      id: editalId,
      objeto: file.name.replace('.pdf', '').replace(/_/g, ' '),
      pdf_storage_path: storagePath,
      pdf_tamanho_bytes: file.size,
      origem: 'upload',
      status: 'pending',
    })

    if (dbError) {
      await supabaseAdmin.storage.from('editais-pdfs').remove([storagePath])
      return NextResponse.json({ error: `Falha ao registrar edital: ${dbError.message}` }, { status: 500, headers: CORS_HEADERS })
    }

    const response: UploadResponse = {
      editalId,
      storagePath,
      message: 'Upload realizado com sucesso. Pronto para análise.',
    }

    return NextResponse.json(response, { status: 201, headers: CORS_HEADERS })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[upload]', err)
    }
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
