-- ================================================================
-- Migration 002: Tabela editais
-- Documentos de licitação (editais)
-- ================================================================

CREATE TYPE public.edital_status AS ENUM (
  'pending',
  'extracting',
  'analyzing',
  'completed',
  'error'
);

CREATE TYPE public.edital_modalidade AS ENUM (
  'pregao_eletronico',
  'pregao_presencial',
  'concorrencia',
  'tomada_de_precos',
  'convite',
  'leilao',
  'dispensa',
  'inexigibilidade',
  'outro'
);

CREATE TYPE public.edital_origem AS ENUM (
  'upload',
  'pncp'
);

CREATE TABLE public.editais (
  id                       UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  orgao_id                 UUID                    REFERENCES public.orgaos(id) ON DELETE SET NULL,

  -- Identificação
  numero_edital            TEXT,
  ano                      SMALLINT,
  numero_processo          TEXT,
  numero_sequencial_pncp   TEXT,
  codigo_pncp              TEXT                    UNIQUE,

  -- Conteúdo
  objeto                   TEXT                    NOT NULL,
  modalidade               public.edital_modalidade,
  situacao                 TEXT,

  -- Financeiro
  valor_estimado           NUMERIC(18, 2),
  valor_homologado         NUMERIC(18, 2),

  -- Datas
  data_publicacao          DATE,
  data_abertura_propostas  TIMESTAMPTZ,
  data_encerramento        TIMESTAMPTZ,
  data_homologacao         DATE,
  prazo_execucao_dias      INTEGER,

  -- Entrega
  endereco_entrega         TEXT,
  municipio_entrega        TEXT,
  uf_entrega               CHAR(2),

  -- Documento PDF
  pdf_storage_path         TEXT,
  pdf_url_pncp             TEXT,
  pdf_tamanho_bytes        BIGINT,
  total_paginas            INTEGER,

  -- Controle
  origem                   public.edital_origem    NOT NULL DEFAULT 'upload',
  status                   public.edital_status    NOT NULL DEFAULT 'pending',
  error_message            TEXT,

  -- Campos desnormalizados (cache para listagem performática)
  resumo_executivo         TEXT,
  viabilidade_score        SMALLINT                CHECK (viabilidade_score BETWEEN 0 AND 100),
  viabilidade_veredicto    TEXT                    CHECK (viabilidade_veredicto IN ('viavel', 'parcialmente_viavel', 'inviavel')),

  created_at               TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ             NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_editais_orgao_id        ON public.editais (orgao_id);
CREATE INDEX idx_editais_status          ON public.editais (status);
CREATE INDEX idx_editais_data_abertura   ON public.editais (data_abertura_propostas DESC NULLS LAST);
CREATE INDEX idx_editais_viabilidade     ON public.editais (viabilidade_veredicto);
CREATE INDEX idx_editais_codigo_pncp     ON public.editais (codigo_pncp);
CREATE INDEX idx_editais_objeto_fts      ON public.editais USING gin (to_tsvector('portuguese', objeto));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER editais_updated_at
  BEFORE UPDATE ON public.editais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.editais IS 'Editais de licitação pública analisados pelo sistema';
COMMENT ON COLUMN public.editais.codigo_pncp IS 'Código único PNCP formato CNPJ-sequencial/ano';
COMMENT ON COLUMN public.editais.viabilidade_score IS 'Score 0-100 de viabilidade calculado pelo OLLAMA';
