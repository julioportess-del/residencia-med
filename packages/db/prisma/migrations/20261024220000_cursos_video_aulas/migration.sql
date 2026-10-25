-- CreateEnum
CREATE TYPE "TipoVideoAula" AS ENUM ('BASE', 'APROFUNDADA');

-- CreateEnum
CREATE TYPE "TipoMaterialAula" AS ENUM ('MAPA_MENTAL', 'APOSTILA', 'RESUMO_ESTRATEGICO', 'SLIDE_AULA', 'OUTRO');

-- CreateTable
CREATE TABLE "GrandeArea" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "capaUrl" TEXT,
    "corTema" TEXT,
    "fase" "FaseJornada" NOT NULL DEFAULT 'EXTENSIVO',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrandeArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrandeArea_slug_key" ON "GrandeArea"("slug");

-- CreateIndex
CREATE INDEX "GrandeArea_fase_publicado_ordem_idx" ON "GrandeArea"("fase", "publicado", "ordem");

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" TEXT NOT NULL,
    "grandeAreaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_grandeAreaId_slug_key" ON "Disciplina"("grandeAreaId", "slug");

-- CreateIndex
CREATE INDEX "Disciplina_grandeAreaId_ordem_idx" ON "Disciplina"("grandeAreaId", "ordem");

-- AddForeignKey
ALTER TABLE "Disciplina" ADD CONSTRAINT "Disciplina_grandeAreaId_fkey" FOREIGN KEY ("grandeAreaId") REFERENCES "GrandeArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Aula" (
    "id" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aula_disciplinaId_slug_key" ON "Aula"("disciplinaId", "slug");

-- CreateIndex
CREATE INDEX "Aula_disciplinaId_ordem_idx" ON "Aula"("disciplinaId", "ordem");

-- AddForeignKey
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "VideoAula" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "tipo" "TipoVideoAula" NOT NULL,
    "titulo" TEXT NOT NULL,
    "duracaoS" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT 'mux',
    "providerId" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "apresentador" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoAula_aulaId_tipo_idx" ON "VideoAula"("aulaId", "tipo");

-- AddForeignKey
ALTER TABLE "VideoAula" ADD CONSTRAINT "VideoAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MaterialAula" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "tipo" "TipoMaterialAula" NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanhoBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialAula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialAula_aulaId_idx" ON "MaterialAula"("aulaId");

-- AddForeignKey
ALTER TABLE "MaterialAula" ADD CONSTRAINT "MaterialAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ProgressoAula" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "tempoAssistidoS" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressoAula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoAula_userId_aulaId_key" ON "ProgressoAula"("userId", "aulaId");

-- CreateIndex
CREATE INDEX "ProgressoAula_userId_concluida_idx" ON "ProgressoAula"("userId", "concluida");

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoAula" ADD CONSTRAINT "ProgressoAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
