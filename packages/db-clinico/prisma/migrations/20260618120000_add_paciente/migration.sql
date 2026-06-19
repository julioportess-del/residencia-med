-- CreateTable
CREATE TABLE "clinico"."Paciente" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "alergias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicamentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "condicoesCronicas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "antecedentes" TEXT,
    "consentimentoCadastro" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "excluidoEm" TIMESTAMP(3),

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Paciente_usuarioAuthId_idx" ON "clinico"."Paciente"("usuarioAuthId");

-- CreateIndex
CREATE INDEX "Paciente_nomeCompleto_idx" ON "clinico"."Paciente"("nomeCompleto");

-- AlterTable
ALTER TABLE "clinico"."Consulta" ADD COLUMN "pacienteId" TEXT;

-- CreateIndex
CREATE INDEX "Consulta_pacienteId_idx" ON "clinico"."Consulta"("pacienteId");

-- AddForeignKey
ALTER TABLE "clinico"."Consulta" ADD CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "clinico"."Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "clinico"."PreferenciasMedico" ADD COLUMN     "cadastroPacientesAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cadastroPacientesAceiteEm" TIMESTAMP(3);
