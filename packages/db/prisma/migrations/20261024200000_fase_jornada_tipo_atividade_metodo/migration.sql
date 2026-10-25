-- CreateEnum
CREATE TYPE "FaseJornada" AS ENUM ('EXTENSIVO', 'RETA_FINAL');

-- CreateEnum
CREATE TYPE "TipoAtividadeMetodo" AS ENUM ('ANAMNESE', 'EXAME', 'HIPOTESE', 'CONDUTA', 'PRONTUARIO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "faseJornada" "FaseJornada" NOT NULL DEFAULT 'EXTENSIVO';

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN "tipoAtividadeMetodo" "TipoAtividadeMetodo";

-- AlterTable
ALTER TABLE "BlocoEstudo" ADD COLUMN "tipoAtividadeMetodo" "TipoAtividadeMetodo";

-- CreateIndex
CREATE INDEX "Sessao_tipoAtividadeMetodo_idx" ON "Sessao"("tipoAtividadeMetodo");

-- CreateIndex
CREATE INDEX "BlocoEstudo_tipoAtividadeMetodo_idx" ON "BlocoEstudo"("tipoAtividadeMetodo");
