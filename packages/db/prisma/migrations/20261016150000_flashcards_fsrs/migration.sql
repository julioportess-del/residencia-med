-- Etapa 3: flashcards com FSRS. Somente ACRÉSCIMOS.
-- CreateEnum
CREATE TYPE "EstadoFsrs" AS ENUM ('NOVO', 'APRENDENDO', 'REVISAO', 'REAPRENDENDO');

-- CreateEnum
CREATE TYPE "NotaFlashcard" AS ENUM ('ERREI', 'DIFICIL', 'BOM', 'FACIL');

-- CreateEnum
CREATE TYPE "OrigemFlashcard" AS ENUM ('MANUAL', 'ERRO', 'IA');

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "questaoId" TEXT,
    "frente" TEXT NOT NULL,
    "verso" TEXT NOT NULL,
    "origem" "OrigemFlashcard" NOT NULL DEFAULT 'MANUAL',
    "suspenso" BOOLEAN NOT NULL DEFAULT false,
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "estabilidade" DOUBLE PRECISION NOT NULL,
    "dificuldade" DOUBLE PRECISION NOT NULL,
    "diasDecorridos" INTEGER NOT NULL,
    "diasAgendados" INTEGER NOT NULL,
    "passosAprendizado" INTEGER NOT NULL,
    "repeticoes" INTEGER NOT NULL,
    "lapsos" INTEGER NOT NULL,
    "estado" "EstadoFsrs" NOT NULL,
    "ultimaRevisao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisaoFlashcard" (
    "id" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nota" "NotaFlashcard" NOT NULL,
    "estadoAntes" "EstadoFsrs" NOT NULL,
    "revisadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisaoFlashcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_userId_nome_key" ON "Deck"("userId", "nome");

-- CreateIndex
CREATE INDEX "Flashcard_userId_vencimento_idx" ON "Flashcard"("userId", "vencimento");

-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "RevisaoFlashcard_userId_revisadoEm_idx" ON "RevisaoFlashcard"("userId", "revisadoEm");

-- CreateIndex
CREATE INDEX "RevisaoFlashcard_flashcardId_idx" ON "RevisaoFlashcard"("flashcardId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisaoFlashcard" ADD CONSTRAINT "RevisaoFlashcard_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

