# PMO-APP — Arquivo Direcionador Universal

> Este documento serve como fonte de verdade para qualquer LLM, dev ou colaborador que trabalhe neste projeto.
> Sempre consulte este arquivo antes de tomar decisões de implementacao.
> Ultima atualizacao: 2026-03-11

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
| ORM | Prisma | 5.22.0 |
| Banco de dados | PostgreSQL | via Neon.tech (free tier) |
| IA/LLM | Google Gemini | via @google/genai 1.43.0 |
| Icones | Lucide React | 0.576.0 |
| Toasts | Sonner | 2.0.7 |
| Temas | next-themes | 0.4.6 |
| Auth (futuro) | NextAuth.js | a implementar |
| Deploy (futuro) | Vercel | a implementar |

**Path alias:** `@/*` aponta para `./src/*`

---

## 3. ESTRUTURA DE PASTAS ATUAL

```
pmo-app/
├── prisma/
│   └── schema.prisma                          # Modelos: Project, Artifact, ProjectVersion, EAPItem, Risk, StatusReport
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # Layout raiz (Toaster, font Inter, lang pt-BR)
│   │   ├── page.tsx                            # Dashboard — listagem de projetos com busca
│   │   ├── globals.css                         # Tailwind + variaveis de tema (OKLch)
│   │   ├── projects/
│   │   │   ├── new/page.tsx                    # Formulario de criacao (7 perguntas + IA)
│   │   │   └── [id]/documents/page.tsx         # Central de documentos (3 abas: Business Case, Escopo, Riscos)
│   │   └── api/
│   │       ├── projects/route.ts               # GET (busca) + POST (criacao com IA + artefatos)
│   │       ├── projects/[id]/route.ts          # GET projeto individual com artifacts, risks, versions
│   │       ├── ai/route.ts                     # POST analise IA (Gemini) — gera classificacao, business case, escopo, riscos
│   │       ├── artifacts/route.ts              # PUT atualizacao com auto-versionamento (snapshot antes de salvar)
│   │       ├── cron/route.ts                   # GET alertas (projetos parados >7 dias, riscos materializados)
│   │       └── webhooks/route.ts               # POST integracao externa Jira/DevOps (futuro)
│   ├── components/
│   │   ├── layout/
│   │   │   └── Topbar.tsx                      # Header fixo com navegacao e branding
│   │   ├── projects/
│   │   │   └── ProjectCard.tsx                 # Card de projeto (nome, gerente, orcamento, status, classificacao)
│   │   └── ui/                                 # 10 componentes shadcn/ui: badge, button, card, input, label, select, skeleton, sonner, textarea
│   └── lib/
│       ├── prisma.ts                           # Singleton do Prisma Client (previne multiplas instancias em dev)
│       └── utils.ts                            # Utilitario cn() para classes condicionais (clsx + tailwind-merge)
├── package.json
├── tsconfig.json
├── next.config.ts                              # Vazio (defaults do Next.js)
└── components.json                             # Config do shadcn/ui
```

---

## 4. MODELO DE DADOS (PRISMA)

```prisma
model Project {
  id             String           @id @default(uuid())
  name           String
  manager        String
  budget         Float
  stakeholders   String?
  status         String           @default("GREEN")        // GREEN | YELLOW | RED
  classification String?                                    // TRADITIONAL | AGILE | HYBRID
  problems       String?
  returns        String?
  impacts        String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  artifacts      Artifact[]
  versions       ProjectVersion[]
  eapItems       EAPItem[]
  risks          Risk[]
  statusReports  StatusReport[]
}

model Artifact {
  id        String   @id @default(uuid())
  projectId String
  type      String   // BUSINESS_CASE | ESCOPO_PRELIMINAR | RISCOS_INICIAIS | DOCUMENT_CENTER
  content   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectVersion {
  id           String   @id @default(uuid())
  projectId    String
  snapshotData Json     // Estado completo dos artefatos em um ponto no tempo
  createdAt    DateTime @default(now())
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model EAPItem {
  id          String   @id @default(uuid())
  projectId   String
  name        String
  description String?
  parentId    String?  // Estrutura hierarquica (arvore)
  status      String   @default("PENDING") // PENDING | IN_PROGRESS | COMPLETED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Risk {
  id          String   @id @default(uuid())
  projectId   String
  description String
  probability Int      // 1-5
  impact      Int      // 1-5
  status      String   @default("IDENTIFIED") // IDENTIFIED | MITIGATED | OCCURRED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model StatusReport {
  id          String   @id @default(uuid())
  projectId   String
  reportDate  DateTime @default(now())
  summary     String
  statusColor String   // GREEN | YELLOW | RED
  nextSteps   String?
  createdAt   DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

**Modelos futuros a criar:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // hash bcrypt
  name      String
  role      String   @default("USER") // USER | ADMIN
  createdAt DateTime @default(now())
  projects  Project[] // relacao via Project.createdBy
}
```

**Tipos de Artifact futuros:**
- `TERMO_ABERTURA` — Documento formal de aprovacao e inicio de execucao
- `TERMO_ENCERRAMENTO` — Documento de fechamento com licoes aprendidas e aceite

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
# (futuro) npx prisma db seed
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

### Ciclo de Vida de Risco
`IDENTIFIED` → `MITIGATED` → `OCCURRED`
- Se um risco vai para OCCURRED, o status do projeto automaticamente vira RED

### Status de Itens da EAP
`PENDING` → `IN_PROGRESS` → `COMPLETED`

### As 7 Perguntas Fundamentais (Iniciacao de Projeto)
1. Nome do Projeto
2. Gerente do Projeto
3. Orcamento Aprovado (R$)
4. Principais Stakeholders
5. Que problemas o projeto resolvera?
6. Retornos Esperados
7. Impactos (o que muda ou quem e afetado)

### Documentos do Ciclo de Vida do Projeto
| Documento | Momento | Status no sistema |
|-----------|---------|------------------|
| Pre-projeto / Business Case | Antes da aprovacao | Implementado (gerado por IA) |
| Escopo Preliminar | Informacoes basicas do projeto | Implementado (gerado por IA) |
| Termo de Abertura | Aprovacao formal, inicio da execucao | A implementar |
| EAP (Estrutura Analitica) | Planejamento da execucao | Modelo existe, UI nao |
| Matriz de Risco | Acompanhamento | Parcialmente implementado |
| Status Report | Acompanhamento periodico | Modelo existe, UI nao |
| Termo de Encerramento | Fechamento do projeto | A implementar |

**IMPORTANTE:** Escopo Preliminar e Termo de Abertura sao documentos DISTINTOS. O escopo contem informacoes basicas. O termo representa a aprovacao formal e marca o inicio da execucao do projeto.

---

## 8. O QUE JA ESTA IMPLEMENTADO

### Funcional e confirmado
- [x] Dashboard de portfolio com busca por nome (`src/app/page.tsx`)
- [x] Formulario de criacao com 7 perguntas (`src/app/projects/new/page.tsx`)
- [x] Analise via IA Gemini: classificacao + business case + escopo + riscos (`src/app/api/ai/route.ts`)
- [x] Criacao de projeto com artefatos em transacao (`src/app/api/projects/route.ts`)
- [x] Central de documentos com 3 abas (`src/app/projects/[id]/documents/page.tsx`)
- [x] Edicao de artefatos com auto-versionamento via snapshot (`src/app/api/artifacts/route.ts`)
- [x] Status semaforo com badges coloridos
- [x] Formatacao em Real (R$) com `Intl.NumberFormat('pt-BR')`
- [x] Validacao server-side (orcamento alto exige escopo >20 chars)
- [x] Webhook para riscos externos com cascata automatica de status (`src/app/api/webhooks/route.ts`)

### Parcial / Inacabado
- [ ] Rollback de versoes — snapshots salvos no banco, mas SEM UI de historico/restauracao
- [ ] Cron de alertas — logica existe mas apenas loga no console, sem notificacao real
- [ ] Dark mode — next-themes instalado + CSS vars prontas, mas sem toggle na UI
- [ ] Gestao de riscos — apenas visualizacao, sem edicao/mitigacao/CRUD

### Ausente (precisa implementar)
- [ ] Autenticacao (email/senha via NextAuth.js)
- [ ] Modelo User no banco
- [ ] UI para EAP (WBS) — modelo EAPItem existe no Prisma
- [ ] UI para Status Reports — modelo StatusReport existe no Prisma
- [ ] Termo de Abertura (tipo de Artifact)
- [ ] Termo de Encerramento (tipo de Artifact + fluxo de fechamento)
- [ ] Filtros e ordenacao no dashboard
- [ ] Dashboard analitico com KPIs e graficos
- [ ] Notificacoes push in-app
- [ ] Deploy em producao
- [ ] Testes automatizados
- [ ] CI/CD
- [ ] .env.example
- [ ] Seed de dados (prisma/seed.ts)
- [ ] Paginas de erro (404, 500, error.tsx, loading.tsx)

---

## 9. DECISOES TECNICAS REGISTRADAS

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Auth | NextAuth.js + Credentials (email/senha) | Simples, sem SSO necessario por enquanto |
| Banco dev | Neon.tech free tier | Nao congela projetos inativos (Supabase congela) |
| Deploy | Vercel | Sem restricao da AIR por enquanto |
| IA principal | Gemini 2.5 Flash | Coberto pela API gratuita |
| IA fallback | Gemini 2.5 Pro | Para quando o modelo principal falhar. NAO pode ser 1.5 (fora da API) |
| Design | Figma como referencia final | URL: https://www.figma.com/make/Lodp4YbQbtwVNUxD76QTX1/Project-Management-App |
| Idioma do app | pt-BR hardcoded | Sem necessidade de i18n por enquanto |
| Notificacoes | Push in-app (toast/badge) | Sem email ou Slack por enquanto |
| Integracao Jira | Futuro, nao prioridade | Foco em features internas primeiro |
| @prisma/client | Mover para dependencies | Atualmente esta incorretamente em devDependencies |

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

## 11. ROADMAP COMPLETO

### FASE 1 — Preparacao para Touchpoint (ate 26/03/2026)
> Meta: Demo ao vivo, funcional, impressionante. Polir o que existe.

| ID | Tarefa | Descricao | Esforco | Status |
|----|--------|-----------|---------|--------|
| 1.1 | Setup local independente | Provisionar Neon.tech, .env.local, rodar migrations, criar seed.ts, corrigir @prisma/client | Baixo | A fazer |
| 1.2 | Fallback de IA | Try/catch no /api/ai com Gemini 2.5 Flash como principal e 2.5 Pro como fallback | Baixo | A fazer |
| 1.3 | Polir UX do fluxo principal | Loading states elegantes na IA, artefatos bem formatados, responsividade para projetor | Medio | A fazer |
| 1.4 | Alinhar visual com Figma | Comparar telas atuais com Figma, ajustar cores/espacamentos/tipografia/layout | Medio-Alto | A fazer |
| 1.5 | Dados de demo convincentes | 3-5 projetos ficticios mas realistas, 1 para criar ao vivo | Baixo | A fazer |

---

### FASE 2 — MVP para Producao (27/03 → 26/06/2026)
> Meta: Sistema em producao, utilizavel de verdade na AIR Company.

#### Sprint 1: Autenticacao + Deploy (Abril, semanas 1-2)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.1 | Autenticacao email/senha | NextAuth.js + Credentials, modelo User no Prisma, telas login/registro, middleware de protecao, relacionar Project.createdBy com User.id | Alto |
| 2.2 | Deploy Vercel | Conectar GitHub → Vercel, env vars, banco Neon como producao | Baixo |

#### Sprint 2: EAP + Riscos completo (Abril, semanas 3-4)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.3 | UI para EAP (WBS) | Nova pagina `/projects/[id]/eap`, arvore hierarquica, CRUD EAPItems, status por item | Alto |
| 2.4 | Gestao de riscos completa | CRUD completo de riscos, matriz visual 5x5, campo de plano de mitigacao | Medio |

**Arquivos a criar:**
- `src/app/projects/[id]/eap/page.tsx`
- `src/app/api/eap/route.ts`

#### Sprint 3: Status Reports + Notificacoes (Maio, semanas 1-2)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.5 | UI para Status Reports | Nova pagina `/projects/[id]/status`, formulario, timeline visual | Medio |
| 2.6 | Notificacoes push in-app | Badge no Topbar com contador, drawer de notificacoes, integracao com logica do cron | Medio |

**Arquivos a criar:**
- `src/app/projects/[id]/status/page.tsx`
- `src/app/api/status-reports/route.ts`

#### Sprint 4: Documentos completos (Maio, semanas 3-4)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.7 | Termo de Abertura | Novo tipo de Artifact `TERMO_ABERTURA`, template com aprovadores e data de inicio, IA gera rascunho a partir do escopo | Medio |
| 2.8 | Termo de Encerramento | Novo tipo `TERMO_ENCERRAMENTO`, fluxo de fechamento de projeto, campos de licoes aprendidas e aceite | Medio |
| 2.9 | Rollback de versoes | UI de historico por artefato, comparacao visual, botao de restaurar | Medio |

#### Sprint 5: Dashboard + Polish (Junho, semanas 1-2)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.10 | Dashboard analitico | KPIs (total projetos, distribuicao por status, orcamento agregado), graficos com Recharts ou Chart.js | Medio |
| 2.11 | Filtros e ordenacao | Filtrar por status/classificacao/gerente, ordenar por data/nome/orcamento, persistir na URL | Baixo-Medio |

#### Sprint 6: Hardening (Junho, semanas 3-4)

| ID | Tarefa | Descricao | Esforco |
|----|--------|-----------|---------|
| 2.12 | Testes automatizados | Vitest para API routes, Testing Library para componentes criticos | Medio |
| 2.13 | Seguranca e performance | Migrar listagens para Server Components, validacao de inputs, rate limiting | Medio |

---

## 12. MAPA DE ARQUIVOS CRITICOS

### Arquivos existentes que precisam de modificacao

| Arquivo | Modificacoes necessarias |
|---------|------------------------|
| `prisma/schema.prisma` | Adicionar model User, novos tipos de Artifact (TERMO_ABERTURA, TERMO_ENCERRAMENTO) |
| `package.json` | Mover @prisma/client de devDependencies para dependencies |
| `src/app/api/ai/route.ts` | Adicionar fallback Gemini 2.5 Pro |
| `src/app/api/projects/route.ts` | Relacionar projeto com User (apos auth) |
| `src/app/page.tsx` | Polir dashboard, adicionar filtros, alinhar com Figma |
| `src/app/projects/new/page.tsx` | Melhorar loading states da IA, polir UX |
| `src/app/projects/[id]/documents/page.tsx` | Polir artefatos, alinhar com Figma, expandir riscos |
| `src/components/layout/Topbar.tsx` | Alinhar com Figma, adicionar badge de notificacoes (futuro) |
| `src/components/projects/ProjectCard.tsx` | Alinhar com Figma |

### Novos arquivos a criar

| Arquivo | Fase | Descricao |
|---------|------|-----------|
| `.env.example` | 1.1 | Template de variaveis de ambiente |
| `prisma/seed.ts` | 1.1 | Dados de demonstracao |
| `src/app/loading.tsx` | 1.3 | Loading state global |
| `src/app/error.tsx` | 1.3 | Error boundary global |
| `src/app/not-found.tsx` | 1.3 | Pagina 404 |
| `src/app/login/page.tsx` | 2.1 | Tela de login |
| `src/app/register/page.tsx` | 2.1 | Tela de registro |
| `src/middleware.ts` | 2.1 | Protecao de rotas (NextAuth) |
| `src/app/projects/[id]/eap/page.tsx` | 2.3 | UI da EAP (WBS) |
| `src/app/api/eap/route.ts` | 2.3 | CRUD EAPItems |
| `src/app/projects/[id]/status/page.tsx` | 2.5 | UI dos Status Reports |
| `src/app/api/status-reports/route.ts` | 2.5 | CRUD StatusReports |
| `src/app/api/notifications/route.ts` | 2.6 | API de notificacoes |

---

## 13. PADROES E CONVENCOES A SEGUIR

### Codigo
- TypeScript strict mode (ja configurado)
- Path alias: `@/` = `./src/`
- Componentes UI via shadcn/ui (instalados com `npx shadcn add`)
- Classes CSS via Tailwind com `cn()` helper para condicionais
- Prisma Client via singleton em `@/lib/prisma`
- Tipos vindos de `@prisma/client` (nao criar interfaces duplicadas)
- API routes no padrao Next.js App Router (`route.ts` com funcoes GET/POST/PUT/DELETE exportadas)
- IDs sao UUID v4 (gerados pelo Prisma com `@default(uuid())`)
- Datas gerenciadas pelo Prisma (`@default(now())` e `@updatedAt`)

### UI/UX
- Idioma: pt-BR
- Moeda: Real (R$) com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Status visual: semaforo (GREEN=emerald, YELLOW=amber, RED=rose)
- Toasts via Sonner para feedback de acoes
- Design de referencia: Figma (link na secao 9)
- Font: Inter (ja configurada no layout.tsx)

### Git
- Trabalhar em branches, nao commitar direto na master
- Nao alterar schema.prisma sem garantir compatibilidade com banco do Eduardo
- Testar antes de mergear

---

## 14. CRITERIOS DE VERIFICACAO

### Para o Touchpoint (26/03)
- [ ] `npm run dev` sobe sem erros
- [ ] Dashboard lista projetos com visual proximo ao Figma
- [ ] Criar projeto: 7 perguntas → IA processa → 3 artefatos gerados
- [ ] Se IA principal falhar → fallback funciona e usuario e informado
- [ ] Central de documentos: editar artefato → salvar → snapshot criado
- [ ] Responsivo em tela de projetor/TV (1920px+)
- [ ] Dados de demo realistas e convincentes

### Para Producao (26/06)
- [ ] Login com email/senha funciona
- [ ] Rotas protegidas (sem auth = redirect para login)
- [ ] EAP: criar arvore hierarquica, mudar status de itens
- [ ] Riscos: CRUD completo, matriz visual probabilidade x impacto
- [ ] Status Reports: criar, visualizar timeline
- [ ] Termo de Abertura: gerar a partir do escopo
- [ ] Termo de Encerramento: fluxo de fechamento
- [ ] Notificacoes: badge aparece quando ha alertas
- [ ] Dashboard analitico com KPIs
- [ ] Filtros no dashboard (status, classificacao, gerente)
- [ ] Deploy Vercel funcional com banco Neon
- [ ] Testes nos fluxos core

---

## 15. TIME E COMUNICACAO

| Pessoa | Papel | Contato |
|--------|-------|---------|
| Eduardo | Lider tecnico, apresenta no touchpoint | Teams corporativo |
| Frank | Desenvolvimento principal | Teams corporativo |
| Marcel | Desenvolvimento (disponibilidade incerta) | Teams corporativo |

- Reunioes: terca e quinta via Teams
- Codigo: GitHub
- Nao ha GitHub Projects configurado

---

## 16. RISCOS CONHECIDOS

| Risco | Severidade | Mitigacao |
|-------|-----------|-----------|
| Chave Gemini pessoal (quota) | Critico | Implementar fallback com segundo modelo |
| Banco so na maquina do Eduardo | Alto | Provisionar Neon.tech |
| Zero testes | Alto (para producao) | Adicionar Vitest no Sprint 6 |
| Sem autenticacao | Critico (para producao) | NextAuth.js no Sprint 1 da Fase 2 |
| @prisma/client em devDependencies | Baixo | Mover para dependencies |
| Todas as paginas "use client" | Baixo | Migrar para Server Components no Sprint 6 |
