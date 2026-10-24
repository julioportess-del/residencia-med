-- CreateTable
CREATE TABLE "ProcessoSeletivo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "bancaId" TEXT,
    "especialidade" TEXT NOT NULL,
    "numeroInscricao" TEXT,
    "editalPublicado" BOOLEAN NOT NULL DEFAULT false,
    "linkEdital" TEXT,
    "inscricaoFeita" BOOLEAN NOT NULL DEFAULT false,
    "inscricaoPaga" BOOLEAN NOT NULL DEFAULT false,
    "taxaInscricaoCentavos" INTEGER,
    "logisticaOrganizada" BOOLEAN NOT NULL DEFAULT false,
    "cidadeProva" TEXT,
    "inicioInscricoes" DATE,
    "fimInscricoes" DATE,
    "dataProva" DATE,
    "provaRealizada" BOOLEAN NOT NULL DEFAULT false,
    "acertos" INTEGER,
    "totalQuestoes" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessoSeletivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessoSeletivo_userId_dataProva_idx" ON "ProcessoSeletivo"("userId", "dataProva");

-- CreateIndex
CREATE INDEX "ProcessoSeletivo_bancaId_idx" ON "ProcessoSeletivo"("bancaId");

-- AddForeignKey
ALTER TABLE "ProcessoSeletivo" ADD CONSTRAINT "ProcessoSeletivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoSeletivo" ADD CONSTRAINT "ProcessoSeletivo_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

