-- Migração: tipo de atendimento (Primeira consulta / Retorno / Teleconsulta /
-- Avaliação / Procedimento / Outro) na Consulta. "Retorno" habilita o retorno
-- inteligente (contexto da consulta anterior).
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (guardas).

DO $$ BEGIN
  CREATE TYPE "clinico"."TipoAtendimento" AS ENUM
    ('PRIMEIRA_CONSULTA', 'RETORNO', 'TELECONSULTA', 'AVALIACAO', 'PROCEDIMENTO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "clinico"."Consulta"
  ADD COLUMN IF NOT EXISTS "tipoAtendimento" "clinico"."TipoAtendimento" NOT NULL DEFAULT 'OUTRO';
