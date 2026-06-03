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
      'Mulher de 68 anos, hipertensa e diabética, comparece ao pronto-socorro com palpitações há 3 horas. PA 138/82 mmHg, FC 126 bpm, irregular. Eletrocardiograma evidencia ausência de ondas P, intervalos R-R irregulares e QRS estreito.',
    enunciado:
      'Considerando o quadro clínico e os escores de risco, qual a conduta mais apropriada quanto à anticoagulação?',
    alternativas: [
      {
        letra: 'A',
        texto: 'AAS 100mg/dia, sem anticoagulação plena.',
        explicacaoErro:
          'AAS NÃO substitui anticoagulação na FA. Diretriz SBC 2023 retirou AAS do arsenal preventivo.',
      },
      {
        letra: 'B',
        texto: 'Anticoagulante oral direto (apixabana ou rivaroxabana).',
        correta: true,
      },
      {
        letra: 'C',
        texto: 'Varfarina mantendo INR entre 2 e 3.',
        explicacaoErro:
          'Varfarina é opção mas não preferencial em FA não-valvar — diretriz prioriza ACOD.',
      },
      {
        letra: 'D',
        texto: 'Não anticoagular pois o risco de sangramento supera o benefício.',
        explicacaoErro:
          'CHA2DS2-VASc desta paciente é ≥4. Indicação formal de anticoagulação plena.',
      },
      {
        letra: 'E',
        texto: 'Cardioverter eletricamente sem anticoagulação prévia.',
        explicacaoErro:
          'Cardioversão em FA com início >48h exige anticoagulação prévia OU eco transesofágico.',
      },
    ],
    explicacaoMd: `## Por que B é a correta\n\nFibrilação atrial (ECG sem onda P, R-R irregulares).\n\n### CHA2DS2-VASc\n- Idade 65-74: +1\n- Sexo feminino: +1\n- HAS: +1\n- DM: +1\n\nTotal = 4. Indicação formal de anticoagulação plena.\n\n### Por que ACOD?\nDiretriz SBC 2023 recomenda ACOD em FA não-valvar pelo perfil de segurança, sem necessidade de monitorização de INR e menor risco de hemorragia intracraniana.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_ARRITMIAS_FA'],
    guidelineTitulos: ['Diretriz Brasileira de Fibrilacao Atrial 2023'],
  },
  {
    bancaCodigo: 'ENARE',
    ano: 2024,
    numeroOriginal: 47,
    enunciadoVignette:
      'Homem 58 anos, tabagista, dor precordial em aperto irradiada para mandíbula há 90 minutos. PA 110/70, FC 92. ECG: supra de ST em DII, DIII, aVF, com infra em aVL. Hospital sem hemodinâmica; centro de referência a 3 horas de transferência.',
    enunciado: 'Qual a conduta mais apropriada?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Trombólise imediata com tenecteplase no próprio serviço.',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'Transferir para ICP primária sem intervenção.',
        explicacaoErro:
          'Janela porta-balão recomendada: ≤120min se transferência. 3h ultrapassa esse limite.',
      },
      {
        letra: 'C',
        texto: 'Aguardar troponina seriada antes de qualquer intervenção.',
        explicacaoErro:
          'Em IAMCSST, diagnóstico é clínico + ECG. Aguardar troponina atrasa reperfusão.',
      },
      {
        letra: 'D',
        texto: 'AAS + clopidogrel + heparina, sem reperfusão por estar fora da janela.',
        explicacaoErro: 'Janela de reperfusão no IAMCSST é até 12h. Paciente está em <3h.',
      },
      {
        letra: 'E',
        texto: 'Realizar ecocardiograma à beira-leito antes de decidir.',
        explicacaoErro: 'Ecocardiograma não é necessário com ECG diagnóstico. Atrasa reperfusão.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\nIAMCSST de parede inferior, 90 minutos.\n\n### Algoritmo de reperfusão (SBC 2023)\n1. ICP primária se centro com hemodinâmica disponível: porta-balão ≤90min (mesmo serviço) ou ≤120min (transferência)\n2. Trombólise se não for possível ICP — porta-agulha ≤30min\n\nTransferência de 3h excede 120min → trombólise local imediata.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CARDIO_SCA_IAM'],
    guidelineTitulos: ['Diretriz de IAM com Supra de ST 2023'],
  },
  {
    bancaCodigo: 'USP',
    ano: 2024,
    numeroOriginal: 15,
    enunciadoVignette:
      'Homem 65 anos, IC com FE reduzida (FE 30%), CF II. Já em uso de IECA, beta-bloqueador, espironolactona. Permanece sintomático após otimização. NT-proBNP 2400.',
    enunciado: 'Próxima conduta com maior benefício em mortalidade?',
    alternativas: [
      { letra: 'A', texto: 'Trocar IECA por sacubitril/valsartana (ARNI).', correta: true },
      {
        letra: 'B',
        texto: 'Adicionar furosemida 80mg/dia.',
        explicacaoErro: 'Diurético de alça alivia sintomas mas não reduz mortalidade.',
      },
      {
        letra: 'C',
        texto: 'Adicionar amiodarona profilática.',
        explicacaoErro:
          'Sem indicação de antiarrítmico profilático em IC sem arritmia documentada.',
      },
      {
        letra: 'D',
        texto: 'Encaminhar para transplante cardíaco.',
        explicacaoErro: 'Paciente otimizável ainda — esgotar terapia médica antes.',
      },
      {
        letra: 'E',
        texto: 'Aumentar dose do IECA até máxima tolerada.',
        explicacaoErro: 'Se já otimizado e sintomático, benefício adicional vem de ARNI ou iSGLT2.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\nPilares do tratamento de IC com FER:\n1. IECA/ARNI\n2. Beta-bloqueador\n3. Antagonista mineralocorticoide\n4. iSGLT2 (dapagliflozina/empagliflozina)\n\nPACIENT-HF mostrou que **sacubitril/valsartana** reduz mortalidade vs enalapril em ~16% em FER sintomática. Adicionar iSGLT2 também seria correto pelos estudos DAPA-HF e EMPEROR-Reduced.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CARDIO_IC'],
  },

  // ============= PEDIATRIA =============
  {
    bancaCodigo: 'USP',
    ano: 2023,
    numeroOriginal: 23,
    enunciado:
      'Lactente de 2 meses, em puericultura. Conforme calendário MS, devem ser administradas:',
    alternativas: [
      {
        letra: 'A',
        texto: 'BCG, Hepatite B, Pentavalente.',
        explicacaoErro:
          'BCG e Hep B ao nascer. Pentavalente começa aos 2 meses, mas faltam outras dessa idade.',
      },
      { letra: 'B', texto: 'Pentavalente, VIP, Pneumocócica 10, Rotavírus.', correta: true },
      {
        letra: 'C',
        texto: 'Pentavalente, VOP, Pneumocócica 10, Rotavírus.',
        explicacaoErro: 'VOP NÃO é usada na 1a dose. Calendário atual: VIP aos 2, 4 e 6 meses.',
      },
      {
        letra: 'D',
        texto: 'Tríplice viral, Pneumocócica, Meningocócica.',
        explicacaoErro: 'Tríplice viral só aos 12m. Meningocócica aos 3 e 5m.',
      },
      {
        letra: 'E',
        texto: 'Apenas Hep B e BCG, que não foram dadas ao nascer.',
        explicacaoErro:
          'Não se atrasa o calendário. Aplica-se o que está indicado para 2m + completa ausentes.',
      },
    ],
    explicacaoMd: `## Por que B é a correta\n\n### Calendário aos 2 meses (SBP / MS 2024)\n- Pentavalente (DTP + Hib + HepB) — 1a dose\n- VIP — 1a dose\n- Pneumocócica 10 — 1a dose\n- Rotavírus — 1a dose (limite 3m e 15d)\n\nVOP entrou em desuso na 1a dose por risco de pólio vacinal.`,
    dificuldade: 'FACIL',
    temaCodigos: ['PEDIA_VACINAS'],
    guidelineTitulos: ['Calendario Vacinal SBP 2024'],
  },
  {
    bancaCodigo: 'PSU-MG',
    ano: 2024,
    numeroOriginal: 21,
    enunciadoVignette:
      'Mãe de RN a termo, 3 dias de vida, refere dor para amamentar. Mama com fissura no mamilo direito. RN com pega visivelmente assimétrica.',
    enunciado: 'Conduta inicial mais apropriada?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Suspender aleitamento materno e iniciar fórmula.',
        explicacaoErro:
          'Suspender aleitamento é última opção. Causa de fissura aqui é pega errada — corrigir.',
      },
      { letra: 'B', texto: 'Corrigir técnica de pega e amamentação.', correta: true },
      {
        letra: 'C',
        texto: 'Prescrever antibiótico tópico no mamilo.',
        explicacaoErro: 'Sem sinais de infecção (eritema, calor, secreção). ATB não indicado.',
      },
      {
        letra: 'D',
        texto: 'Indicar bombinha de leite por 2 semanas.',
        explicacaoErro: 'Se pega está errada, problema persiste sem corrigir a técnica.',
      },
      {
        letra: 'E',
        texto: 'Aplicar creme cicatrizante à base de lanolina.',
        explicacaoErro:
          'Lanolina pode ajudar ADJUVANTE, mas a causa raiz é a pega — corrigir primeiro.',
      },
    ],
    explicacaoMd: `## Por que B é a correta\n\n### Sinais de boa pega\n- Boca bem aberta\n- Lábio inferior evertido\n- Bochechas arredondadas\n- Maior parte da aréola visível acima\n- Queixo encosta na mama\n\n### Causa principal de fissura\nPega errada — RN suga apenas mamilo. Correção da técnica resolve em 80% dos casos. Aleitamento NÃO deve ser interrompido; o próprio leite tem propriedades cicatrizantes (passar leite no mamilo após mamada).`,
    dificuldade: 'FACIL',
    temaCodigos: ['PEDIA_ALEITAMENTO'],
  },
  {
    bancaCodigo: 'IPSEMG',
    ano: 2024,
    numeroOriginal: 18,
    enunciadoVignette:
      'Lactente 4 meses, febre 39C há 3 dias, recusa alimentar. Exame: gemência, perfusão 4s, FR 60, retração subdiafragmática. SpO2 88%.',
    enunciado: 'Conduta imediata?',
    alternativas: [
      { letra: 'A', texto: 'Internação + suporte ventilatório + ATB EV empírico.', correta: true },
      {
        letra: 'B',
        texto: 'Amoxicilina VO + observação em casa.',
        explicacaoErro:
          'Sinais de gravidade (gemência, hipóxia, taquipneia, retração) exigem internação.',
      },
      {
        letra: 'C',
        texto: 'Aerosol com salbutamol e reavaliar em 30min.',
        explicacaoErro: 'Salbutamol não trata pneumonia bacteriana. Estabilização e ATB.',
      },
      {
        letra: 'D',
        texto: 'Corticoide IM e alta com retorno em 24h.',
        explicacaoErro: 'Sem indicação de corticoide; risco de descompensação em casa.',
      },
      {
        letra: 'E',
        texto: 'Fisioterapia respiratória e oxigênio domiciliar.',
        explicacaoErro:
          'Lactente em sofrimento respiratório + hipóxia: não é candidato a manejo domiciliar.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Pneumonia grave em lactente\nSinais de alarme (OMS/MS):\n- Tiragem subcostal\n- SpO2 <90%\n- Recusa alimentar\n- Gemência\n- Cianose\n\n### Conduta\n1. Internação + monitorização\n2. Oxigênio para SpO2 ≥94%\n3. ATB empírico EV (ampicilina ou amoxi-clav)\n4. Suporte hídrico\n5. Considerar UTI se piora`,
    dificuldade: 'MEDIO',
    temaCodigos: ['PEDIA_INFECTO'],
  },

  // ============= CLINICA MEDICA =============
  {
    bancaCodigo: 'UNIFESP',
    ano: 2024,
    numeroOriginal: 31,
    enunciadoVignette:
      'Homem 52 anos, diabetes tipo 2 há 8 anos, em uso de metformina 2g/dia. HbA1c 8,4%. PA 142/88. Albumina/creatinina urinária 70 mg/g. IMC 31.',
    enunciado: 'Adição mais apropriada ao tratamento?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Glibenclamida.',
        explicacaoErro:
          'Sulfonilureias caem em prioridade. Sem benefício cardiovascular/renal e risco de hipoglicemia.',
      },
      {
        letra: 'B',
        texto: 'Insulina NPH bedtime.',
        explicacaoErro:
          'Insulina seria opção mas iSGLT2/GLP-1 oferece benefícios adicionais (renal/CV).',
      },
      { letra: 'C', texto: 'iSGLT2 (empagliflozina).', correta: true },
      {
        letra: 'D',
        texto: 'Pioglitazona.',
        explicacaoErro: 'Risco de IC, retenção hídrica e ganho de peso. Não é primeira escolha.',
      },
      {
        letra: 'E',
        texto: 'Acarbose.',
        explicacaoErro: 'Eficácia menor; sem benefício CV ou renal.',
      },
    ],
    explicacaoMd: `## Por que C é a correta\n\nPaciente com DM2 + nefropatia incipiente (microalbuminúria) + HAS.\n\n### Por que iSGLT2?\nDiretriz ADA/SBD 2024: em DM2 com:\n- Doença renal crônica → iSGLT2 (empa, dapa)\n- IC ou alto risco CV → iSGLT2 ou GLP-1\n- Sobrepeso/obesidade → GLP-1 ou iSGLT2\n\nEMPA-REG, DAPA-CKD: redução de progressão de doença renal.`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_ENDOCRINO'],
  },
  {
    bancaCodigo: 'SUS-SP',
    ano: 2024,
    numeroOriginal: 9,
    enunciadoVignette:
      'Homem 58 anos, ex-tabagista 40 maços-ano, dispneia progressiva. VEF1/CVF pós-bd 0,62. VEF1 55% predito. CAT score 18. 2 exacerbações no último ano, 1 com internação.',
    enunciado: 'Classificação GOLD e tratamento inicial?',
    alternativas: [
      {
        letra: 'A',
        texto: 'GOLD A — broncodilatador SOS.',
        explicacaoErro: 'CAT 18 e ≥2 exacerbações/ano = grupo E (alto risco), não A.',
      },
      {
        letra: 'B',
        texto: 'GOLD B — LABA + LAMA.',
        explicacaoErro: 'Grupo B = sintomas com baixo risco. Este paciente tem alto risco.',
      },
      { letra: 'C', texto: 'GOLD E — LABA + LAMA + ICS.', correta: true },
      {
        letra: 'D',
        texto: 'GOLD D — apenas ICS.',
        explicacaoErro: 'Classificação GOLD 2024 não usa mais grupo D; é A, B ou E.',
      },
      {
        letra: 'E',
        texto: 'GOLD E — apenas oxigenoterapia.',
        explicacaoErro:
          'Oxigênio se SpO2 baixa. Aqui faltam dados; tratamento broncodilatador combinado é o pilar.',
      },
    ],
    explicacaoMd: `## Por que C é a correta\n\n### GOLD 2024 — classificação\n- Grupo A: CAT <10 e ≤1 exacerbação sem hospitalização\n- Grupo B: CAT ≥10 e ≤1 exacerbação sem hospitalização\n- Grupo E: ≥2 exacerbações/ano OU ≥1 com hospitalização (independente de sintomas)\n\nPaciente: 2 exacerbações + 1 hospitalização = E.\n\n### Tratamento grupo E\n- LABA + LAMA primeiro\n- Adicionar ICS se eosinófilos sangue ≥300 ou hist asma\n- Roflumilaste ou azitromicina em casos selecionados`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_PNEUMO'],
  },

  // ============= CIRURGIA =============
  {
    bancaCodigo: 'HCPA',
    ano: 2024,
    numeroOriginal: 22,
    enunciadoVignette:
      'Homem 30 anos, vítima de acidente moto, chega ao PS. PA 80/50, FC 130, FR 28, ecograve bra 11. Abdome distendido, dor difusa. FAST positivo (líquido livre).',
    enunciado: 'Conduta?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Tomografia abdominal urgente para definir estratégia.',
        explicacaoErro: 'Paciente instável + FAST+ = não é candidato a TC. Cirurgia direta.',
      },
      { letra: 'B', texto: 'Laparotomia exploradora imediata.', correta: true },
      {
        letra: 'C',
        texto: 'Drenagem peritoneal percutânea.',
        explicacaoErro:
          'Drenagem não trata lesão de órgão sólido. Apenas em coleções selecionadas.',
      },
      {
        letra: 'D',
        texto: 'Embolização angiográfica esplênica.',
        explicacaoErro: 'Embolização é opção em paciente ESTÁVEL. Aqui está instável.',
      },
      {
        letra: 'E',
        texto: 'Observação por 6 horas e nova FAST.',
        explicacaoErro: 'Observação em paciente instável pode ser fatal.',
      },
    ],
    explicacaoMd: `## Por que B é a correta\n\n### Trauma abdominal fechado — fluxograma ATLS\n- Estável + FAST− → TC ou observação\n- Estável + FAST+ → TC para mapear lesão\n- Instável + FAST+ → laparotomia exploradora imediata\n- Instável + FAST− → buscar outras causas de choque\n\nPaciente em choque (PA 80/50, FC 130) com FAST+ = laparotomia urgente sem mais exames.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CIR_TRAUMA'],
  },
  {
    bancaCodigo: 'UFRJ',
    ano: 2024,
    numeroOriginal: 14,
    enunciadoVignette:
      'Mulher 45 anos, dor abdominal periumbilical migratória para FID há 12h, febre 38,2C, anorexia. Blumberg positivo. Leuco 14.000. Sem comorbidades.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Apendicectomia laparoscópica.', correta: true },
      {
        letra: 'B',
        texto: 'Antibioticoterapia isolada com ciprofloxacina + metronidazol.',
        explicacaoErro:
          'ATB isolada tem altas taxas de recorrência (>30% em 1 ano). Cirurgia é padrão.',
      },
      {
        letra: 'C',
        texto: 'Tomografia para confirmar antes de cirurgia.',
        explicacaoErro:
          'Quadro clínico clássico (Alvarado alto) — TC opcional. Atrasar cirurgia aumenta risco de perfuração.',
      },
      {
        letra: 'D',
        texto: 'Aguardar 24h com observação.',
        explicacaoErro:
          'Apendicite com >12h sem tratamento → maior risco de perfuração e peritonite.',
      },
      {
        letra: 'E',
        texto: 'Drenagem percutânea.',
        explicacaoErro:
          'Drenagem indicada se já há plastrão apendicular formado, não em apendicite aguda não complicada.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Apendicite aguda — diagnóstico clínico\nEscore de Alvarado ≥7 → alta probabilidade.\n\n### Tratamento padrão\n- Apendicectomia laparoscópica preferencial\n- ATB profilático no pré-operatório (cefalosporina + metronidazol)\n- ATB pós: não-complicada = 24h; complicada (peritonite/abscesso) = 4-7 dias\n\n### ATB isolada\nEstudos APPAC mostram opção em casos selecionados (sem fecalitos, sem complicação), mas com 30-40% de recorrência em 1 ano.`,
    dificuldade: 'FACIL',
    temaCodigos: ['CIR_ABDOMEN_AGUDO'],
  },

  // ============= GO =============
  {
    bancaCodigo: 'UNICAMP',
    ano: 2024,
    numeroOriginal: 8,
    enunciadoVignette:
      'Gestante 32 anos, G2P1, IG 39 semanas, em trabalho de parto ativo. Dilatação 6cm, dinâmica 3 contrações em 10min, BCF 140 com acelerações. Em fase ativa há 4 horas.',
    enunciado: 'A conduta correta é:',
    alternativas: [
      {
        letra: 'A',
        texto: 'Aguardar evolução espontânea com monitorização intermitente.',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'Acelerar com ocitocina.',
        explicacaoErro:
          'Ocitocina indicada apenas se progressão inadequada. Curva de dilatação normal: ~1cm/h. Adequado.',
      },
      {
        letra: 'C',
        texto: 'Indicar cesariana.',
        explicacaoErro: 'Sem distocia. Indicação incorreta.',
      },
      {
        letra: 'D',
        texto: 'Realizar amniotomia para acelerar.',
        explicacaoErro: 'Amniotomia rotineira não é mais recomendada.',
      },
      {
        letra: 'E',
        texto: 'Iniciar analgesia epidural.',
        explicacaoErro: 'Analgesia é opção da paciente, não deve ser imposta.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Trabalho de parto normal\n- Fase ativa: dilatação >5-6cm + contrações regulares\n- Curva normal multípara: ~1cm/h\n- Paciente: 6cm + dinâmica adequada + BCF normal = evolução normal\n\n### Conduta expectante (MS 2023)\n- Monitorização intermitente do BCF\n- Sem intervenções rotineiras\n- Permitir movimentação, hidratação, suporte`,
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
    enunciado: 'Diagnóstico e conduta inicial?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Diabetes gestacional — orientação dietética e MAPA glicêmica.',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'Diabetes pré-gestacional — iniciar insulina imediatamente.',
        explicacaoErro:
          'Sem evidência de pré-gestacional (diagnóstico exigiria HbA1c ≥6,5% ou glicemia jejum ≥126 antes da gestação).',
      },
      {
        letra: 'C',
        texto: 'Tolerância normal — repetir em 4 semanas.',
        explicacaoErro: 'Valores alterados: jejum ≥92, 1h ≥180, 2h ≥153. Diagnósticos.',
      },
      {
        letra: 'D',
        texto: 'Iniciar metformina diretamente.',
        explicacaoErro:
          'Tratamento inicial: dieta + atividade física + monitorização 1-2 semanas. Insulina/metformina se não atinge metas.',
      },
      {
        letra: 'E',
        texto: 'Encaminhar para parto cesárea programado.',
        explicacaoErro: 'Diagnóstico não indica cesárea programada. Via de parto é obstétrica.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Critérios IADPSG/SBD para DMG\nQualquer um:\n- Jejum ≥92 mg/dL\n- 1h ≥180 mg/dL\n- 2h ≥153 mg/dL\n\nPaciente: jejum 96 + 1h 195 + 2h 165 → todos alterados.\n\n### Conduta inicial\n1. Dieta com fracionamento\n2. Atividade física (caminhada após refeições)\n3. Monitorização glicêmica capilar 4-7x/dia\n4. Avaliar metas em 1-2 semanas\n5. Insulina se metas não atingidas (jejum <95, 1h pós <140 ou 2h pós <120)`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PRENATAL'],
  },

  // ============= PSF =============
  {
    bancaCodigo: 'PSU-MG',
    ano: 2024,
    numeroOriginal: 33,
    enunciado: 'Sobre a Estratégia Saúde da Família (ESF), conforme PNAB 2017, é CORRETO afirmar:',
    alternativas: [
      {
        letra: 'A',
        texto: 'População adscrita máxima de 4.000 pessoas.',
        explicacaoErro: 'PNAB define 2.000-3.500 recomendado, com máximo 4.000 EXCEPCIONALMENTE.',
      },
      {
        letra: 'B',
        texto: 'Equipe mínima: médico, enfermeiro, técnico de enfermagem e ACS.',
        correta: true,
      },
      {
        letra: 'C',
        texto: 'Número de ACS sempre 6 por equipe.',
        explicacaoErro: 'Variável: 1 ACS para cada 750 pessoas, podendo até 100% de cobertura.',
      },
      {
        letra: 'D',
        texto: 'NASF substituiu equipes mínimas.',
        explicacaoErro: 'NASF (hoje eMulti) é equipe de APOIO, não substitui.',
      },
      {
        letra: 'E',
        texto: 'PSF e ESF são termos sinônimos.',
        explicacaoErro: 'PSF era programa pontual; ESF é estratégia organizadora da APS.',
      },
    ],
    explicacaoMd: `## Por que B é a correta\n\n### Equipe mínima ESF (PNAB 2017)\n- 1 médico\n- 1 enfermeiro\n- 1 técnico/auxiliar enfermagem\n- ACS (variável)\n\nPode incluir saúde bucal (eSF + SB).\n\n### NASF / eMulti (2023)\nNASF substituído pelas eMulti. Apoio matricial: nutricionistas, psicólogos, fisioterapeutas.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['PSF_SUS'],
    guidelineTitulos: ['Politica Nacional de Atencao Basica'],
  },
  {
    bancaCodigo: 'BH',
    ano: 2024,
    numeroOriginal: 6,
    enunciado:
      'Em uma população de 100.000 pessoas, observou-se 50 casos novos de uma doença em 1 ano. A incidência anual é:',
    alternativas: [
      { letra: 'A', texto: '50 casos por 100.000 habitantes-ano.', correta: true },
      { letra: 'B', texto: '0,5% ao ano.', explicacaoErro: '50/100.000 = 0,05%, não 0,5%.' },
      { letra: 'C', texto: '5 por 100.000.', explicacaoErro: 'Conta errada.' },
      {
        letra: 'D',
        texto: 'Incidência não pode ser calculada com esses dados.',
        explicacaoErro: 'Dados são suficientes: casos novos / população em risco / tempo.',
      },
      {
        letra: 'E',
        texto: 'Prevalência de 50 casos.',
        explicacaoErro: 'Prevalência inclui todos os casos (novos + antigos), não só novos.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Incidência\nIncidência = casos NOVOS / população em risco × tempo\n\nIncidência = 50 / 100.000 × 1 ano = 50 por 100.000 habitantes-ano (ou 0,05%)\n\n### Diferença prevalência x incidência\n- Incidência: casos novos em período\n- Prevalência: todos os casos existentes em momento\n\nPrevalência = Incidência × Duração média da doença`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSF_EPIDEMIO'],
  },

  // ============= PSIQUIATRIA =============
  {
    bancaCodigo: 'UFPR',
    ano: 2024,
    numeroOriginal: 11,
    enunciadoVignette:
      'Mulher 35 anos, queixa de tristeza há 4 semanas, anedonia, insônia terminal, perda 4kg, ideação de morte sem plano. Sem episódios prévios. Sem comorbidades.',
    enunciado: 'Diagnóstico e tratamento inicial?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Episódio depressivo maior — iniciar ISRS (sertralina ou escitalopram).',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'Distimia — iniciar imipramina.',
        explicacaoErro: 'Distimia exige sintomas ≥2 anos. Quadro agudo de 4 semanas.',
      },
      {
        letra: 'C',
        texto: 'Reação normal de luto — apenas observação.',
        explicacaoErro:
          'Sem fator precipitante mencionado; critérios de DSM-5 atingidos. Tratamento indicado.',
      },
      {
        letra: 'D',
        texto: 'Episódio depressivo — iniciar antipsicótico.',
        explicacaoErro: 'Antipsicótico não é primeira escolha em depressão sem psicose.',
      },
      {
        letra: 'E',
        texto: 'Transtorno bipolar — iniciar lítio.',
        explicacaoErro: 'Sem episódios maníacos prévios. Diagnóstico não se aplica.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Critérios DSM-5 (≥5 sintomas em 2 semanas)\n- Humor deprimido\n- Anedonia\n- Alterações peso/apetite\n- Insônia/hipersonia\n- Agitação/lentificação\n- Fadiga\n- Culpa/desvalia\n- Concentração\n- Ideação suicida\n\nPaciente: ≥5 ✓\n\n### Tratamento\n- ISRS (sertralina, escitalopram, fluoxetina) — 1a linha\n- Início em 4-6 semanas\n- Manter 6-12 meses após remissão\n- Avaliar risco de suicídio em toda consulta`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSIQ_DEPRESSAO'],
  },

  // ============= MAIS CARDIO =============
  {
    bancaCodigo: 'AMRIGS',
    ano: 2023,
    numeroOriginal: 28,
    enunciadoVignette:
      'Homem 62 anos, HAS, dislipidemia, dor torácica em aperto desencadeada por esforço moderado, alivia com repouso. ECG normal. Troponina normal seriada.',
    enunciado: 'Hipótese diagnóstica e próximo passo?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Síndrome coronariana crônica — teste ergométrico ou cintilografia.',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'IAM sem supra — cateterismo imediato.',
        explicacaoErro: 'Troponina normal e ECG normal afastam IAM. Sintoma crônico, não agudo.',
      },
      {
        letra: 'C',
        texto: 'Angina instável — internar para cateterismo.',
        explicacaoErro: 'Angina instável = mudança recente de padrão. Aqui é estável.',
      },
      {
        letra: 'D',
        texto: 'Dor musculoesquelética — alta com analgésico.',
        explicacaoErro: 'Dor desencadeada por esforço, paciente de risco. Investigar.',
      },
      {
        letra: 'E',
        texto: 'Pericardite — RM cardíaca.',
        explicacaoErro: 'Pericardite tipicamente dor pleurítica, posicional, ECG com supra difuso.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Síndrome coronariana crônica\nDor anginosa estável:\n- Em aperto, retroesternal\n- Desencadeada por esforço/estresse\n- Alivia com repouso ou nitrato\n- Padrão estável\n\n### Investigação\n1. Estratificação de risco (probabilidade pré-teste)\n2. Teste funcional: ergométrico, cintilografia, eco stress\n3. Angio-TC ou cateterismo se alto risco`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_SCA_NSTEMI'],
  },
  {
    bancaCodigo: 'SES-SC',
    ano: 2024,
    numeroOriginal: 19,
    enunciadoVignette:
      'Mulher 70 anos, HAS, em uso de losartana 50mg + HCTZ 12,5mg. PA 158/96 em 3 medidas. Já com mudanças de estilo de vida adequadas.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Adicionar amlodipina.', correta: true },
      {
        letra: 'B',
        texto: 'Trocar HCTZ por furosemida.',
        explicacaoErro:
          'Furosemida não é diurético anti-hipertensivo de escolha (só se IC ou IRC avançada).',
      },
      {
        letra: 'C',
        texto: 'Aumentar losartana para 100mg.',
        explicacaoErro: 'Combinar drogas de classes diferentes é melhor que aumentar uma só.',
      },
      {
        letra: 'D',
        texto: 'Suspender HCTZ por idade avançada.',
        explicacaoErro: 'Tiazídico em baixa dose é seguro em idosos e bem tolerado.',
      },
      {
        letra: 'E',
        texto: 'Indicar denervação renal.',
        explicacaoErro: 'Procedimento experimental, não primeira/segunda linha.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### HAS estágio 2 + alvo não atingido\nAlvo PA: <140/90 (ou <130/80 se alto risco).\n\n### Estratégia preferida\nCombinar drogas de classes diferentes:\n- IECA/BRA + tiazídico (já tem)\n- Adicionar BCC (amlodipina) → trio sinérgico\n\nPNAB e Diretriz SBC: combinações IECA/BRA + tiazídico + BCC são gold standard.`,
    dificuldade: 'FACIL',
    temaCodigos: ['CARDIO_HAS'],
  },

  // ============= MAIS PEDIATRIA =============
  {
    bancaCodigo: 'ENARE',
    ano: 2023,
    numeroOriginal: 35,
    enunciadoVignette:
      'RN a termo, 38 semanas, 3.200g, parto vaginal sem intercorrências. Apgar 9/10. Tipagem sanguínea materna O+, RN A+. Coombs direto positivo.',
    enunciado: 'Conduta após 24h se BT 14 mg/dL com BD 0,5?',
    alternativas: [
      { letra: 'A', texto: 'Fototerapia conforme curva de Bhutani.', correta: true },
      {
        letra: 'B',
        texto: 'Exsanguineotransfusão imediata.',
        explicacaoErro:
          'Indicação de exsanguíneo: BT muito alta + sinais de neurotoxicidade. Ainda não atingido.',
      },
      {
        letra: 'C',
        texto: 'Apenas observação com nova BT em 12h.',
        explicacaoErro:
          'Risco de progressão por incompatibilidade ABO + Coombs+. Fototerapia profilática.',
      },
      {
        letra: 'D',
        texto: 'Imunoglobulina humana EV.',
        explicacaoErro:
          'Indicada se hiperbilirrubinemia se aproxima do nível de exsanguíneo apesar de fototerapia.',
      },
      {
        letra: 'E',
        texto: 'Suspender aleitamento.',
        explicacaoErro: 'Mantém aleitamento; icterícia do leite é tardia (>1 semana). Aqui é ABO.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Icterícia neonatal por incompatibilidade ABO\n- Mãe O + RN A ou B\n- Coombs direto pode ser + (~30%)\n- Hiperbilirrubinemia precoce (24-48h)\n\n### Manejo\n1. Aplicar curva de Bhutani por idade em horas\n2. Fototerapia conforme zona (alta, alto-intermediária, intermediária, baixa)\n3. Acompanhar com nova BT em 4-6h\n4. Manter aleitamento\n5. Imunoglobulina EV se subir apesar de fototerapia\n6. Exsanguineotransfusão se valor crítico ou neurotoxicidade`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['PEDIA_NEO'],
  },

  // ============= MAIS GO =============
  {
    bancaCodigo: 'BH',
    ano: 2024,
    numeroOriginal: 16,
    enunciadoVignette:
      'Mulher 35 anos, já com 2 cesarianas prévias, gestação atual 36 semanas, sem comorbidades, feto em apresentação cefálica.',
    enunciado: 'Via de parto recomendada?',
    alternativas: [
      { letra: 'A', texto: 'Cesariana eletiva.', correta: true },
      {
        letra: 'B',
        texto: 'Parto vaginal após cesariana (VBAC).',
        explicacaoErro: 'VBAC é contraindicado após 2 cesarias prévias — risco de rotura uterina.',
      },
      {
        letra: 'C',
        texto: 'Indução com misoprostol.',
        explicacaoErro: 'Misoprostol contraindicado em cesárea prévia — risco grave de rotura.',
      },
      {
        letra: 'D',
        texto: 'Aguardar início espontâneo do trabalho.',
        explicacaoErro:
          'Recomenda-se cesariana eletiva 39 semanas em pacientes com 2 cesarias prévias.',
      },
      {
        letra: 'E',
        texto: 'Versão externa para apresentação podal.',
        explicacaoErro: 'Feto já está cefálico. Não há indicação.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Via de parto após cesárea\n- 1 cesárea prévia: VBAC pode ser tentado se condições favoráveis (incisão segmentar transversa, sem outras contraindicações)\n- ≥2 cesáreas: cesariana eletiva (risco de rotura ~1%)\n- Cesárea clássica (corporal): SEMPRE cesárea eletiva\n\n### Cesárea eletiva\n- Programar 39 semanas (reduz prematuridade tardia)\n- Avaliar maturidade fetal se <39 semanas`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PARTO'],
  },

  // ============= MAIS CLINICA =============
  {
    bancaCodigo: 'UNIFESP',
    ano: 2023,
    numeroOriginal: 42,
    enunciadoVignette:
      'Homem 45 anos, dor abdominal em queimação no epigástrio há 6 meses, piora 2-3h após refeições, alivia com antiácido. Sem perda ponderal. Tabagista.',
    enunciado: 'Conduta?',
    alternativas: [
      { letra: 'A', texto: 'Pesquisa de H. pylori e tratamento se positivo + IBP.', correta: true },
      {
        letra: 'B',
        texto: 'EDA imediata para descartar neoplasia.',
        explicacaoErro:
          'Sem sinais de alarme (perda ponderal, anemia, disfagia, idade >55). EDA não é primeira linha.',
      },
      {
        letra: 'C',
        texto: 'Cirurgia para vagotomia.',
        explicacaoErro:
          'Cirurgia obsoleta em úlcera não complicada com tratamento clínico disponível.',
      },
      {
        letra: 'D',
        texto: 'Apenas IBP por 4 semanas.',
        explicacaoErro: 'Ignorar H. pylori = recidiva. Tratar a causa.',
      },
      {
        letra: 'E',
        texto: 'Bloqueador H2 + retorno em 6 meses.',
        explicacaoErro: 'IBP é mais potente; tratamento de H. pylori essencial.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Dispepsia/úlcera péptica\n- Sintomas típicos sem sinais de alarme em <55 anos: testar e tratar H. pylori\n- Sinais de alarme (perda ponderal, anemia, disfagia, vômito persistente, sangramento) → EDA\n\n### Esquema H. pylori (1a linha)\n- IBP + amoxicilina + claritromicina × 14 dias OU\n- IBP + amoxicilina + levofloxacino × 10 dias OU\n- Esquema quádruplo com bismuto se resistência\n\n### Confirmar erradicação\n- Teste respiratório ou antígeno fecal 4-8 semanas após término`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CLINICA_GASTRO'],
  },
  {
    bancaCodigo: 'IPSEMG',
    ano: 2024,
    numeroOriginal: 26,
    enunciadoVignette:
      'Homem 35 anos, retorna após viagem para zona endêmica. Febre intermitente há 7 dias, calafrios, cefaleia, mialgia. Esfregaço sanguíneo: trofozoítos em anel em hemácias normais.',
    enunciado: 'Diagnóstico e conduta?',
    alternativas: [
      { letra: 'A', texto: 'Malária por P. falciparum — artemeter+lumefantrina.', correta: true },
      {
        letra: 'B',
        texto: 'Malária por P. vivax — cloroquina + primaquina.',
        explicacaoErro:
          'P. vivax tem hemácias aumentadas e granulações de Schuffner. Aqui hemácias normais sugere P. falciparum.',
      },
      {
        letra: 'C',
        texto: 'Babesiose — atovaquona + azitromicina.',
        explicacaoErro: 'Babesiose é rara no Brasil; padrão parasitológico diferente.',
      },
      {
        letra: 'D',
        texto: 'Dengue grave — apenas suporte.',
        explicacaoErro: 'Dengue: leucopenia, plaquetopenia, sem parasitos em hemácias.',
      },
      {
        letra: 'E',
        texto: 'Febre amarela — apenas suporte.',
        explicacaoErro:
          'Febre amarela: icterícia, hemorragia, lesão hepática. Sem parasito intracelular.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### P. falciparum vs P. vivax (esfregaço)\n- P. falciparum: hemácias normais, múltiplos anéis, gametócitos em foice\n- P. vivax: hemácias aumentadas, Schuffner, formas variadas\n\n### Tratamento P. falciparum (MS)\n- Não complicada: artemeter + lumefantrina × 3 dias\n- Grave: artesunato EV\n\n### P. vivax (sem hipnozoítos): cloroquina + primaquina (radical cure)`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CLINICA_INFECTO'],
  },

  // ============= MAIS PSF =============
  {
    bancaCodigo: 'SES-SC',
    ano: 2024,
    numeroOriginal: 4,
    enunciado: 'São ações da Vigilância em Saúde, EXCETO:',
    alternativas: [
      { letra: 'A', texto: 'Vigilância epidemiológica de doenças de notificação compulsória.' },
      { letra: 'B', texto: 'Vigilância sanitária de serviços de saúde.' },
      { letra: 'C', texto: 'Vigilância ambiental (qualidade da água, vetores).' },
      { letra: 'D', texto: 'Vigilância da saúde do trabalhador.' },
      { letra: 'E', texto: 'Realização direta de cirurgias de alta complexidade.', correta: true },
    ],
    explicacaoMd: `## Por que E é a correta\n\n### Áreas da Vigilância em Saúde (MS)\n1. Vigilância epidemiológica\n2. Vigilância sanitária\n3. Vigilância ambiental\n4. Vigilância da saúde do trabalhador\n\nAlta complexidade hospitalar NÃO é atribuição da Vigilância em Saúde — pertence à média/alta complexidade do SUS.`,
    dificuldade: 'FACIL',
    temaCodigos: ['PSF_VIGILANCIA'],
  },

  // ============= MAIS CARDIO/CIR =============
  {
    bancaCodigo: 'HCPA',
    ano: 2023,
    numeroOriginal: 17,
    enunciadoVignette:
      'Mulher 25 anos, palpitações em sustos, taquicardia súbita iniciada e terminada abruptamente. PA 100/65, FC 180, regular, QRS estreito. Sem sinais de instabilidade.',
    enunciado: 'Conduta inicial?',
    alternativas: [
      { letra: 'A', texto: 'Manobra vagal (Valsalva modificada).', correta: true },
      {
        letra: 'B',
        texto: 'Cardioversão elétrica sincronizada 100J.',
        explicacaoErro: 'Cardioversão em paciente estável reservada se manobras + drogas falharem.',
      },
      {
        letra: 'C',
        texto: 'Amiodarona EV em bolus.',
        explicacaoErro: 'Amiodarona não é 1a linha em TSV de QRS estreito estável.',
      },
      {
        letra: 'D',
        texto: 'Beta-bloqueador EV.',
        explicacaoErro: 'BB pode ser útil mas adenosina + manobras vagais são primeira linha.',
      },
      {
        letra: 'E',
        texto: 'Marcapasso transcutâneo.',
        explicacaoErro: 'Indicado em bradicardia, não taquicardia.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### TSV (Taquicardia Supraventricular paroxística)\nQRS estreito, regular, ~150-250 bpm, início/término súbitos.\n\n### Algoritmo (paciente estável)\n1. Manobras vagais (Valsalva modificada — 45° elevação após Valsalva, eficácia 43% vs 17% padrão)\n2. Adenosina 6mg em bolus rápido (12mg se falhar)\n3. BCC (verapamil) ou beta-bloqueador EV\n4. Cardioversão se não reverter ou instável\n\n### Instável\nSinais: hipotensão, dor torácica, IC aguda, alteração consciência → cardioversão sincronizada imediata.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_ARRITMIAS'],
  },
  {
    bancaCodigo: 'UFRJ',
    ano: 2023,
    numeroOriginal: 25,
    enunciadoVignette:
      'Mulher 55 anos, dor em FII com massa palpável, febre 38C há 3 dias. TC de abdome: diverticulite com abscesso pericólico de 5cm.',
    enunciado: 'Conduta?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Drenagem percutânea + ATB EV + colonoscopia em 6 semanas.',
        correta: true,
      },
      {
        letra: 'B',
        texto: 'Cirurgia urgente com colostomia.',
        explicacaoErro:
          'Cirurgia urgente reservada para Hinchey III/IV (peritonite). Hinchey II = drenagem.',
      },
      {
        letra: 'C',
        texto: 'ATB VO ambulatorial.',
        explicacaoErro: 'Hinchey II (abscesso pericólico) requer internação + ATB EV + drenagem.',
      },
      {
        letra: 'D',
        texto: 'Apenas ATB EV sem drenagem.',
        explicacaoErro: 'Abscesso ≥4cm com sinais sistêmicos = drenagem percutânea.',
      },
      {
        letra: 'E',
        texto: 'Ressecção cólica eletiva imediata.',
        explicacaoErro: 'Ressecção eletiva após resolução do quadro agudo, se indicada.',
      },
    ],
    explicacaoMd: `## Por que A é a correta\n\n### Classificação de Hinchey\n- I: abscesso pericólico pequeno (<4cm) → ATB EV\n- II: abscesso pélvico/abdominal distante (≥4cm) → drenagem percutânea + ATB\n- III: peritonite purulenta → cirurgia urgente\n- IV: peritonite fecal → cirurgia urgente\n\n### Após resolução\n- Colonoscopia em 6 semanas para descartar neoplasia\n- Considerar colectomia eletiva se recorrências`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CIR_ABDOMEN_AGUDO'],
  },
]
