// ============================================================
// LICITA-Pro — Shared Types
// Interfaces compartilhadas entre apps/web e apps/api
// ============================================================

// ─── Enums ───────────────────────────────────────────────────
export type EditalStatus = 'pending' | 'extracting' | 'analyzing' | 'completed' | 'error'
export type EditalModalidade =
  | 'pregao_eletronico'
  | 'pregao_presencial'
  | 'concorrencia'
  | 'tomada_de_precos'
  | 'convite'
  | 'leilao'
  | 'dispensa'
  | 'inexigibilidade'
  | 'outro'
export type EditalOrigem = 'upload' | 'pncp'
export type ViabilidadeVeredicto = 'viavel' | 'parcialmente_viavel' | 'inviavel'
export type AnaliseTipo =
  | 'dados_basicos'
  | 'valor_estimado'
  | 'itens_completos'
  | 'requisitos_tecnicos'
  | 'viabilidade'
  | 'resumo_executivo'

export type RequisitoDificuldade = 'baixa' | 'media' | 'alta'
export type RequisitoCategoria =
  | 'habilitacao_juridica'
  | 'qualificacao_tecnica'
  | 'qualificacao_economica'
  | 'documentos_fiscais'
  | 'requisitos_amostra'
  | 'garantias'
  | 'prazos_importantes'

// ─── Órgão ───────────────────────────────────────────────────
export interface Orgao {
  id: string
  cnpj: string | null
  nome: string
  nome_curto: string | null
  sigla: string | null
  esfera: 'federal' | 'estadual' | 'municipal' | null
  uf: string | null
  municipio: string | null
  codigo_pncp: string | null
  created_at: string
}

// ─── Edital ──────────────────────────────────────────────────
export interface Edital {
  id: string
  orgao_id: string | null
  orgao?: Orgao

  numero_edital: string | null
  ano: number | null
  numero_processo: string | null
  codigo_pncp: string | null

  objeto: string
  modalidade: EditalModalidade | null

  valor_estimado: number | null
  data_publicacao: string | null
  data_abertura_propostas: string | null
  data_encerramento: string | null
  prazo_execucao_dias: number | null

  endereco_entrega: string | null
  municipio_entrega: string | null
  uf_entrega: string | null

  pdf_storage_path: string | null
  pdf_url_pncp: string | null
  total_paginas: number | null

  origem: EditalOrigem
  status: EditalStatus
  error_message: string | null

  resumo_executivo: string | null
  viabilidade_score: number | null
  viabilidade_veredicto: ViabilidadeVeredicto | null

  created_at: string
  updated_at: string
}

// ─── Item do Edital ──────────────────────────────────────────
export interface EspecificacoesItem {
  material?: string | null
  cor?: string | null
  dimensoes?: string | null
  normas_tecnicas?: string[]
  acabamento?: string | null
  capacidade_carga?: string | null
  [key: string]: unknown
}

export interface ItemEdital {
  id: string
  edital_id: string

  numero_item: string
  numero_lote: string | null
  nome_lote: string | null

  descricao: string
  descricao_detalhada: string | null
  especificacoes: EspecificacoesItem

  unidade: string | null
  quantidade: number | null

  valor_unitario_estimado: number | null
  valor_total_estimado: number | null

  codigo_item_catalogo: string | null
  tipo_item: 'material' | 'servico' | null

  categoria: string | null
  confianca_quantidade: 'alta' | 'media' | 'baixa' | null

  pode_produzir: boolean | null
  viabilidade_nota: number | null
  viabilidade_justificativa: string | null
  restricoes_producao: string[]

  created_at: string
}

// ─── Requisito do Edital ─────────────────────────────────────
export interface RequisitoEdital {
  id: string
  edital_id: string
  categoria: RequisitoCategoria
  descricao: string
  obrigatorio: boolean
  dificuldade: RequisitoDificuldade
  observacao: string | null
  data_limite: string | null
  created_at: string
}

// ─── Categoria de Destaque ───────────────────────────────────
export interface CategoriaDestaque {
  id: string
  nome: string
  ativa: boolean
  created_at: string
}

// ─── Feedback de Análise ─────────────────────────────────────
export interface FeedbackAnalise {
  id: string
  edital_id: string
  tipo_analise: AnaliseTipo
  nota: number | null
  correcoes: Record<string, unknown>
  comentario: string | null
  created_at: string
}

// ─── Regra de Treinamento ────────────────────────────────────
export interface RegraTreinamento {
  id: string
  tipo_analise: AnaliseTipo
  titulo: string
  regra: string
  ativa: boolean
  created_at: string
  updated_at: string
}

// ─── Exemplo de Treinamento ──────────────────────────────────
export interface ExemploTreinamento {
  id: string
  tipo_analise: AnaliseTipo
  edital_id: string | null
  entrada_texto: string
  saida_esperada: Record<string, unknown>
  aprovado: boolean
  created_at: string
}

// ─── Certificação ────────────────────────────────────────────
export interface Certificacao {
  id: string
  edital_id: string
  item_id: string | null
  nome: string
  tipo: 'abnt' | 'inmetro' | 'iso' | 'procel' | 'anvisa' | 'bpm' | 'outro'
  norma: string | null
  descricao: string | null
  obrigatoria: boolean
  created_at: string
}

// ─── Análise LLM ─────────────────────────────────────────────
export interface AnaliseLLM {
  id: string
  edital_id: string
  tipo: AnaliseTipo
  modelo: string
  prompt_versao: string
  chunks_processados: number
  resultado_json: Record<string, unknown>
  duracao_ms: number | null
  sucesso: boolean
  erro: string | null
  created_at: string
}

// ─── Edital completo (com relações) ──────────────────────────
export interface EditalCompleto extends Omit<Edital, 'orgao'> {
  orgao: Orgao | null
  itens: ItemEdital[]
  certificacoes: Certificacao[]
  requisitos: RequisitoEdital[]
  analises: AnaliseLLM[]
}

// ─── PNCP API Types ──────────────────────────────────────────
export interface PNCPContratacao {
  numeroControlePNCP: string
  orgaoEntidade: {
    cnpj: string
    razaoSocial: string
    poderId: string
    esferaId: string
  }
  unidadeOrgao: {
    codigoUnidade: string
    nomeUnidade: string
    ufNome: string
    ufSigla: string
    municipioNome: string
    codigoIBGE: string
  }
  numeroCompra: string
  anoCompra: number
  sequencialCompra: number
  objetoCompra: string
  informacaoComplementar: string | null
  valorTotalEstimado: number | null
  valorTotalHomologado: number | null
  dataPublicacaoPncp: string
  dataAberturaProposta: string | null
  dataEncerramentoProposta: string | null
  situacaoCompraId: number
  situacaoCompraNome: string
  modalidadeId: number
  modalidadeNome: string
  modoDisputaId: number
  modoDisputaNome: string
  tipoInstrumentoConvocatorioId: number
  tipoInstrumentoConvocatorioNome: string
  linkSistemaOrigem: string | null
}

export interface PNCPItem {
  numeroItem: number
  descricao: string
  materialOuServico: string
  valorUnitarioEstimado: number | null
  quantidade: number
  unidadeMedida: string
  situacaoCompraItemNome: string
  codigoCatalogo: string | null
  tipoBeneficioId: number | null
  tipoBeneficioNome: string | null
}

export interface PNCPSearchResult {
  data: PNCPContratacao[]
  totalRegistros: number
  totalPaginas: number
  numeroPagina: number
  tamanhoPagina: number
}

// ─── API Request/Response Types ──────────────────────────────
export interface UploadResponse {
  editalId: string
  storagePath: string
  message: string
}

export interface AnalyzeRequest {
  editalId: string
  model?: string
}

export interface SSEEvent {
  step: string
  progress: number
  message: string
  editalId?: string
  error?: string
}

export interface EditaisListResponse {
  data: Edital[]
  total: number
  page: number
  pageSize: number
}

export interface EditaisListParams {
  search?: string
  status?: EditalStatus
  viabilidade?: ViabilidadeVeredicto
  modalidade?: EditalModalidade
  uf?: string
  page?: number
  pageSize?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  ollama: 'ok' | 'error'
  supabase: 'ok' | 'error'
  ollamaModel: string
  timestamp: string
}
