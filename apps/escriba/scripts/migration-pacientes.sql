-- Migração: cadastro OPT-IN de pacientes + vínculo na consulta + flag de opt-in.
-- Rodar UMA vez no SQL Editor do Supabase. Re-executável (guardas IF NOT EXISTS).
-- LGPD: dado identificável só existe quando o médico ativa o cadastro e aceita
-- os termos. Criptografia em repouso é padrão do Supabase.

-- 1) Tabela Paciente
CREATE TABLE IF NOT EXISTS "clinico"."Paciente" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "alergias" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "medicamentos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "condicoesCronicas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "antecedentes" TEXT,
    "consentimentoCadastro" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),
    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Paciente_usuarioAuthId_idx" ON "clinico"."Paciente"("usuarioAuthId");
CREATE INDEX IF NOT EXISTS "Paciente_nomeCompleto_idx" ON "clinico"."Paciente"("nomeCompleto");

-- 2) Vínculo opcional Consulta -> Paciente
ALTER TABLE "clinico"."Consulta" ADD COLUMN IF NOT EXISTS "pacienteId" TEXT;
CREATE INDEX IF NOT EXISTS "Consulta_pacienteId_idx" ON "clinico"."Consulta"("pacienteId");
DO $$ BEGIN
  ALTER TABLE "clinico"."Consulta"
    ADD CONSTRAINT "Consulta_pacienteId_fkey"
    FOREIGN KEY ("pacienteId") REFERENCES "clinico"."Paciente"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Opt-in do médico nas preferências
ALTER TABLE "clinico"."PreferenciasMedico"
  ADD COLUMN IF NOT EXISTS "cadastroPacientesAtivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clinico"."PreferenciasMedico"
  ADD COLUMN IF NOT EXISTS "cadastroPacientesAceiteEm" TIMESTAMP(3);
