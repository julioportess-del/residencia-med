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

## Etapa 1 — Treinar a prova-alvo (meta: 1 semana)

1. **Modo prova ACM/AMRIGS**: simulado por banca e ano (prova histórica completa) e estilo-banca (100 q A–D, 4 h), com correção no fim.
2. **Listas inteligentes** (sem IA): Inéditas da banca-alvo · Meus erros · Acertos no chute · Certeza com erro · Revisões vencidas.
3. Filtros reais no banco: banca, ano, situação (inédita/respondida/errada), palavra-chave, paginação.
4. Confiança com 4 níveis ("não sei"), via migration aditiva.
5. Resultado do simulado: por área, por dificuldade, tempo por questão, em branco.

## Etapa 2 — Estudar no celular e aprender com o erro

1. Navegação mobile + PWA instalável (ícones).
2. **Caderno de erros** automático: motivo do erro, conceito correto, anotação, próxima revisão.
3. Bloco "Hoje" com recomendação calculada (tempo disponível → nº de questões + revisões).
4. Diagnóstico inicial (≈40 questões estratificadas).

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
