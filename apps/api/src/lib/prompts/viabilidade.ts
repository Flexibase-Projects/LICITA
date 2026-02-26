export const PROMPT_VERSION = '1.0'

export const SYSTEM_VIABILIDADE = `Você é um consultor sênior especializado em análise de viabilidade para fabricantes de mobiliário corporativo, escolar e hospitalar em licitações públicas brasileiras. Sua análise deve ser realista, objetiva e útil para tomada de decisão. Responda SOMENTE com JSON válido.`

export function buildPromptViabilidade(dadosEdital: unknown): string {
  return `Com base nos dados extraídos do edital abaixo, determine a viabilidade de participação de uma empresa fabricante de mobiliário.

PERFIL DA EMPRESA:
- Fabricante de mobiliário corporativo, escolar e hospitalar
- Materiais dominados: MDF, MDP, aço SAE 1020, madeira maciça de reflorestamento
- Certificações ABNT disponíveis para linhas padrão de produto
- Capacidade de produção: média (até 500 peças/mês para projetos complexos)
- Raio de entrega econômica: até 600km sem custo logístico elevado
- Prazo mínimo de produção: 30 dias para lotes pequenos, 60-90 dias para grandes

DADOS DO EDITAL (JSON):
${JSON.stringify(dadosEdital, null, 2)}

FORMATO DE SAÍDA (JSON obrigatório):
{
  "veredicto": "viavel|parcialmente_viavel|inviavel",
  "score": numero_entre_0_e_100,
  "justificativa": "parágrafo objetivo explicando o veredicto geral",
  "itens_analise": [
    {
      "numero_item": "string",
      "descricao": "descrição resumida",
      "pode_produzir": true_ou_false,
      "nota_viabilidade": numero_entre_0_e_100,
      "justificativa": "por que pode ou não produzir este item",
      "restricoes": ["lista de restrições específicas"]
    }
  ],
  "pontos_atencao": [
    "alertas importantes que a equipe de licitação precisa verificar"
  ],
  "vantagens_competitivas": [
    "pontos onde a empresa tem diferencial ou vantagem"
  ],
  "certificacoes_faltantes": [
    "certificações que a empresa precisaria obter para este edital"
  ],
  "estimativa_complexidade": "baixa|media|alta",
  "impacto_logistico": "baixo|medio|alto",
  "recomendacao": "Frase direta: PARTICIPAR / NÃO PARTICIPAR / PARTICIPAR COM RESSALVAS — seguida de motivo em 1-2 frases"
}

CRITÉRIOS DE ANÁLISE:
- Mobiliário padrão (cadeiras, mesas, armários comuns) → viabilidade alta
- Itens com madeira maciça exótica certificada FSC → restrição importante
- Ensaios INMETRO/ABNT obrigatórios pré-licitação → dificuldade alta, tempo de certificação
- Volumes acima de 1000 unidades com prazo menor de 60 dias → risco de capacidade
- Entrega em local acima de 600km → impacto logístico médio-alto
- Garantia de execução acima de 10% do valor → atenção ao capital de giro
- Normas técnicas muito específicas → verificar se empresa já está adequada`
}
