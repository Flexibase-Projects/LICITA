import { NextResponse } from 'next/server'

/** Catálogo dos endpoints da API com nomes e parâmetros humanizados (somente leitura). */
export type EndpointItem = {
  nome: string
  descricao: string
  metodo: string
  caminho: string
  parametros: { nome: string; descricao: string; obrigatorio: boolean; exemplo?: string }[]
}

const ENDPOINTS: EndpointItem[] = [
  {
    nome: 'Listar editais',
    descricao: 'Lista editais com filtros e paginação',
    metodo: 'GET',
    caminho: '/api/editais',
    parametros: [
      { nome: 'search', descricao: 'Busca por texto no objeto, órgão ou número do edital', obrigatorio: false, exemplo: 'mobiliário' },
      { nome: 'status', descricao: 'Fase do edital', obrigatorio: false, exemplo: 'pending | extracting | analyzing | completed | error' },
      { nome: 'viabilidade', descricao: 'Veredicto de viabilidade', obrigatorio: false, exemplo: 'viavel | parcialmente_viavel | inviavel' },
      { nome: 'modalidade', descricao: 'Modalidade de licitação', obrigatorio: false },
      { nome: 'uf', descricao: 'Sigla do estado (2 letras)', obrigatorio: false, exemplo: 'SP' },
      { nome: 'page', descricao: 'Página da listagem', obrigatorio: false, exemplo: '1' },
      { nome: 'pageSize', descricao: 'Itens por página (máx. 100)', obrigatorio: false, exemplo: '20' },
      { nome: 'orderBy', descricao: 'Campo para ordenação', obrigatorio: false, exemplo: 'created_at' },
      { nome: 'order', descricao: 'Direção da ordenação', obrigatorio: false, exemplo: 'asc | desc' },
    ],
  },
  {
    nome: 'Detalhe de um edital',
    descricao: 'Retorna dados completos de um edital pelo ID',
    metodo: 'GET',
    caminho: '/api/editais/[id]',
    parametros: [
      { nome: 'id', descricao: 'ID (UUID) do edital na URL', obrigatorio: true },
    ],
  },
  {
    nome: 'Reavaliar viabilidade',
    descricao: 'Dispara nova análise de viabilidade do edital',
    metodo: 'POST',
    caminho: '/api/editais/[id]/viabilidade',
    parametros: [{ nome: 'id', descricao: 'ID do edital na URL', obrigatorio: true }],
  },
  {
    nome: 'Viabilidade logística',
    descricao: 'Calcula viabilidade logística (distância, frete, prazos)',
    metodo: 'GET',
    caminho: '/api/editais/[id]/viabilidade-logistica',
    parametros: [{ nome: 'id', descricao: 'ID do edital na URL', obrigatorio: true }],
  },
  {
    nome: 'Buscar no PNCP (uma página)',
    descricao: 'Consulta contratações publicadas no Portal Nacional de Contratações',
    metodo: 'GET',
    caminho: '/api/pncp/search',
    parametros: [
      { nome: 'dataInicial', descricao: 'Data inicial (AAAAMMDD)', obrigatorio: false, exemplo: '20250101' },
      { nome: 'dataFinal', descricao: 'Data final (AAAAMMDD)', obrigatorio: false, exemplo: '20250131' },
      { nome: 'modalidade', descricao: 'Código modalidade PNCP (ex: 8 = Pregão Eletrônico)', obrigatorio: false },
      { nome: 'uf', descricao: 'Sigla do estado', obrigatorio: false, exemplo: 'SP' },
      { nome: 'pagina', descricao: 'Número da página', obrigatorio: false, exemplo: '1' },
      { nome: 'tamanhoPagina', descricao: 'Registros por página (máx. 50)', obrigatorio: false, exemplo: '20' },
      { nome: 'palavraChave', descricao: 'Palavra-chave para filtrar', obrigatorio: false },
    ],
  },
  {
    nome: 'Carregar todas as páginas do PNCP',
    descricao: 'Busca e agrega múltiplas páginas do PNCP conforme filtros',
    metodo: 'GET',
    caminho: '/api/pncp/search-all',
    parametros: [
      { nome: 'dataInicial', descricao: 'Data inicial (AAAAMMDD)', obrigatorio: false },
      { nome: 'dataFinal', descricao: 'Data final (AAAAMMDD)', obrigatorio: false },
      { nome: 'uf', descricao: 'Sigla do estado', obrigatorio: false },
      { nome: 'palavraChave', descricao: 'Palavra-chave (ex: mobiliário)', obrigatorio: false },
    ],
  },
  {
    nome: 'Importar edital do PNCP',
    descricao: 'Importa um edital do PNCP para o sistema e inicia análise',
    metodo: 'POST',
    caminho: '/api/pncp/import',
    parametros: [
      { nome: 'codigoPncp', descricao: 'Código do edital no PNCP (ex: 00000000000191-000001/2025)', obrigatorio: true },
    ],
  },
  {
    nome: 'Configuração da operação',
    descricao: 'Parâmetros do Cérebro da Operação (endereço, logística, produção)',
    metodo: 'GET',
    caminho: '/api/operacao',
    parametros: [],
  },
  {
    nome: 'Atualizar configuração da operação',
    descricao: 'Salva ou atualiza os parâmetros da operação',
    metodo: 'PUT',
    caminho: '/api/operacao',
    parametros: [
      { nome: 'endereco_centro', descricao: 'Endereço completo do centro de operações', obrigatorio: false },
      { nome: 'municipio', descricao: 'Município', obrigatorio: false },
      { nome: 'uf', descricao: 'UF (2 letras)', obrigatorio: false },
      { nome: 'cep', descricao: 'CEP', obrigatorio: false },
      { nome: 'raio_entrega_km', descricao: 'Raio de entrega em km', obrigatorio: false },
      { nome: 'custo_km_frete', descricao: 'Custo por km de frete (R$)', obrigatorio: false },
      { nome: 'custo_montagem_por_entrega', descricao: 'Custo de montagem por entrega (R$)', obrigatorio: false },
      { nome: 'dias_uteis_entrega_apos_producao', descricao: 'Dias úteis para entrega após produção', obrigatorio: false },
      { nome: 'prazo_minimo_producao_dias', descricao: 'Prazo mínimo de produção em dias', obrigatorio: false },
      { nome: 'capacidade_producao_mensal_pecas', descricao: 'Capacidade de produção mensal em peças', obrigatorio: false },
      { nome: 'materiais_principais', descricao: 'Materiais principais', obrigatorio: false },
      { nome: 'certificacoes_abnt', descricao: 'Certificações ABNT', obrigatorio: false },
      { nome: 'ramo_principal', descricao: 'Ramo principal para a IA', obrigatorio: false },
      { nome: 'observacoes', descricao: 'Observações para análises', obrigatorio: false },
    ],
  },
  {
    nome: 'Saúde do sistema',
    descricao: 'Verifica se a API, banco e Ollama estão respondendo',
    metodo: 'GET',
    caminho: '/api/health',
    parametros: [],
  },
  {
    nome: 'Analisar edital (IA)',
    descricao: 'Dispara o pipeline de extração e análise com IA do PDF do edital',
    metodo: 'POST',
    caminho: '/api/analyze',
    parametros: [
      { nome: 'editalId', descricao: 'ID do edital', obrigatorio: true },
      { nome: 'model', descricao: 'Modelo Ollama (opcional)', obrigatorio: false },
    ],
  },
  {
    nome: 'Upload de PDF',
    descricao: 'Envia o PDF do edital para armazenamento',
    metodo: 'POST',
    caminho: '/api/upload',
    parametros: [{ nome: 'file', descricao: 'Arquivo PDF (multipart/form-data)', obrigatorio: true }],
  },
  {
    nome: 'Listar feedbacks',
    descricao: 'Lista feedbacks de qualidade das análises',
    metodo: 'GET',
    caminho: '/api/feedback',
    parametros: [{ nome: 'editalId', descricao: 'Filtrar por ID do edital', obrigatorio: false }],
  },
  {
    nome: 'Enviar feedback',
    descricao: 'Registra feedback sobre a análise de um edital',
    metodo: 'POST',
    caminho: '/api/feedback/[editalId]',
    parametros: [
      { nome: 'editalId', descricao: 'ID do edital na URL', obrigatorio: true },
      { nome: 'rating', descricao: 'Nota da análise', obrigatorio: true },
      { nome: 'comment', descricao: 'Comentário opcional', obrigatorio: false },
    ],
  },
  {
    nome: 'Mapa – GeoJSON dos estados',
    descricao: 'Retorna o contorno dos estados em GeoJSON (fonte IBGE)',
    metodo: 'GET',
    caminho: '/api/mapa/geojson-estados',
    parametros: [],
  },
  {
    nome: 'Mapa – Heatmap por estado',
    descricao: 'Contagem de editais por UF para o heatmap',
    metodo: 'GET',
    caminho: '/api/mapa/heatmap',
    parametros: [],
  },
  {
    nome: 'Mapa – Lista de órgãos por estado',
    descricao: 'Órgãos com editais no estado selecionado (cache)',
    metodo: 'GET',
    caminho: '/api/mapa/orgaos',
    parametros: [{ nome: 'uf', descricao: 'Sigla do estado', obrigatorio: true, exemplo: 'SP' }],
  },
  {
    nome: 'Mapa – Detalhe do órgão',
    descricao: 'Dados do órgão, CNPJ e editais PNCP do órgão',
    metodo: 'GET',
    caminho: '/api/mapa/orgao/[cnpj]',
    parametros: [
      { nome: 'cnpj', descricao: 'CNPJ do órgão (na URL)', obrigatorio: true },
      { nome: 'uf', descricao: 'UF para filtrar editais no PNCP', obrigatorio: false },
    ],
  },
  {
    nome: 'Mapa – Atualizar cache',
    descricao: 'Dispara atualização do cache do mapa (PNCP + geocodificação)',
    metodo: 'POST',
    caminho: '/api/mapa/refresh',
    parametros: [],
  },
  {
    nome: 'Regras de treinamento (IA)',
    descricao: 'Lista ou cria regras por tipo de análise',
    metodo: 'GET / POST',
    caminho: '/api/training/rules',
    parametros: [{ nome: 'tipo', descricao: 'Tipo de análise (dados_basicos, valor_estimado, etc.)', obrigatorio: true }],
  },
  {
    nome: 'Regra de treinamento por ID',
    descricao: 'Atualiza ou remove uma regra',
    metodo: 'GET / PUT / DELETE',
    caminho: '/api/training/rules/[id]',
    parametros: [{ nome: 'id', descricao: 'ID da regra na URL', obrigatorio: true }],
  },
  {
    nome: 'Exemplos de treinamento',
    descricao: 'Lista ou cria exemplos por tipo de análise',
    metodo: 'GET / POST',
    caminho: '/api/training/examples',
    parametros: [{ nome: 'tipo', descricao: 'Tipo de análise', obrigatorio: true }],
  },
  {
    nome: 'Exemplo de treinamento por ID',
    descricao: 'Atualiza ou remove um exemplo',
    metodo: 'GET / PUT / DELETE',
    caminho: '/api/training/examples/[id]',
    parametros: [{ nome: 'id', descricao: 'ID do exemplo na URL', obrigatorio: true }],
  },
  {
    nome: 'Categorias de destaque',
    descricao: 'Categorias para destacar trechos no edital',
    metodo: 'GET / POST',
    caminho: '/api/training/categories',
    parametros: [],
  },
  {
    nome: 'Categoria por ID',
    descricao: 'Atualiza ou remove uma categoria',
    metodo: 'GET / PUT / DELETE',
    caminho: '/api/training/categories/[id]',
    parametros: [{ nome: 'id', descricao: 'ID da categoria na URL', obrigatorio: true }],
  },
]

export async function GET() {
  return NextResponse.json({ endpoints: ENDPOINTS })
}
