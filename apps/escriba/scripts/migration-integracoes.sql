-- Migração: Integration Layer (Feegow = 1º adapter) + token da extensão.
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (guardas).

DO $$ BEGIN
  CREATE TYPE "clinico"."SistemaProntuario" AS ENUM ('FEEGOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "clinico"."IntegracaoProntuario" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "sistema" "clinico"."SistemaProntuario" NOT NULL,
    "tokenCifrado" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegracaoProntuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IntegracaoProntuario_usuarioAuthId_sistema_key"
  ON "clinico"."IntegracaoProntuario"("usuarioAuthId", "sistema");

CREATE TABLE IF NOT EXISTS "clinico"."VinculoExterno" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "sistema" "clinico"."SistemaProntuario" NOT NULL,
    "tipoRecurso" TEXT NOT NULL,
    "idExterno" TEXT NOT NULL,
    "pacienteId" TEXT,
    "consultaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VinculoExterno_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "VinculoExterno_usuarioAuthId_sistema_tipoRecurso_idExterno_key"
  ON "clinico"."VinculoExterno"("usuarioAuthId", "sistema", "tipoRecurso", "idExterno");
CREATE INDEX IF NOT EXISTS "VinculoExterno_pacienteId_idx" ON "clinico"."VinculoExterno"("pacienteId");
CREATE INDEX IF NOT EXISTS "VinculoExterno_consultaId_idx" ON "clinico"."VinculoExterno"("consultaId");

CREATE TABLE IF NOT EXISTS "clinico"."TokenExtensao" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "hashToken" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Extensão Chrome',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    CONSTRAINT "TokenExtensao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TokenExtensao_hashToken_key" ON "clinico"."TokenExtensao"("hashToken");
CREATE INDEX IF NOT EXISTS "TokenExtensao_usuarioAuthId_idx" ON "clinico"."TokenExtensao"("usuarioAuthId");
