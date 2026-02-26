-- ================================================================
-- Migration 007: Índices adicionais e funções utilitárias
-- ================================================================

-- ─── Função de busca full-text unificada ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_editais(
  query     TEXT,
  limit_n   INT  DEFAULT 20,
  offset_n  INT  DEFAULT 0
)
RETURNS TABLE (
  id                      UUID,
  numero_edital           TEXT,
  objeto                  TEXT,
  orgao_nome              TEXT,
  orgao_uf                CHAR(2),
  viabilidade_veredicto   TEXT,
  viabilidade_score       SMALLINT,
  data_abertura_propostas TIMESTAMPTZ,
  valor_estimado          NUMERIC,
  status                  public.edital_status,
  origem                  public.edital_origem,
  created_at              TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.id,
    e.numero_edital,
    e.objeto,
    o.nome         AS orgao_nome,
    o.uf           AS orgao_uf,
    e.viabilidade_veredicto,
    e.viabilidade_score,
    e.data_abertura_propostas,
    e.valor_estimado,
    e.status,
    e.origem,
    e.created_at
  FROM public.editais e
  LEFT JOIN public.orgaos o ON o.id = e.orgao_id
  WHERE
    to_tsvector('portuguese',
      e.objeto || ' ' || COALESCE(o.nome, '') || ' ' || COALESCE(e.numero_edital, '')
    ) @@ plainto_tsquery('portuguese', query)
  ORDER BY e.data_abertura_propostas DESC NULLS LAST
  LIMIT  limit_n
  OFFSET offset_n;
$$;

-- ─── Função de estatísticas para dashboard home ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'total_editais',         COUNT(*)                                              FILTER (WHERE TRUE),
    'editais_analisados',    COUNT(*)                                              FILTER (WHERE status = 'completed'),
    'editais_viaveis',       COUNT(*)                                              FILTER (WHERE viabilidade_veredicto = 'viavel'),
    'editais_parciais',      COUNT(*)                                              FILTER (WHERE viabilidade_veredicto = 'parcialmente_viavel'),
    'editais_inviaveis',     COUNT(*)                                              FILTER (WHERE viabilidade_veredicto = 'inviavel'),
    'valor_total_estimado',  SUM(valor_estimado)                                   FILTER (WHERE status = 'completed'),
    'editais_abertos',       COUNT(*)                                              FILTER (WHERE data_encerramento > now()),
    'editais_este_mes',      COUNT(*)                                              FILTER (WHERE created_at > date_trunc('month', now()))
  )
  FROM public.editais;
$$;

COMMENT ON FUNCTION public.search_editais IS 'Busca full-text em editais + nome do órgão com paginação';
COMMENT ON FUNCTION public.get_dashboard_stats IS 'Estatísticas agregadas para o dashboard home';
