-- Etapa 2: caderno de erros + confiança "não sei". Somente ACRÉSCIMOS.

-- AlterEnum
ALTER TYPE "Confianca" ADD VALUE IF NOT EXISTS 'NAO_SEI';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MotivoErro" AS ENUM ('FALTA_CONHECIMENTO', 'CONCEITO_ERRADO', 'LEITURA_ENUNCIADO', 'PEGADINHA', 'ESQUECIMENTO', 'DESATENCAO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RegistroErro" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "motivo" "MotivoErro",
    "conceitoCorreto" TEXT,
    "anotacao" TEXT,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroErro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RegistroErro_userId_questaoId_key" ON "RegistroErro"("userId", "questaoId");
CREATE INDEX IF NOT EXISTS "RegistroErro_userId_motivo_idx" ON "RegistroErro"("userId", "motivo");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "RegistroErro" ADD CONSTRAINT "RegistroErro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "RegistroErro" ADD CONSTRAINT "RegistroErro_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
