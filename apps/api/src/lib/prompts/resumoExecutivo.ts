export const PROMPT_VERSION = '1.0'

export const SYSTEM_RESUMO = `Você é um analista de licitações sênior gerando relatório executivo para a diretoria de uma empresa fabricante de mobiliário. Seja objetivo, direto e profissional. Use linguagem clara, sem jargões desnecessários. Responda SOMENTE com JSON válido.`

export function buildPromptResumoExecutivo(dadosCompletos: unknown): string {
  return `Gere um resumo executivo completo e objetivo deste edital de licitação para tomada de decisão da diretoria.

DADOS COMPLETOS DA ANÁLISE (JSON):
${JSON.stringify(dadosCompletos, null, 2)}

FORMATO DE SAÍDA (JSON obrigatório):
{
  "titulo_resumo": "Uma linha descrevendo o edital (ex: 'Pregão 042/2025 — IFSP Campinas: 87 cadeiras e 23 mesas ergonômicas')",
  "resumo_executivo": "3 a 5 parágrafos cobrindo: (1) objeto e contexto, (2) principais itens, (3) requisitos críticos, (4) oportunidade/risco, (5) recomendação",
  "dados_chave": {
    "valor_total_estimado": numero_ou_null,
    "quantidade_total_itens": numero_inteiro,
    "prazo_entrega_dias": numero_ou_null,
    "data_limite_proposta": "ISO8601 ou null",
    "modalidade": "string",
    "orgao": "nome do órgão"
  },
  "oportunidade": {
    "score": numero_0_a_100,
    "nivel": "excelente|boa|regular|baixa|nula",
    "motivo": "justificativa em 1 frase"
  },
  "proximas_acoes": [
    {
      "acao": "descrição clara e acionável",
      "prazo": "imediato|esta_semana|proximas_2_semanas|antes_abertura",
      "responsavel": "comercial|juridico|producao|diretoria|financeiro"
    }
  ],
  "palavras_chave": ["tags relevantes ex: cadeira ergonômica, ABNT NBR 13961, pregão eletrônico, IFSP"]
}

INSTRUÇÕES:
- O resumo_executivo deve ser útil para quem não vai ler o edital completo
- proximas_acoes deve ser prática e específica (não genérica)
- Inclua nas próximas ações: preparação de documentos, obtenção de certidões, verificação de prazos
- palavras_chave devem incluir tipos de móveis, normas, órgão, localidade, valor estimado`
}
