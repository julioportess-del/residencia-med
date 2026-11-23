CREATE TABLE "clinico"."AnaliseConsulta" (
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
CREATE INDEX "AnaliseConsulta_consultaId_idx" ON "clinico"."AnaliseConsulta"("consultaId");
CREATE INDEX "AnaliseConsulta_usuarioAuthId_idx" ON "clinico"."AnaliseConsulta"("usuarioAuthId");
ALTER TABLE "clinico"."AnaliseConsulta" ENABLE ROW LEVEL SECURITY;
