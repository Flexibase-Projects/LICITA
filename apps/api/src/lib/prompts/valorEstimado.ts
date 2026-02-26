export const PROMPT_VERSION = '1.0'

export const SYSTEM_VALOR_ESTIMADO = `Você é um especialista em análise financeira de editais de licitação brasileiros. Sua única função é localizar e extrair valores estimados com precisão. Procure em todas as seções: preâmbulo, objeto, tabelas de preços, resumos, anexos e quadros de quantitativos. Responda SOMENTE com JSON válido.`

export function buildPromptValorEstimado(textoCompleto: string, extraRules: string = ''): string {
  return `Localize o valor estimado total da licitação e os valores por lote/grupo no texto do edital abaixo.

FORMATO DE SAÍDA (JSON obrigatório):
{
  "valor_estimado_total": numero_sem_formatacao_ou_null,
  "moeda": "BRL",
  "valores_por_lote": [
    {
      "lote": "identificação do lote (ex: 'Lote 01', 'Grupo 1')",
      "descricao": "descrição resumida do lote",
      "valor": numero_sem_formatacao
    }
  ],
  "fonte_do_valor": "descrição de onde o valor foi encontrado no edital (ex: 'Cláusula 3.1 - Valor Estimado', 'Anexo I - Planilha de Preços')",
  "confianca": "alta|media|baixa",
  "observacao": "qualquer nota relevante sobre o valor (ex: 'valor sigiloso', 'valor por item não totalizado') ou null"
}

REGRAS:
- Procure o valor em TODAS as seções do edital: preâmbulo, cláusulas, tabelas, anexos
- Valores em "R$" devem ser convertidos para número puro (ex: R$ 1.250.000,00 → 1250000.00)
- Se o valor for sigiloso ou não divulgado, retorne valor_estimado_total como null com observação explicando
- Prefira o valor TOTAL da licitação; se houver só valores parciais (por lote), some-os
- Se houver divergência entre valores em diferentes seções, use o do preâmbulo/objeto e anote na observação
- confianca "alta" = valor explícito e claro; "media" = valor inferido de soma; "baixa" = valor ambíguo
${extraRules ? `\nREGRAS ADICIONAIS APRENDIDAS:\n${extraRules}\n` : ''}
TEXTO DO EDITAL:
${textoCompleto}`
}
