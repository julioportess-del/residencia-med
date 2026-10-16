-- Comentario gerado por IA nas questoes oficiais + origem da classificacao por tema.
-- Aditiva: so adiciona colunas/enum com default.

CREATE TYPE "OrigemClassificacao" AS ENUM ('MANUAL', 'PARSER', 'IA');

ALTER TABLE "Questao"
  ADD COLUMN "comentarioIa" JSONB,
  ADD COLUMN "comentarioIaModelo" TEXT,
  ADD COLUMN "comentarioIaVersao" TEXT,
  ADD COLUMN "comentarioIaEm" TIMESTAMP(3),
  ADD COLUMN "comentarioIaRevisado" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gabaritoContestadoIa" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "QuestaoTema"
  ADD COLUMN "origem" "OrigemClassificacao" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "confianca" DOUBLE PRECISION;
