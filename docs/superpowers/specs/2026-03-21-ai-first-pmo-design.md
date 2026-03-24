# AI-First PMO — Design Spec

> Data: 2026-03-21
> Autor: Frank + Claude (PM)
> Status: Aprovado

## Contexto

O PMO-APP e um projeto "clandestino" liderado pelo Head de um studio da AIR Company. O time dele avalia nos touchpoints (terca/quinta) e da feedback. O objetivo do trimestre e tornar o produto impressionante o suficiente para o Head aprovar uso real com GPs.

**Estrategia escolhida:** AI-First PMO — dobrar a aposta na IA como diferencial competitivo.

**Principio:** "O GP nao escreve documentos. Ele responde perguntas e cola transcricoes. O sistema faz o resto."

## Features Planejadas

### 3.2A — Meeting-to-Everything Pipeline
O GP cola a transcricao da reuniao e em 30s toda a documentacao esta atualizada.
- Expandir extracao IA (decisoes, status, EAP)
- UX de revisao com aceitar/rejeitar cada item
- Modelo Decision no banco

### 3.2B — Assistente IA do Portfolio
Chat no dashboard que responde perguntas sobre o portfolio via Gemini.
- Endpoint `/api/ai/chat`
- Componente PortfolioAssistant.tsx
- Chips de sugestoes pre-definidas

### 3.2C — Smart Digest + Dashboard Executivo
Resumo semanal automatico + KPIs enriquecidos.
- Expand cron para digest semanal via IA
- WeeklyDigestCard.tsx no dashboard
- KPIs por departamento, burn rate, health score

### 3.2D — PDF Exports Profissionais
Padronizacao visual com header/footer consistente.
- Helper `pdf-utils.ts`
- Aplicar em todos os exports

## Decisao: Auth como Debito Tecnico
Auth fica na Fase 4, pos-aprovacao do Head. Nao agrega valor no momento de criacao/validacao.

## Ordem de Execucao
1. Semanas 1-2: Meeting-to-Everything
2. Semanas 3-4: Assistente IA Portfolio
3. Semanas 5-6: Digest + Dashboard
4. Semana 7: PDFs padronizados
5. Semana 8+: Buffer + Figma alignment

## Arquivos Criticos
Ver plano completo em `.claude/plans/typed-pondering-taco.md`
