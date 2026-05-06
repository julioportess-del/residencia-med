export type AlternativaSeed = {
  letra: string
  texto: string
  correta?: boolean
  explicacaoErro?: string
}

export type QuestaoSeed = {
  bancaCodigo: string
  ano: number
  tipo?: 'R1' | 'R3' | 'ACESSO_DIRETO'
  numeroOriginal?: number
  enunciado: string
  enunciadoVignette?: string
  alternativas: AlternativaSeed[]
  explicacaoMd: string
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL' | 'MUITO_DIFICIL'
  temaCodigos: string[]
  guidelineTitulos?: string[]
}

export const QUESTOES: QuestaoSeed[] = [
  // ============= CARDIOLOGIA =============
  {
    bancaCodigo: 'AMRIGS',
    ano: 2024,
    numeroOriginal: 12,
    enunciadoVignette:
      'Mulher de 68 anos, hipertensa e diabetica, comparece ao pronto-socorro com palpitacoes ha 3 horas. PA 138/82 mmHg, FC 126 bpm, irregular. Eletrocardiograma evidencia ausencia de ondas P, intervalos R-R irregulares e QRS estreito.',
    enunciado:
      'Considerando o quadro clinico e os escores de risco, qual a conduta mais apropriada quanto a anticoagulacao?',
    alternativas: [
      { letra: 'A', texto: 'AAS 100mg/dia, sem anticoagulacao plena.', explicacaoErro: 'AAS NAO substitui anticoagulacao na FA. Diretriz SBC 2023 retirou AAS do arsenal preventivo.' },
      { letra: 'B', texto: 'Anticoagulante oral direto (apixabana ou rivaroxabana).', correta: true },
      { letra: 'C', texto: 'Varfarina mantendo INR entre 2 e 3.', explicacaoErro: 'Varfarina e opcao mas nao preferencial em FA nao-valvar — diretriz prioriza ACOD.' },
      { letra: 'D', texto: 'Nao anticoagular pois o risco de sangramento supera o beneficio.', explicacaoErro: 'CHA2DS2-VASc desta paciente e ≥4. Indicacao formal de anticoagulacao plena.' },
      { letra: 'E', texto: 'Cardioverter eletricamente sem anticoagulacao previa.', explicacaoErro: 'Cardioversao em FA com inicio >48h exige anticoagulacao previa OU eco transesofagico.' },
    ],
    explicacaoMd: `## Por que B e a correta\n\nFibrilacao atrial (ECG sem onda P, R-R irregulares).\n\n### CHA2DS2-VASc\n- Idade 65-74: +1\n- Sexo feminino: +1\n- HAS: +1\n- DM: +1\n\nTotal = 4. Indicacao formal de anticoagulacao plena.\n\n### Por que ACOD?\nDiretriz SBC 2023 recomenda ACOD em FA nao-valvar pelo perfil de seguranca, sem necessidade de monitorizacao de INR e menor risco de hemorragia intracraniana.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_ARRITMIAS_FA'],
    guidelineTitulos: ['Diretriz Brasileira de Fibrilacao Atrial 2023'],
  },
  {
    bancaCodigo: 'ENARE',
    ano: 2024,
    numeroOriginal: 47,
    enunciadoVignette:
      'Homem 58 anos, tabagista, dor precordial em aperto irradiada para mandibula ha 90 minutos. PA 110/70, FC 92. ECG: supra de ST em DII, DIII, aVF, com infra em aVL. Hospital sem hemodinamica; centro de referencia a 3 horas de transferencia.',
    enunciado: 'Qual a conduta mais apropriada?',
    alternativas: [
      { letra: 'A', texto: 'Trombolise imediata com tenecteplase no proprio servico.', correta: true },
      { letra: 'B', texto: 'Transferir para ICP primaria sem intervencao.', explicacaoErro: 'Janela porta-balao recomendada: ≤120min se transferencia. 3h ultrapassa esse limite.' },
      { letra: 'C', texto: 'Aguardar troponina seriada antes de qualquer intervencao.', explicacaoErro: 'Em IAMCSST, diagnostico e clinico + ECG. Aguardar troponina atrasa reperfusao.' },
      { letra: 'D', texto: 'AAS + clopidogrel + heparina, sem reperfusao por estar fora da janela.', explicacaoErro: 'Janela de reperfusao no IAMCSST e ate 12h. Paciente esta em <3h.' },
      { letra: 'E', texto: 'Realizar ecocardiograma a beira-leito antes de decidir.', explicacaoErro: 'Ecocardiograma nao e necessario com ECG diagnostico. Atrasa reperfusao.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\nIAMCSST de parede inferior, 90 minutos.\n\n### Algoritmo de reperfusao (SBC 2023)\n1. ICP primaria se centro com hemodinamica disponivel: porta-balao ≤90min (mesmo servico) ou ≤120min (transferencia)\n2. Trombolise se nao for possivel ICP — porta-agulha ≤30min\n\nTransferencia de 3h excede 120min → trombolise local imediata.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CARDIO_SCA_IAM'],
    guidelineTitulos: ['Diretriz de IAM com Supra de ST 2023'],
  },
  {
    bancaCodigo: 'USP',
    ano: 2024,
    numeroOriginal: 15,
    enunciadoVignette:
      'Homem 65 anos, IC com FE reduzida (FE 30%), CF II. Ja em uso de IECA, beta-bloqueador, espironolactona. Permanece sintomatico apos otimizacao. NT-proBNP 2400.',
    enunciado: 'Proxima conduta com maior beneficio em mortalidade?',
    alternativas: [
      { letra: 'A', texto: 'Trocar IECA por sacubitril/valsartana (ARNI).', correta: true },
      { letra: 'B', texto: 'Adicionar furosemida 80mg/dia.', explicacaoErro: 'Diuretico de alca alivia sintomas mas nao reduz mortalidade.' },
      { letra: 'C', texto: 'Adicionar amiodarona profilatica.', explicacaoErro: 'Sem indicacao de antiarritmico profilatico em IC sem arritmia documentada.' },
      { letra: 'D', texto: 'Encaminhar para transplante cardiaco.', explicacaoErro: 'Paciente otimizavel ainda — esgotar terapia medica antes.' },
      { letra: 'E', texto: 'Aumentar dose do IECA ate maxima tolerada.', explicacaoErro: 'Se ja otimizado e sintomatico, beneficio adicional vem de ARNI ou iSGLT2.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\nPilares do tratamento de IC com FER:\n1. IECA/ARNI\n2. Beta-bloqueador\n3. Antagonista mineralocorticoide\n4. iSGLT2 (dapagliflozina/empagliflozina)\n\nPACIENT-HF mostrou que **sacubitril/valsartana** reduz mortalidade vs enalapril em ~16% em FER sintomatica. Adicionar iSGLT2 tambem seria correto pelos estudos DAPA-HF e EMPEROR-Reduced.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CARDIO_IC'],
  },

  // ============= PEDIATRIA =============
  {
    bancaCodigo: 'USP',
    ano: 2023,
    numeroOriginal: 23,
    enunciado: 'Lactente de 2 meses, em puericultura. Conforme calendario MS, devem ser administradas:',
    alternativas: [
      { letra: 'A', texto: 'BCG, Hepatite B, Pentavalente.', explicacaoErro: 'BCG e Hep B ao nascer. Pentavalente comeca aos 2 meses, mas faltam outras dessa idade.' },
      { letra: 'B', texto: 'Pentavalente, VIP, Pneumococica 10, Rotavirus.', correta: true },
      { letra: 'C', texto: 'Pentavalente, VOP, Pneumococica 10, Rotavirus.', explicacaoErro: 'VOP NAO e usada na 1a dose. Calendario atual: VIP aos 2, 4 e 6 meses.' },
      { letra: 'D', texto: 'Trip viral, Pneumococica, Meningococica.', explicacaoErro: 'Trip viral so aos 12m. Meningococica aos 3 e 5m.' },
      { letra: 'E', texto: 'Apenas Hep B e BCG, que nao foram dadas ao nascer.', explicacaoErro: 'Nao se atrasa o calendario. Aplica-se o que esta indicado para 2m + completa ausentes.' },
    ],
    explicacaoMd: `## Por que B e a correta\n\n### Calendario aos 2 meses (SBP / MS 2024)\n- Pentavalente (DTP + Hib + HepB) — 1a dose\n- VIP — 1a dose\n- Pneumococica 10 — 1a dose\n- Rotavirus — 1a dose (limite 3m e 15d)\n\nVOP entrou em desuso na 1a dose por risco de polio vacinal.`,
    dificuldade: 'FACIL',
    temaCodigos: ['PEDIA_VACINAS'],
    guidelineTitulos: ['Calendario Vacinal SBP 2024'],
  },
  {
    bancaCodigo: 'PSU-MG',
    ano: 2024,
    numeroOriginal: 21,
    enunciadoVignette:
      'Mae de RN a termo, 3 dias de vida, refere dor para amamentar. Mama com fissura no mamilo direito. RN com pega visivelmente assimetrica.',
    enunciado: 'Conduta inicial mais apropriada?',
    alternativas: [
      { letra: 'A', texto: 'Suspender aleitamento materno e iniciar formula.', explicacaoErro: 'Suspender aleitamento e ultima opcao. Causa de fissura aqui e pega errada — corrigir.' },
      { letra: 'B', texto: 'Corrigir tecnica de pega e amamentacao.', correta: true },
      { letra: 'C', texto: 'Prescrever antibiotico topico no mamilo.', explicacaoErro: 'Sem sinais de infeccao (eritema, calor, secrecao). ATB nao indicado.' },
      { letra: 'D', texto: 'Indicar bombinha de leite por 2 semanas.', explicacaoErro: 'Se pega esta errada, problema persiste sem corrigir a tecnica.' },
      { letra: 'E', texto: 'Aplicar creme cicatrizante a base de lanolina.', explicacaoErro: 'Lanolina pode ajudar ADJUVANTE, mas a causa raiz e a pega — corrigir primeiro.' },
    ],
    explicacaoMd: `## Por que B e a correta\n\n### Sinais de boa pega\n- Boca bem aberta\n- Labio inferior evertido\n- Bochechas arredondadas\n- Maior parte da areola visivel acima\n- Queixo encosta na mama\n\n### Causa principal de fissura\nPega errada — RN suga apenas mamilo. Correcao da tecnica resolve em 80% dos casos. Aleitamento NAO deve ser interrompido; o proprio leite tem propriedades cicatrizantes (passar leite no mamilo apos mamada).`,
    dificuldade: 'FACIL',
    temaCodigos: ['PEDIA_ALEITAMENTO'],
  },
  {
    bancaCodigo: 'IPSEMG',
    ano: 2024,
    numeroOriginal: 18,
    enunciadoVignette:
      'Lactente 4 meses, febre 39C ha 3 dias, recusa alimentar. Exame: gemencia, perfusao 4s, FR 60, retracao subdiafragmatica. SpO2 88%.',
    enunciado: 'Conduta imediata?',
    alternativas: [
      { letra: 'A', texto: 'Internacao + suporte ventilatorio + ATB EV empirico.', correta: true },
      { letra: 'B', texto: 'Amoxicilina VO + observacao em casa.', explicacaoErro: 'Sinais de gravidade (gemencia, hipoxia, taquipneia, retracao) exigem internacao.' },
      { letra: 'C', texto: 'Aerosol com salbutamol e reavaliar em 30min.', explicacaoErro: 'Salbutamol nao trata pneumonia bacteriana. Estabilizacao e ATB.' },
      { letra: 'D', texto: 'Corticoide IM e alta com retorno em 24h.', explicacaoErro: 'Sem indicacao de corticoide; risco de descompensacao em casa.' },
      { letra: 'E', texto: 'Fisioterapia respiratoria e oxigenio domiciliar.', explicacaoErro: 'Lactente em sofrimento respiratorio + hipoxia: nao e candidato a manejo domiciliar.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Pneumonia grave em lactente\nSinais de alarme (OMS/MS):\n- Tiragem subcostal\n- SpO2 <90%\n- Recusa alimentar\n- Gemencia\n- Cianose\n\n### Conduta\n1. Internacao + monitorizacao\n2. Oxigenio para SpO2 ≥94%\n3. ATB empirico EV (ampicilina ou amoxi-clav)\n4. Suporte hidrico\n5. Considerar UTI se piora`,
    dificuldade: 'MEDIO',
    temaCodigos: ['PEDIA_INFECTO'],
  },

  // ============= CLINICA MEDICA =============
  {
    bancaCodigo: 'UNIFESP',
    ano: 2024,
    numeroOriginal: 31,
    enunciadoVignette:
      'Homem 52 anos, diabetes tipo 2 ha 8 anos, em uso de metformina 2g/dia. HbA1c 8,4%. PA 142/88. Albumina/creatinina urinaria 70 mg/g. IMC 31.',
    enunciado: 'Adicao mais apropriada ao tratamento?',
    alternativas: [
      { letra: 'A', texto: 'Glibenclamida.', explicacaoErro: 'Sulfonilureias caem em prioridade. Sem beneficio cardiovascular/renal e risco de hipoglicemia.' },
      { letra: 'B', texto: 'Insulina NPH bedtime.', explicacaoErro: 'Insulina seria opcao mas iSGLT2/GLP-1 oferece beneficios adicionais (renal/CV).' },
      { letra: 'C', texto: 'iSGLT2 (empagliflozina).', correta: true },
      { letra: 'D', texto: 'Pioglitazona.', explicacaoErro: 'Risco de IC, retencao hidrica e ganho de peso. Nao e primeira escolha.' },
      { letra: 'E', texto: 'Acarbose.', explicacaoErro: 'Eficacia menor; sem beneficio CV ou renal.' },
    ],
    explicacaoMd: `## Por que C e a correta\n\nPaciente com DM2 + nefropatia incipiente (microalbuminuria) + HAS.\n\n### Por que iSGLT2?\nDiretriz ADA/SBD 2024: em DM2 com:\n- Doenca renal cronica → iSGLT2 (empa, dapa)\n- IC ou alto risco CV → iSGLT2 ou GLP-1\n- Sobrepeso/obesidade → GLP-1 ou iSGLT2\n\nEMPA-REG, DAPA-CKD: reducao de progressao de doenca renal.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_ENDOCRINO'],
  },
  {
    bancaCodigo: 'SUS-SP',
    ano: 2024,
    numeroOriginal: 9,
    enunciadoVignette:
      'Homem 58 anos, ex-tabagista 40 macos-ano, dispneia progressiva. VEF1/CVF pos-bd 0,62. VEF1 55% predito. CAT score 18. 2 exacerbacoes no ultimo ano, 1 com internacao.',
    enunciado: 'Classificacao GOLD e tratamento inicial?',
    alternativas: [
      { letra: 'A', texto: 'GOLD A — broncodilatador SOS.', explicacaoErro: 'CAT 18 e ≥2 exacerbacoes/ano = grupo E (alto risco), nao A.' },
      { letra: 'B', texto: 'GOLD B — LABA + LAMA.', explicacaoErro: 'Grupo B = sintomas com baixo risco. Este paciente tem alto risco.' },
      { letra: 'C', texto: 'GOLD E — LABA + LAMA + ICS.', correta: true },
      { letra: 'D', texto: 'GOLD D — apenas ICS.', explicacaoErro: 'Classificacao GOLD 2024 nao usa mais grupo D; e A, B ou E.' },
      { letra: 'E', texto: 'GOLD E — apenas oxigenoterapia.', explicacaoErro: 'Oxigenio se SpO2 baixa. Aqui faltam dados; tratamento broncodilatador combinado e o pilar.' },
    ],
    explicacaoMd: `## Por que C e a correta\n\n### GOLD 2024 — classificacao\n- Grupo A: CAT <10 e ≤1 exacerbacao sem hospitalizacao\n- Grupo B: CAT ≥10 e ≤1 exacerbacao sem hospitalizacao\n- Grupo E: ≥2 exacerbacoes/ano OU ≥1 com hospitalizacao (independente de sintomas)\n\nPaciente: 2 exacerbacoes + 1 hospitalizacao = E.\n\n### Tratamento grupo E\n- LABA + LAMA primeiro\n- Adicionar ICS se eosinofilos sangue ≥300 ou hist asma\n- Roflumilaste ou azitromicina em casos selecionados`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_PNEUMO'],
  },

  // ============= CIRURGIA =============
  {
    bancaCodigo: 'HCPA',
    ano: 2024,
    numeroOriginal: 22,
    enunciadoVignette:
      'Homem 30 anos, vitima de acidente moto, chega ao PS. PA 80/50, FC 130, FR 28, ecograve bra 11. Abdomen distendido, dor difusa. FAST positivo (liquido livre).',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Tomografia abdominal urgente para definir estrategia.', explicacaoErro: 'Paciente instavel + FAST+ = nao e candidato a TC. Cirurgia direta.' },
      { letra: 'B', texto: 'Laparotomia exploradora imediata.', correta: true },
      { letra: 'C', texto: 'Drenagem peritoneal percutanea.', explicacaoErro: 'Drenagem nao trata lesao de orgao solido. Apenas em coleções selecionadas.' },
      { letra: 'D', texto: 'Embolizacao angiografica esplenica.', explicacaoErro: 'Embolizacao e opcao em paciente ESTAVEL. Aqui esta instavel.' },
      { letra: 'E', texto: 'Observacao por 6 horas e nova FAST.', explicacaoErro: 'Observacao em paciente instavel pode ser fatal.' },
    ],
    explicacaoMd: `## Por que B e a correta\n\n### Trauma abdominal fechado — fluxograma ATLS\n- Estavel + FAST− → TC ou observacao\n- Estavel + FAST+ → TC para mapear lesao\n- Instavel + FAST+ → laparotomia exploradora imediata\n- Instavel + FAST− → buscar outras causas de choque\n\nPaciente em choque (PA 80/50, FC 130) com FAST+ = laparotomia urgente sem mais exames.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CIR_TRAUMA'],
  },
  {
    bancaCodigo: 'UFRJ',
    ano: 2024,
    numeroOriginal: 14,
    enunciadoVignette:
      'Mulher 45 anos, dor abdominal periumbilical migratoria para FID ha 12h, febre 38,2C, anorexia. Blumberg positivo. Leuco 14.000. Sem comorbidades.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Apendicectomia laparoscopica.', correta: true },
      { letra: 'B', texto: 'Antibioticoterapia isolada com ciprofloxacina + metronidazol.', explicacaoErro: 'ATB isolada tem altas taxas de recorrencia (>30% em 1 ano). Cirurgia e padrao.' },
      { letra: 'C', texto: 'Tomografia para confirmar antes de cirurgia.', explicacaoErro: 'Quadro clinico classico (Alvarado alto) — TC opcional. Atrasar cirurgia aumenta risco de perfuracao.' },
      { letra: 'D', texto: 'Aguardar 24h com observacao.', explicacaoErro: 'Apendicite com >12h sem tratamento → maior risco de perfuracao e peritonite.' },
      { letra: 'E', texto: 'Drenagem percutanea.', explicacaoErro: 'Drenagem indicada se ja ha plastrao apendicular formado, nao em apendicite aguda nao complicada.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Apendicite aguda — diagnostico clinico\nEscore de Alvarado ≥7 → alta probabilidade.\n\n### Tratamento padrao\n- Apendicectomia laparoscopica preferencial\n- ATB profilatico no pre-operatorio (cefalosporina + metronidazol)\n- ATB pos: nao-complicada = 24h; complicada (peritonite/abscesso) = 4-7 dias\n\n### ATB isolada\nEstudos APPAC mostram opcao em casos selecionados (sem fecalitos, sem complicacao), mas com 30-40% de recorrencia em 1 ano.`,
    dificuldade: 'FACIL',
    temaCodigos: ['CIR_ABDOMEN_AGUDO'],
  },

  // ============= GO =============
  {
    bancaCodigo: 'UNICAMP',
    ano: 2024,
    numeroOriginal: 8,
    enunciadoVignette:
      'Gestante 32 anos, G2P1, IG 39 semanas, em trabalho de parto ativo. Dilatacao 6cm, dinamica 3 contracoes em 10min, BCF 140 com aceleracoes. Em fase ativa ha 4 horas.',
    enunciado: 'A conduta correta e:',
    alternativas: [
      { letra: 'A', texto: 'Aguardar evolucao espontanea com monitorizacao intermitente.', correta: true },
      { letra: 'B', texto: 'Acelerar com ocitocina.', explicacaoErro: 'Ocitocina indicada apenas se progressao inadequada. Curva de dilatacao normal: ~1cm/h. Adequado.' },
      { letra: 'C', texto: 'Indicar cesariana.', explicacaoErro: 'Sem distocia. Indicacao incorreta.' },
      { letra: 'D', texto: 'Realizar amniotomia para acelerar.', explicacaoErro: 'Amniotomia rotineira nao e mais recomendada.' },
      { letra: 'E', texto: 'Iniciar analgesia epidural.', explicacaoErro: 'Analgesia e opcao da paciente, nao deve ser imposta.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Trabalho de parto normal\n- Fase ativa: dilatacao >5-6cm + contracoes regulares\n- Curva normal multipara: ~1cm/h\n- Paciente: 6cm + dinamica adequada + BCF normal = evolucao normal\n\n### Conduta expectante (MS 2023)\n- Monitorizacao intermitente do BCF\n- Sem intervencoes rotineiras\n- Permitir movimentacao, hidratacao, suporte`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PARTO'],
    guidelineTitulos: ['Manejo do Trabalho de Parto - Ministerio da Saude 2023'],
  },
  {
    bancaCodigo: 'FMRP-USP',
    ano: 2024,
    numeroOriginal: 5,
    enunciadoVignette:
      'Gestante 28 anos, IG 28 semanas, sem comorbidades. TOTG 75g: jejum 96, 1h 195, 2h 165 mg/dL.',
    enunciado: 'Diagnostico e conduta inicial?',
    alternativas: [
      { letra: 'A', texto: 'Diabetes gestacional — orientacao dietetica e MAPA glicemica.', correta: true },
      { letra: 'B', texto: 'Diabetes pre-gestacional — iniciar insulina imediatamente.', explicacaoErro: 'Sem evidencia de pre-gestacional (diagnostico exigiria HbA1c ≥6,5% ou glicemia jejum ≥126 antes da gestacao).' },
      { letra: 'C', texto: 'Tolerancia normal — repetir em 4 semanas.', explicacaoErro: 'Valores alterados: jejum ≥92, 1h ≥180, 2h ≥153. Diagnosticos.' },
      { letra: 'D', texto: 'Iniciar metformina diretamente.', explicacaoErro: 'Tratamento inicial: dieta + atividade fisica + monitorizacao 1-2 semanas. Insulina/metformina se nao atinge metas.' },
      { letra: 'E', texto: 'Encaminhar para parto cesarea programado.', explicacaoErro: 'Diagnostico nao indica cesarea programada. Via de parto e obstetrica.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Criterios IADPSG/SBD para DMG\nQualquer um:\n- Jejum ≥92 mg/dL\n- 1h ≥180 mg/dL\n- 2h ≥153 mg/dL\n\nPaciente: jejum 96 + 1h 195 + 2h 165 → todos alterados.\n\n### Conduta inicial\n1. Dieta com fracionamento\n2. Atividade fisica (caminhada apos refeicoes)\n3. Monitorizacao glicemica capilar 4-7x/dia\n4. Avaliar metas em 1-2 semanas\n5. Insulina se metas nao atingidas (jejum <95, 1h pos <140 ou 2h pos <120)`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PRENATAL'],
  },

  // ============= PSF =============
  {
    bancaCodigo: 'PSU-MG',
    ano: 2024,
    numeroOriginal: 33,
    enunciado: 'Sobre a Estrategia Saude da Familia (ESF), conforme PNAB 2017, e CORRETO afirmar:',
    alternativas: [
      { letra: 'A', texto: 'Populacao adscrita maxima de 4.000 pessoas.', explicacaoErro: 'PNAB define 2.000-3.500 recomendado, com maximo 4.000 EXCEPCIONALMENTE.' },
      { letra: 'B', texto: 'Equipe minima: medico, enfermeiro, tecnico de enfermagem e ACS.', correta: true },
      { letra: 'C', texto: 'Numero de ACS sempre 6 por equipe.', explicacaoErro: 'Variavel: 1 ACS para cada 750 pessoas, podendo ate 100% de cobertura.' },
      { letra: 'D', texto: 'NASF substituiu equipes minimas.', explicacaoErro: 'NASF (hoje eMulti) e equipe de APOIO, nao substitui.' },
      { letra: 'E', texto: 'PSF e ESF sao termos sinonimos.', explicacaoErro: 'PSF era programa pontual; ESF e estrategia organizadora da APS.' },
    ],
    explicacaoMd: `## Por que B e a correta\n\n### Equipe minima ESF (PNAB 2017)\n- 1 medico\n- 1 enfermeiro\n- 1 tecnico/auxiliar enfermagem\n- ACS (variavel)\n\nPode incluir saude bucal (eSF + SB).\n\n### NASF / eMulti (2023)\nNASF substituido pelas eMulti. Apoio matricial: nutricionistas, psicologos, fisioterapeutas.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['PSF_SUS'],
    guidelineTitulos: ['Politica Nacional de Atencao Basica'],
  },
  {
    bancaCodigo: 'BH',
    ano: 2024,
    numeroOriginal: 6,
    enunciado:
      'Em uma populacao de 100.000 pessoas, observou-se 50 casos novos de uma doenca em 1 ano. A incidencia anual e:',
    alternativas: [
      { letra: 'A', texto: '50 casos por 100.000 habitantes-ano.', correta: true },
      { letra: 'B', texto: '0,5% ao ano.', explicacaoErro: '50/100.000 = 0,05%, nao 0,5%.' },
      { letra: 'C', texto: '5 por 100.000.', explicacaoErro: 'Conta errada.' },
      { letra: 'D', texto: 'Incidencia nao pode ser calculada com esses dados.', explicacaoErro: 'Dados sao suficientes: casos novos / populacao em risco / tempo.' },
      { letra: 'E', texto: 'Prevalencia de 50 casos.', explicacaoErro: 'Prevalencia inclui todos os casos (novos + antigos), nao so novos.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Incidencia\nIncidencia = casos NOVOS / populacao em risco × tempo\n\nIncidencia = 50 / 100.000 × 1 ano = 50 por 100.000 habitantes-ano (ou 0,05%)\n\n### Diferenca prevalencia x incidencia\n- Incidencia: casos novos em periodo\n- Prevalencia: todos os casos existentes em momento\n\nPrevalencia = Incidencia × Duracao media da doenca`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSF_EPIDEMIO'],
  },

  // ============= PSIQUIATRIA =============
  {
    bancaCodigo: 'UFPR',
    ano: 2024,
    numeroOriginal: 11,
    enunciadoVignette:
      'Mulher 35 anos, queixa de tristeza ha 4 semanas, anedonia, insonia terminal, perda 4kg, ideacao de morte sem plano. Sem episodios previos. Sem comorbidades.',
    enunciado: 'Diagnostico e tratamento inicial?',
    alternativas: [
      { letra: 'A', texto: 'Episodio depressivo maior — iniciar ISRS (sertralina ou escitalopram).', correta: true },
      { letra: 'B', texto: 'Distimia — iniciar imipramina.', explicacaoErro: 'Distimia exige sintomas ≥2 anos. Quadro agudo de 4 semanas.' },
      { letra: 'C', texto: 'Reacao normal de luto — apenas observacao.', explicacaoErro: 'Sem fator precipitante mencionado; criterios de DSM-5 atingidos. Tratamento indicado.' },
      { letra: 'D', texto: 'Episodio depressivo — iniciar antipsicotico.', explicacaoErro: 'Antipsicotico nao e primeira escolha em depressao sem psicose.' },
      { letra: 'E', texto: 'Transtorno bipolar — iniciar litio.', explicacaoErro: 'Sem episodios maniacos previos. Diagnostico nao se aplica.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Criterios DSM-5 (≥5 sintomas em 2 semanas)\n- Humor deprimido\n- Anedonia\n- Alteracoes peso/apetite\n- Insonia/hipersonia\n- Agitacao/lentificacao\n- Fadiga\n- Culpa/desvalia\n- Concentracao\n- Ideacao suicida\n\nPaciente: ≥5 ✓\n\n### Tratamento\n- ISRS (sertralina, escitalopram, fluoxetina) — 1a linha\n- Inicio em 4-6 semanas\n- Manter 6-12 meses apos remissao\n- Avaliar risco de suicidio em toda consulta`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSIQ_DEPRESSAO'],
  },

  // ============= MAIS CARDIO =============
  {
    bancaCodigo: 'AMRIGS',
    ano: 2023,
    numeroOriginal: 28,
    enunciadoVignette:
      'Homem 62 anos, HAS, dislipidemia, dor toracica em aperto desencadeada por esforco moderado, alivia com repouso. ECG normal. Troponina normal seriada.',
    enunciado: 'Hipotese diagnostica e proximo passo?',
    alternativas: [
      { letra: 'A', texto: 'Sindrome coronariana cronica — teste ergometrico ou cintilografia.', correta: true },
      { letra: 'B', texto: 'IAM sem supra — cateterismo imediato.', explicacaoErro: 'Troponina normal e ECG normal afastam IAM. Sintoma cronico, nao agudo.' },
      { letra: 'C', texto: 'Angina instavel — internar para cateterismo.', explicacaoErro: 'Angina instavel = mudanca recente de padrao. Aqui e estavel.' },
      { letra: 'D', texto: 'Dor musculoesqueletica — alta com analgesico.', explicacaoErro: 'Dor desencadeada por esforco, paciente de risco. Investigar.' },
      { letra: 'E', texto: 'Pericardite — RM cardiaca.', explicacaoErro: 'Pericardite tipicamente dor pleuritica, posicional, ECG com supra difuso.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Sindrome coronariana cronica\nDor anginosa estavel:\n- Em aperto, retroesternal\n- Desencadeada por esforco/estresse\n- Alivia com repouso ou nitrato\n- Padrao estavel\n\n### Investigacao\n1. Estratificacao de risco (probabilidade pre-teste)\n2. Teste funcional: ergometrico, cintilografia, eco stress\n3. Angio-TC ou cateterismo se alto risco`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_SCA_NSTEMI'],
  },
  {
    bancaCodigo: 'SES-SC',
    ano: 2024,
    numeroOriginal: 19,
    enunciadoVignette:
      'Mulher 70 anos, HAS, em uso de losartana 50mg + HCTZ 12,5mg. PA 158/96 em 3 medicas. Ja com mudancas de estilo de vida adequadas.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Adicionar amlodipina.', correta: true },
      { letra: 'B', texto: 'Trocar HCTZ por furosemida.', explicacaoErro: 'Furosemida nao e diuretico anti-hipertensivo de escolha (so se IC ou IRC avancada).' },
      { letra: 'C', texto: 'Aumentar losartana para 100mg.', explicacaoErro: 'Combinar drogas de classes diferentes e melhor que aumentar uma so.' },
      { letra: 'D', texto: 'Suspender HCTZ por idade avancada.', explicacaoErro: 'Tiazidico em baixa dose e seguro em idosos e bem tolerado.' },
      { letra: 'E', texto: 'Indicar denervacao renal.', explicacaoErro: 'Procedimento experimental, nao primeira/segunda linha.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### HAS estagio 2 + alvo nao atingido\nAlvo PA: <140/90 (ou <130/80 se alto risco).\n\n### Estrategia preferida\nCombinar drogas de classes diferentes:\n- IECA/BRA + tiazidico (ja tem)\n- Adicionar BCC (amlodipina) → trio sinergico\n\nPNAB e Diretriz SBC: combinacoes IECA/BRA + tiazidico + BCC sao gold standard.`,
    dificuldade: 'FACIL',
    temaCodigos: ['CARDIO_HAS'],
  },

  // ============= MAIS PEDIATRIA =============
  {
    bancaCodigo: 'ENARE',
    ano: 2023,
    numeroOriginal: 35,
    enunciadoVignette:
      'RN a termo, 38 semanas, 3.200g, parto vaginal sem intercorrencias. Apgar 9/10. Tipagem sanguinea materna O+, RN A+. Coombs direto positivo.',
    enunciado: 'Conduta apos 24h se BT 14 mg/dL com BD 0,5?',
    alternativas: [
      { letra: 'A', texto: 'Fototerapia conforme curva de Bhutani.', correta: true },
      { letra: 'B', texto: 'Exsanguineotransfusao imediata.', explicacaoErro: 'Indicacao de exsanguineo: BT muito alta + sinais de neurotoxicidade. Ainda nao atingido.' },
      { letra: 'C', texto: 'Apenas observacao com nova BT em 12h.', explicacaoErro: 'Risco de progressao por incompatibilidade ABO + Coombs+. Fototerapia profilatica.' },
      { letra: 'D', texto: 'Imunoglobulina humana EV.', explicacaoErro: 'Indicada se hiperbilirrubinemia se aproxima do nivel de exsanguineo apesar de fototerapia.' },
      { letra: 'E', texto: 'Suspender aleitamento.', explicacaoErro: 'Mantem aleitamento; ictericia do leite e tardia (>1 semana). Aqui e ABO.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Ictericia neonatal por incompatibilidade ABO\n- Mae O + RN A ou B\n- Coombs direto pode ser + (~30%)\n- Hiperbilirrubinemia precoce (24-48h)\n\n### Manejo\n1. Aplicar curva de Bhutani por idade em horas\n2. Fototerapia conforme zona (alta, alto-intermediaria, intermediaria, baixa)\n3. Acompanhar com nova BT em 4-6h\n4. Manter aleitamento\n5. Imunoglobulina EV se subir apesar de fototerapia\n6. Exsanguineotransfusao se valor critico ou neurotoxicidade`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['PEDIA_NEO'],
  },

  // ============= MAIS GO =============
  {
    bancaCodigo: 'BH',
    ano: 2024,
    numeroOriginal: 16,
    enunciadoVignette:
      'Mulher 35 anos, ja com 2 cesarianas previas, gestacao atual 36 semanas, sem comorbidades, feto em apresentacao cefalica.',
    enunciado: 'Via de parto recomendada?',
    alternativas: [
      { letra: 'A', texto: 'Cesariana eletiva.', correta: true },
      { letra: 'B', texto: 'Parto vaginal apos cesariana (VBAC).', explicacaoErro: 'VBAC e contraindicado apos 2 cesarias previas — risco de rotura uterina.' },
      { letra: 'C', texto: 'Inducao com misoprostol.', explicacaoErro: 'Misoprostol contraindicado em cesarea previa — risco grave de rotura.' },
      { letra: 'D', texto: 'Aguardar inicio espontaneo do trabalho.', explicacaoErro: 'Recomenda-se cesariana eletiva 39 semanas em pacientes com 2 cesarias previas.' },
      { letra: 'E', texto: 'Versao externa para apresentacao podal.', explicacaoErro: 'Feto ja esta cefalico. Nao ha indicacao.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Via de parto apos cesarea\n- 1 cesarea previa: VBAC pode ser tentado se condicoes favoraveis (incisao segmentar transversa, sem outras contraindicacoes)\n- ≥2 cesareas: cesariana eletiva (risco de rotura ~1%)\n- Cesarea classica (corporal): SEMPRE cesarea eletiva\n\n### Cesarea eletiva\n- Programar 39 semanas (reduz prematuridade tardia)\n- Avaliar maturidade fetal se <39 semanas`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PARTO'],
  },

  // ============= MAIS CLINICA =============
  {
    bancaCodigo: 'UNIFESP',
    ano: 2023,
    numeroOriginal: 42,
    enunciadoVignette:
      'Homem 45 anos, dor abdominal em queimacao no epigastrio ha 6 meses, piora 2-3h apos refeicoes, alivia com antiacido. Sem perda ponderal. Tabagista.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Pesquisa de H. pylori e tratamento se positivo + IBP.', correta: true },
      { letra: 'B', texto: 'EDA imediata para descartar neoplasia.', explicacaoErro: 'Sem sinais de alarme (perda ponderal, anemia, disfagia, idade >55). EDA nao e primeira linha.' },
      { letra: 'C', texto: 'Cirurgia para vagotomia.', explicacaoErro: 'Cirurgia obsoleta em ulcera nao complicada com tratamento clinico disponivel.' },
      { letra: 'D', texto: 'Apenas IBP por 4 semanas.', explicacaoErro: 'Ignorar H. pylori = recidiva. Tratar a causa.' },
      { letra: 'E', texto: 'Bloqueador H2 + retorno em 6 meses.', explicacaoErro: 'IBP e mais potente; tratamento de H. pylori essencial.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Dispepsia/ulcera peptica\n- Sintomas tipicos sem sinais de alarme em <55 anos: testar e tratar H. pylori\n- Sinais de alarme (perda ponderal, anemia, disfagia, vomito persistente, sangramento) → EDA\n\n### Esquema H. pylori (1a linha)\n- IBP + amoxicilina + claritromicina × 14 dias OU\n- IBP + amoxicilina + levofloxacino × 10 dias OU\n- Esquema quadruplo com bismuto se resistencia\n\n### Confirmar erradicacao\n- Teste respiratorio ou antigeno fecal 4-8 semanas apos termino`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CLINICA_GASTRO'],
  },
  {
    bancaCodigo: 'IPSEMG',
    ano: 2024,
    numeroOriginal: 26,
    enunciadoVignette:
      'Homem 35 anos, retorna apos viagem para zona endemica. Febre intermitente ha 7 dias, calafrios, cefaleia, mialgia. Esfregaco sanguineo: trofozoitos em anel em hemacias normais.',
    enunciado: 'Diagnostico e conduta?',
    alternativas: [
      { letra: 'A', texto: 'Malaria por P. falciparum — artemeter+lumefantrina.', correta: true },
      { letra: 'B', texto: 'Malaria por P. vivax — cloroquina + primaquina.', explicacaoErro: 'P. vivax tem hemacias aumentadas e granulacoes de Schuffner. Aqui hemacias normais sugere P. falciparum.' },
      { letra: 'C', texto: 'Babesiose — atovaquona + azitromicina.', explicacaoErro: 'Babesiose e raro no Brasil; padrao parasitologico diferente.' },
      { letra: 'D', texto: 'Dengue grave — apenas suporte.', explicacaoErro: 'Dengue: leucopenia, plaquetopenia, sem parasitos em hemacias.' },
      { letra: 'E', texto: 'Febre amarela — apenas suporte.', explicacaoErro: 'Febre amarela: ictericia, hemorragia, lesao hepatica. Sem parasito intracelular.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### P. falciparum vs P. vivax (esfregaco)\n- P. falciparum: hemacias normais, multiplos anelis, gametocitos em foice\n- P. vivax: hemacias aumentadas, Schuffner, formas variadas\n\n### Tratamento P. falciparum (MS)\n- Nao complicada: artemeter + lumefantrina × 3 dias\n- Grave: artesunato EV\n\n### P. vivax (sem hipnozoitos): cloroquina + primaquina (radical cure)`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_INFECTO'],
  },

  // ============= MAIS PSF =============
  {
    bancaCodigo: 'SES-SC',
    ano: 2024,
    numeroOriginal: 4,
    enunciado:
      'Sao acoes da Vigilancia em Saude, EXCETO:',
    alternativas: [
      { letra: 'A', texto: 'Vigilancia epidemiologica de doencas de notificacao compulsoria.' },
      { letra: 'B', texto: 'Vigilancia sanitaria de servicos de saude.' },
      { letra: 'C', texto: 'Vigilancia ambiental (qualidade da agua, vetores).' },
      { letra: 'D', texto: 'Vigilancia da saude do trabalhador.' },
      { letra: 'E', texto: 'Realizacao direta de cirurgias de alta complexidade.', correta: true },
    ],
    explicacaoMd: `## Por que E e a correta\n\n### Areas da Vigilancia em Saude (MS)\n1. Vigilancia epidemiologica\n2. Vigilancia sanitaria\n3. Vigilancia ambiental\n4. Vigilancia da saude do trabalhador\n\nAlta complexidade hospitalar NAO e atribuicao da Vigilancia em Saude — pertence a media/alta complexidade do SUS.`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSF_VIGILANCIA'],
  },

  // ============= MAIS CARDIO/CIR =============
  {
    bancaCodigo: 'HCPA',
    ano: 2023,
    numeroOriginal: 17,
    enunciadoVignette:
      'Mulher 25 anos, palpitacoes em sustos, taquicardia subita iniciada e terminada abruptamente. PA 100/65, FC 180, regular, QRS estreito. Sem sinais de instabilidade.',
    enunciado: 'Conduta inicial?',
    alternativas: [
      { letra: 'A', texto: 'Manobra vagal (Valsalva modificada).', correta: true },
      { letra: 'B', texto: 'Cardioversao eletrica sincronizada 100J.', explicacaoErro: 'Cardioversao em paciente estavel reservada se manobras + drogas falharem.' },
      { letra: 'C', texto: 'Amiodarona EV em bolus.', explicacaoErro: 'Amiodarona nao e 1a linha em TSV de QRS estreito estavel.' },
      { letra: 'D', texto: 'Beta-bloqueador EV.', explicacaoErro: 'BB pode ser util mas adenosina + manobras vagais sao primeira linha.' },
      { letra: 'E', texto: 'Marcapasso transcutaneo.', explicacaoErro: 'Indicado em bradicardia, nao taquicardia.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### TSV (Taquicardia Supraventricular paroxistica)\nQRS estreito, regular, ~150-250 bpm, inicio/termino subitos.\n\n### Algoritmo (paciente estavel)\n1. Manobras vagais (Valsalva modificada — 45° elevacao apos Valsalva, eficacia 43% vs 17% padrao)\n2. Adenosina 6mg em bolus rapido (12mg se falhar)\n3. BCC (verapamil) ou beta-bloqueador EV\n4. Cardioversao se nao reverter ou instavel\n\n### Instavel\nSinais: hipotensao, dor toracica, IC aguda, alteracao consciencia → cardioversao sincronizada imediata.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_ARRITMIAS'],
  },
  {
    bancaCodigo: 'UFRJ',
    ano: 2023,
    numeroOriginal: 25,
    enunciadoVignette:
      'Mulher 55 anos, dor em FII com massa palpavel, febre 38C ha 3 dias. TC abdomen: divertilculite com abscesso pericolico de 5cm.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Drenagem percutanea + ATB EV + colonoscopia em 6 semanas.', correta: true },
      { letra: 'B', texto: 'Cirurgia urgente com colostomia.', explicacaoErro: 'Cirurgia urgente reservada para Hinchey III/IV (peritonite). Hinchey II = drenagem.' },
      { letra: 'C', texto: 'ATB VO ambulatorial.', explicacaoErro: 'Hinchey II (abscesso pericolico) requer internacao + ATB EV + drenagem.' },
      { letra: 'D', texto: 'Apenas ATB EV sem drenagem.', explicacaoErro: 'Abscesso ≥4cm com sinais sistemicos = drenagem percutanea.' },
      { letra: 'E', texto: 'Resseccao colica eletiva imediata.', explicacaoErro: 'Resseccao eletiva apos resolucao do quadro agudo, se indicada.' },
    ],
    explicacaoMd: `## Por que A e a correta\n\n### Classificacao de Hinchey\n- I: abscesso pericolico pequeno (<4cm) → ATB EV\n- II: abscesso pelvico/abdominal distante (≥4cm) → drenagem percutanea + ATB\n- III: peritonite purulenta → cirurgia urgente\n- IV: peritonite fecal → cirurgia urgente\n\n### Apos resolucao\n- Colonoscopia em 6 semanas para descartar neoplasia\n- Considerar colectomia eletiva se recorrencias`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CIR_ABDOMEN_AGUDO'],
  },
]
