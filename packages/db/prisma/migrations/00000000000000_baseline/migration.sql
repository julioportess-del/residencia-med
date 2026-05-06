-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "TipoProva" AS ENUM ('R1', 'R3', 'ACESSO_DIRETO', 'REVALIDACAO');

-- CreateEnum
CREATE TYPE "Dificuldade" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL');

-- CreateEnum
CREATE TYPE "FonteGuideline" AS ENUM ('SBP', 'SBC', 'SBI', 'SBR', 'SBOT', 'FEBRASGO', 'SBN', 'SBPT', 'SBED', 'MS', 'ANVISA', 'NICE', 'WHO', 'UPTODATE', 'HARRISON', 'CECIL', 'NELSON', 'OUTRO');

-- CreateEnum
CREATE TYPE "Confianca" AS ENUM ('CHUTE', 'INCERTO', 'CONFIANTE');

-- CreateEnum
CREATE TYPE "TipoSessao" AS ENUM ('ESTUDO', 'SIMULADO', 'REVISAO', 'LIVRE');

-- CreateEnum
CREATE TYPE "TipoBloco" AS ENUM ('TEORIA', 'QUESTOES', 'REVISAO', 'SIMULADO');

-- CreateEnum
CREATE TYPE "StatusBloco" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'PULADO');

-- CreateEnum
CREATE TYPE "PlanoUsuario" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PlanoOrg" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'TRIAL', 'CANCELADA', 'INADIMPLENTE', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "PapelOrg" AS ENUM ('ADMIN', 'MEMBRO');

-- CreateEnum
CREATE TYPE "StatusSubmissao" AS ENUM ('PENDENTE_IA', 'REJEITADA_IA', 'PENDENTE_REVISAO', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "PapelMensagem" AS ENUM ('USUARIO', 'ASSISTENTE', 'SISTEMA');

-- CreateEnum
CREATE TYPE "StatusSimuladoLive" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('REVISAO_VENCENDO', 'PLANO_ATIVADO', 'PLANO_CANCELADO', 'PLANO_INADIMPLENTE', 'CONVITE_ORG', 'SIMULADO_LIVE_CONVITE', 'CONTRIBUICAO_APROVADA', 'CONTRIBUICAO_REJEITADA', 'CONTRIBUICAO_VALIDADA_IA', 'PROFICIENCIA_MARCO', 'SISTEMA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "metaResidencia" TEXT,
    "bancasAlvo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataProva" TIMESTAMP(3),
    "cargaHorariaSemanal" INTEGER,
    "organizationId" TEXT,
    "papelOrg" "PapelOrg",
    "creditosUsadosMes" INTEGER NOT NULL DEFAULT 0,
    "creditosResetEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clerkOrgId" TEXT,
    "plano" "PlanoOrg" NOT NULL DEFAULT 'STARTER',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteOrg" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "PapelOrg" NOT NULL DEFAULT 'MEMBRO',
    "token" TEXT NOT NULL,
    "convidadoPor" TEXT NOT NULL,
    "aceitoEm" TIMESTAMP(3),
    "aceitoPor" TEXT,
    "revogadoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "ultimoUsoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3),
    "revogadaEm" TIMESTAMP(3),
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyUso" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "rota" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "latenciaMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKeyUso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissaoQuestao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "enunciadoVignette" TEXT,
    "alternativasJson" JSONB NOT NULL,
    "gabaritoLetra" TEXT NOT NULL,
    "fonteUrl" TEXT,
    "comentario" TEXT,
    "status" "StatusSubmissao" NOT NULL DEFAULT 'PENDENTE_IA',
    "scoreIA" DOUBLE PRECISION,
    "motivoIA" TEXT,
    "questaoCriadaId" TEXT,
    "revisadaPor" TEXT,
    "revisadaEm" TIMESTAMP(3),
    "motivoRejeicao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissaoQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banca" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "estado" TEXT,
    "descricao" TEXT,
    "url" TEXT,
    "cor" TEXT,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especialidade" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Especialidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidadeId" TEXT NOT NULL,
    "parentId" TEXT,
    "profundidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "tipo" "TipoProva" NOT NULL DEFAULT 'R1',
    "titulo" TEXT,
    "fonte" TEXT,
    "importadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "provaId" TEXT,
    "enunciado" TEXT NOT NULL,
    "enunciadoVignette" TEXT,
    "gabaritoLetra" TEXT NOT NULL,
    "explicacao" TEXT NOT NULL,
    "explicacaoMd" TEXT NOT NULL,
    "dificuldade" "Dificuldade" NOT NULL DEFAULT 'MEDIO',
    "ano" INTEGER NOT NULL,
    "numeroOriginal" INTEGER,
    "fonte" TEXT,
    "hash" TEXT NOT NULL,
    "embedding" vector(1536),
    "geradaPorIA" BOOLEAN NOT NULL DEFAULT false,
    "questaoOriginalId" TEXT,
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "reportes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "explicacaoErro" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestaoTema" (
    "questaoId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "primario" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestaoTema_pkey" PRIMARY KEY ("questaoId","temaId")
);

-- CreateTable
CREATE TABLE "Guideline" (
    "id" TEXT NOT NULL,
    "fonte" "FonteGuideline" NOT NULL,
    "titulo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "url" TEXT,
    "resumo" TEXT NOT NULL,
    "conteudo" TEXT,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidelineTema" (
    "guidelineId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,

    CONSTRAINT "GuidelineTema_pkey" PRIMARY KEY ("guidelineId","temaId")
);

-- CreateTable
CREATE TABLE "QuestaoGuideline" (
    "questaoId" TEXT NOT NULL,
    "guidelineId" TEXT NOT NULL,
    "trecho" TEXT,

    CONSTRAINT "QuestaoGuideline_pkey" PRIMARY KEY ("questaoId","guidelineId")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT,
    "alternativaLetra" TEXT,
    "correta" BOOLEAN NOT NULL,
    "tempoSegundos" INTEGER NOT NULL,
    "confianca" "Confianca",
    "modoRevisao" BOOLEAN NOT NULL DEFAULT false,
    "sessaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoSessao" NOT NULL,
    "bancaId" TEXT,
    "configuracao" JSONB NOT NULL,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),
    "acertos" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "pulos" INTEGER NOT NULL DEFAULT 0,
    "tempoTotal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoEstudo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bancaAlvo" TEXT NOT NULL,
    "dataProva" TIMESTAMP(3) NOT NULL,
    "cargaHorariaSemanal" INTEGER NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaRevisaoEm" TIMESTAMP(3),
    "narrativa" TEXT,

    CONSTRAINT "PlanoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlocoEstudo" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "semana" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "duracaoMin" INTEGER NOT NULL,
    "tipo" "TipoBloco" NOT NULL,
    "temaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusBloco" NOT NULL DEFAULT 'PENDENTE',
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "BlocoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRevisao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "intervalo" INTEGER NOT NULL DEFAULT 1,
    "repeticoes" INTEGER NOT NULL DEFAULT 0,
    "fatorFacilidade" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "qualidade" INTEGER,
    "ultimaRevisao" TIMESTAMP(3),
    "proximaRevisao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemRevisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnaliseIncidencia" (
    "id" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "janelaAnos" INTEGER NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "porcentagem" DOUBLE PRECISION NOT NULL,
    "tendencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "computadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnaliseIncidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMCall" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "funcao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "versaoPrompt" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "latenciaMs" INTEGER NOT NULL,
    "custoUsd" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plano" "PlanoUsuario" NOT NULL DEFAULT 'FREE',
    "status" "StatusAssinatura" NOT NULL DEFAULT 'TRIAL',
    "iniciadaEm" TIMESTAMP(3),
    "validaAte" TIMESTAMP(3),
    "trialAte" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaOrg" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plano" "PlanoOrg" NOT NULL DEFAULT 'STARTER',
    "status" "StatusAssinatura" NOT NULL DEFAULT 'TRIAL',
    "seatsContratadas" INTEGER NOT NULL DEFAULT 1,
    "iniciadaEm" TIMESTAMP(3),
    "validaAte" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturaOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoStripe" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processadoEm" TIMESTAMP(3),
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoStripe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaMentor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contextoJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversaMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemMentor" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "papel" "PapelMensagem" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "custoUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimuladoLive" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "bancaId" TEXT,
    "organizationId" TEXT,
    "criadoPor" TEXT NOT NULL,
    "numeroQuestoes" INTEGER NOT NULL DEFAULT 20,
    "tempoMinutos" INTEGER NOT NULL DEFAULT 40,
    "questaoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "StatusSimuladoLive" NOT NULL DEFAULT 'AGUARDANDO',
    "iniciaEm" TIMESTAMP(3),
    "encerraEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimuladoLive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteLive" (
    "id" TEXT NOT NULL,
    "simuladoLiveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),
    "acertos" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "tempoTotal" INTEGER NOT NULL DEFAULT 0,
    "respostasJson" JSONB,

    CONSTRAINT "ParticipanteLive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proficiencia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreGlobal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porEspecialidadeJson" JSONB NOT NULL DEFAULT '[]',
    "totalRespostas" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proficiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT,
    "link" TEXT,
    "lidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkOrgId_key" ON "Organization"("clerkOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteOrg_token_key" ON "ConviteOrg"("token");

-- CreateIndex
CREATE INDEX "ConviteOrg_organizationId_idx" ON "ConviteOrg"("organizationId");

-- CreateIndex
CREATE INDEX "ConviteOrg_email_idx" ON "ConviteOrg"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hash_key" ON "ApiKey"("hash");

-- CreateIndex
CREATE INDEX "ApiKey_organizationId_idx" ON "ApiKey"("organizationId");

-- CreateIndex
CREATE INDEX "ApiKey_hash_idx" ON "ApiKey"("hash");

-- CreateIndex
CREATE INDEX "ApiKeyUso_apiKeyId_createdAt_idx" ON "ApiKeyUso"("apiKeyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissaoQuestao_questaoCriadaId_key" ON "SubmissaoQuestao"("questaoCriadaId");

-- CreateIndex
CREATE INDEX "SubmissaoQuestao_userId_createdAt_idx" ON "SubmissaoQuestao"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissaoQuestao_status_createdAt_idx" ON "SubmissaoQuestao"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Banca_codigo_key" ON "Banca"("codigo");

-- CreateIndex
CREATE INDEX "Banca_codigo_idx" ON "Banca"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidade_codigo_key" ON "Especialidade"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Tema_codigo_key" ON "Tema"("codigo");

-- CreateIndex
CREATE INDEX "Tema_especialidadeId_idx" ON "Tema"("especialidadeId");

-- CreateIndex
CREATE INDEX "Tema_parentId_idx" ON "Tema"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Tema_nome_especialidadeId_parentId_key" ON "Tema"("nome", "especialidadeId", "parentId");

-- CreateIndex
CREATE INDEX "Prova_ano_idx" ON "Prova"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "Prova_bancaId_ano_tipo_key" ON "Prova"("bancaId", "ano", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Questao_hash_key" ON "Questao"("hash");

-- CreateIndex
CREATE INDEX "Questao_bancaId_ano_idx" ON "Questao"("bancaId", "ano");

-- CreateIndex
CREATE INDEX "Questao_dificuldade_idx" ON "Questao"("dificuldade");

-- CreateIndex
CREATE INDEX "Questao_publicada_idx" ON "Questao"("publicada");

-- CreateIndex
CREATE INDEX "Questao_provaId_idx" ON "Questao"("provaId");

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_idx" ON "Alternativa"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Alternativa_questaoId_letra_key" ON "Alternativa"("questaoId", "letra");

-- CreateIndex
CREATE INDEX "QuestaoTema_temaId_idx" ON "QuestaoTema"("temaId");

-- CreateIndex
CREATE INDEX "QuestaoTema_questaoId_idx" ON "QuestaoTema"("questaoId");

-- CreateIndex
CREATE INDEX "Guideline_fonte_ano_idx" ON "Guideline"("fonte", "ano");

-- CreateIndex
CREATE INDEX "Resposta_userId_createdAt_idx" ON "Resposta"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Resposta_userId_questaoId_idx" ON "Resposta"("userId", "questaoId");

-- CreateIndex
CREATE INDEX "Resposta_questaoId_idx" ON "Resposta"("questaoId");

-- CreateIndex
CREATE INDEX "Resposta_sessaoId_idx" ON "Resposta"("sessaoId");

-- CreateIndex
CREATE INDEX "Sessao_userId_iniciadaEm_idx" ON "Sessao"("userId", "iniciadaEm");

-- CreateIndex
CREATE INDEX "Sessao_tipo_idx" ON "Sessao"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoEstudo_userId_key" ON "PlanoEstudo"("userId");

-- CreateIndex
CREATE INDEX "BlocoEstudo_planoId_semana_diaSemana_idx" ON "BlocoEstudo"("planoId", "semana", "diaSemana");

-- CreateIndex
CREATE INDEX "ItemRevisao_userId_proximaRevisao_idx" ON "ItemRevisao"("userId", "proximaRevisao");

-- CreateIndex
CREATE UNIQUE INDEX "ItemRevisao_userId_questaoId_key" ON "ItemRevisao"("userId", "questaoId");

-- CreateIndex
CREATE INDEX "AnaliseIncidencia_bancaId_porcentagem_idx" ON "AnaliseIncidencia"("bancaId", "porcentagem");

-- CreateIndex
CREATE INDEX "AnaliseIncidencia_bancaId_janelaAnos_idx" ON "AnaliseIncidencia"("bancaId", "janelaAnos");

-- CreateIndex
CREATE UNIQUE INDEX "AnaliseIncidencia_bancaId_temaId_janelaAnos_key" ON "AnaliseIncidencia"("bancaId", "temaId", "janelaAnos");

-- CreateIndex
CREATE UNIQUE INDEX "LLMCall_cacheKey_key" ON "LLMCall"("cacheKey");

-- CreateIndex
CREATE INDEX "LLMCall_userId_createdAt_idx" ON "LLMCall"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LLMCall_funcao_createdAt_idx" ON "LLMCall"("funcao", "createdAt");

-- CreateIndex
CREATE INDEX "LLMCall_cacheKey_idx" ON "LLMCall"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_userId_key" ON "Assinatura"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_stripeCustomerId_key" ON "Assinatura"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_stripeSubscriptionId_key" ON "Assinatura"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Assinatura_stripeCustomerId_idx" ON "Assinatura"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Assinatura_status_idx" ON "Assinatura"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaOrg_organizationId_key" ON "AssinaturaOrg"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaOrg_stripeCustomerId_key" ON "AssinaturaOrg"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaOrg_stripeSubscriptionId_key" ON "AssinaturaOrg"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoStripe_stripeEventId_key" ON "EventoStripe"("stripeEventId");

-- CreateIndex
CREATE INDEX "EventoStripe_processadoEm_idx" ON "EventoStripe"("processadoEm");

-- CreateIndex
CREATE INDEX "ConversaMentor_userId_updatedAt_idx" ON "ConversaMentor"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "MensagemMentor_conversaId_createdAt_idx" ON "MensagemMentor"("conversaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SimuladoLive_codigo_key" ON "SimuladoLive"("codigo");

-- CreateIndex
CREATE INDEX "SimuladoLive_codigo_idx" ON "SimuladoLive"("codigo");

-- CreateIndex
CREATE INDEX "SimuladoLive_organizationId_idx" ON "SimuladoLive"("organizationId");

-- CreateIndex
CREATE INDEX "SimuladoLive_status_idx" ON "SimuladoLive"("status");

-- CreateIndex
CREATE INDEX "ParticipanteLive_simuladoLiveId_idx" ON "ParticipanteLive"("simuladoLiveId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteLive_simuladoLiveId_userId_key" ON "ParticipanteLive"("simuladoLiveId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Proficiencia_userId_key" ON "Proficiencia"("userId");

-- CreateIndex
CREATE INDEX "Proficiencia_userId_idx" ON "Proficiencia"("userId");

-- CreateIndex
CREATE INDEX "Notificacao_userId_createdAt_idx" ON "Notificacao"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacao_userId_lidaEm_idx" ON "Notificacao"("userId", "lidaEm");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteOrg" ADD CONSTRAINT "ConviteOrg_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyUso" ADD CONSTRAINT "ApiKeyUso_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoQuestao" ADD CONSTRAINT "SubmissaoQuestao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissaoQuestao" ADD CONSTRAINT "SubmissaoQuestao_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "Especialidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_questaoOriginalId_fkey" FOREIGN KEY ("questaoOriginalId") REFERENCES "Questao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoTema" ADD CONSTRAINT "QuestaoTema_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoTema" ADD CONSTRAINT "QuestaoTema_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidelineTema" ADD CONSTRAINT "GuidelineTema_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "Guideline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidelineTema" ADD CONSTRAINT "GuidelineTema_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoGuideline" ADD CONSTRAINT "QuestaoGuideline_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoGuideline" ADD CONSTRAINT "QuestaoGuideline_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "Guideline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "Alternativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoEstudo" ADD CONSTRAINT "PlanoEstudo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlocoEstudo" ADD CONSTRAINT "BlocoEstudo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlocoEstudo" ADD CONSTRAINT "BlocoEstudo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRevisao" ADD CONSTRAINT "ItemRevisao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRevisao" ADD CONSTRAINT "ItemRevisao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnaliseIncidencia" ADD CONSTRAINT "AnaliseIncidencia_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnaliseIncidencia" ADD CONSTRAINT "AnaliseIncidencia_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMCall" ADD CONSTRAINT "LLMCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaOrg" ADD CONSTRAINT "AssinaturaOrg_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaMentor" ADD CONSTRAINT "ConversaMentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemMentor" ADD CONSTRAINT "MensagemMentor_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaMentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoLive" ADD CONSTRAINT "SimuladoLive_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "Banca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoLive" ADD CONSTRAINT "SimuladoLive_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteLive" ADD CONSTRAINT "ParticipanteLive_simuladoLiveId_fkey" FOREIGN KEY ("simuladoLiveId") REFERENCES "SimuladoLive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteLive" ADD CONSTRAINT "ParticipanteLive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proficiencia" ADD CONSTRAINT "Proficiencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

