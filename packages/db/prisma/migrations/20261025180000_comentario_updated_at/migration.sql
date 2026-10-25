-- AlterTable: adiciona updatedAt a ComentarioComunidade (default now() pros registros existentes)
ALTER TABLE "ComentarioComunidade"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
