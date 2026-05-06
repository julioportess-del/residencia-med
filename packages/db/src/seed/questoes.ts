import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

type AlternativaSeed = {
  letra: string
  texto: string
  correta?: boolean
  explicacaoErro?: string
}

type QuestaoSeed = {
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

const QUESTOES: QuestaoSeed[] = [
  {
    bancaCodigo: 'AMRIGS',
    ano: 2024,
    numeroOriginal: 12,
    enunciadoVignette:
      'Mulher de 68 anos, hipertensa e diabetica, comparece ao pronto-socorro com palpitacoes ha 3 horas. PA 138/82 mmHg, FC 126 bpm, irregular. Eletrocardiograma evidencia ausencia de ondas P, intervalos R-R irregulares e QRS estreito.',
    enunciado:
      'Considerando o quadro clinico e os escores de risco, qual a conduta mais apropriada quanto a anticoagulacao para essa paciente?',
    alternativas: [
      {
        letra: 'A',
        texto: 'Iniciar AAS 100mg/dia, sem necessidade de anticoagulacao plena.',
        explicacaoErro:
          'AAS NAO substitui anticoagulacao na FA. Diretriz SBC 2023 retirou AAS do arsenal preventivo de eventos tromboembolicos em FA.',
      },
      {
        letra: 'B',
        texto: 'Iniciar anticoagulante oral direto (apixabana ou rivaroxabana).',
        correta: true,
      },
      {
        letra: 'C',
        texto: 'Iniciar varfarina mantendo INR entre 2 e 3.',
        explicacaoErro:
          'Varfarina e opcao valida mas nao preferencial em FA nao-valvar — diretriz prioriza ACOD pelo perfil de seguranca e ausencia de monitorizacao de INR.',
      },
      {
        letra: 'D',
        texto: 'Nao anticoagular pois o risco de sangramento supera o beneficio.',
        explicacaoErro:
          'CHA2DS2-VASc desta paciente e ≥4 (idade 65-74 +1, sexo feminino +1, HAS +1, DM +1). Indicacao formal de anticoagulacao plena.',
      },
      {
        letra: 'E',
        texto: 'Cardioverter eletricamente sem anticoagulacao previa.',
        explicacaoErro:
          'Cardioversao em FA com inicio >48h ou tempo desconhecido exige anticoagulacao por 3 semanas previas OU eco transesofagico afastando trombo. Nunca cardiovertir as cegas.',
      },
    ],
    explicacaoMd: `## Por que B e a correta

Paciente apresenta **fibrilacao atrial** (ECG sem onda P, R-R irregulares).

### Calculo do CHA2DS2-VASc
- Idade 65-74 anos: **+1**
- Sexo feminino: **+1**
- Hipertensao: **+1**
- Diabetes: **+1**

**Total = 4**. Indicacao formal de anticoagulacao plena.

### Por que ACOD e nao varfarina?
A Diretriz Brasileira de FA (SBC, 2023) recomenda ACOD (apixabana, rivaroxabana, dabigatrana, edoxabana) como **primeira escolha em FA nao-valvar**, devido a:
- Menor risco de hemorragia intracraniana
- Sem necessidade de monitorizacao de INR
- Janela terapeutica ampla
- Menos interacoes com alimentos

Varfarina permanece indicada em **FA valvar** (estenose mitral moderada-grave ou protese valvar mecanica).`,
    dificuldade: 'MEDIO',
    temaCodigos: ['CARDIO_ARRITMIAS_FA'],
    guidelineTitulos: ['Diretriz Brasileira de Fibrilacao Atrial 2023'],
  },
  {
    bancaCodigo: 'ENARE',
    ano: 2024,
    numeroOriginal: 47,
    enunciadoVignette:
      'Homem 58 anos, tabagista, da entrada no PS com dor precordial em aperto irradiada para mandibula ha 90 minutos. PA 110/70, FC 92 bpm. ECG mostra supradesnivelamento de ST em parede inferior (DII, DIII, aVF), com infra em aVL. Hospital sem hemodinamica disponivel; centro de referencia esta a 3 horas de transferencia.',
    enunciado: 'Qual a conduta mais apropriada?',
    alternativas: [
      { letra: 'A', texto: 'Trombolise imediata com tenecteplase no proprio servico.', correta: true },
      {
        letra: 'B',
        texto: 'Transferir imediatamente para ICP primaria sem intervencao no momento.',
        explicacaoErro:
          'Janela porta-balao recomendada e ate 120min do primeiro contato medico se transferencia for necessaria. 3h ultrapassa esse limite — preferir trombolise local.',
      },
      {
        letra: 'C',
        texto: 'Aguardar dosagem seriada de troponinas antes de qualquer intervencao.',
        explicacaoErro:
          'Em IAMCSST, diagnostico e clinico + ECG. Aguardar troponina atrasa reperfusao e aumenta mortalidade.',
      },
      {
        letra: 'D',
        texto: 'AAS + clopidogrel + heparina, sem reperfusao por estar fora da janela.',
        explicacaoErro:
          'Janela de reperfusao no IAMCSST e ate 12h do inicio dos sintomas. Paciente esta na janela ideal (<3h).',
      },
      {
        letra: 'E',
        texto: 'Realizar ecocardiograma a beira-leito antes de decidir conduta.',
        explicacaoErro:
          'Ecocardiograma nao e necessario para diagnostico de IAMCSST com ECG diagnostico. Atrasa reperfusao.',
      },
    ],
    explicacaoMd: `## Por que A e a correta

**IAMCSST de parede inferior** com sintomas de 90 minutos.

### Algoritmo de reperfusao (Diretriz SBC 2023)
1. **ICP primaria** se centro com hemodinamica disponivel e tempo porta-balao ≤90min (mesmo servico) ou ≤120min (transferencia)
2. **Trombolise** se nao for possivel ICP nos prazos acima — meta porta-agulha ≤30min

Neste caso: transferencia de 3h excede 120min de porta-balao -> **trombolise local imediata**.

### Drogas obrigatorias antes/junto da reperfusao
- AAS 200-300mg mastigado
- Segundo antiplaquetario (clopidogrel ou ticagrelor)
- Anticoagulante (enoxaparina ou HNF)
- Estatina alta potencia
- Beta-bloqueador VO se sem contra-indicacao`,
    dificuldade: 'DIFICIL',
    temaCodigos: ['CARDIO_SCA_IAM'],
    guidelineTitulos: ['Diretriz de IAM com Supra de ST 2023'],
  },
  {
    bancaCodigo: 'USP',
    ano: 2023,
    numeroOriginal: 23,
    enunciado:
      'Lactente de 2 meses, em consulta de puericultura. Mae questiona quais vacinas serao aplicadas. Segundo o calendario do Ministerio da Saude, aos 2 meses devem ser administradas:',
    alternativas: [
      {
        letra: 'A',
        texto: 'BCG, Hepatite B, Pentavalente.',
        explicacaoErro: 'BCG e Hepatite B ao nascer. Pentavalente comeca aos 2 meses, mas faltam outras dessa idade.',
      },
      { letra: 'B', texto: 'Pentavalente, VIP, Pneumococica 10, Rotavirus.', correta: true },
      {
        letra: 'C',
        texto: 'Pentavalente, VOP, Pneumococica 10, Rotavirus.',
        explicacaoErro:
          'VOP (oral, atenuada) NAO e usada na primeira dose. Calendario atual: VIP (injetavel) aos 2, 4 e 6 meses.',
      },
      {
        letra: 'D',
        texto: 'Trip viral, Pneumococica, Meningococica.',
        explicacaoErro:
          'Trip viral so aos 12 meses. Meningococica C aos 3 e 5 meses. Esquema descrito nao e de 2 meses.',
      },
      {
        letra: 'E',
        texto: 'Apenas Hepatite B e BCG, que nao foram dadas ao nascer.',
        explicacaoErro:
          'Nao se atrasa o calendario para concentrar tudo. Aplica-se o que esta indicado para 2 meses + completa ausentes em separado.',
      },
    ],
    explicacaoMd: `## Por que B e a correta

### Calendario aos 2 meses (SBP / MS 2024)
- **Pentavalente** (DTP + Hib + HepB) — 1a dose
- **VIP** (poliomielite injetavel) — 1a dose
- **Pneumococica 10-valente** — 1a dose
- **Rotavirus** — 1a dose (limite ate 3m e 15d)

### Pontos importantes
- **VOP (oral)** entrou em desuso na 1a dose por risco de polio vacinal — VIP e a regra atual
- **Rotavirus** tem janela rigida: nao aplicar apos 3m e 15d (1a dose) ou 7m e 29d (ultima)
- **Calendario completo no nascer**: BCG + HepB monovalente`,
    dificuldade: 'FACIL',
    temaCodigos: ['PEDIA_VACINAS'],
    guidelineTitulos: ['Calendario Vacinal SBP 2024'],
  },
  {
    bancaCodigo: 'UNICAMP',
    ano: 2024,
    numeroOriginal: 8,
    enunciadoVignette:
      'Gestante 32 anos, G2P1, IG 39 semanas, em trabalho de parto ativo. Dilatacao cervical 6cm, dinamica uterina 3 contracoes em 10min, BCF 140 bpm com aceleracoes preservadas. Ha 4 horas em fase ativa.',
    enunciado: 'A conduta correta e:',
    alternativas: [
      { letra: 'A', texto: 'Aguardar evolucao espontanea com monitorizacao intermitente.', correta: true },
      {
        letra: 'B',
        texto: 'Acelerar com ocitocina ja que ja se passaram 4 horas em fase ativa.',
        explicacaoErro:
          'Acelaracao com ocitocina indicada APENAS se progressao inadequada. Curva de dilatacao normal: ~1cm/h. Paciente em 6cm apos 4h e progressao adequada.',
      },
      {
        letra: 'C',
        texto: 'Indicar cesariana por trabalho de parto prolongado.',
        explicacaoErro: 'Nao caracteriza trabalho de parto prolongado nem distocia. Indicacao incorreta.',
      },
      {
        letra: 'D',
        texto: 'Realizar amniotomia para acelerar o trabalho.',
        explicacaoErro: 'Amniotomia rotineira nao e mais recomendada — pratica restrita a indicacoes especificas.',
      },
      {
        letra: 'E',
        texto: 'Iniciar analgesia epidural sem aguardar pedido da paciente.',
        explicacaoErro: 'Analgesia e opcao da paciente, nao deve ser imposta. Conduta intervencionista nao indicada.',
      },
    ],
    explicacaoMd: `## Por que A e a correta

### Avaliacao do trabalho de parto
- Fase ativa: dilatacao cervical >5-6cm com contracoes regulares
- Curva de dilatacao normal: ~1cm/h em multipara
- Paciente com 6cm + dinamica adequada + BCF normal = **evolucao normal**

### Conduta expectante (MS 2023)
- Monitorizacao intermitente do BCF a cada 15-30min em fase ativa baixo risco
- NAO realizar intervencoes rotineiras: amniotomia, ocitocina, episiotomia
- Permitir movimentacao, hidratacao, suporte emocional
- Reavaliar a cada 2-4h

### Quando intervir
- Distocia (parada de progressao por 2h+)
- Sofrimento fetal (BCF <110 ou >160 sustentado)
- Sangramento ativo, prolapso de cordao, etc.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['GO_PARTO'],
    guidelineTitulos: ['Manejo do Trabalho de Parto - Ministerio da Saude 2023'],
  },
  {
    bancaCodigo: 'PSU-MG',
    ano: 2024,
    numeroOriginal: 33,
    enunciado:
      'Sobre a Estrategia Saude da Familia (ESF), conforme a Politica Nacional de Atencao Basica (PNAB 2017), e CORRETO afirmar:',
    alternativas: [
      {
        letra: 'A',
        texto: 'Cada equipe deve ter populacao adscrita maxima de 4.000 pessoas.',
        explicacaoErro: 'PNAB define populacao adscrita recomendada de 2.000 a 3.500 pessoas, com maximo de 4.000 EXCEPCIONALMENTE.',
      },
      { letra: 'B', texto: 'A equipe minima e composta por medico, enfermeiro, tecnico de enfermagem e ACS.', correta: true },
      {
        letra: 'C',
        texto: 'O numero de ACS e fixo: sempre 6 por equipe.',
        explicacaoErro:
          'Numero de ACS e variavel conforme territorio (urbano/rural, vulnerabilidade). Recomendacao: 1 ACS para cada 750 pessoas, podendo ate 100% de cobertura.',
      },
      {
        letra: 'D',
        texto: 'NASF substituiu equipes minimas em municipios pequenos.',
        explicacaoErro: 'NASF (hoje eMulti) e equipe de APOIO, nao substitui equipe minima.',
      },
      {
        letra: 'E',
        texto: 'PSF e ESF sao termos sinonimos e intercambiaveis.',
        explicacaoErro:
          'PSF (Programa) era a versao antiga; ESF (Estrategia) reflete a mudanca de programa pontual para estrategia organizadora da APS.',
      },
    ],
    explicacaoMd: `## Por que B e a correta

### Equipe minima ESF (PNAB 2017)
- 1 medico
- 1 enfermeiro
- 1 tecnico ou auxiliar de enfermagem
- ACS (Agentes Comunitarios de Saude) — numero variavel

Tambem pode incluir profissionais de saude bucal (eSF + SB).

### Populacao adscrita
- Recomendada: 2.000 a 3.500 pessoas
- Maximo: 4.000 (em areas de baixa vulnerabilidade)

### NASF / eMulti (2023)
NASF foi substituido pelas equipes Multiprofissionais (eMulti) em 2023. Funcao: apoio matricial as equipes da APS, com nutricionistas, psicologos, fisioterapeutas, etc.`,
    dificuldade: 'MEDIO',
    temaCodigos: ['PSF_SUS'],
    guidelineTitulos: ['Politica Nacional de Atencao Basica'],
  },
]

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashQuestao(enunciado: string, vignette?: string): string {
  return createHash('sha256').update(normalizar((vignette ?? '') + enunciado)).digest('hex')
}

export async function seedQuestoes(prisma: PrismaClient) {
  for (const q of QUESTOES) {
    const banca = await prisma.banca.findUnique({ where: { codigo: q.bancaCodigo } })
    if (!banca) throw new Error(`Banca nao encontrada: ${q.bancaCodigo}`)

    const prova = await prisma.prova.upsert({
      where: { bancaId_ano_tipo: { bancaId: banca.id, ano: q.ano, tipo: q.tipo ?? 'R1' } },
      create: { bancaId: banca.id, ano: q.ano, tipo: q.tipo ?? 'R1' },
      update: {},
    })

    const hash = hashQuestao(q.enunciado, q.enunciadoVignette)
    const existente = await prisma.questao.findUnique({ where: { hash } })
    if (existente) continue

    const gabarito = q.alternativas.find((a) => a.correta)
    if (!gabarito) throw new Error(`Questao sem gabarito: ${q.enunciado.slice(0, 50)}`)

    const questao = await prisma.questao.create({
      data: {
        bancaId: banca.id,
        provaId: prova.id,
        enunciado: q.enunciado,
        enunciadoVignette: q.enunciadoVignette,
        explicacao: q.explicacaoMd,
        explicacaoMd: q.explicacaoMd,
        gabaritoLetra: gabarito.letra,
        dificuldade: q.dificuldade,
        ano: q.ano,
        numeroOriginal: q.numeroOriginal,
        hash,
        alternativas: {
          create: q.alternativas.map((a, i) => ({
            letra: a.letra,
            texto: a.texto,
            correta: a.correta ?? false,
            explicacaoErro: a.explicacaoErro,
            ordem: i,
          })),
        },
      },
    })

    for (const codigo of q.temaCodigos) {
      const tema = await prisma.tema.findUnique({ where: { codigo } })
      if (!tema) continue
      await prisma.questaoTema.create({
        data: {
          questaoId: questao.id,
          temaId: tema.id,
          peso: 1.0,
          primario: true,
        },
      })
    }

    if (q.guidelineTitulos) {
      for (const titulo of q.guidelineTitulos) {
        const guideline = await prisma.guideline.findFirst({ where: { titulo } })
        if (!guideline) continue
        await prisma.questaoGuideline.create({
          data: { questaoId: questao.id, guidelineId: guideline.id },
        })
      }
    }
  }
}
