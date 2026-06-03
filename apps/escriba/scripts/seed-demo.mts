/**
 * Seed de DEMONSTRAÇÃO (apenas dev local). Cria consultas fictícias com estrutura
 * clínica completa para apresentar a UI. NÃO usar em produção. Idempotente:
 * limpa as demos anteriores do dev user antes de inserir.
 */
import * as dbc from '@residencia-med/db-clinico'
import * as aiClinico from '@residencia-med/ai/clinico'

// Destructure em runtime: contorna a checagem estática de named exports do ESM
// quando os pacotes re-exportam via wildcard. Fallback p/ `.default` (interop CJS).
/* eslint-disable @typescript-eslint/no-explicit-any */
const dbcAny = dbc as any
const aiAny = aiClinico as any
const prismaClinico = dbcAny.prismaClinico ?? dbcAny.default?.prismaClinico
const renderizarEvolucoes = aiAny.renderizarEvolucoes ?? aiAny.default?.renderizarEvolucoes
if (!prismaClinico)
  throw new Error('prismaClinico não resolvido: keys=' + Object.keys(dbcAny).join(','))
if (!renderizarEvolucoes)
  throw new Error('renderizarEvolucoes não resolvido: keys=' + Object.keys(aiAny).join(','))

const USER = 'dev-dev-residencia-med-local'

type Demo = {
  iniciais: string
  tipo: string
  status: 'RASCUNHO' | 'REVISADO'
  estrutura: unknown
  diasAtras: number
}

const demos: Demo[] = [
  {
    iniciais: 'M.S.',
    tipo: 'HIPERTENSAO',
    status: 'REVISADO',
    diasAtras: 1,
    estrutura: {
      subjetivo: {
        queixaPrincipal: 'Retorno para acompanhamento de hipertensão e diabetes.',
        historiaDoencaAtual:
          'Paciente de 58 anos, hipertensa e diabética há 10 anos, vem para reavaliação. Refere boa adesão às medicações, sem queixas no momento. Nega cefaleia, alterações visuais, dor torácica ou dispneia. Aferição domiciliar com PA em torno de 140/85.',
        antecedentesPessoais: ['Hipertensão arterial sistêmica', 'Diabetes mellitus tipo 2'],
        antecedentesFamiliares: ['Mãe diabética', 'Pai com IAM aos 60 anos'],
        medicacoesEmUso: ['Losartana 50mg 12/12h', 'Metformina 850mg 2x/dia', 'AAS 100mg/dia'],
        alergias: ['Nega alergias medicamentosas'],
        habitosVida: ['Sedentária', 'Ex-tabagista (parou há 5 anos)'],
      },
      objetivo: {
        sinaisVitais: 'PA 142/88 mmHg, FC 78 bpm, peso 82 kg, IMC 30,1 kg/m².',
        exameFisico:
          'BEG, corada, hidratada. ACV: bulhas normofonéticas, sem sopros. AR: MV presente bilateral, sem ruídos adventícios. Pés sem lesões, pulsos pediosos presentes.',
        examesComplementares: ['HbA1c 7,8% (há 1 mês)', 'Creatinina 0,9', 'LDL 118'],
      },
      avaliacao: {
        hipotesesDiagnosticas: ['HAS em controle parcial', 'DM2 com controle glicêmico subótimo'],
        cidSugerido: [
          { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
          { codigo: 'E11.9', descricao: 'Diabetes mellitus tipo 2 sem complicações' },
        ],
        raciocinioClinico:
          'Controle pressórico e glicêmico ainda acima da meta. Otimizar terapia e reforçar mudanças de estilo de vida antes de intensificar fármacos.',
      },
      plano: {
        conduta:
          'Ajuste de metformina, manutenção dos demais fármacos, reforço de dieta e atividade física.',
        prescricoes: [
          'Losartana 50mg — 1 comprimido VO 12/12h',
          'Metformina 850mg — 1 comprimido VO 3x/dia (aumentado)',
          'AAS 100mg — 1 comprimido VO 1x/dia',
        ],
        examesSolicitados: ['HbA1c', 'Perfil lipídico', 'Creatinina e TFG', 'Microalbuminúria'],
        orientacoes: [
          'Reduzir sal e açúcar; aumentar fibras e vegetais',
          'Caminhada 30 min, 5x por semana',
          'Aferir PA em casa 2x por semana e anotar',
        ],
        encaminhamentos: [],
        retorno: 'Retorno em 3 meses com exames.',
        sinaisDeAlerta: [
          'Procurar pronto-atendimento se dor torácica, falta de ar súbita ou PA > 180/110 com sintomas',
        ],
      },
      narrativaCorrida:
        'Paciente de 58 anos, hipertensa e diabética, em retorno de rotina, assintomática, com bom uso das medicações. PA 142/88, HbA1c 7,8%. Otimizada metformina, solicitados exames de controle e reforçadas medidas não farmacológicas. Retorno em 3 meses.',
    },
  },
  {
    iniciais: 'J.P.',
    tipo: 'IVAS',
    status: 'RASCUNHO',
    diasAtras: 0,
    estrutura: {
      subjetivo: {
        queixaPrincipal: 'Dor de garganta e febre há 3 dias.',
        historiaDoencaAtual:
          'Homem de 34 anos com odinofagia intensa, febre aferida de 38,5°C, dores no corpo. Nega tosse produtiva ou dispneia. Refere placas esbranquiçadas na garganta.',
        antecedentesPessoais: ['Hígido'],
        medicacoesEmUso: [],
        alergias: ['Nega'],
        habitosVida: ['Não tabagista'],
      },
      objetivo: {
        sinaisVitais: 'Tax 38,2°C, PA 120/80, FC 90 bpm.',
        exameFisico:
          'Orofaringe hiperemiada com exsudato amigdaliano bilateral. Linfonodos cervicais anteriores aumentados e dolorosos. AR limpo.',
      },
      avaliacao: {
        hipotesesDiagnosticas: ['Faringoamigdalite bacteriana (provável estreptocócica)'],
        cidSugerido: [{ codigo: 'J03.9', descricao: 'Amigdalite aguda não especificada' }],
        raciocinioClinico:
          'Critérios de Centor elevados (febre, exsudato, adenopatia, ausência de tosse) — antibioticoterapia indicada.',
      },
      plano: {
        conduta: 'Antibiótico, sintomáticos e atestado.',
        prescricoes: [
          'Amoxicilina 500mg — 1 cápsula VO 8/8h por 10 dias',
          'Dipirona 1g — 1 comprimido VO até 6/6h se dor ou febre',
        ],
        examesSolicitados: [],
        orientacoes: [
          'Hidratação abundante e repouso',
          'Completar todo o antibiótico mesmo com melhora',
        ],
        encaminhamentos: [],
        retorno: 'Retornar se piora ou ausência de melhora em 48–72h.',
        sinaisDeAlerta: [
          'Procurar emergência se dificuldade para respirar, engolir saliva ou abertura limitada da boca',
        ],
      },
      narrativaCorrida:
        'Homem de 34 anos, hígido, com faringoamigdalite exsudativa febril e adenopatia cervical, Centor elevado. Prescrita amoxicilina 10 dias + sintomáticos, orientações e atestado. Retorno se piora.',
    },
  },
  {
    iniciais: 'A.C.',
    tipo: 'DOR_LOMBAR',
    status: 'RASCUNHO',
    diasAtras: 0,
    estrutura: {
      subjetivo: {
        queixaPrincipal: 'Dor lombar há 5 dias após esforço.',
        historiaDoencaAtual:
          'Mulher de 41 anos, dor lombar baixa iniciada após carregar peso. Dor mecânica, melhora com repouso. Nega irradiação para membros, déficit de força, alteração de esfíncteres ou febre.',
        antecedentesPessoais: ['Sem comorbidades'],
        medicacoesEmUso: [],
        alergias: ['Nega'],
      },
      objetivo: {
        sinaisVitais: 'Afebril, PA 118/76.',
        exameFisico:
          'Contratura paravertebral lombar à palpação. Lasègue negativo bilateral. Força e sensibilidade preservadas em MMII.',
      },
      avaliacao: {
        hipotesesDiagnosticas: ['Lombalgia mecânica aguda inespecífica'],
        cidSugerido: [{ codigo: 'M54.5', descricao: 'Dor lombar baixa' }],
        raciocinioClinico:
          'Quadro mecânico sem sinais de alarme (red flags ausentes). Manejo conservador.',
      },
      plano: {
        conduta: 'Analgesia, orientação e manutenção de atividade conforme tolerância.',
        prescricoes: [
          'Dipirona 1g — 1 comprimido VO 6/6h se dor',
          'Ibuprofeno 400mg — 1 comprimido VO 8/8h por 5 dias após alimentação',
        ],
        examesSolicitados: [],
        orientacoes: [
          'Evitar repouso absoluto; manter atividade leve',
          'Aplicar calor local',
          'Evitar levantar peso até melhora',
        ],
        encaminhamentos: [],
        retorno: 'Reavaliar em 2 semanas se não houver melhora.',
        sinaisDeAlerta: [
          'Procurar atendimento se dor irradiada com fraqueza, perda de controle urinário/fecal ou febre',
        ],
      },
      narrativaCorrida:
        'Mulher de 41 anos com lombalgia mecânica aguda pós-esforço, sem red flags. Prescritos analgésico e anti-inflamatório, orientações de manutenção de atividade. Reavaliar em 2 semanas se persistir.',
    },
  },
]

async function main() {
  // Limpa demos anteriores deste dev user (idempotente).
  await prismaClinico.evolucao.deleteMany({ where: { consulta: { usuarioAuthId: USER } } })
  await prismaClinico.transcricao.deleteMany({ where: { consulta: { usuarioAuthId: USER } } })
  await prismaClinico.consulta.deleteMany({ where: { usuarioAuthId: USER } })
  await prismaClinico.logAcesso.deleteMany({ where: { usuarioAuthId: USER } })

  for (const d of demos) {
    const estrutura = d.estrutura
    const ev = renderizarEvolucoes(estrutura as never)
    const criadoEm = new Date(Date.now() - d.diasAtras * 86_400_000)

    const consulta = await prismaClinico.consulta.create({
      data: {
        usuarioAuthId: USER,
        pacienteIniciais: d.iniciais,
        tipoConsulta: d.tipo as never,
        status: d.status as never,
        consentimentoConfirmado: true,
        consentimentoEm: criadoEm,
        criadoEm,
        transcricao: {
          create: { texto: '(transcrição de demonstração — áudio descartado)', criadoEm },
        },
        evolucoes: {
          create: [
            {
              modelo: 'SOAP',
              textoGerado: ev.soap,
              dadosEstruturados: estrutura as object,
              revisadoPeloMedico: d.status === 'REVISADO',
            },
            {
              modelo: 'CORRIDA',
              textoGerado: ev.corrida,
              dadosEstruturados: estrutura as object,
              revisadoPeloMedico: d.status === 'REVISADO',
            },
            {
              modelo: 'UBS',
              textoGerado: ev.ubs,
              dadosEstruturados: estrutura as object,
              revisadoPeloMedico: d.status === 'REVISADO',
            },
          ],
        },
      },
      select: { id: true },
    })

    await prismaClinico.logAcesso.create({
      data: {
        usuarioAuthId: USER,
        acao: 'PROCESSAR_CONSULTA',
        consultaId: consulta.id,
        em: criadoEm,
      },
    })
    if (d.status === 'REVISADO') {
      await prismaClinico.logAcesso.create({
        data: {
          usuarioAuthId: USER,
          acao: 'REVISAR_CONSULTA',
          consultaId: consulta.id,
          em: criadoEm,
        },
      })
    }
    console.log(`✓ ${d.iniciais} (${d.tipo}) — ${d.status}`)
  }

  // Logs de documentos e assistente p/ as métricas mostrarem números.
  await prismaClinico.logAcesso.createMany({
    data: [
      { usuarioAuthId: USER, acao: 'GERAR_DOC_ATESTADO' },
      { usuarioAuthId: USER, acao: 'GERAR_DOC_RECEITA' },
      { usuarioAuthId: USER, acao: 'GERAR_DOC_SOLICITACAO_EXAMES' },
      { usuarioAuthId: USER, acao: 'CONSULTAR_ASSISTENTE' },
      { usuarioAuthId: USER, acao: 'CONSULTAR_ASSISTENTE' },
    ],
  })

  console.log('\nSeed de demonstração concluído.')
  await prismaClinico.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
