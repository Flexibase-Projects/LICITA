-- ================================================================
-- Migration 011: Cache unificado de órgãos por UF para o mapa
-- Fonte única para heatmap (contagem) e lista de órgãos (detalhe)
-- Atualizado periodicamente no backend; lista sem PNCP ao selecionar estado
-- ================================================================

CREATE TABLE IF NOT EXISTS public.mapa_orgaos_cache (
  uf                  CHAR(2)     PRIMARY KEY,
  orgaos_json         JSONB       NOT NULL DEFAULT '[]',
  total_editais_uf    INTEGER     NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mapa_orgaos_cache IS 'Cache de órgãos com editais de mobiliário por UF; heatmap e lista usam esta fonte';
COMMENT ON COLUMN public.mapa_orgaos_cache.orgaos_json IS 'Array de MapaOrgao (cnpj, nome, municipio, total_editais, lat, lng, etc.)';
COMMENT ON COLUMN public.mapa_orgaos_cache.total_editais_uf IS 'Soma de total_editais dos órgãos da UF (usado no heatmap)';
