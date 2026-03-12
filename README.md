# PMO-APP

Sistema de gestao de projetos tradicionais para a AIR Company (Labs, Celula 2).

**Principio central:** O usuario nao escreve documentos. O usuario responde perguntas. O sistema gera a documentacao.

O PMO-APP guia o gerente de projetos atraves de 7 perguntas fundamentais e, com apoio de IA (Google Gemini), gera automaticamente a documentacao padrao: Business Case, Escopo Preliminar e Analise de Riscos.

---

## Tech Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.x |
| UI | React + TypeScript | 19.x / 5.x |
| Styling | Tailwind CSS | 4.x |
| Componentes | shadcn/ui (Radix UI) | 1.x |
| Animacoes | Framer Motion | 12.x |
| ORM | Prisma | 5.x |
| Banco de dados | PostgreSQL via Neon.tech | — |
| IA/LLM | Google Gemini | @google/genai |
| Graficos | Recharts | 3.x |
| PDF | jsPDF | 4.x |

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado 20+)
- npm (vem junto com o Node.js)
- Conta no [Neon.tech](https://neon.tech/) (free tier) para o banco PostgreSQL
- Chave de API do [Google Gemini](https://aistudio.google.com/apikey) (free tier)

---

## Instalacao Local

### 1. Clonar o repositorio

```bash
git clone https://github.com/eromeirosp/pmo-app.git
cd pmo-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variaveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com seus dados:

```env
# Obrigatoria — URL de conexao do seu banco Neon.tech
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Obrigatoria — Chave da API do Google Gemini
GEMINI_API_KEY="sua-chave-aqui"
```

> **Como obter o DATABASE_URL:** Crie um projeto no [Neon.tech](https://neon.tech/), va em "Connection Details" e copie a connection string.
>
> **Como obter a GEMINI_API_KEY:** Acesse o [Google AI Studio](https://aistudio.google.com/apikey), crie uma chave de API e copie.

### 4. Rodar as migrations do banco

```bash
npx prisma migrate dev
```

Isso vai criar todas as tabelas no seu banco PostgreSQL.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Scripts Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de producao |
| `npm start` | Inicia o servidor de producao (precisa do build antes) |
| `npm run lint` | Executa o ESLint para verificar o codigo |

---

## Deploy no Vercel

### 1. Conectar o repositorio

1. Acesse [vercel.com](https://vercel.com/) e faca login
2. Clique em "Add New Project"
3. Importe o repositorio `eromeirosp/pmo-app` do GitHub
4. O Vercel detecta automaticamente que e um projeto Next.js

### 2. Configurar variaveis de ambiente

Antes de fazer o deploy, configure as variaveis no painel do Vercel:

1. Va em **Settings** → **Environment Variables**
2. Adicione:
   - `DATABASE_URL` → sua connection string do Neon.tech
   - `GEMINI_API_KEY` → sua chave da API do Gemini

### 3. Deploy

Clique em "Deploy". Cada push para a branch principal vai gerar um deploy automatico.

---

## Estrutura do Projeto

```
pmo-app/
├── prisma/
│   └── schema.prisma              # Modelos de dados (Project, Artifact, Risk, etc.)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Dashboard — listagem de projetos
│   │   ├── layout.tsx             # Layout raiz (font Inter, Toaster, lang pt-BR)
│   │   ├── globals.css            # Tailwind + variaveis de tema
│   │   ├── projects/
│   │   │   ├── new/page.tsx       # Formulario de criacao (7 perguntas + IA)
│   │   │   └── [id]/documents/    # Central de documentos
│   │   └── api/
│   │       ├── projects/          # CRUD de projetos
│   │       ├── ai/                # Analise via Gemini (classificacao + documentos)
│   │       ├── artifacts/         # Atualizacao com auto-versionamento
│   │       ├── cron/              # Alertas automaticos
│   │       └── webhooks/          # Integracoes externas
│   ├── components/
│   │   ├── layout/                # Topbar, navegacao
│   │   ├── projects/              # ProjectCard e componentes de projeto
│   │   └── ui/                    # Componentes shadcn/ui (button, card, input, etc.)
│   └── lib/
│       ├── prisma.ts              # Singleton do Prisma Client
│       └── utils.ts               # Helper cn() para classes CSS condicionais
├── .env.example                   # Template de variaveis de ambiente
├── ROADMAP.md                     # Roadmap completo e decisoes tecnicas
└── package.json
```

**Path alias:** `@/*` aponta para `./src/*`

---

## Convencoes de Codigo

### Geral
- TypeScript strict mode
- Componentes UI via shadcn/ui (`npx shadcn add <componente>`)
- Classes CSS com Tailwind + helper `cn()` para condicionais
- Prisma Client via singleton em `@/lib/prisma`
- Tipos vindos de `@prisma/client` (nao criar interfaces duplicadas)
- API routes no padrao App Router (`route.ts` com GET/POST/PUT/DELETE)

### UI/UX
- Idioma: **pt-BR** (hardcoded, sem i18n)
- Moeda: R$ com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Status semaforo: GREEN (emerald), YELLOW (amber), RED (rose)
- Toasts via Sonner
- Font: Inter
- Design de referencia: [Figma](https://www.figma.com/make/Lodp4YbQbtwVNUxD76QTX1/Project-Management-App)

### Git
- **Nunca commitar direto na master** — sempre trabalhar em branches
- Testar antes de fazer merge
- Nao alterar `prisma/schema.prisma` sem garantir compatibilidade com o banco dos demais

---

## Como Contribuir

1. Crie uma branch a partir da `master`:
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/nome-da-feature
   ```

2. Faca suas alteracoes e commite:
   ```bash
   git add .
   git commit -m "feat: descricao da alteracao"
   ```

3. Envie para o GitHub:
   ```bash
   git push origin feature/nome-da-feature
   ```

4. Abra um Pull Request no GitHub para review

---

## Proximos Passos

Consulte o [ROADMAP.md](./ROADMAP.md) para ver o planejamento completo, decisoes tecnicas e o que esta implementado vs. pendente.

---

## Time

| Pessoa | Papel |
|--------|-------|
| Eduardo | Lider tecnico |
| Frank | Desenvolvimento |
| Marcel | Desenvolvimento |
