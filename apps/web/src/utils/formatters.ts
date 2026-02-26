export function formatBRL(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function formatModalidade(value: string | null | undefined): string {
  const map: Record<string, string> = {
    pregao_eletronico: 'Pregão Eletrônico',
    pregao_presencial: 'Pregão Presencial',
    concorrencia: 'Concorrência',
    tomada_de_precos: 'Tomada de Preços',
    convite: 'Convite',
    leilao: 'Leilão',
    dispensa: 'Dispensa de Licitação',
    inexigibilidade: 'Inexigibilidade',
    outro: 'Outro',
  }
  return map[value ?? ''] ?? (value ?? '—')
}

export function formatViabilidade(value: string | null | undefined): string {
  const map: Record<string, string> = {
    viavel: 'Viável',
    parcialmente_viavel: 'Parcialmente Viável',
    inviavel: 'Inviável',
  }
  return map[value ?? ''] ?? '—'
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
