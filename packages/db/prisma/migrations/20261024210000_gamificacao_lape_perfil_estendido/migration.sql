-- CreateEnum
CREATE TYPE "Cinturao" AS ENUM ('BRONZE', 'PRATA', 'OURO', 'ESMERALDA', 'PLATINA', 'DIAMANTE');

-- CreateEnum
CREATE TYPE "PerfilDisc" AS ENUM ('ANALISTA', 'COMUNICADOR', 'EXECUTOR', 'CONCILIADOR');

-- CreateEnum
CREATE TYPE "PerfilSocioemocional" AS ENUM ('TAREFAS', 'PESSOAS', 'IDEIAS', 'SISTEMAS');

-- CreateEnum
CREATE TYPE "PerfilProcrastinacao" AS ENUM ('LEVE', 'MODERADA', 'SEVERA');

-- CreateEnum
CREATE TYPE "PerfilMemoria" AS ENUM ('BAIXA', 'MEDIA', 'ACIMA_DA_MEDIA', 'ALTA');

-- AlterTable (Perfil estendido do User)
ALTER TABLE "User"
  ADD COLUMN "cpf"         TEXT,
  ADD COLUMN "whatsapp"    TEXT,
  ADD COLUMN "instagram"   TEXT,
  ADD COLUMN "tiktok"      TEXT,
  ADD COLUMN "cep"         TEXT,
  ADD COLUMN "cidade"      TEXT,
  ADD COLUMN "uf"          TEXT,
  ADD COLUMN "rua"         TEXT,
  ADD COLUMN "numero"      TEXT,
  ADD COLUMN "bairro"      TEXT,
  ADD COLUMN "complemento" TEXT;

-- CreateTable Nivel
CREATE TABLE "Nivel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cinturao" "Cinturao" NOT NULL DEFAULT 'BRONZE',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nivel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nivel_userId_key" ON "Nivel"("userId");

-- AddForeignKey
ALTER TABLE "Nivel" ADD CONSTRAINT "Nivel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PerfilCandidato
CREATE TABLE "PerfilCandidato" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "disc" "PerfilDisc",
    "socioemocional" "PerfilSocioemocional",
    "procrastinacao" "PerfilProcrastinacao",
    "memoria" "PerfilMemoria",
    "concluidoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilCandidato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilCandidato_userId_key" ON "PerfilCandidato"("userId");

-- AddForeignKey
ALTER TABLE "PerfilCandidato" ADD CONSTRAINT "PerfilCandidato_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
