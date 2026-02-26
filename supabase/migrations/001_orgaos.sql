-- ================================================================
-- Migration 001: Tabela orgaos
-- Órgãos públicos que emitem editais
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.orgaos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj        TEXT        UNIQUE,
  nome        TEXT        NOT NULL,
  sigla       TEXT,
  esfera      TEXT        CHECK (esfera IN ('federal', 'estadual', 'municipal')),
  uf          CHAR(2),
  municipio   TEXT,
  codigo_pncp TEXT        UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_orgaos_cnpj    ON public.orgaos (cnpj);
CREATE INDEX idx_orgaos_uf      ON public.orgaos (uf);
CREATE INDEX idx_orgaos_nome    ON public.orgaos USING gin (nome gin_trgm_ops);

COMMENT ON TABLE public.orgaos IS 'Órgãos públicos emissores de editais de licitação';
COMMENT ON COLUMN public.orgaos.codigo_pncp IS 'Código interno do órgão no sistema PNCP';
