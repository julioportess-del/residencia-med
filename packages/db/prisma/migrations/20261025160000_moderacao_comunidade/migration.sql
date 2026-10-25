-- CreateEnum
CREATE TYPE "MotivoReporte" AS ENUM ('SPAM', 'OFENSIVO', 'FORA_DO_TEMA', 'INFO_INCORRETA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusReporteComunidade" AS ENUM ('PENDENTE', 'RESOLVIDO_OCULTO', 'RESOLVIDO_MANTIDO');

-- AlterTable
ALTER TABLE "PostComunidade" ADD COLUMN "ocultoEm" TIMESTAMP(3);
CREATE INDEX "PostComunidade_ocultoEm_idx" ON "PostComunidade"("ocultoEm");

-- AlterTable
ALTER TABLE "ComentarioComunidade" ADD COLUMN "ocultoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReporteComunidade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "comentarioId" TEXT,
    "motivo" "MotivoReporte" NOT NULL,
    "detalhes" TEXT,
    "status" "StatusReporteComunidade" NOT NULL DEFAULT 'PENDENTE',
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReporteComunidade_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReporteComunidade_status_createdAt_idx" ON "ReporteComunidade"("status", "createdAt");
CREATE INDEX "ReporteComunidade_postId_idx" ON "ReporteComunidade"("postId");
CREATE INDEX "ReporteComunidade_comentarioId_idx" ON "ReporteComunidade"("comentarioId");

ALTER TABLE "ReporteComunidade" ADD CONSTRAINT "ReporteComunidade_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReporteComunidade" ADD CONSTRAINT "ReporteComunidade_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "PostComunidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReporteComunidade" ADD CONSTRAINT "ReporteComunidade_comentarioId_fkey"
  FOREIGN KEY ("comentarioId") REFERENCES "ComentarioComunidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
