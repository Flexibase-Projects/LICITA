-- ================================================================
-- Migration 003: Tabela itens_edital
-- Produtos/itens listados nos editais
-- ================================================================

CREATE TABLE public.itens_edital (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edital_id                 UUID        NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,

  -- Identificação
  numero_item               TEXT        NOT NULL,
  numero_lote               TEXT,
  nome_lote                 TEXT,

  -- Descrição
  descricao                 TEXT        NOT NULL,
  descricao_detalhada       TEXT,
  especificacoes            JSONB       NOT NULL DEFAULT '{}',

  -- Quantidade
  unidade                   TEXT,
  quantidade                NUMERIC(14, 4),

  -- Valores
  valor_unitario_estimado   NUMERIC(18, 2),
  valor_total_estimado      NUMERIC(18, 2),

  -- Catalogação
  codigo_item_catalogo      TEXT,
  tipo_item                 TEXT        CHECK (tipo_item IN ('material', 'servico')),

  -- Análise de viabilidade por item
  pode_produzir             BOOLEAN,
  viabilidade_nota          SMALLINT    CHECK (viabilidade_nota BETWEEN 0 AND 100),
  viabilidade_justificativa TEXT,
  restricoes_producao       TEXT[]      NOT NULL DEFAULT '{}',

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_itens_edital_id      ON public.itens_edital (edital_id);
CREATE INDEX idx_itens_lote           ON public.itens_edital (edital_id, numero_lote);
CREATE INDEX idx_itens_pode_produzir  ON public.itens_edital (edital_id, pode_produzir);
CREATE INDEX idx_itens_descricao_fts  ON public.itens_edital USING gin (to_tsvector('portuguese', descricao));

COMMENT ON TABLE public.itens_edital IS 'Itens/produtos listados nos editais de licitação';
COMMENT ON COLUMN public.itens_edital.especificacoes IS 'JSON com specs técnicas: {material, cor, dimensoes, normas_tecnicas, acabamento}';
COMMENT ON COLUMN public.itens_edital.codigo_item_catalogo IS 'Código CATMAT (material) ou CATSER (serviço)';
