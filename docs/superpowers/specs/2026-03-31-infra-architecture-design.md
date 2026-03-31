# Visão Geral de Infraestrutura — PMO App @ CompassUOL

> **Audiência:** Liderança (Lidia, Castro) e time de arquitetura/infra
> **Objetivo:** Dar base para decisões de cloud e envolver time especializado antes do rollout

---

## Seção 1 — Contexto e visão geral

**O que é o PMO App**

Plataforma web de gestão de projetos desenvolvida internamente pela AI/R Company Labs — Célula 2. Cobre o ciclo completo de um projeto: charter, EAP, riscos, orçamento, stakeholders, status reports, lições aprendidas e encerramento. Possui motor de inteligência com IA (Google Gemini) que gera sugestões, alertas preditivos e simulações de cenário.

**Stack tecnológica atual**

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | API Routes (Node.js, embutido no Next.js) |
| Banco de dados | PostgreSQL (via Prisma ORM) |
| IA | Google Gemini API |
| Deploy atual | Vercel (desenvolvimento) |

**O que existe hoje vs. o que será construído**

| Hoje | Planejado |
|---|---|
| App funcional com dados reais | Autenticação com login/senha |
| Motor de IA (sugestões, alertas, cenários) | SSO corporativo (Fase 2) |
| Notificações internas no app | Push notifications por e-mail e browser |
| Deploy em Vercel (desenvolvimento) | Deploy em cloud enterprise (AWS ou Azure) |

---

## Seção 2 — Modelo de isolamento de dados (Multi-tenancy)

**Recomendação: banco único com separação lógica por tenant**

Cada registro no banco (projeto, usuário, risco, etc.) é associado a um identificador de organização/célula (`tenantId`). Todos compartilham a mesma instância de banco, mas os dados são completamente isolados por lógica de aplicação.

| Modelo | Complexidade | Custo | Isolamento | Indicado para |
|---|---|---|---|---|
| ✅ Banco único + tenantId | Baixa | Baixo | Lógico | Piloto → Enterprise |
| Banco por célula/BU | Média | Médio-alto | Físico | Requisito regulatório |
| Deploy por cliente | Alta | Alto | Total | Clientes externos |

Este é o modelo usado por Jira, Asana, Monday.com e a maioria das ferramentas SaaS enterprise. Funciona até escala muito alta e pode evoluir para isolamento físico se houver requisito de compliance no futuro. Para o contexto interno da CompassUOL, essa abordagem reduz o custo de operação e é suficiente para os requisitos de privacidade entre células/BUs (Business Units). Caso surja exigência regulatória no futuro, a migração para banco por BU é possível sem reescrever a aplicação.

---

## Seção 3 — Fases de escala

### Fase 1 — Piloto
**Escopo:** 1–2 células, ~10–50 projetos, ~20–100 usuários
**Objetivo:** validar o MVP com usuários reais antes de expandir

| Componente | Solução |
|---|---|
| App | 1 container (Fargate ou App Service) |
| Banco | PostgreSQL gerenciado — instância pequena (2 vCPU / 4 GB RAM) |
| Armazenamento | Bucket para documentos e artefatos |
| Auth | Login básico (usuário/senha) — SSO planejado para Fase 2 |
| Notificações | E-mail transacional simples |
| IA | Google Gemini API (pay-per-use) |
| Custo estimado | **~$150–350/mês** (AWS ou Azure) |

---

### Fase 2 — Expansão
**Escopo:** múltiplas BUs, ~200–500 projetos, ~500–2.000 usuários

| Componente | Solução |
|---|---|
| App | Auto-scaling (2–4 containers) |
| Banco | PostgreSQL gerenciado com réplica de leitura |
| Auth | **SSO integrado** (Cognito ou Microsoft Entra ID) |
| Notificações | E-mail + push browser |
| Jobs assíncronos | Fila de mensagens para alertas e cron da IA |
| Monitoramento | Logs centralizados + alertas de performance |
| Custo estimado | **~$800–2.000/mês** |

---

### Fase 3 — Enterprise
**Escopo:** empresa toda, 1.000+ projetos, 5.000+ usuários

| Componente | Solução |
|---|---|
| App | Kubernetes gerenciado (EKS ou AKS) com auto-scaling agressivo |
| Banco | PostgreSQL de alta disponibilidade + connection pooling |
| CDN | Assets estáticos distribuídos globalmente |
| IA | Possível migração para Azure OpenAI / AWS Bedrock |
| Disaster Recovery | Backup automatizado + failover multi-região |
| Compliance | Auditoria de acesso + criptografia em repouso e em trânsito |
| Custo estimado | **~$3.000–8.000/mês** (varia muito com uso de IA) |

---

## Seção 4 — Comparativo AWS vs Azure

| Função | AWS | Azure |
|---|---|---|
| Hospedagem do app | ECS Fargate / App Runner | App Service / AKS |
| Banco de dados | RDS PostgreSQL | Azure Database for PostgreSQL |
| Armazenamento de arquivos | S3 | Blob Storage |
| **SSO / Autenticação** | **Cognito + SAML/OIDC** | **Microsoft Entra ID** ⭐ |
| Push notifications | SNS | Notification Hubs |
| E-mail transacional | SES | Communication Services |
| Fila de mensagens | SQS | Service Bus |
| Jobs agendados (cron) | EventBridge + Lambda | Azure Functions |
| Secrets / Variáveis | Secrets Manager | Key Vault |
| Logs e monitoramento | CloudWatch + X-Ray | Azure Monitor + App Insights |
| CDN / Assets | CloudFront | Azure Front Door |

**Nota sobre IA:** o app usa Google Gemini — isso é independente do provedor cloud e continuaria assim em ambos os cenários. No futuro, uma migração para **AWS Bedrock** ou **Azure OpenAI** pode ser avaliada para manter tudo no mesmo ecossistema.

---

## Seção 5 — SSO (Single Sign-On)

O SSO permite que os colaboradores da CompassUOL façam login no PMO App usando as mesmas credenciais corporativas, sem criar uma senha nova.

**Via AWS — Cognito**
- Suporta SAML 2.0 e OpenID Connect
- Se a CompassUOL já tiver Microsoft Entra ID, o Cognito pode federar com ele (funciona, mas adiciona uma camada intermediária)
- O app já tem NextAuth.js preparado no código — integração direta

**Via Azure — Microsoft Entra ID** ⭐ recomendado se a CompassUOL usar Microsoft 365
- É o login corporativo padrão da maioria das grandes empresas brasileiras (antigo Azure Active Directory)
- Integração praticamente nativa: registra o app no portal Azure, configura o NextAuth.js, pronto
- Zero atrito para o usuário final — mesmo login do Teams, Outlook, etc.

**Recomendação:** verificar com o time de TI da CompassUOL se já existe Microsoft Entra ID corporativo ativo. Se sim, a rota Azure para SSO é significativamente mais simples.

---

## Seção 6 — Notificações Push

O app já possui notificações internas (banco de dados + alertas visuais na tela). A expansão para push contempla dois canais:

| Canal | Descrição | AWS | Azure |
|---|---|---|---|
| **E-mail** | Alertas de risco, status report vencido, ação autopilot | SES | Communication Services |
| **Push browser** | Notificação no navegador mesmo com o app fechado | SNS | Notification Hubs |
| **Push mobile** | Se houver app mobile no futuro | SNS + Firebase | Notification Hubs + Firebase |

Push de browser requer implementar **Service Workers** no frontend — é uma adição ao app, não apenas infraestrutura.

---

## Seção 7 — Custos (visão alto nível)

| Fase | Projetos | Usuários | Custo mensal estimado |
|---|---|---|---|
| Piloto | ~50 | ~100 | $150–350 |
| Expansão | ~500 | ~2.000 | $800–2.000 |
| Enterprise | 1.000+ | 5.000+ | $3.000–8.000+ |

> **Atenção:** o maior variável de custo neste app é a **IA (Google Gemini)**. O uso intenso de sugestões, simulações e análises pode dobrar esses valores dependendo do volume de chamadas. Isso precisa ser medido no piloto.

> **Nota metodológica:** estimativas baseadas em preços públicos de AWS (região us-east-1) e Azure (Brasil Sul), referência março 2026, sem desconto por volume ou contrato enterprise. Valores reais podem variar — recomenda-se sizing definitivo com o time de arquitetura.

---

## Seção 8 — Próximos passos recomendados

1. **Confirmar provedor cloud** com o time de TI/infra da CompassUOL — verificar contrato existente e se há Microsoft Entra ID ativo
2. **Envolver time de arquitetura** para sizing definitivo, compliance (LGPD) e disaster recovery
3. **Definir estratégia de piloto** — qual célula, quantos projetos, critérios de sucesso
4. **Planejar SSO** junto ao time de identidade da CompassUOL antes de qualquer deploy
5. **Medir uso de IA no piloto** para projetar custos reais antes da expansão
6. **Containerizar o app** (Docker) como pré-requisito para qualquer deploy em cloud
