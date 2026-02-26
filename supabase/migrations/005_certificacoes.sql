-- ================================================================
-- Migration 005: Tabela certificacoes
-- Certificações e normas exigidas pelos editais
-- ================================================================

CREATE TABLE public.certificacoes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  edital_id   UUID        NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
  item_id     UUID        REFERENCES public.itens_edital(id) ON DELETE CASCADE,

  nome        TEXT        NOT NULL,
  tipo        TEXT        NOT NULL DEFAULT 'outro'
                          CHECK (tipo IN ('abnt', 'inmetro', 'iso', 'procel', 'anvisa', 'bpm', 'outro')),
  norma       TEXT,
  descricao   TEXT,
  obrigatoria BOOLEAN     NOT NULL DEFAULT true,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_cert_edital_id ON public.certificacoes (edital_id);
CREATE INDEX idx_cert_item_id   ON public.certificacoes (item_id);
CREATE INDEX idx_cert_tipo      ON public.certificacoes (edital_id, tipo);

COMMENT ON TABLE public.certificacoes IS 'Certificações, normas e habilitações exigidas pelos editais';
COMMENT ON COLUMN public.certificacoes.item_id IS 'NULL significa que a certificação se aplica ao edital todo';
COMMENT ON COLUMN public.certificacoes.norma IS 'Norma técnica ex: ABNT NBR 16069:2012';
