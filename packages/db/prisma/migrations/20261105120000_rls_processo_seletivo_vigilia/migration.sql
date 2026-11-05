-- Fecha a API REST do Supabase (papéis anon/authenticated) para tabelas de dados de usuário.
-- Sem políticas = nega tudo via PostgREST. O app acessa via Prisma com o papel postgres (bypassrls).
ALTER TABLE "ProcessoSeletivo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessaoVigilia" ENABLE ROW LEVEL SECURITY;
