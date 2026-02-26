// Chunking semântico de PDFs para OLLAMA
// Estratégia: detecta seções do edital e cria chunks por seção
// Limite: 3500 tokens ≈ ~14000 caracteres (seguro para num_ctx=8192)

import type { PageText } from './pdfExtractor'

export type SectionType =
  | 'header'        // Preâmbulo, objeto, órgão, datas
  | 'itens'         // Tabelas de itens/produtos/lotes
  | 'habilitacao'   // Requisitos, certidões, certificações
  | 'condicoes'     // Condições de pagamento, entrega, execução
  | 'penalidades'   // Penalidades, sanções
  | 'anexos'        // Anexos e modelos
  | 'other'

export interface TextChunk {
  index: number
  sectionType: SectionType
  text: string
  pageStart: number
  pageEnd: number
  charCount: number
}

// Padrões para detectar início de seção (ordem importa: itens antes de header para não capturar "objeto" no meio)
const SECTION_PATTERNS: Array<{ pattern: RegExp; type: SectionType }> = [
  { pattern: /\b(DOS ITENS|ITENS DO CERTAME|RELAÇÃO DE ITENS|ITENS DA LICITAÇÃO|LISTA DE ITENS)\b/i, type: 'itens' },
  { pattern: /\b(LOTE\s*[ºn]?\s*\d+|GRUPO\s*\d+)\b/i, type: 'itens' },
  { pattern: /\b(TABELA DE PREÇOS|PLANILHA DE PREÇOS|QUANTITATIVO|CRONOGRAMA FÍSICO)\b/i, type: 'itens' },
  { pattern: /\b(OBJETO|DO OBJETO|OBJETO DA LICITAÇÃO)\b/i, type: 'header' },
  { pattern: /\b(DA HABILITAÇÃO|HABILITAÇÃO|DOCUMENTOS DE HABILITAÇÃO|QUALIFICAÇÃO TÉCNICA)\b/i, type: 'habilitacao' },
  { pattern: /\b(DAS CONDIÇÕES|CONDIÇÕES DE PAGAMENTO|DO PAGAMENTO|PRAZO DE ENTREGA|LOCAL DE ENTREGA)\b/i, type: 'condicoes' },
  { pattern: /\b(DAS PENALIDADES|PENALIDADES|SANÇÕES|MULTAS)\b/i, type: 'penalidades' },
  { pattern: /\b(ANEXO\s+[IVX\d]+|MODELO DE PROPOSTA)\b/i, type: 'anexos' },
]

const MAX_CHUNK_CHARS = 14000  // contexto 32k permite chunks maiores
const OVERLAP_CHARS = 800

// Para extração de itens: percorrer TODO o documento com chunks sobrepostos (não depender só da seção)
const ITEM_CHUNK_SIZE = 16000
const ITEM_OVERLAP = 2000

/**
 * Divide o PDF em chunks semânticos baseados nas seções do edital.
 * Retorna array de chunks prontos para enviar ao OLLAMA.
 */
export function chunkPDFPages(pages: PageText[]): TextChunk[] {
  const chunks: TextChunk[] = []

  // Agrupa páginas por seção detectada
  let currentSection: SectionType = 'header'
  let currentPages: PageText[] = []

  const flushSection = () => {
    if (currentPages.length === 0) return

    const fullText = currentPages.map((p) => p.text).join('\n')
    const subChunks = splitToMaxSize(fullText, MAX_CHUNK_CHARS, OVERLAP_CHARS)

    for (const subText of subChunks) {
      chunks.push({
        index: chunks.length,
        sectionType: currentSection,
        text: subText,
        pageStart: currentPages[0].page,
        pageEnd: currentPages[currentPages.length - 1].page,
        charCount: subText.length,
      })
    }
  }

  for (const page of pages) {
    const detectedSection = detectSection(page.text)

    if (detectedSection && detectedSection !== currentSection) {
      flushSection()
      currentSection = detectedSection
      currentPages = [page]
    } else {
      currentPages.push(page)

      // Flush se ficou muito grande
      const totalChars = currentPages.reduce((s, p) => s + p.text.length, 0)
      if (totalChars > MAX_CHUNK_CHARS * 1.5) {
        flushSection()
        // Mantém última página como contexto (overlap)
        currentPages = currentPages.slice(-1)
      }
    }
  }

  flushSection()

  return chunks
}

/**
 * Retorna chunks apenas de uma seção específica.
 */
export function getChunksBySection(chunks: TextChunk[], section: SectionType): TextChunk[] {
  return chunks.filter((c) => c.sectionType === section)
}

/**
 * Retorna todos os chunks de itens (seção principal para análise de produtos).
 */
export function getItemChunks(chunks: TextChunk[]): TextChunk[] {
  return chunks.filter((c) => c.sectionType === 'itens')
}

/**
 * Gera chunks de texto cobrindo TODO o documento para extração de itens.
 * Garante que nenhuma página seja ignorada: usa texto completo com sobreposição.
 * Útil quando a detecção de seção falha ou o edital não tem cabeçalho "DOS ITENS".
 */
export function getFullTextChunksForItems(fullText: string): Array<{ text: string; index: number; total: number }> {
  const result: Array<{ text: string; index: number; total: number }> = []
  if (!fullText || fullText.trim().length === 0) return result

  const len = fullText.length
  let start = 0
  let index = 0

  while (start < len) {
    let end = start + ITEM_CHUNK_SIZE
    if (end >= len) {
      result.push({ text: fullText.slice(start), index, total: 0 })
      break
    }
    const naturalBreak = fullText.lastIndexOf('\n', end)
    if (naturalBreak > start + ITEM_CHUNK_SIZE * 0.6) {
      end = naturalBreak + 1
    }
    result.push({ text: fullText.slice(start, end), index, total: 0 })
    index++
    start = end - ITEM_OVERLAP
  }

  result.forEach((r, i) => { r.total = result.length })
  return result
}

function detectSection(text: string): SectionType | null {
  for (const { pattern, type } of SECTION_PATTERNS) {
    if (pattern.test(text)) return type
  }
  return null
}

function splitToMaxSize(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) return [text]

  const result: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChars

    if (end >= text.length) {
      result.push(text.slice(start))
      break
    }

    // Tenta cortar em fim de parágrafo ou linha
    const naturalBreak = text.lastIndexOf('\n', end)
    if (naturalBreak > start + maxChars * 0.5) {
      end = naturalBreak
    }

    result.push(text.slice(start, end))
    start = end - overlap // overlap para contexto contínuo
  }

  return result
}
