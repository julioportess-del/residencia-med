-- CreateEnum
CREATE TYPE "clinico"."TipoDocumentoModelo" AS ENUM ('EVOLUCAO', 'RECEITUARIO', 'ATESTADO', 'SOLICITACAO_EXAMES', 'RESUMO', 'OUTRO');

-- CreateTable
CREATE TABLE "clinico"."Modelo" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "tipoDocumento" "clinico"."TipoDocumentoModelo" NOT NULL DEFAULT 'EVOLUCAO',
    "instrucoes" TEXT NOT NULL,
    "formatoBase" "clinico"."ModeloEvolucao" NOT NULL DEFAULT 'SOAP',
    "isPublico" BOOLEAN NOT NULL DEFAULT false,
    "isPadrao" BOOLEAN NOT NULL DEFAULT false,
    "usosCount" INTEGER NOT NULL DEFAULT 0,
    "ultimoUsoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Modelo_usuarioAuthId_idx" ON "clinico"."Modelo"("usuarioAuthId");

-- CreateIndex
CREATE INDEX "Modelo_especialidade_idx" ON "clinico"."Modelo"("especialidade");

-- AlterTable
ALTER TABLE "clinico"."Consulta" ADD COLUMN "modeloId" TEXT;

-- CreateIndex
CREATE INDEX "Consulta_modeloId_idx" ON "clinico"."Consulta"("modeloId");

-- AddForeignKey
ALTER TABLE "clinico"."Consulta" ADD CONSTRAINT "Consulta_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "clinico"."Modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
