-- ================================================================
-- Migration 008: Storage bucket para PDFs dos editais
-- ================================================================

-- Criar bucket privado para PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'editais-pdfs',
  'editais-pdfs',
  false,
  524288000,  -- 500 MB em bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Usuários autenticados podem ler PDFs
CREATE POLICY "auth_read_editais_pdfs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'editais-pdfs' AND auth.role() = 'authenticated');

-- Service role faz upload (backend Next.js usa service role key)
-- O service role bypassa RLS automaticamente

COMMENT ON TABLE storage.buckets IS 'Bucket editais-pdfs: armazena PDFs dos editais de licitação (privado, max 500MB)';
