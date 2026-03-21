# PMO-APP — Arquivo Direcionador Universal

> Este documento serve como fonte de verdade para qualquer LLM, dev ou colaborador que trabalhe neste projeto.
> Sempre consulte este arquivo antes de tomar decisoes de implementacao.
> Ultima atualizacao: 2026-03-21

---

## 1. VISAO GERAL DO PROJETO

**Nome:** PMO-APP
**Organizacao:** AIR Company (ex-Compass/CompassUOL) — Labs, Celula 2
**Repositorio:** GitHub (privado)

**Problema que resolve:**
A AIR Company nao possui padronizacao na documentacao de projetos tradicionais entre studios e powerhouses. Cada projeto usa templates diferentes, a documentacao e manual, ha retrabalho frequente e nao existe local centralizado.

**Principio central:**
> O usuario nao escreve documentos. O usuario responde perguntas. O sistema gera a documentacao.

**Proposta de valor:**
Sistema guiado para geracao automatica da documentacao padrao de projetos tradicionais, que permite padronizar, registrar e acompanhar informacoes de projeto com baixo esforco, garantindo consistencia, rastreabilidade e visibilidade institucional.

**Usuario-alvo:** Gerentes de projeto, coordenadores de PMO, lideres de portfolio da AIR Company e powerhouses associadas.

**Escala prevista:** Todas as powerhouses do grupo AIR Company — potencialmente centenas de projetos simultaneos.

---

## 2. STACK TECNOLOGICO

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Linguagem | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui (Radix UI) | via radix-ui 1.4.3 |
| Animacoes | Framer Motion | 12.34.4 |
| Graficos | Recharts | 3.8.0 |
| ORM | Prisma | 5.22.0 |
| Banco de dados | PostgreSQL | via Neon.tech (free tier) |
| IA/LLM | Google Gemini | via @google/genai 1.43.0 |
| PDF Export | jsPDF + jsPDF-autotable | 4.2.0 / 5.0.7 |
| Icones | Lucide React | 0.576.0 |
| Toasts | Sonner | 2.0.7 |
| Temas | next-themes | 0.4.6 |
| Auth (futuro) | NextAuth.js | a implementar |
| Deploy | Vercel | configurado |

**Path alias:** `@/*` aponta para `./src/*`

---

## 3. ESTRUTURA DE PASTAS ATUAL

```
pmo-app/
├── prisma/
│   ├── schema.prisma              # 10 modelos + AuditLog
│   ├── seed.ts                    # Dados demo (3 projetos realistas)
│   └── seed-self.ts               # Seed alternativo
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout raiz (Toaster, Inter, tema, lang pt-BR)
│   │   ├── page.tsx               # Dashboard — KPIs, graficos, busca, filtros
│   │   ├── globals.css            # Tailwind + variaveis de tema (OKLch)
│   │   ├── error.tsx              # Error boundary global
│   │   ├── loading.tsx            # Loading state global
│   │   ├── not-found.tsx          # Pagina 404
│   │   ├── feedback/page.tsx       # Board de feedbacks/tickets
│   │   ├── projects/
│   │   │   ├── new/page.tsx       # Formulario de criacao (7 perguntas + IA)
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Pagina de projeto com 8 abas
│   │   │       └── documents/page.tsx # Central de documentos (legado)
│   │   └── api/
│   │       ├── projects/route.ts               # GET lista + POST criacao com IA
│   │       ├── projects/[id]/route.ts           # GET/PATCH/DELETE projeto
│   │       ├── projects/[id]/objectives/route.ts
│   │       ├── projects/[id]/stakeholders/route.ts
│   │       ├── projects/[id]/charter/route.ts
│   │       ├── projects/[id]/eap/route.ts
│   │       ├── projects/[id]/risks/route.ts
│   │       ├── projects/[id]/status-reports/route.ts
│   │       ├── projects/[id]/budget/route.ts    # Lancamentos de orcamento
│   │       ├── projects/[id]/closing/route.ts
│   │       ├── projects/[id]/versions/route.ts  # Snapshots de versao
│   │       ├── projects/[id]/audit-logs/route.ts
│   │       ├── projects/stats/route.ts          # KPIs do dashboard
│   │       ├── ai/route.ts                      # Analise IA principal (Gemini)
│   │       ├── ai/suggest/route.ts              # Sugestoes contextuais IA
│   │       ├── artifacts/route.ts               # CRUD artefatos com versionamento
│   │       ├── notifications/route.ts           # Notificacoes
│   │       ├── tickets/route.ts                 # GET + POST feedback tickets
│   │       ├── tickets/[id]/route.ts            # PATCH status/likes + DELETE
│   │       ├── tickets/[id]/comment/route.ts    # POST comentarios
│   │       ├── cron/route.ts                    # Alertas automaticos (stub)
│   │       └── webhooks/route.ts                # Integracoes externas (stub)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.tsx
│   │   │   ├── NotificationBell.tsx    # Sino de notificacoes com polling
│   │   │   └── ThemeToggle.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectHeader.tsx
│   │   │   ├── ProjectTabs.tsx
│   │   │   ├── TabHeader.tsx
│   │   │   ├── ProjectInfoTab.tsx
│   │   │   ├── ProjectPreProjectTab.tsx
│   │   │   ├── ProjectCharterTab.tsx
│   │   │   ├── ProjectEapTab.tsx
│   │   │   ├── ProjectRiskTab.tsx
│   │   │   ├── ProjectStatusReportTab.tsx
│   │   │   ├── ProjectEncerramentoTab.tsx
│   │   │   ├── ProjectBudgetTab.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── ProjectAuditModal.tsx
│   │   │   ├── ProjectVersionHistory.tsx  # Historico + rollback de versoes
│   │   │   └── MeetingTranscriptModal.tsx # Transcricao de reuniao → IA
│   │   ├── feedback/
│   │   │   ├── FeedbackWidget.tsx       # Widget flutuante (Ctrl+V screenshot)
│   │   │   ├── FeedbackCard.tsx         # Card com badges, likes, comments
│   │   │   └── FeedbackDetailModal.tsx  # Modal com status, likes, thread
│   │   ├── dashboard/
│   │   │   ├── StatsKPIRow.tsx
│   │   │   ├── StatusDonutChart.tsx
│   │   │   ├── BudgetBarChart.tsx
│   │   │   └── ProjectsAreaChart.tsx
│   │   ├── theme-provider.tsx
│   │   └── ui/                    # 13+ componentes shadcn/ui
│   └── lib/
│       ├── prisma.ts              # Singleton Prisma Client
│       ├── utils.ts               # cn() + parseLocalDate()
│       ├── audit.ts               # Funcao de audit logging
│       ├── ai-sanitize.ts         # Sanitizacao de inputs para prompts IA
│       ├── ai-schemas.ts          # Schemas Zod para validacao de respostas IA
│       └── __tests__/             # Testes unitarios (Vitest)
│           ├── ai-sanitize.test.ts
│           └── utils.test.ts
├── public/
│   └── uploads/tickets/           # Screenshots de feedback (local only)
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── components.json
├── vitest.config.ts
├── README.md
└── ROADMAP.md
```

---

## 4. MODELO DE DADOS (PRISMA) — 14 TABELAS

```prisma
model Project {
  id               String           @id @default(uuid())
  name             String
  manager          String
  budget           Float
  stakeholders     String?
  status           String           @default("GREEN")        // GREEN | YELLOW | RED
  classification   String?                                    // TRADITIONAL | AGILE | HYBRID
  problems         String?
  returns          String?
  impacts          String?
  preliminaryTimeline  String?
  milestones           String?
  successCriteria      String?
  department       String?
  description      String?
  charterApproved    Boolean          @default(false)
  charterApprovedAt  DateTime?
  statusOverride       String?          // Override manual do status pelo GP
  statusOverrideReason String?          // Justificativa obrigatoria do override
  startDate        DateTime?
  endDate          DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  // Relacoes
  artifacts        Artifact[]
  charterItems     CharterItem[]
  closingItems     ClosingItem[]
  eapItems         EAPItem[]
  objectives       Objective[]
  versions         ProjectVersion[]
  risks            Risk[]
  stakeholdersList Stakeholder[]
  statusReports    StatusReport[]
}

model Objective     { id, projectId, text, order, createdAt }
model Stakeholder   { id, projectId, name, role, email?, interest, influence, createdAt }
model CharterItem   { id, projectId, type (CRITERIA|DELIVERABLE|PREMISE|RESTRICTION), text, createdAt }
model ClosingItem   { id, projectId, type (DELIVERABLE|LESSON|RECOMMENDATION), text, createdAt }
model Artifact      { id, projectId, type, content (Json), createdAt, updatedAt }
model ProjectVersion { id, projectId, snapshotData (Json), createdAt }
model EAPItem       { id, projectId, name, description?, parentId?, status, order (Float), createdAt, updatedAt }
model Risk          { id, projectId, title, description, probability (Int 1-5), impact (Int 1-5), level, status, category, mitigation?, contingency?, responsible?, createdAt, updatedAt }
model StatusReport  { id, projectId, period, reportDate, overallStatus, scopeStatus, scheduleStatus, budgetStatus, progress (Float), budgetSpent?, accomplishments?, nextSteps?, issues?, createdAt, updatedAt }
model BudgetEntry   { id, projectId, description, amount (Float), type (COST|REVENUE), category?, date, createdAt }
model Notification  { id, projectId?, type, title, message, read (Boolean), createdAt }
model Ticket        { id, type (BUG|IMPROVEMENT|FEATURE), title, description, status, page?, screenshot?, author?, likes (String[]), comments (Json), createdAt, updatedAt }
model AuditLog      { id, projectId, userId?, userName?, action, entity, entityId?, field?, oldValue?, newValue?, createdAt }
```

---

## 5. VARIAVEIS DE AMBIENTE

```env
# Obrigatorias
DATABASE_URL="postgresql://user:password@host:5432/dbname"
GEMINI_API_KEY="sua-chave-google-gemini"

# Futuras (quando auth for implementada)
NEXTAUTH_SECRET="secret-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
```

**Banco recomendado para dev:** Neon.tech (free tier, nao congela projetos inativos, PostgreSQL nativo, compativel com Prisma)

---

## 6. COMO SUBIR LOCALMENTE

```bash
npm install
# Criar arquivo .env com DATABASE_URL e GEMINI_API_KEY
npx prisma migrate dev
npx prisma db seed           # Carrega 3 projetos demo
npm run dev
```

---

## 7. CONCEITOS DE DOMINIO

### Status Semaforo (Traffic Light)
| Valor | Significado | Cor |
|-------|------------|-----|
| GREEN | No Prazo | Verde/Emerald |
| YELLOW | Atencao | Amarelo/Amber |
| RED | Atrasado/Critico | Vermelho/Rose |

### Classificacao de Projeto
| Valor | Significado |
|-------|------------|
| TRADITIONAL | Metodologia cascata/waterfall |
| AGILE | Metodologia agil |
| HYBRID | Combinacao de ambas |

### Scoring de Risco (P x I)
O risco e classificado pelo score = Probabilidade (1-5) x Impacto (1-5):
| Score | Nivel |
|-------|-------|
| 1-2 | Muito Baixo |
| 3-4 | Baixo |
| 5-9 | Medio |
| 10-15 | Alto |
| 16-25 | Muito Alto |

### Status de Risco (PT-BR padrao)
`Identificado` → `Em Monitoramento` → `Ocorrido` | `Encerrado`

### Status de Itens da EAP
`PENDING` → `IN_PROGRESS` → `DONE`

### As 7 Perguntas Fundamentais (Iniciacao de Projeto)
1. Nome do Projeto
2. Gerente do Projeto
3. Orcamento Aprovado (R$)
4. Principais Stakeholders
5. Que problemas o projeto resolvera?
6. Retornos Esperados
7. Impactos (o que muda ou quem e afetado)

### Documentos do Ciclo de Vida do Projeto
| Documento | Momento | Status |
|-----------|---------|--------|
| Pre-projeto / Business Case | Antes da aprovacao | ✅ Implementado (gerado por IA) |
| Escopo Preliminar | Informacoes basicas | ✅ Implementado (gerado por IA) |
| Termo de Abertura (Charter) | Aprovacao formal | ✅ Implementado (4 secoes + IA) |
| EAP (Estrutura Analitica) | Planejamento | ✅ Implementado (lista flat, hierarquia pendente) |
| Matriz de Risco | Acompanhamento | ✅ Implementado (CRUD + IA + scoring P×I) |
| Status Report | Acompanhamento periodico | ✅ Implementado (CRUD + IA + PDF) |
| Termo de Encerramento | Fechamento | ✅ Implementado (3 secoes basicas) |

**IMPORTANTE:** Escopo Preliminar e Termo de Abertura sao documentos DISTINTOS. O escopo contem informacoes basicas. O termo representa a aprovacao formal e marca o inicio da execucao do projeto.

**PRINCIPIO DE IA:** A IA sempre le dados persistidos (banco), nao estado local do formulario. O usuario deve salvar antes de pedir sugestoes.

---

## 8. O QUE JA ESTA IMPLEMENTADO

### ✅ Funcional e confirmado
- [x] Dashboard de portfolio com KPIs, graficos (donut, bar, area), busca, filtros, ordenacao
- [x] Formulario de criacao com 7 perguntas + analise IA Gemini
- [x] IA gera: classificacao, business case, escopo, timeline, milestones, criterios de sucesso, riscos iniciais
- [x] Fallback IA: Gemini 2.5 Flash → 2.5 Pro
- [x] Pagina de projeto com 7 abas (Info, Pre-Projeto, Charter, EAP, Risco, Status, Encerramento)
- [x] Aba Informacoes: edicao de metadados do projeto (nome, gerente, orcamento, datas, status, departamento)
- [x] Aba Pre-Projeto: objetivos CRUD, stakeholders CRUD (nome, papel, email, interesse, influencia), business case, escopo
- [x] Aba Termo de Abertura: 4 secoes (criterios, entregas, premissas, restricoes) com sugestoes IA
- [x] Aba EAP: CRUD de itens, reorder, status toggle, PDF export
- [x] Aba Matriz de Risco: CRUD completo, scoring P×I real, sugestoes IA com contingency
- [x] Aba Status Report: CRUD, traffic light system, sugestoes narrativas IA, PDF export
- [x] Aba Encerramento: 3 secoes (entregas, licoes, recomendacoes) com CRUD individual
- [x] Modal de auditoria: timeline visual de CREATE/UPDATE/DELETE com old/new values
- [x] Central de documentos com edicao e versionamento (snapshot)
- [x] Status semaforo com badges coloridos
- [x] Formatacao em Real (R$) com Intl.NumberFormat
- [x] Dark mode funcional (next-themes + CSS vars)
- [x] Responsivo (desktop, tablet, mobile)
- [x] Dados demo: 3 projetos realistas via seed.ts
- [x] Deploy Vercel configurado (prisma generate + next build)
- [x] .env.example
- [x] Paginas de erro (404, 500, error.tsx, loading.tsx)
- [x] Aviso de "IA le dados salvos" no Status Report
- [x] Classificacao de projeto via IA com confirmacao do usuario
- [x] Encerramento assistido por IA (baseado em historico do projeto)
- [x] Sanitizacao de input anti-injection (`ai-sanitize.ts`)
- [x] Validacao de respostas IA com Zod schemas (`ai-schemas.ts`)
- [x] Sugestoes IA para decomposicao de EAP
- [x] Dependencias simples entre itens EAP (`dependsOn` + validacao)
- [x] Status semi-automatico computado (baseado em EAP, riscos, status reports)
- [x] Audit trail expandido para todas as entidades
- [x] Heatmap visual 5×5 real para matriz de risco (interativo, com filtro por celula)
- [x] Progress bar calculada a partir da EAP (pendente/em progresso/concluido)
- [x] Charter como gate para EAP (charterApproved + bloqueio UI + botao aprovar/revogar)
- [x] EAP hierarquica visual (arvore com indent, parent selection, buildTree + depth)
- [x] Override de status com justificativa (popover no header, campos statusOverride + statusOverrideReason no banco)
- [x] Aba Orcamento: CRUD de lancamentos (BudgetEntry), calculo de gasto vs aprovado
- [x] ROI editavel (retorno esperado vs orcamento) com badge colorido
- [x] Sistema de feedback/tickets: board com filtros, widget flutuante (Ctrl+V screenshot), likes, comentarios, status workflow
- [x] Sugestoes IA para cadencia/rituais de governanca
- [x] Testes unitarios iniciais (Vitest) para ai-sanitize e utils
- [x] Transcricao de reuniao via IA (MeetingTranscriptModal + endpoint meeting_transcript — extrai status reports, stakeholders, EAP, riscos)
- [x] Historico de versoes com rollback (ProjectVersionHistory.tsx — timeline, expand/collapse, restore com confirmacao)
- [x] Notificacoes in-app — backend (NotificationBell.tsx com polling 60s, mark-as-read, mark-all-read; API GET/PATCH)
- [x] Cron de alertas automaticos (3 tipos: projetos parados 7d, riscos materializados, budget warning — deduplicacao 24h)
- [x] Legenda visual acessivel para status semaforo (StatusLegend component com aria-labels)

### ⬜ Incompleto / Precisa evolucao
- [x] Upload de screenshots — ja usa base64 data URI direto no banco (sem writeFile)
- [x] Versionamento — ProjectVersionHistory.tsx completo com rollback
- [x] Cron/alertas — 3 tipos de alerta funcionais (stalled, risk, budget) com deduplicacao
- [x] Acessibilidade parcial — StatusLegend com aria-labels implementado; faltam icones/labels em outros contextos
- [x] PDF Status Report — completo com narrativa (accomplishments, nextSteps, issues)
- [x] PDF Charter — export funcional com 4 secoes
- [x] Stakeholders — CRUD completo na aba Pre-Projeto (nome, papel, email, interesse, influencia, edicao inline)
- [x] Type safety — zero `as any` casts no codebase (verificado 21/03)
- [x] NotificationBell — completo e montado no Topbar (polling 60s, mark-as-read)

### ⬜ Ausente (precisa implementar)
- [ ] Autenticacao (email/senha via NextAuth.js)
- [ ] Modelo User no banco
- [ ] Assinatura digital de documentos
- [x] Notificacoes in-app (implementado: NotificationBell + API + Cron alertas)
- [ ] Testes automatizados (cobertura de rotas e componentes)
- [ ] CI/CD (GitHub Actions)

---

## 9. DECISOES TECNICAS REGISTRADAS

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Auth | NextAuth.js + Credentials (email/senha) | Simples, sem SSO necessario por enquanto |
| Banco dev | Neon.tech free tier | Nao congela projetos inativos (Supabase congela) |
| Deploy | Vercel | Sem restricao da AIR por enquanto |
| IA principal | Gemini 2.5 Pro | Modelo mais capaz, usado como primeira tentativa |
| IA fallback | Gemini 2.5 Flash | Fallback rapido quando Pro falha ou atinge quota |
| Design | Figma como referencia final | URL: https://www.figma.com/make/Lodp4YbQbtwVNUxD76QTX1/Project-Management-App |
| Idioma do app | pt-BR hardcoded | Sem necessidade de i18n por enquanto |
| Status de risco | PT-BR padrao | "Identificado", "Em Monitoramento", "Ocorrido", "Encerrado" |
| Scoring de risco | P × I numerico | Score = probability(1-5) × impact(1-5), mapeado para 5 niveis |
| IA e estado | Sempre le banco (persistido) | Usuario deve salvar antes de pedir sugestoes |

---

## 10. RESTRICOES E REGRAS

1. **Zero orcamento** — Toda infraestrutura deve ser free tier
2. **Nao quebrar o setup do Eduardo** — Ele apresenta no touchpoint. Trabalhar em branch, mergear somente com acordo
3. **Chave Gemini pessoal** — Quota generosa mas nao corporativa. Implementar fallback
4. **Nao envolver o PMO da AIR agora** — Construir e mostrar valor primeiro
5. **Qualquer alteracao no `prisma/schema.prisma`** deve ser compativel com o banco do Eduardo
6. **O app deve ser em portugues (pt-BR)**
7. **Seguir o design do Figma como referencia visual**

---

## 11. ROADMAP

### FASE 0 — Estabilizacao / Confianca Basica ✅ (Concluida 12/03/2026)
> Correcoes de bugs e inconsistencias levantadas na reuniao de demo.

- [x] Fix data UTC/BRT (off-by-one em datas)
- [x] Remover botao Salvar fake do Charter
- [x] Fix contingency nao persistida ao aceitar risco IA
- [x] Fix scroll do modal de auditoria
- [x] Normalizar status de risco PT/EN em toda a base de codigo
- [x] Aviso "IA le dados salvos" no Status Report
- [x] Scoring de risco P×I real (score numerico + calculo de nivel)
- [x] Atualizar ROADMAP.md como fonte de verdade

### FASE 1 — IA Avancada + Melhorias de Dominio ✅ (Concluida 17/03/2026)
> Sprint de IA avancada e correcoes estruturais de dominio.

- [x] Classificacao de projeto via IA com confirmacao do usuario
- [x] Encerramento assistido por IA (le status reports, riscos, EAP)
- [x] Sanitizacao de input antes do prompt (anti-injection via `ai-sanitize.ts`)
- [x] Validacao de respostas IA com Zod schemas (`ai-schemas.ts`)
- [x] Sugestoes de IA para decomposicao de EAP
- [x] Dependencias simples entre itens da EAP (`dependsOn` + validacao)
- [x] Status semi-automatico computado (baseado em EAP, riscos, status reports)
- [x] Audit trail expandido para todas as entidades
- [x] Heatmap visual 5×5 real para matriz de risco (interativo, com filtro por celula)
- [x] Progress bar calculada a partir da EAP (pendente/em progresso/concluido)
- [x] Charter como gate para EAP (charterApproved + bloqueio UI + botao aprovar/revogar)

### FASE 2 — Dominio e Governanca ✅ (Concluida 18/03/2026)
> Modelo de dados e fluxo representam a realidade de PMO.

**Decision Gates:**
- [x] DG-01: EAP nasce apos Charter aprovado ✅ (ja implementado)
- [x] DG-02: Aprovacao do Charter via campo charterApproved ✅ (ja implementado)

**Implementacao:**
- [x] EAP hierarquica visual (arvore com indent, parent selection, buildTree + depth)
- [x] Override de status com justificativa (popover no header + statusOverride/statusOverrideReason no banco)

### FASE 3.1 — Estabilizacao + Quick Wins ✅ (Concluida 21/03/2026)
> Correcao de bugs reportados, fixes de producao, melhorias rapidas de export.

- [x] Fix bug POST /api/tickets 500 (verificado 21/03: codigo limpo, sem bug identificado)
- [x] Fix upload screenshots para Vercel (ja usa screenshotBase64 como data URI direto no banco — sem writeFile)
- [x] Fix type safety `(project as any).charterApproved` (verificado 21/03: zero `as any` no codebase)
- [x] PDF export no Charter (handleExport com 4 secoes: criterios, entregas, premissas, restricoes)
- [x] PDF Status Report completo (inclui narrativa: accomplishments, nextSteps, issues por periodo)
- [ ] Revisao de alinhamento com Figma (todas as telas)
- [ ] Sistema de icones + labels para status (alem de cor) — acessibilidade
- [x] Legenda visual para estados/criticidade (StatusLegend component com aria-labels)

### FASE 3.2 — Features de Valor (parcialmente concluida)
> Funcionalidades de alto impacto baseadas em feedback do time.

- [x] Stakeholders CRUD ja existe na aba Pre-Projeto (nome, papel, email, interesse, influencia)
- [ ] Stakeholder matrix visual (grid Interesse x Influencia) — complemento visual
- [x] Textarea de transcricao de reuniao → IA extrai status reports, stakeholders, itens EAP (MeetingTranscriptModal.tsx + endpoint meeting_transcript)
- [ ] Consolidacao do modulo de export/impressao (padrao unificado para todos os PDFs)
- [ ] Dashboard export PDF (relatorio de portfolio)
- [x] Notificacoes in-app (NotificationBell.tsx com polling 60s, mark-as-read, mark-all-read; montado no Topbar; API GET/PATCH completa)
- [x] UI de historico/rollback de versoes (ProjectVersionHistory.tsx com timeline, expand/collapse, rollback com confirmacao)
- [x] Cron/alertas funcionais (3 alertas: projetos parados 7d, riscos materializados, budget warning — com deduplicacao 24h)

### FASE 3.2A — Meeting-to-Everything Pipeline (em andamento)
> **Estrategia AI-First PMO:** O GP cola a transcricao da reuniao e em 30s toda a documentacao esta atualizada.

- [ ] Promover visibilidade da feature (botao proeminente, nao escondido no header)
- [ ] Expandir extracao IA: decisoes, atualizacoes de status, mudancas de EAP
- [ ] UX de revisao aprimorada (aceitar/rejeitar cada item, preview, aplicar selecionados)
- [ ] Modelo Decision (novo: id, projectId, description, madeBy, madeAt, context, status)
- [ ] API route decisions CRUD

### FASE 3.2B — Assistente IA do Portfolio
> Chat no dashboard que responde perguntas sobre o portfolio inteiro via Gemini.

- [ ] Backend: endpoint `/api/ai/chat` (busca dados do banco, monta contexto, Gemini responde)
- [ ] Frontend: PortfolioAssistant.tsx (barra de prompt, chips de sugestoes, respostas ricas)
- [ ] Integrar no dashboard (colapsavel, abaixo dos KPIs)

### FASE 3.2C — Smart Digest + Dashboard Executivo
> Resumo semanal automatico + KPIs enriquecidos + export de portfolio.

- [ ] Smart Digest semanal via IA (expand cron, type WEEKLY_DIGEST, WeeklyDigestCard.tsx)
- [ ] Dashboard KPIs enriquecidos (por departamento, burn rate, health score, tendencias)
- [ ] Dashboard export PDF (relatorio de portfolio completo)

### FASE 3.2D — PDF Exports Profissionais
> Padronizacao visual de todos os PDFs com header/footer consistente.

- [ ] Helper reutilizavel `src/lib/pdf-utils.ts` (header, footer, estilos)
- [ ] Aplicar em todos os exports existentes e novos

### FASE 4 — Formalizacao / Maturidade do Produto (debito tecnico)
> Autenticacao, governanca, testes, producao. Pos-aprovacao do Head.

- [ ] Autenticacao (NextAuth + Credentials + modelo User)
- [ ] RBAC basico (admin, GP, viewer)
- [ ] Assinatura simbolica de Charter e Encerramento
- [ ] Fluxo de encerramento completo com checklist e aceite
- [ ] Testes automatizados (Vitest + Testing Library — cobertura de rotas e componentes)
- [ ] CI/CD (GitHub Actions + Deploy Vercel finalizado)

### FASE 5 — Evolucao do Produto (Backlog)
> Features de longo prazo baseadas em feedback.

- [ ] Templates de documentos por tipo de projeto (upload, classificacao Desejavel/Obrigatorio, integracao IA)
- [ ] Suporte multi-moeda (R$ ↔ U$) com conversao
- [ ] Integracao com ferramentas externas (Jira, Teams, etc.)

---

## 12. PADROES E CONVENCOES

### Codigo
- TypeScript strict mode
- Path alias: `@/` = `./src/`
- Componentes UI via shadcn/ui
- Classes CSS via Tailwind com `cn()` helper
- Prisma Client via singleton em `@/lib/prisma`
- Datas: usar `parseLocalDate()` de `@/lib/utils` para evitar bug UTC
- Status de risco: sempre em PT-BR ("Identificado", "Em Monitoramento", "Ocorrido", "Encerrado")
- API routes no padrao Next.js App Router
- IDs sao UUID v4

### UI/UX
- Idioma: pt-BR
- Moeda: Real (R$) com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Status visual: semaforo (GREEN=emerald, YELLOW=amber, RED=rose)
- Toasts via Sonner para feedback de acoes
- Design de referencia: Figma
- Font: Inter

### Git
- Trabalhar em branches, nao commitar direto na master
- Nao alterar schema.prisma sem garantir compatibilidade com banco do Eduardo
- Testar antes de mergear

---

## 13. TIME E COMUNICACAO

| Pessoa | Papel | Contato |
|--------|-------|---------|
| Eduardo | Lider tecnico, apresenta no touchpoint | Teams corporativo |
| Frank | Desenvolvimento principal | Teams corporativo |
| Marcel | Desenvolvimento (disponibilidade incerta) | Teams corporativo |

- Reunioes: terca e quinta via Teams
- Codigo: GitHub
- Nao ha GitHub Projects configurado

---

## 14. RISCOS CONHECIDOS

| Risco | Severidade | Mitigacao |
|-------|-----------|-----------|
| Chave Gemini pessoal (quota) | Critico | Fallback Flash → Pro implementado |
| Zero testes | Alto (para producao) | Adicionar Vitest na Fase 4 |
| Sem autenticacao | Critico (para producao) | NextAuth.js na Fase 4 |
| EAP hierarquica implementada | Resolvido | buildTree + depth + parent selection |
| Status override implementado | Resolvido | Popover no header + campos no banco + audit log |
| Screenshots feedback em producao | Resolvido | Ja usa base64 data URI direto no banco (sem writeFile) |
| POST /api/tickets 500 | Resolvido | Verificado 21/03 — codigo limpo, sem bug |

---

## 15. BACKLOG DE FEEDBACKS

> Feedbacks recebidos via modulo de feedback do app. Triagem realizada em 21/03/2026.

| Data | Autor | Tipo | Descricao | Prioridade | Fase | Status |
|------|-------|------|-----------|-----------|------|--------|
| 20/03 15:13 | Eduardo | Novo Recurso | Suporte multi-moeda (R$ ↔ U$) com conversao | Baixa | 5 | Backlog |
| 20/03 15:19 | Eduardo | Novo Recurso | Area de carga de templates de documentos por tipo de projeto (Desejavel/Obrigatorio), para IA usar no preenchimento e para impressao/export | Alta | 5 | Backlog |
| 20/03 15:21 | Eduardo | Novo Recurso | Modulo de impressao/exportacao de documentos com base nos templates por tipo de projeto | Media | 3.2 | Priorizado |
| 20/03 18:23 | Frank | Melhoria/Bug | POST /api/tickets retorna 500 ao criar ticket | Critica | 3.1 | Resolvido (verificado 21/03) |
| 20/03 18:32 | Frank | Novo Recurso | Textarea para transcricao de reuniao → IA extrai status report, stakeholders, itens EAP | Alta | 3.2 | Implementado (MeetingTranscriptModal.tsx) |
