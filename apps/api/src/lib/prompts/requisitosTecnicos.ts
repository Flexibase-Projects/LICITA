export const PROMPT_VERSION = '2.0'

export const SYSTEM_REQUISITOS = `Você é um especialista sênior em compliance e habilitação de licitações públicas brasileiras. Analise o edital como um consultor de licitações experiente, identificando TODOS os requisitos organizados por categoria. Seja minucioso e preciso. Responda SOMENTE com JSON válido.`

export function buildPromptRequisitos(textoChunk: string, extraRules: string = ''): string {
  return `Extraia TODOS os requisitos de habilitação, documentos exigidos, certificações e prazos importantes do trecho de edital abaixo. Organize por categoria.

FORMATO DE SAÍDA (JSON obrigatório):
{
  "habilitacao_juridica": [
    {
      "descricao": "descrição completa do documento/requisito exigido",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "nota adicional relevante ou null"
    }
  ],
  "qualificacao_tecnica": [
    {
      "descricao": "descrição do requisito técnico",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota relevante"
    }
  ],
  "qualificacao_economica": [
    {
      "descricao": "requisito econômico-financeiro",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota"
    }
  ],
  "documentos_fiscais": [
    {
      "descricao": "certidão ou documento fiscal exigido",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota"
    }
  ],
  "requisitos_amostra": [
    {
      "descricao": "exigência de amostra, laudo ou ensaio",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota"
    }
  ],
  "garantias": [
    {
      "descricao": "garantia exigida (proposta, contrato, execução)",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota com percentual/valor"
    }
  ],
  "prazos_importantes": [
    {
      "descricao": "prazo ou data crítica",
      "data": "ISO8601 ou null",
      "obrigatorio": true,
      "dificuldade": "baixa|media|alta",
      "observacao": "null ou nota"
    }
  ],
  "certificacoes": [
    {
      "nome": "nome oficial da certificação",
      "tipo": "abnt|inmetro|iso|procel|anvisa|bpm|outro",
      "norma": "ex: ABNT NBR 16069:2012 ou null",
      "descricao": "o que exige especificamente",
      "obrigatoria": true,
      "aplica_a": "geral ou descrição do item"
    }
  ],
  "visita_tecnica_obrigatoria": true_ou_false_ou_null,
  "resumo_requisitos": "parágrafo resumindo os principais requisitos e pontos de atenção para participação"
}

CRITÉRIOS DE DIFICULDADE:
- "baixa": documento padrão, fácil de obter (certidões negativas, contrato social)
- "media": requer preparação prévia (atestados de capacidade, registro em conselho)
- "alta": demorado ou custoso (ensaios laboratoriais, certificação INMETRO, amostras)

INSTRUÇÕES PARA MOBILIÁRIO:
- Identifique normas ABNT: NBR 13961 (escritório), NBR 16069 (madeira), NBR 15963 (escolar), NBR 14790 (estofado)
- Capture exigências de ensaios em laboratório acreditado INMETRO/ABNT
- Verifique certificado de origem (FSC, IBAMA)
- Identifique atestados de capacidade técnica e quantidades mínimas exigidas
- Verifique exigência de registro CREA, CAU ou outros conselhos
${extraRules ? `\nREGRAS ADICIONAIS APRENDIDAS:\n${extraRules}\n` : ''}
TEXTO DO EDITAL:
${textoChunk}`
}
