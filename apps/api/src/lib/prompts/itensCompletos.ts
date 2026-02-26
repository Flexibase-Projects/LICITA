export const PROMPT_VERSION = '3.0'

export const SYSTEM_ITENS = `Você é um analista de licitações que extrai itens de editais com fidelidade total ao texto. Sua tarefa é listar TODOS os produtos e serviços a serem adquiridos que aparecem no trecho, preservando numeração, descrições e valores exatamente como no edital. Responda SOMENTE com JSON válido.`

export function buildPromptItens(
  textoChunk: string,
  chunkIndex: number,
  totalChunks: number,
  categorias: string[] = [],
  extraRules: string = ''
): string {
  const categoriasStr = categorias.length > 0
    ? categorias.join(', ')
    : 'mobiliario, assento, equipamento, servico, outro'

  return `Extraia TODOS os itens (produtos/serviços a serem adquiridos) que aparecem no trecho abaixo. Este é o bloco ${chunkIndex + 1} de ${totalChunks} do edital.

OBRIGAÇÕES:
- Seja FIEL ao texto: copie descrições e especificações como estão no edital, sem resumir demais.
- Inclua toda linha de tabela, lista ou quantitativo que represente item a ser comprado/contratado.
- Preserve a numeração exata (número do item, do lote) como no documento.
- Para cada item, preencha o máximo de campos que conseguir (quantidade, unidade, valor unitário, valor total).
- descricao_detalhada deve conter a especificação completa do edital quando houver.
- Valores: use apenas número (ex: 1250.50), sem "R$" ou vírgula de milhar.

FORMATO DE SAÍDA (JSON obrigatório):
{
  "itens": [
    {
      "numero_item": "exatamente como no edital (ex: '001', '1', 'Item 3')",
      "numero_lote": "ex: 'Lote 01', '1' ou null",
      "nome_lote": "nome do lote se houver ou null",
      "descricao": "nome/título do item (até 150 caracteres)",
      "descricao_detalhada": "especificação técnica completa, copiada do edital",
      "unidade": "UN, CJ, M², PCT, KG, etc. ou null",
      "quantidade": número ou null,
      "valor_unitario_estimado": número ou null,
      "valor_total_estimado": número ou null,
      "especificacoes": {
        "material": "ex: MDF 18mm ou null",
        "cor": "ex: Cinza ou null",
        "dimensoes": "ex: 1,60m x 0,80m ou null",
        "normas_tecnicas": ["ABNT NBR ..."],
        "acabamento": "ex: laminado ou null",
        "capacidade_carga": "ex: 120kg ou null"
      },
      "codigo_catmat": "código CATMAT/CATSER se houver ou null",
      "categoria": "uma de: ${categoriasStr}",
      "confianca_quantidade": "alta se número explícito, media se inferido, baixa se ausente"
    }
  ],
  "total_itens_encontrados": número_inteiro,
  "chunk_info": "ex: Bloco com itens 1 a 20"
}

REGRAS:
- Inclua TODOS os itens visíveis neste trecho. Não omita por serem muitos.
- Não invente itens que não estejam no texto.
- Se o trecho não contiver nenhum item (só cláusulas, capa, etc.), retorne: {"itens": [], "total_itens_encontrados": 0, "chunk_info": "Nenhum item neste trecho"}
- Para mobiliário: dimensões em metros (L x P x H), normas ABNT quando citadas.
${extraRules ? `\nREGRAS ADICIONAIS:\n${extraRules}\n` : ''}

TEXTO DO EDITAL (bloco ${chunkIndex + 1}/${totalChunks}):
${textoChunk}`
}
