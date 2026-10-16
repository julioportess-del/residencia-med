# Roadmap — Minha Residência (Anestesiologia)

Princípio: **estudar primeiro, interface depois.** Cada etapa precisa entregar algo que eu use no estudo da semana seguinte.
Prova-âncora: **Prova Unificada AMB/AMRIGS/ACM/AMMS (Fundatec), 22/11/2026**. Ela seleciona Joinville (HMSJ: 12 vagas; HRHDS: 6) e outras vagas de SC/RS. Formato: 100 questões, alternativas A–D.
Outras: PSU-MG 2027 (possivelmente também em 22/11, confirmar), UNIFESP (29/11, Vunesp, confirmar), SUS-SP (13/12, Vunesp, confirmar), ENARE (Acesso Direto via ENAMED, confirmar).

## Etapa 0 — Plataforma estável ✅ (16/10/2026)

- Cache de IA corrigido (colisão de chaves).
- Revisão espaçada funcionando sem Redis/worker.
- Gabarito não vaza antes da resposta; checagem de dono da sessão.
- Simulado: envio único, tempo real por questão, retomada após recarregar.
- Correção completa: sua resposta × gabarito oficial, leitura de confiança (hipercorreção), comentário por alternativa, temas, diretrizes, link do PDF oficial, IA rotulada (aparece só com chave).
- Conta master sem paywall; login, recuperação de senha.

## Etapa 1 — Treinar a prova-alvo ✅ (16/10/2026)

- Banco de questões com filtros combinados reais (palavra-chave, banca, ano, área, dificuldade, situação), contagem, "carregar mais" e filtros salvos na URL (dá para favoritar).
- Situações calculadas pelo histórico: inéditas, respondidas, errei, acertei, errei com certeza, acertei no chute, revisão vencida.
- **Listas inteligentes**: Inéditas da minha banca · Revisões vencidas · Meus erros · Errei com certeza · Acertei no chute.
- **Modo estudo** (`/estudo/[id]`): sequência da seleção com correção comentada a cada questão, retomando de onde parou.
- **Simulado**: prova completa (banca + ano, na ordem original, 2,4 min/questão), estilo banca (100 inéditas) e personalizado. Sorteio uniforme (Fisher–Yates) e sem as questões que você já fez, quando escolhido.
- **Resultado**: acertos, erros, em branco, tempo total e médio, desempenho por área, dificuldade e confiança, questão a questão.
- Pendente desta etapa: confiança com 4 níveis ("não sei"), que exige migration; vai junto com a próxima migration.

## Etapa 2 — Estudar no celular e aprender com o erro ✅ (16/10/2026)

- **Navegação mobile**: barra inferior fixa (Painel, Questões, Simulado, Revisão, Mais) e cabeçalho com notificações. PWA já instalável (ícones e manifest ok); abre direto no painel.
- **Caderno de erros** (`/caderno`): toda questão errada entra sozinha; motivo do erro (7 tipos), conceito correto e anotação; status aberto / acertei depois / resolvido; **padrões detectados** (3+ erros abertos no mesmo tema → recomendação); "Refazer erros abertos". Também dá para registrar direto na correção.
- **Confiança com 4 níveis**: Tenho certeza · Estou em dúvida · Chutei · Não sei responder ("não sei" + acerto não conta como domínio).
- **Plano de hoje** no painel: saudação, modos Rápido (10 min), Padrão (40 min) e Aprofundado (90 min), com tarefas calculadas dos seus dados (revisões vencidas → erros → inéditas da banca-alvo) e botão "Começar".
- Migration aditiva `20261016120000_caderno_erros` aplicada em produção via SQL e registrada em `_prisma_migrations`.
- Pendente: diagnóstico inicial (vai para a Etapa 3, junto com o domínio por tema, que depende da classificação das questões).

## Etapa 3 — Memória de longo prazo

1. Flashcards com **FSRS** (`ts-fsrs` 5.x, MIT): decks, suspensos, favoritos, revisão rápida, criação a partir do erro.
2. Revisão de questões migrada para FSRS (retenção desejada ajustável, padrão 0,9).
3. Domínio por tema com confiabilidade ("avaliação insuficiente" abaixo da amostra mínima).
4. Calibração de confiança.

## Etapa 4 — Planejamento adaptativo

Modos 10 / 30–45 / 90 min; dias leves (plantão); reagendar o que não foi feito; plano de reta final por prova; corrigir o bug da semana do cronograma.

## Etapa 5 — Mentor e relatórios

Relatório semanal e mensal só com dados reais e amostra mínima; mentor IA com contexto do histórico (exige chave de IA).

## Etapa 6 — Mapa de oportunidades e extras

Processos de Anestesio (SC, PR, RS, MG, SP) com prazos e alertas, partindo de "Minhas provas". Depois: busca universal, flag de questão desatualizada, backup/exportação, modo foco/pomodoro.

## Bloqueios que dependem do dono

| Bloqueio                                  | Por quê                                                 | Decisão necessária                                        |
| ----------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Classificação das 1.418 questões por tema | Sem tema não há filtro por área nem domínio por assunto | Autorizar uso de API paga (Anthropic) e cadastrar a chave |
| Comentários das questões oficiais         | Hoje 0 comentários revisados                            | Idem; comentário marcado como "gerado por IA"             |
| Pipeline de importação de PDFs            | O código não está no repositório (só as tabelas)        | Onde está o importador? Senão, reconstruir                |
| "Minhas provas" (sessão paralela)         | Migration nova em produção                              | Aprovar aplicação da migration                            |
