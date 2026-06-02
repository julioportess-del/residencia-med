-- CreateTable
CREATE TABLE "clinico"."PreferenciasMedico" (
    "id" TEXT NOT NULL,
    "usuarioAuthId" TEXT NOT NULL,
    "especialidade" TEXT,
    "instrucoesCustom" TEXT,
    "formatoPadrao" "clinico"."ModeloEvolucao" NOT NULL DEFAULT 'SOAP',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciasMedico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciasMedico_usuarioAuthId_key" ON "clinico"."PreferenciasMedico"("usuarioAuthId");
