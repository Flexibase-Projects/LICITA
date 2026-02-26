-- ================================================================
-- Migration 004: Tabela analises_llm
-- Registro de análises feitas pelo OLLAMA
-- ================================================================

CREATE TYPE public.analise_tipo AS ENUM (
  'dados_basicos',
  'itens_completos',
  'requisitos_tecnicos',
  'viabilidade',
  'resumo_executivo'
);

CREATE TABLE public.analises_llm (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  edital_id           UUID              NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,

  tipo                public.analise_tipo NOT NULL,
  modelo              TEXT              NOT NULL,
  prompt_versao       TEXT              NOT NULL DEFAULT '1.0',

  -- Input
  chunks_processados  INTEGER           NOT NULL DEFAULT 0,
  tokens_entrada      INTEGER,

  -- Output
  resultado_json      JSONB             NOT NULL,
  resultado_texto     TEXT,
  tokens_saida        INTEGER,

  -- Performance
  duracao_ms          INTEGER,
  sucesso             BOOLEAN           NOT NULL DEFAULT true,
  erro                TEXT,

  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_analises_edital_id ON public.analises_llm (edital_id);
CREATE INDEX idx_analises_tipo      ON public.analises_llm (edital_id, tipo);
CREATE INDEX idx_analises_created   ON public.analises_llm (created_at DESC);

COMMENT ON TABLE public.analises_llm IS 'Histórico de análises realizadas pelo modelo OLLAMA local';
COMMENT ON COLUMN public.analises_llm.resultado_json IS 'Saída JSON bruta do modelo LLM para auditoria';
