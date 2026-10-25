-- CreateTable: métrica de uso da Vigília. Só duração, sem frame nem biométrico.
CREATE TABLE "SessaoVigilia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aulaId" TEXT,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradaEm" TIMESTAMP(3),
    "duracaoSegundos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessaoVigilia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SessaoVigilia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SessaoVigilia_userId_iniciadaEm_idx" ON "SessaoVigilia"("userId", "iniciadaEm");
CREATE INDEX "SessaoVigilia_aulaId_idx" ON "SessaoVigilia"("aulaId");
