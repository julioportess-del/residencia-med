-- CreateEnum
CREATE TYPE "clinico"."TipoAtendimento" AS ENUM ('PRIMEIRA_CONSULTA', 'RETORNO', 'TELECONSULTA', 'AVALIACAO', 'PROCEDIMENTO', 'OUTRO');

-- AlterTable
ALTER TABLE "clinico"."Consulta" ADD COLUMN "tipoAtendimento" "clinico"."TipoAtendimento" NOT NULL DEFAULT 'OUTRO';
