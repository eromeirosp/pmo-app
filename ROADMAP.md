# PMO-APP — Arquivo Direcionador Universal

> Este documento serve como fonte de verdade para qualquer LLM, dev ou colaborador que trabalhe neste projeto.
> Sempre consulte este arquivo antes de tomar decisoes de implementacao.
> Ultima atualizacao: 2026-03-28

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
│   ├── schema.prisma              # 21 modelos (15 originais + 6 Intelligence)
│   ├── seed.ts                    # Dados demo (3 projetos realistas)
│   ├── seed-self.ts               # Seed alternativo
│   └── seed-intelligence.ts       # Seed das 8 regras globais de inteligencia
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
│   │   │       └── page.tsx       # Pagina de projeto com sidebar + abas dinamicas
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
│   │       ├── projects/[id]/decisions/route.ts # Decisoes CRUD
│   │       ├── projects/[id]/documents/         # Geracao de documentos via IA
│   │       │   └── generate/route.ts            # POST gera documento Markdown via Gemini
│   │       ├── projects/[id]/health/route.ts    # GET health score + trend + alertas
│   │       ├── projects/[id]/rules/route.ts     # GET/PUT overrides de regras por projeto
│   │       ├── projects/[id]/autopilot/         # Acoes automaticas do autopilot
│   │       │   ├── route.ts                     # GET lista acoes PENDING/APPROVED/REJECTED
│   │       │   └── [actionId]/route.ts          # PATCH aprova/rejeita acao
│   │       ├── projects/[id]/scenarios/         # Simulacao what-if
│   │       │   ├── route.ts                     # GET/POST cenarios salvos
│   │       │   ├── [scenarioId]/route.ts        # DELETE cenario
│   │       │   └── simulate/route.ts            # POST executa simulacao (sem side effects)
│   │       ├── projects/stats/route.ts          # KPIs do dashboard
│   │       ├── intelligence/                    # Motor de inteligencia preditiva
│   │       │   ├── evaluate/route.ts            # POST avalia todos os projetos
│   │       │   ├── alerts/route.ts              # GET lista alertas preditivos
│   │       │   ├── alerts/[id]/route.ts         # PATCH descarta alerta
│   │       │   └── rules/route.ts               # GET/PUT regras globais
│   │       ├── ai/route.ts                      # Analise IA principal (Gemini)
│   │       ├── ai/suggest/route.ts              # Sugestoes contextuais IA
│   │       ├── ai/chat/route.ts                 # Assistente IA do portfolio
│   │       ├── artifacts/route.ts               # CRUD artefatos com versionamento
│   │       ├── notifications/route.ts           # Notificacoes
│   │       ├── tickets/route.ts                 # GET + POST feedback tickets
│   │       ├── tickets/[id]/route.ts            # PATCH status/likes + DELETE
│   │       ├── tickets/[id]/comment/route.ts    # POST comentarios
│   │       ├── cron/route.ts                    # Alertas automaticos + intelligence evaluate
│   │       └── webhooks/route.ts                # Integracoes externas (stub)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.tsx
│   │   │   ├── NotificationBell.tsx    # Sino de notificacoes com polling
│   │   │   └── ThemeToggle.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectHeader.tsx        # Cabecalho com status + health score
│   │   │   ├── ProjectSidebar.tsx       # Navegacao lateral por fase do projeto
│   │   │   ├── TabHeader.tsx
│   │   │   ├── ProjectInfoTab.tsx
│   │   │   ├── ProjectPreProjectTab.tsx
│   │   │   ├── ProjectCharterTab.tsx
│   │   │   ├── ProjectEapTab.tsx
│   │   │   ├── ProjectRiskTab.tsx
│   │   │   ├── ProjectStatusReportTab.tsx
│   │   │   ├── ProjectEncerramentoTab.tsx
│   │   │   ├── ProjectBudgetTab.tsx
│   │   │   ├── ProjectDocumentsTab.tsx    # Geracao/visualizacao de documentos IA
│   │   │   ├── ProjectRulesTab.tsx        # Config de regras preditivas por projeto
│   │   │   ├── ProjectAutopilotTab.tsx    # Acoes automaticas: review + approve/reject
│   │   │   ├── ProjectSimulatorTab.tsx    # Simulador what-if com cenarios
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── ProjectAuditModal.tsx
│   │   │   ├── ProjectVersionHistory.tsx  # Historico + rollback de versoes
│   │   │   └── MeetingTranscriptModal.tsx # Transcricao de reuniao → IA
│   │   ├── intelligence/
│   │   │   ├── AlertItem.tsx              # Item de alerta preditivo com severidade
│   │   │   ├── HealthScoreIndicator.tsx   # Indicador visual de health score + trend
│   │   │   ├── IntelligenceSettingsModal.tsx # Config global de regras
│   │   │   └── PredictiveAlertsCard.tsx   # Card de alertas do portfolio
│   │   ├── feedback/
│   │   │   ├── FeedbackWidget.tsx       # Widget flutuante (Ctrl+V screenshot)
│   │   │   ├── FeedbackCard.tsx         # Card com badges, likes, comments
│   │   │   └── FeedbackDetailModal.tsx  # Modal com status, likes, thread
│   │   ├── dashboard/
│   │   │   ├── StatsKPIRow.tsx
│   │   │   ├── StatusDonutChart.tsx
│   │   │   ├── BudgetBarChart.tsx
│   │   │   ├── ProjectsAreaChart.tsx
│   │   │   ├── WeeklyDigestCard.tsx    # Resumo semanal IA com botao Atualizar
│   │   │   └── PortfolioAssistant.tsx  # Chat IA do portfolio
│   │   ├── theme-provider.tsx
│   │   └── ui/                    # 14+ componentes shadcn/ui (incl. tooltip)
│   └── lib/
│       ├── prisma.ts              # Singleton Prisma Client
│       ├── utils.ts               # cn() + parseLocalDate()
│       ├── format.ts              # formatCurrency() com suporte multi-moeda
│       ├── audit.ts               # Funcao de audit logging
│       ├── ai-sanitize.ts         # Sanitizacao de inputs para prompts IA
│       ├── ai-schemas.ts          # Schemas Zod para validacao de respostas IA
│       ├── ai-context.ts          # getProjectContext() centralizado para prompts IA
│       ├── ai-document-prompts.ts # Catalogo de 7 documentos + prompts por tipo
│       ├── intelligence-rules.ts  # 8 regras preditivas puras (budget, schedule, risk, scope)
│       ├── intelligence-engine.ts # Motor central: avalia projetos, calcula health score
│       ├── autopilot-engine.ts    # Motor autopilot: gera drafts via Gemini, aplica aprovados
│       ├── scenario-engine.ts     # Motor de simulacao what-if (zero side effects)
│       ├── pdf-utils.ts           # Helper PDF padronizado (header, table, footer, save)
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

## 4. MODELO DE DADOS (PRISMA) — 21 TABELAS

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
  decisions        Decision[]
  healthSnapshots  ProjectHealthSnapshot[]
  predictiveAlerts PredictiveAlert[]
  ruleOverrides    ProjectRuleOverride[]
  autopilotActions AutopilotAction[]
  scenarios        Scenario[]
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
model Decision      { id, projectId, description, madeBy?, madeAt (DateTime), context?, status @default("REGISTERED"), createdAt, updatedAt }
model AuditLog      { id, projectId, userId?, userName?, action, entity, entityId?, field?, oldValue?, newValue?, createdAt }

// === Intelligence Engine (novos) ===
model IntelligenceRule    { id, key (unique), label, description, category (BUDGET|SCHEDULE|RISK|SCOPE|QUALITY), threshold (Float), enabled (Boolean), severity (LOW|MEDIUM|HIGH|CRITICAL), createdAt, updatedAt }
model ProjectRuleOverride { id, projectId, ruleKey, threshold (Float?), enabled (Boolean?), @@unique([projectId, ruleKey]) }
model PredictiveAlert     { id, projectId, ruleKey, severity (LOW|MEDIUM|HIGH|CRITICAL), message, evidence (Json), dismissed (Boolean), resolvedAt (DateTime?), createdAt }
model ProjectHealthSnapshot { id, projectId, score (Float), triggeredRules (Json), createdAt, @@index([projectId, createdAt]) }
model AutopilotAction     { id, projectId, ruleKey, type (STATUS_REPORT_DRAFT|RISK_ESCALATION|BUDGET_ALERT|SCHEDULE_ALERT|STAGNATION_NUDGE), status (PENDING|APPROVED|REJECTED|EXPIRED), draftData (Json), createdAt, updatedAt, @@index([projectId, status]) }
model Scenario            { id, projectId, label, parameters (Json), result (Json), createdAt }
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
- [x] Pagina de projeto com sidebar lateral e 12+ abas (Info, Pre-Projeto, Charter, EAP, Risco, Status, Orcamento, Encerramento, Documentos, Regras, Autopilot, Simulador)
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
- [x] Modelo Decision + CRUD completo (decisions por projeto, com descricao, autor, data, contexto, status)
- [x] Assistente IA do portfolio (chat no dashboard — `/api/ai/chat` + UI integrada)
- [x] Robustez no parsing de IA (normalizacao de status PT-BR, recuperacao de JSON truncado, maxOutputTokens)
- [x] Smart Digest semanal (WeeklyDigestCard.tsx + cron WEEKLY_DIGEST + botao Atualizar com force)
- [x] PDF exports padronizados via pdf-utils.ts (Charter, EAP, Status Report, Riscos, Orcamento, Encerramento, Dashboard Portfolio)
- [x] Dashboard export PDF (relatorio de portfolio com KPIs + lista de projetos)
- [x] Central de Documentos IA (7 tipos padrao de mercado, geracao via Gemini, edicao + versionamento, sidebar com catalogo)
- [x] Validacao robusta no POST /api/tickets (req.json try-catch, tipos, length limits, VALID_TYPES)
- [x] Navegacao por sidebar lateral (ProjectSidebar.tsx — organizada por fase: Geral, Iniciacao, Planejamento, Execucao, Encerramento)
- [x] Intelligence Engine: 8 regras preditivas por categoria (budget, schedule, risk, scope, quality)
- [x] Health Score por projeto (0-100) com trend (improving/stable/declining)
- [x] Alertas preditivos persistentes com auto-resolucao
- [x] Overrides de regras por projeto (threshold + enabled customizaveis)
- [x] Autopilot Engine: gera drafts de acoes via Gemini quando regras disparam (fluxo Draft → Review → Approve)
- [x] Simulador de cenarios what-if (simulacao pura em memoria, sem side effects no DB)
- [x] Cenarios nomeados salvos para comparacao futura
- [x] formatCurrency() com suporte multi-moeda (format.ts)
- [x] Seed de regras globais de inteligencia (prisma/seed-intelligence.ts)

### ⬜ Ausente (precisa implementar)
- [ ] Autenticacao (email/senha via NextAuth.js)
- [ ] Modelo User no banco
- [ ] Assinatura digital de documentos
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
- [x] Legenda visual para estados/criticidade (StatusLegend component com aria-labels)

### FASE 3.2 — Features de Valor (parcialmente concluida)
> Funcionalidades de alto impacto baseadas em feedback do time.

- [x] Stakeholders CRUD ja existe na aba Pre-Projeto (nome, papel, email, interesse, influencia)
- [ ] Stakeholder matrix visual (grid Interesse x Influencia) — complemento visual
- [x] Textarea de transcricao de reuniao → IA extrai status reports, stakeholders, itens EAP (MeetingTranscriptModal.tsx + endpoint meeting_transcript)
- [x] Consolidacao do modulo de export/impressao (pdf-utils.ts — padrao unificado para todos os PDFs)
- [x] Dashboard export PDF (relatorio de portfolio)
- [x] Notificacoes in-app (NotificationBell.tsx com polling 60s, mark-as-read, mark-all-read; montado no Topbar; API GET/PATCH completa)
- [x] UI de historico/rollback de versoes (ProjectVersionHistory.tsx com timeline, expand/collapse, rollback com confirmacao)
- [x] Cron/alertas funcionais (3 alertas: projetos parados 7d, riscos materializados, budget warning — com deduplicacao 24h)

### FASE 3.2A — Meeting-to-Everything Pipeline ✅ (Concluida 26/03/2026)
> **Estrategia AI-First PMO:** O GP cola a transcricao da reuniao e em 30s toda a documentacao esta atualizada.

- [ ] Promover visibilidade da feature (botao proeminente, nao escondido no header)
- [x] Expandir extracao IA: decisoes, atualizacoes de status, mudancas de EAP
- [x] UX de revisao aprimorada (aceitar/rejeitar cada item, preview, aplicar selecionados)
- [x] Modelo Decision (novo: id, projectId, description, madeBy, madeAt, context, status)
- [x] API route decisions CRUD (`/api/projects/[id]/decisions` — GET/POST/PATCH/DELETE)

### FASE 3.2B — Assistente IA do Portfolio ✅ (Concluida 26/03/2026)
> Chat no dashboard que responde perguntas sobre o portfolio inteiro via Gemini.

- [x] Backend: endpoint `/api/ai/chat` (busca dados do banco, monta contexto, Gemini responde)
- [x] Frontend: PortfolioAssistant.tsx (barra de prompt, chips de sugestoes, respostas ricas)
- [x] Integrar no dashboard (colapsavel, abaixo dos KPIs)

### FASE 3.2C — Smart Digest + Dashboard Executivo ✅ (Concluida 27/03/2026)
> Resumo semanal automatico + KPIs enriquecidos + export de portfolio.

- [x] Smart Digest semanal via IA (cron WEEKLY_DIGEST + WeeklyDigestCard.tsx com botao Atualizar force)
- [x] Dashboard KPIs enriquecidos (health score, budget total/medio, ROI, departamento, tendencias 6 meses)
- [x] Dashboard export PDF (relatorio de portfolio com KPIs + lista de projetos)

### FASE 3.2D — PDF Exports Profissionais ✅ (Concluida 27/03/2026)
> Padronizacao visual de todos os PDFs com header/footer consistente.

- [x] Helper reutilizavel `src/lib/pdf-utils.ts` (createPdfDoc, addTable, addSection, addNarrativeSection, addFooter, savePdf)
- [x] Aplicar em todos os exports: Charter, EAP, Status Report, Riscos, Orcamento, Encerramento, Dashboard Portfolio

### FASE 4 — Formalizacao / Maturidade do Produto (debito tecnico)
> Autenticacao, governanca, testes, producao. Pos-aprovacao do Head.

- [ ] Autenticacao (NextAuth + Credentials + modelo User)
- [ ] RBAC basico (admin, GP, viewer)
- [ ] Assinatura simbolica de Charter e Encerramento
- [ ] Fluxo de encerramento completo com checklist e aceite
- [ ] Testes automatizados (Vitest + Testing Library — cobertura de rotas e componentes)
- [ ] CI/CD (GitHub Actions + Deploy Vercel finalizado)

### FASE 5 — Geracao Inteligente de Documentos
> Visao revisada (26/03): a LLM ja conhece os padroes de mercado (PMBoK, PRINCE2, etc.), entao gera documentos padrao de mercado preenchidos com dados reais do projeto — sem necessidade de cadastro manual de templates.

#### FASE 5A — Geracao de Documentos padrao via IA ✅
> Implementado em 26/03. A IA gera documentos completos baseados em padroes de mercado, preenchidos com dados reais do projeto.

- [x] Catalogo de 7 documentos padrao (TAP, Plano de Riscos, Plano de Comunicacao, Plano do Projeto, Ata de Reuniao, Status Report, Plano de Qualidade)
- [x] Classificacao por metodologia: cada documento e Obrigatorio ou Desejavel conforme tipo (TRADITIONAL/AGILE/HYBRID)
- [x] API: `POST /api/projects/[id]/documents/generate` — gera documento via Gemini Pro/Flash
- [x] `getProjectContext` extraido para `src/lib/ai-context.ts` (reutilizado em suggest + documents)
- [x] Prompts especializados por tipo de documento (`src/lib/ai-document-prompts.ts`)
- [x] UI DocumentCenter reescrito: sidebar com catalogo, badges Obrigatorio/Desejavel, badges Gerado/Pendente
- [x] Progresso documental (barra de progresso obrigatorios e total)
- [x] Renderizacao Markdown formatada (react-markdown)
- [x] Edicao de documentos gerados + versionamento automatico (reusa modelo Artifact existente)
- [x] Botao "Regenerar" com auto-versioning antes de sobrescrever

#### FASE 5B — Customizacao por Empresa (Backlog)
> Empresas poderao cadastrar seus proprios templates/formatos para que a IA siga o padrao corporativo em vez do padrao de mercado.

- [ ] Modelo `CustomTemplate` (nome, conteudo/url, tipo de projeto, empresa)
- [ ] UI para GP cadastrar templates corporativos
- [ ] IA usa template customizado como contexto quando disponivel, senao usa padrao de mercado
- [ ] Merge inteligente: dados do projeto + formato do template corporativo

#### FASE 5C — Export e Historico Avancado (Backlog)
> Export profissional e rastreabilidade completa de documentos.

- [ ] Export PDF com layout padronizado
- [ ] Historico de versoes com diff visual
- [ ] Rollback para versoes anteriores
- [ ] Comparacao entre versoes

### FASE 6 — Intelligence Engine + Autopilot + Simulador ✅ (Concluida 28/03/2026)
> Motor de inteligencia preditiva que avalia projetos automaticamente, gera acoes corretivas e permite simulacao de cenarios.

#### FASE 6A — Regras Preditivas + Health Score ✅
> 8 regras puras que avaliam saude do projeto por categoria.

- [x] 9 regras preditivas: budgetBurnRate, budgetDeviation, schedulePerformance, projectStagnation, riskCascade, riskConcentration, scopeCreep, recurringIssuesSimple, historicalBenchmark
- [x] Categorias: BUDGET, SCHEDULE, RISK, SCOPE, QUALITY
- [x] Health Score (0-100) calculado por deducoes de severidade
- [x] Trend comparando com snapshot de 7 dias atras (improving/stable/declining)
- [x] Alertas preditivos persistentes (`PredictiveAlert`) com auto-resolucao
- [x] Snapshots de saude historicos (`ProjectHealthSnapshot`)
- [x] Regras globais configuráveis (`IntelligenceRule`) com seed padrao
- [x] Overrides por projeto (`ProjectRuleOverride`) — threshold + enabled
- [x] API: `/api/intelligence/evaluate`, `/api/intelligence/alerts`, `/api/intelligence/rules`
- [x] API: `/api/projects/[id]/health`, `/api/projects/[id]/rules`
- [x] Lib: `intelligence-rules.ts` (funcoes puras), `intelligence-engine.ts` (orquestrador)
- [x] Componentes: `HealthScoreIndicator`, `AlertItem`, `PredictiveAlertsCard`, `IntelligenceSettingsModal`
- [x] Aba de regras por projeto (`ProjectRulesTab.tsx`) — toggle, slider, reset

#### FASE 6B — Autopilot Engine ✅
> IA gera rascunhos de acoes corretivas automaticamente. GP revisa e aprova.

- [x] Motor autopilot: mapeia regra → tipo de acao via Gemini
- [x] 5 tipos: STATUS_REPORT_DRAFT, RISK_ESCALATION, BUDGET_ALERT, SCHEDULE_ALERT, STAGNATION_NUDGE
- [x] Fluxo obrigatorio: Draft → Review → Approve (nunca aplica direto)
- [x] Ao aprovar, cria entidade real no banco + AuditLog
- [x] API: `/api/projects/[id]/autopilot` (GET lista, PATCH aprova/rejeita)
- [x] Componente: `ProjectAutopilotTab.tsx` (lista acoes PENDING + historico)
- [x] Lib: `autopilot-engine.ts`

#### FASE 6C — Simulador de Cenarios What-If ✅
> Simulacao pura em memoria para avaliar impacto de decisoes antes de toma-las.

- [x] Simulacao sem side effects no DB (clona dados, aplica parametros, re-executa regras)
- [x] Parametros: ajuste de orcamento (%), delta de prazo (dias), materializacao de riscos, remocao de itens EAP
- [x] Resultado: score atual vs simulado + diff de alertas (appeared/disappeared/unchanged)
- [x] Cenarios nomeados salvos para comparacao futura (`Scenario` model)
- [x] API: `/api/projects/[id]/scenarios` (GET/POST/DELETE), `/api/projects/[id]/scenarios/simulate` (POST)
- [x] Componente: `ProjectSimulatorTab.tsx` (sliders, checkboxes, ScoreComparison side-by-side)
- [x] Lib: `scenario-engine.ts`

#### FASE 6D — Navegacao por Sidebar ✅
> Substituicao do sistema de abas por sidebar lateral organizada por fase do ciclo de vida.

- [x] `ProjectTabs.tsx` removido, substituido por `ProjectSidebar.tsx`
- [x] Navegacao organizada por fase: GERAL / INICIACAO / PLANEJAMENTO / EXECUCAO / ENCERRAMENTO
- [x] Subsecao de documentos expansivel com progress indicator de obrigatorios
- [x] Central de Documentos migrada de pagina separada para aba dentro do projeto
- [x] Health Score integrado ao `ProjectHeader.tsx`

#### FASE 6E — Stakeholder Matrix + Multi-Moeda + Cross-Projeto ✅ (Concluida 28/03/2026)
> Visualizacao stakeholder, suporte multi-moeda e inteligencia cross-projeto.

- [x] Stakeholder Matrix Visual (ScatterChart 2x2 Interesse x Influencia com quadrantes coloridos: Monitorar, Manter Informado, Manter Satisfeito, Gerenciar de Perto)
- [x] Suporte multi-moeda completo: taxas hardcoded BRL/USD/EUR, `convertCurrency()`, dashboard consolida em BRL quando ha moedas mistas
- [x] BudgetBarChart normaliza moedas mistas para BRL com tooltip mostrando valor original
- [x] StatsKPIRow mostra breakdown por moeda no sub-text
- [x] Regra `historicalBenchmark`: compara projeto com encerrados do mesmo departamento/classificacao
- [x] `loadHistoricalData()`: carrega projetos encerrados com licoes aprendidas e health scores
- [x] `HistoricalInsightsCard.tsx`: card de insights historicos integrado na aba de regras

#### Outras features de longo prazo
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
| POST /api/tickets 500 | Resolvido | Fix 27/03 — req.json() try-catch, validacao de tipos/length, VALID_TYPES check |
| Matriz de Risco nao salva | Resolvido | Fix 27/03 — handleAdd com if(!res.ok) + try-catch + toast de erro |
| IA sugere stakeholders duplicados | Novo | IA nao valida stakeholders ja cadastrados na transcricao |
| 6 novos modelos Prisma (Intelligence) | Medio | Requer `prisma migrate dev` + seed-intelligence.ts no banco do Eduardo |

---

## 15. BACKLOG DE FEEDBACKS

> Feedbacks recebidos via modulo de feedback do app. Triagem realizada em 21/03/2026.

| Data | Autor | Tipo | Descricao | Prioridade | Fase | Status |
|------|-------|------|-----------|-----------|------|--------|
| 20/03 15:13 | Eduardo | Novo Recurso | Suporte multi-moeda (R$ ↔ U$) com conversao | Baixa | 6E | Implementado |
| 20/03 15:19 | Eduardo | Novo Recurso | Area de carga de templates de documentos por tipo de projeto (Desejavel/Obrigatorio), para IA usar no preenchimento e para impressao/export | Alta | 5 | Backlog |
| 20/03 15:21 | Eduardo | Novo Recurso | Modulo de impressao/exportacao de documentos com base nos templates por tipo de projeto | Media | 3.2 | Priorizado |
| 20/03 18:23 | Frank | Melhoria/Bug | POST /api/tickets retorna 500 ao criar ticket | Critica | 3.1 | Resolvido (fix validacao 27/03) |
| 20/03 18:32 | Frank | Novo Recurso | Textarea para transcricao de reuniao → IA extrai status report, stakeholders, itens EAP | Alta | 3.2 | Implementado (MeetingTranscriptModal.tsx) |
| 24/03 16:21 | Frank | Correcao | Matriz de Risco nao esta salvando os dados | Critica | 3.2 | Resolvido (handleAdd com res.ok check) |
| 26/03 17:22 | Frank | Melhoria | IA precisa validar stakeholders ja cadastrados na transcricao | Media | 3.2 | Em andamento |

---

## 16. HISTORICO DE TOUCHPOINTS

### Touchpoint 1 (12/03/2026)
- Demo inicial do produto para o time interno
- Feedbacks de bugs coletados (UTC, Charter, contingency, scroll)
- Resultado: Fase 0 gerada e executada

### Touchpoint 2 (27/03/2026) — com Lidia (Compass/AIR)
**Participantes:** Marcel, Eduardo, Frank, Fernando, Lidia

**Decisoes e encaminhamentos:**
- Feedback muito positivo sobre o produto e a IA
- Discussao sobre custos: infra gratuita ate o momento, IA e o principal custo variavel (~R$4k citado)
- Benchmark: solucao semelhante na Natura rodando 1300 projetos com IA = R$0,18/mes
- Projecao: ~R$1.000/mes para centenas de projetos com storage de documentos
- **Templates de documentos**: proxima grande evolucao (Fase 5A)
- **Abordagem MVP**: so links (SharePoint/Drive), sem upload de arquivos inicialmente
- **Lidia levara orcamento ao caixa** para viabilizar infraestrutura
- Empresa estimula uso de IA mas ainda nao tem estrutura para sustentar — este projeto pode ser o gatilho

**Visao de longo prazo discutida:**
- Usar historico de 6-12 meses de projetos como inteligencia para novos projetos
- IA identifica licoes aprendidas, dependencias, flags preventivos
- Potencial de escala para todas as powerhouses do grupo AIR Company
