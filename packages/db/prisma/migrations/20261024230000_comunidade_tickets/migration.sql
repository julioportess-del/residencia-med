-- CreateEnum
CREATE TYPE "CategoriaPost" AS ENUM ('DISCUSSAO', 'DUVIDA', 'DICA', 'DESABAFO');

-- CreateEnum
CREATE TYPE "StatusTicket" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO');

-- CreateTable
CREATE TABLE "PostComunidade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoria" "CategoriaPost" NOT NULL DEFAULT 'DISCUSSAO',
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComunidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostComunidade_createdAt_idx" ON "PostComunidade"("createdAt");
CREATE INDEX "PostComunidade_categoria_createdAt_idx" ON "PostComunidade"("categoria", "createdAt");
CREATE INDEX "PostComunidade_userId_idx" ON "PostComunidade"("userId");

-- AddForeignKey
ALTER TABLE "PostComunidade" ADD CONSTRAINT "PostComunidade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ComentarioComunidade" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioComunidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComentarioComunidade_postId_createdAt_idx" ON "ComentarioComunidade"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "ComentarioComunidade" ADD CONSTRAINT "ComentarioComunidade_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostComunidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComentarioComunidade" ADD CONSTRAINT "ComentarioComunidade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "categoria" TEXT,
    "status" "StatusTicket" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_userId_status_idx" ON "Ticket"("userId", "status");
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "RespostaTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "deEquipe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RespostaTicket_ticketId_createdAt_idx" ON "RespostaTicket"("ticketId", "createdAt");

-- AddForeignKey
ALTER TABLE "RespostaTicket" ADD CONSTRAINT "RespostaTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RespostaTicket" ADD CONSTRAINT "RespostaTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
