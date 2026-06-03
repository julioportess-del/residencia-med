-- Migração: tabela Anexo (análise multimodal de exames/imagens no Escriba).
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (guardas IF NOT EXISTS).
-- A criação do bucket de Storage está em scripts/storage-anexos.sql.

-- Enums (DO-block: CREATE TYPE não aceita IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "clinico"."CategoriaAnexo" AS ENUM ('EXAME_LAB', 'EXAME_IMAGEM', 'IMAGEM_CLINICA', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "clinico"."StatusAnexo" AS ENUM ('ENVIADO', 'PROCESSANDO', 'ANALISADO', 'ERRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela
CREATE TABLE IF NOT EXISTS "clinico"."Anexo" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "consultaId" TEXT,
    "nomeArquivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "categoria" "clinico"."CategoriaAnexo" NOT NULL DEFAULT 'OUTRO',
    "storagePath" TEXT NOT NULL,
    "status" "clinico"."StatusAnexo" NOT NULL DEFAULT 'ENVIADO',
    "resumoAnalise" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analisadoEm" TIMESTAMP(3),
    "excluidoEm" TIMESTAMP(3),
    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "Anexo_usuarioAuthId_idx" ON "clinico"."Anexo"("usuarioAuthId");
CREATE INDEX IF NOT EXISTS "Anexo_consultaId_idx" ON "clinico"."Anexo"("consultaId");
CREATE INDEX IF NOT EXISTS "Anexo_expiraEm_idx" ON "clinico"."Anexo"("expiraEm");

-- FK para Consulta (guarda: só adiciona se ainda não existe)
DO $$ BEGIN
  ALTER TABLE "clinico"."Anexo"
    ADD CONSTRAINT "Anexo_consultaId_fkey"
    FOREIGN KEY ("consultaId") REFERENCES "clinico"."Consulta"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
