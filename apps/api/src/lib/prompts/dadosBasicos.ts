export const PROMPT_VERSION = '2.0'

export const SYSTEM_DADOS_BASICOS = `Você é um analista sênior de licitações públicas brasileiras com 20 anos de experiência. Sua função é extrair dados estruturados de editais com precisão cirúrgica. Responda SOMENTE com JSON válido, sem texto antes ou depois.`

export function buildPromptDadosBasicos(textoChunk: string, extraRules: string = ''): string {
  return `Extraia os dados básicos do trecho de edital abaixo.

FORMATO DE SAÍDA (JSON obrigatório):
{
  "numero_edital": "string ou null",
  "numero_processo": "string ou null",
  "modalidade": "pregao_eletronico|pregao_presencial|concorrencia|tomada_de_precos|convite|leilao|dispensa|inexigibilidade|outro",
  "objeto": "descrição completa do objeto licitado",
  "orgao": {
    "nome": "nome oficial completo do órgão",
    "nome_curto": "nome resumido e prático do órgão (ex: 'Tribunal de Contas de GO', 'IFSP Campinas', 'Prefeitura de Curitiba')",
    "cnpj": "string no formato XX.XXX.XXX/XXXX-XX ou null",
    "municipio": "string ou null",
    "uf": "UF de 2 letras maiúsculas ou null",
    "esfera": "federal|estadual|municipal"
  },
  "valor_estimado": null_ou_numero_sem_formatacao,
  "data_abertura": "formato ISO8601 ex: 2025-03-15T10:00:00-03:00 ou null",
  "data_encerramento": "formato ISO8601 ou null",
  "prazo_execucao_dias": null_ou_numero_inteiro,
  "endereco_entrega": "string ou null",
  "municipio_entrega": "string ou null",
  "uf_entrega": "UF de 2 letras ou null",
  "condicoes_pagamento": "string descrevendo prazo e forma de pagamento ou null",
  "criterio_julgamento": "menor_preco|maior_desconto|tecnica_e_preco|melhor_tecnica|outro"
}

REGRAS OBRIGATÓRIAS:
- Extraia APENAS informações explicitamente presentes no texto
- Para datas, sempre use ISO 8601 com timezone Brasil (-03:00 ou -02:00)
- Para valores monetários: retorne APENAS o número (ex: 125000.00, NÃO "R$ 125.000,00")
- Se não encontrar um campo, retorne null — NUNCA invente informações
- Para CNPJ mantenha a formatação XX.XXX.XXX/XXXX-XX
- Modalidade "Pregão Eletrônico" → "pregao_eletronico"

REGRAS PARA NOME_CURTO DO ÓRGÃO:
- Remova títulos longos e redundantes
- Use a sigla popular + UF quando houver sigla conhecida (ex: "TCE-GO", "IFSP", "UFMG")
- Se não houver sigla, resuma o nome mantendo a essência + cidade/UF (ex: "Prefeitura de São Paulo", "Câmara de Curitiba")
- Exemplos: "Tribunal de Contas do Estado de Goiás" → "Tribunal de Contas de GO"; "Instituto Federal de São Paulo - Campus Campinas" → "IFSP Campinas"
${extraRules ? `\nREGRAS ADICIONAIS APRENDIDAS:\n${extraRules}\n` : ''}
TEXTO DO EDITAL:
${textoChunk}`
}
