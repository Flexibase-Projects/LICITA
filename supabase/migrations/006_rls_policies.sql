-- ================================================================
-- Migration 006: Row Level Security (RLS)
-- Autenticação via Supabase Auth (email/senha)
-- ================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.orgaos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editais      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_edital ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_llm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificacoes ENABLE ROW LEVEL SECURITY;

-- ─── Políticas: usuários autenticados têm acesso total ─────────────────────
-- (Sistema interno — qualquer usuário logado pode ver e editar tudo)

-- orgaos
CREATE POLICY "auth_select_orgaos" ON public.orgaos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_orgaos" ON public.orgaos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_orgaos" ON public.orgaos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- editais
CREATE POLICY "auth_select_editais" ON public.editais
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_editais" ON public.editais
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_editais" ON public.editais
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_delete_editais" ON public.editais
  FOR DELETE USING (auth.role() = 'authenticated');

-- itens_edital
CREATE POLICY "auth_select_itens" ON public.itens_edital
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_itens" ON public.itens_edital
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_itens" ON public.itens_edital
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_delete_itens" ON public.itens_edital
  FOR DELETE USING (auth.role() = 'authenticated');

-- analises_llm
CREATE POLICY "auth_select_analises" ON public.analises_llm
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_analises" ON public.analises_llm
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- certificacoes
CREATE POLICY "auth_select_cert" ON public.certificacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_cert" ON public.certificacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_delete_cert" ON public.certificacoes
  FOR DELETE USING (auth.role() = 'authenticated');

-- ─── Permitir service_role (backend Next.js) acesso total ─────────────────
-- O service_role bypassa RLS por padrão no Supabase
-- Portanto as operações do apps/api usam o service role key
