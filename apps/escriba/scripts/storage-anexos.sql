-- Cria o bucket PRIVADO de anexos clínicos no Supabase Storage.
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (on conflict do nothing).
--
-- Privado (public=false): acesso só via service role no servidor + URLs assinadas.
-- Limite 50MB/arquivo. MIME aceitos: imagens (após HEIC→JPEG no cliente) e PDF.
-- Não precisa de policies de RLS: o upload usa token assinado e a leitura é
-- feita server-side com a service role (que ignora RLS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anexos-clinicos',
  'anexos-clinicos',
  false,
  52428800, -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;
