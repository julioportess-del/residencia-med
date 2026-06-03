-- CreateEnum
CREATE TYPE "clinico"."CategoriaAnexo" AS ENUM ('EXAME_LAB', 'EXAME_IMAGEM', 'IMAGEM_CLINICA', 'OUTRO');

-- CreateEnum
CREATE TYPE "clinico"."StatusAnexo" AS ENUM ('ENVIADO', 'PROCESSANDO', 'ANALISADO', 'ERRO');

-- CreateTable
CREATE TABLE "clinico"."Anexo" (
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

-- CreateIndex
CREATE INDEX "Anexo_usuarioAuthId_idx" ON "clinico"."Anexo"("usuarioAuthId");

-- CreateIndex
CREATE INDEX "Anexo_consultaId_idx" ON "clinico"."Anexo"("consultaId");

-- CreateIndex
CREATE INDEX "Anexo_expiraEm_idx" ON "clinico"."Anexo"("expiraEm");

-- AddForeignKey
ALTER TABLE "clinico"."Anexo" ADD CONSTRAINT "Anexo_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "clinico"."Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
