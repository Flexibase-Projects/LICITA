-- ================================================================
-- Migration 010: Municípios geocodificados (centróides IBGE)
-- Usado para posicionar órgãos públicos no mapa interativo
-- ================================================================

CREATE TABLE IF NOT EXISTS public.municipios (
  codigo_ibge  TEXT        PRIMARY KEY,   -- ex: "3550308" (São Paulo)
  nome         TEXT        NOT NULL,
  uf           CHAR(2)     NOT NULL,      -- ex: "SP"
  lat          NUMERIC(10,6),             -- latitude centróide
  lng          NUMERIC(10,6),             -- longitude centróide
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca por UF e nome
CREATE INDEX IF NOT EXISTS idx_municipios_uf   ON public.municipios (uf);
CREATE INDEX IF NOT EXISTS idx_municipios_nome ON public.municipios (nome);

-- Adicionar geocoordenadas e referência IBGE à tabela orgaos
ALTER TABLE public.orgaos
  ADD COLUMN IF NOT EXISTS municipio_ibge TEXT REFERENCES public.municipios(codigo_ibge),
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,6);

-- Índice para busca por municipio_ibge
CREATE INDEX IF NOT EXISTS idx_orgaos_municipio_ibge ON public.orgaos (municipio_ibge);

-- Cache de heatmap do mapa (evita bater na PNCP a cada request)
CREATE TABLE IF NOT EXISTS public.mapa_heatmap_cache (
  uf          CHAR(2)     PRIMARY KEY,
  count       INTEGER     NOT NULL DEFAULT 0,
  lat         NUMERIC(10,6),
  lng         NUMERIC(10,6),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.municipios IS 'Municípios brasileiros com centróides geográficos (fonte: IBGE)';
COMMENT ON TABLE public.mapa_heatmap_cache IS 'Cache de contagem de editais de mobiliário por UF para o mapa heatmap';
COMMENT ON COLUMN public.orgaos.municipio_ibge IS 'Código IBGE do município do órgão para geocodificação';
COMMENT ON COLUMN public.orgaos.lat IS 'Latitude geocodificada do órgão (centróide do município)';
COMMENT ON COLUMN public.orgaos.lng IS 'Longitude geocodificada do órgão (centróide do município)';
