CREATE TYPE "clinico"."SistemaProntuario" AS ENUM ('FEEGOW');

CREATE TABLE "clinico"."IntegracaoProntuario" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "sistema" "clinico"."SistemaProntuario" NOT NULL,
    "tokenCifrado" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegracaoProntuario_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegracaoProntuario_usuarioAuthId_sistema_key"
  ON "clinico"."IntegracaoProntuario"("usuarioAuthId", "sistema");

CREATE TABLE "clinico"."VinculoExterno" (
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
CREATE UNIQUE INDEX "VinculoExterno_usuarioAuthId_sistema_tipoRecurso_idExterno_key"
  ON "clinico"."VinculoExterno"("usuarioAuthId", "sistema", "tipoRecurso", "idExterno");
CREATE INDEX "VinculoExterno_pacienteId_idx" ON "clinico"."VinculoExterno"("pacienteId");
CREATE INDEX "VinculoExterno_consultaId_idx" ON "clinico"."VinculoExterno"("consultaId");

CREATE TABLE "clinico"."TokenExtensao" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "hashToken" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Extensão Chrome',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    CONSTRAINT "TokenExtensao_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TokenExtensao_hashToken_key" ON "clinico"."TokenExtensao"("hashToken");
CREATE INDEX "TokenExtensao_usuarioAuthId_idx" ON "clinico"."TokenExtensao"("usuarioAuthId");
