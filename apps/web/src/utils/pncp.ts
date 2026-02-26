import type { PNCPContratacao } from '@licita/shared-types'

function formatCnpjForUrl(cnpj: string): string {
  const d = (cnpj || '').replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Retorna a URL da compra no portal PNCP para visualização/download manual.
 * Usa linkSistemaOrigem quando disponível; caso contrário monta a URL padrão.
 */
export function getPncpCompraUrl(contratacao: PNCPContratacao): string {
  const link = contratacao?.linkSistemaOrigem?.trim()
  if (link && link.startsWith('http')) return link
  const cnpj = contratacao?.orgaoEntidade?.cnpj ?? ''
  const ano = contratacao?.anoCompra ?? 0
  const seq = contratacao?.sequencialCompra ?? 0
  const cnpjFormatted = formatCnpjForUrl(cnpj)
  return `https://pncp.gov.br/app/contratacao/orgao/${encodeURIComponent(cnpjFormatted)}/${ano}/${seq}`
}
