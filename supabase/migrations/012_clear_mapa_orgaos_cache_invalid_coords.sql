-- ================================================================
-- Migration 012: Limpa cache de órgãos com coordenadas inválidas
-- (todos no mesmo ponto). Próxima requisição por UF repopula com
-- geocodificação correta por município.
-- ================================================================

TRUNCATE TABLE public.mapa_orgaos_cache;

COMMENT ON TABLE public.mapa_orgaos_cache IS 'Cache de órgãos com editais de mobiliário por UF; heatmap e lista usam esta fonte. Órgãos com lat/lng por município (nunca centroide único).';
