// pdfjs-dist: extração de texto de PDFs página a página
// Estratégia: stream de páginas para não estourar memória em PDFs de 300+ páginas

export interface PageText {
  page: number
  text: string
  wordCount: number
}

export interface ExtractedPDF {
  pages: PageText[]
  totalPages: number
  totalWords: number
  fullText: string
}

/**
 * Resolve o worker do pdfjs-dist em runtime, escondendo o path do bundler.
 */
function resolveWorkerSrc(): string {
  const { pathToFileURL } = require('node:url') as typeof import('node:url')
  const { createRequire } = require('node:module') as typeof import('node:module')
  const _require = createRequire(__filename)
  const pkg = 'pdfjs-dist'
  const subpath = '/legacy/build/pdf.worker.mjs'
  return pathToFileURL(_require.resolve(pkg + subpath)).href
}

/**
 * Extrai texto de um Buffer de PDF usando pdfjs-dist.
 * Processa página a página para eficiência de memória.
 */
export async function extractPDFText(buffer: Buffer): Promise<ExtractedPDF> {
  // Dynamic import — o bundler não tenta resolver porque pdfjs-dist está em serverExternalPackages
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  pdfjsLib.GlobalWorkerOptions.workerSrc = resolveWorkerSrc()

  const uint8Array = new Uint8Array(buffer)
  const pdfDoc = await pdfjsLib.getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const totalPages = pdfDoc.numPages
  const pages: PageText[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Concatena itens de texto da página
    const pageText = textContent.items
      .filter((item) => 'str' in item && typeof (item as { str: unknown }).str === 'string')
      .map((item) => (item as { str: string }).str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    const wordCount = pageText.split(/\s+/).filter(Boolean).length

    pages.push({ page: pageNum, text: pageText, wordCount })

    // Libera recursos da página
    page.cleanup()
  }

  const fullText = pages.map((p) => p.text).join('\n\n')
  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0)

  return { pages, totalPages, totalWords, fullText }
}
