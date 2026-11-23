-- Migração: persistência das análises clínicas do Copilot (idempotente).
CREATE TABLE IF NOT EXISTS "clinico"."AnaliseConsulta" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "hashTranscricao" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "modelo" TEXT NOT NULL,
    "versaoPrompt" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnaliseConsulta_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AnaliseConsulta_consultaId_idx" ON "clinico"."AnaliseConsulta"("consultaId");
CREATE INDEX IF NOT EXISTS "AnaliseConsulta_usuarioAuthId_idx" ON "clinico"."AnaliseConsulta"("usuarioAuthId");
ALTER TABLE "clinico"."AnaliseConsulta" ENABLE ROW LEVEL SECURITY;
