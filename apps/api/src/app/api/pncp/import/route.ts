import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  getContratacao,
  getItensContratacao,
  getArquivosContratacao,
  mapModalidade,
} from '@/lib/pncpClient'
import type { PNCPItem } from '@licita/shared-types'

const BodySchema = z.object({
  cnpjOrgao: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos sem formatação'),
  anoCompra: z.number().int().min(2000).max(2100),
  sequencialCompra: z.number().int().min(1),
})

function formatCNPJ(digits: string): string {
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function mapEsfera(esferaId: string | number | undefined): 'federal' | 'estadual' | 'municipal' {
  const s = esferaId != null ? String(esferaId).toUpperCase() : ''
  const map: Record<string, 'federal' | 'estadual' | 'municipal'> = {
    F: 'federal',
    E: 'estadual',
    M: 'municipal',
    '1': 'federal',
    '2': 'estadual',
    '3': 'municipal',
  }
  return map[s] ?? 'federal'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { cnpjOrgao, anoCompra, sequencialCompra } = parsed.data

    const codigoPncp = `${cnpjOrgao}-${sequencialCompra}/${anoCompra}`
    const { data: existing } = await supabaseAdmin
      .from('editais')
      .select('id')
      .eq('codigo_pncp', codigoPncp)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        editalId: existing.id,
        message: 'Edital já importado anteriormente',
        hasPdf: false,
        totalItens: 0,
      })
    }

    const [contratacao, itensData, arquivos] = await Promise.all([
      getContratacao(cnpjOrgao, anoCompra, sequencialCompra),
      getItensContratacao(cnpjOrgao, anoCompra, sequencialCompra),
      getArquivosContratacao(cnpjOrgao, anoCompra, sequencialCompra),
    ])

    const orgaoEntidade = contratacao?.orgaoEntidade ?? {}
    const unidadeOrgao = contratacao?.unidadeOrgao ?? {}

    const orgaoData = {
      cnpj: formatCNPJ(cnpjOrgao),
      nome: orgaoEntidade.razaoSocial ?? 'Órgão PNCP',
      uf: unidadeOrgao.ufSigla ?? null,
      municipio: unidadeOrgao.municipioNome ?? null,
      esfera: mapEsfera(orgaoEntidade.esferaId),
    }

    const { data: orgao, error: orgaoError } = await supabaseAdmin
      .from('orgaos')
      .upsert(orgaoData, { onConflict: 'cnpj' })
      .select('id')
      .single()

    if (orgaoError) {
      return NextResponse.json(
        { error: 'Erro ao salvar órgão', debug: orgaoError.message },
        { status: 500 }
      )
    }

    let pdfStoragePath: string | null = null
    let pdfUrl: string | null = null
    const arquivosList = Array.isArray(arquivos) ? arquivos : []
    const editalDoc = arquivosList.find(
      (a: { tipoDocumentoId?: number; titulo?: string }) =>
        a.tipoDocumentoId === 1 || (a.titulo && /edital/i.test(a.titulo))
    )

    if (editalDoc?.url) {
      pdfUrl = editalDoc.url
      try {
        const pdfRes = await fetch(editalDoc.url, { signal: AbortSignal.timeout(30000) })
        if (pdfRes.ok) {
          const buffer = Buffer.from(await pdfRes.arrayBuffer())
          const editalId = crypto.randomUUID()
          pdfStoragePath = `editais/${anoCompra}/${editalId}.pdf`
          await supabaseAdmin.storage
            .from('editais-pdfs')
            .upload(pdfStoragePath, buffer, { contentType: 'application/pdf', upsert: false })
        }
      } catch {
        // PDF não crítico
      }
    }

    const editalId = crypto.randomUUID()
    const modalidadeStr = mapModalidade(Number(contratacao?.modalidadeId ?? 8))
    const editalInsert = {
      id: editalId,
      orgao_id: orgao?.id ?? null,
      numero_edital: String(contratacao?.numeroCompra ?? ''),
      ano: anoCompra,
      numero_sequencial_pncp: String(sequencialCompra),
      codigo_pncp: codigoPncp,
      objeto: contratacao?.objetoCompra ?? 'Objeto não informado',
      modalidade: modalidadeStr,
      valor_estimado: contratacao?.valorTotalEstimado ?? null,
      data_publicacao: contratacao?.dataPublicacaoPncp?.slice(0, 10) ?? null,
      data_abertura_propostas: contratacao?.dataAberturaProposta ?? null,
      data_encerramento: contratacao?.dataEncerramentoProposta ?? null,
      pdf_storage_path: pdfStoragePath,
      pdf_url_pncp: pdfUrl,
      origem: 'pncp' as const,
      status: pdfStoragePath ? ('pending' as const) : ('completed' as const),
    }

    const { error: insertError } = await supabaseAdmin.from('editais').insert(editalInsert)

    if (insertError) {
      return NextResponse.json(
        { error: 'Erro ao salvar edital', debug: insertError.message },
        { status: 500 }
      )
    }

    const itens = Array.isArray(itensData?.data) ? itensData.data : []
    if (itens.length > 0) {
      const itensInsert = itens.map((item: PNCPItem) => ({
        edital_id: editalId,
        numero_item: String(item.numeroItem ?? ''),
        descricao: item.descricao ?? '',
        descricao_detalhada: null,
        especificacoes: {},
        unidade: item.unidadeMedida ?? null,
        quantidade: item.quantidade ?? null,
        valor_unitario_estimado: item.valorUnitarioEstimado ?? null,
        valor_total_estimado:
          item.valorUnitarioEstimado != null && item.quantidade
            ? item.valorUnitarioEstimado * item.quantidade
            : null,
        codigo_item_catalogo: item.codigoCatalogo ?? null,
        tipo_item: item.materialOuServico === 'Material' ? 'material' : 'servico',
      }))

      for (let i = 0; i < itensInsert.length; i += 100) {
        await supabaseAdmin.from('itens_edital').insert(itensInsert.slice(i, i + 100))
      }
    }

    return NextResponse.json(
      {
        editalId,
        message: pdfStoragePath
          ? 'Edital importado. PDF disponível para análise.'
          : 'Edital importado (sem PDF — use o link do PNCP para baixar manualmente).',
        totalItens: itens.length,
        hasPdf: !!pdfStoragePath,
      },
      { status: 201 }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404 ? 404 : 500
    return NextResponse.json(
      { error: `Falha na importação: ${msg}`, debug: msg },
      { status }
    )
  }
}
