-- CreateEnum
CREATE TYPE "clinico"."StatusConsulta" AS ENUM ('GRAVANDO', 'TRANSCREVENDO', 'ESTRUTURANDO', 'RASCUNHO', 'REVISADO');

-- CreateEnum
CREATE TYPE "clinico"."TipoConsulta" AS ENUM ('DEMANDA_ESPONTANEA', 'HIPERTENSAO', 'DIABETES', 'RENOVACAO_RECEITA', 'AVALIACAO_EXAMES', 'SAUDE_MENTAL', 'PUERICULTURA', 'SAUDE_DA_MULHER', 'DOR_LOMBAR', 'CEFALEIA', 'IVAS', 'DOR_ABDOMINAL', 'ANSIEDADE', 'ENCAMINHAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "clinico"."ModeloEvolucao" AS ENUM ('SOAP', 'CORRIDA', 'UBS');

-- CreateTable
CREATE TABLE "clinico"."Consulta" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "pacienteIniciais" TEXT NOT NULL,
    "tipoConsulta" "clinico"."TipoConsulta" NOT NULL DEFAULT 'DEMANDA_ESPONTANEA',
    "status" "clinico"."StatusConsulta" NOT NULL DEFAULT 'GRAVANDO',
    "consentimentoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinico"."Transcricao" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinico"."Evolucao" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "modelo" "clinico"."ModeloEvolucao" NOT NULL DEFAULT 'SOAP',
    "dadosEstruturados" JSONB,
    "textoGerado" TEXT NOT NULL,
    "textoEditado" TEXT,
    "revisadoPeloMedico" BOOLEAN NOT NULL DEFAULT false,
    "revisadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinico"."LogAcesso" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "consultaId" TEXT,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consulta_usuarioAuthId_idx" ON "clinico"."Consulta"("usuarioAuthId");

-- CreateIndex
CREATE INDEX "Consulta_status_idx" ON "clinico"."Consulta"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transcricao_consultaId_key" ON "clinico"."Transcricao"("consultaId");

-- CreateIndex
CREATE INDEX "Evolucao_consultaId_idx" ON "clinico"."Evolucao"("consultaId");

-- CreateIndex
CREATE INDEX "LogAcesso_usuarioAuthId_idx" ON "clinico"."LogAcesso"("usuarioAuthId");

-- AddForeignKey
ALTER TABLE "clinico"."Transcricao" ADD CONSTRAINT "Transcricao_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "clinico"."Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinico"."Evolucao" ADD CONSTRAINT "Evolucao_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "clinico"."Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
