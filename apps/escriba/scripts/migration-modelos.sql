-- Migração: biblioteca de Modelos de documento (templates que guiam a IA).
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (guardas + ON CONFLICT).

-- Enum
DO $$ BEGIN
  CREATE TYPE "clinico"."TipoDocumentoModelo" AS ENUM
    ('EVOLUCAO', 'RECEITUARIO', 'ATESTADO', 'SOLICITACAO_EXAMES', 'RESUMO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela
CREATE TABLE IF NOT EXISTS "clinico"."Modelo" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "tipoDocumento" "clinico"."TipoDocumentoModelo" NOT NULL DEFAULT 'EVOLUCAO',
    "instrucoes" TEXT NOT NULL,
    "formatoBase" "clinico"."ModeloEvolucao" NOT NULL DEFAULT 'SOAP',
    "isPublico" BOOLEAN NOT NULL DEFAULT false,
    "isPadrao" BOOLEAN NOT NULL DEFAULT false,
    "usosCount" INTEGER NOT NULL DEFAULT 0,
    "ultimoUsoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),
    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Modelo_usuarioAuthId_idx" ON "clinico"."Modelo"("usuarioAuthId");
CREATE INDEX IF NOT EXISTS "Modelo_especialidade_idx" ON "clinico"."Modelo"("especialidade");

-- Vínculo opcional Consulta -> Modelo
ALTER TABLE "clinico"."Consulta" ADD COLUMN IF NOT EXISTS "modeloId" TEXT;
CREATE INDEX IF NOT EXISTS "Consulta_modeloId_idx" ON "clinico"."Consulta"("modeloId");
DO $$ BEGIN
  ALTER TABLE "clinico"."Consulta"
    ADD CONSTRAINT "Consulta_modeloId_fkey"
    FOREIGN KEY ("modeloId") REFERENCES "clinico"."Modelo"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seeds: modelos da plataforma (usuarioAuthId NULL, isPublico true).
INSERT INTO "clinico"."Modelo"
  ("id","nome","especialidade","tipoDocumento","instrucoes","formatoBase","isPublico","atualizadoEm")
VALUES
  ('mdl_soap_geral','SOAP (geral)',NULL,'EVOLUCAO','Estruture em SOAP clássico: Subjetivo, Objetivo, Avaliação e Plano. Seja objetivo e clínico.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_mfc','Medicina de Família / UBS','Medicina de Família e Comunidade','EVOLUCAO','Use linguagem de APS/UBS. Destaque problemas ativos, condutas, encaminhamentos e retorno. Considere contexto familiar e social quando relevante.','UBS',true,CURRENT_TIMESTAMP),
  ('mdl_cardio','Cardiologia','Cardiologia','EVOLUCAO','Foque em risco cardiovascular, pressão arterial, ausculta cardíaca, sintomas (dor torácica, dispneia, palpitações), achados de ECG/exames e ajuste de terapêutica. Cite metas pressóricas/lipídicas quando pertinente.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_pediatria','Pediatria','Pediatria','EVOLUCAO','Inclua peso, altura e percentis quando informados, estado vacinal, marcos do desenvolvimento, amamentação/alimentação e orientação aos pais. Posologias por peso.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_gineco','Ginecologia / Saúde da Mulher','Ginecologia','EVOLUCAO','Registre DUM, ciclo, método contraceptivo, rastreios (citologia, mamografia) e queixas ginecológicas. Conduta e retorno.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_prenatal','Pré-natal','Obstetrícia','EVOLUCAO','Inclua idade gestacional, exames do trimestre, vacinas da gestante, pressão, edema, BCF e altura uterina quando informados. Sinais de alerta obstétricos.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_psiquiatria','Psiquiatria','Psiquiatria','EVOLUCAO','Inclua exame do estado mental, avaliação de risco (auto/heteroagressividade), evolução do quadro e ajuste de psicofármacos. Linguagem cuidadosa e não estigmatizante.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_ortopedia','Ortopedia','Ortopedia','EVOLUCAO','Descreva exame físico articular (inspeção, palpação, amplitude, manobras especiais), achados de imagem e conduta (conservadora x cirúrgica), reabilitação.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_dermato','Dermatologia','Dermatologia','EVOLUCAO','Descreva a lesão por morfologia (tipo, cor, bordas, distribuição, tamanho), hipóteses diferenciais e conduta. Sinais de alerta para encaminhamento.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_endocrino','Endocrinologia / Diabetes','Endocrinologia','EVOLUCAO','Foque em controle glicêmico (glicemia, HbA1c), metas terapêuticas, peso/IMC, rastreio de complicações e ajuste de medicação.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_pneumo','Pneumologia','Pneumologia','EVOLUCAO','Inclua ausculta pulmonar, sintomas respiratórios, tabagismo, espirometria/exames e conduta. Plano de ação para asma/DPOC quando aplicável.','SOAP',true,CURRENT_TIMESTAMP),
  ('mdl_geriatria','Geriatria','Geriatria','EVOLUCAO','Avalie funcionalidade (AVDs), polifarmácia e desprescrição, risco de quedas, cognição e contexto de cuidado. Conduta centrada na pessoa idosa.','SOAP',true,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
