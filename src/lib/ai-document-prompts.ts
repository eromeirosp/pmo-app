/**
 * Catálogo de documentos de projeto e prompts para geração via IA.
 * Baseado em melhores práticas PMBoK / PRINCE2.
 */

export type DocumentType =
  | "DOC_TAP"
  | "DOC_RISK_PLAN"
  | "DOC_COMM_PLAN"
  | "DOC_PROJECT_PLAN"
  | "DOC_MEETING_MINUTES"
  | "DOC_STATUS_REPORT"
  | "DOC_QUALITY_PLAN";

export type ProjectClassification = "TRADITIONAL" | "AGILE" | "HYBRID";

export type RequirementLevel = "REQUIRED" | "DESIRABLE";

export interface DocumentCatalogEntry {
  type: DocumentType;
  label: string;
  description: string;
  category: "Iniciação" | "Planejamento" | "Execução" | "Encerramento";
  requirements: Record<ProjectClassification, RequirementLevel>;
}

export const DOCUMENT_CATALOG: DocumentCatalogEntry[] = [
  {
    type: "DOC_TAP",
    label: "Termo de Abertura (TAP)",
    description: "Documento que autoriza formalmente o projeto e estabelece objetivos, escopo e stakeholders.",
    category: "Iniciação",
    requirements: { TRADITIONAL: "REQUIRED", AGILE: "REQUIRED", HYBRID: "REQUIRED" },
  },
  {
    type: "DOC_PROJECT_PLAN",
    label: "Plano do Projeto",
    description: "Plano integrado com cronograma, recursos, comunicação e estratégia de execução.",
    category: "Planejamento",
    requirements: { TRADITIONAL: "REQUIRED", AGILE: "DESIRABLE", HYBRID: "REQUIRED" },
  },
  {
    type: "DOC_RISK_PLAN",
    label: "Plano de Gerenciamento de Riscos",
    description: "Estratégias de identificação, análise, resposta e monitoramento de riscos.",
    category: "Planejamento",
    requirements: { TRADITIONAL: "REQUIRED", AGILE: "DESIRABLE", HYBRID: "REQUIRED" },
  },
  {
    type: "DOC_COMM_PLAN",
    label: "Plano de Comunicação",
    description: "Define canais, frequência, responsáveis e público-alvo das comunicações do projeto.",
    category: "Planejamento",
    requirements: { TRADITIONAL: "REQUIRED", AGILE: "DESIRABLE", HYBRID: "DESIRABLE" },
  },
  {
    type: "DOC_QUALITY_PLAN",
    label: "Plano de Qualidade",
    description: "Critérios de qualidade, processos de verificação e validação das entregas.",
    category: "Planejamento",
    requirements: { TRADITIONAL: "DESIRABLE", AGILE: "DESIRABLE", HYBRID: "DESIRABLE" },
  },
  {
    type: "DOC_STATUS_REPORT",
    label: "Modelo de Relatório de Status",
    description: "Template padrão para relatórios periódicos de acompanhamento do projeto.",
    category: "Execução",
    requirements: { TRADITIONAL: "REQUIRED", AGILE: "REQUIRED", HYBRID: "REQUIRED" },
  },
  {
    type: "DOC_MEETING_MINUTES",
    label: "Modelo de Ata de Reunião",
    description: "Template padrão para registro de reuniões, decisões e ações.",
    category: "Execução",
    requirements: { TRADITIONAL: "DESIRABLE", AGILE: "DESIRABLE", HYBRID: "DESIRABLE" },
  },
];

export const DOCUMENT_PROMPTS: Record<DocumentType, string> = {
  DOC_TAP: `Gere um Termo de Abertura de Projeto (TAP / Project Charter) completo e profissional seguindo as melhores práticas do PMBoK.

O documento deve conter as seguintes seções em formato Markdown:
1. **Título do Projeto**
2. **Justificativa / Business Case** — por que este projeto existe
3. **Objetivos** — SMART (Específicos, Mensuráveis, Alcançáveis, Relevantes, Temporais)
4. **Escopo do Projeto** — o que está incluído e o que está excluído
5. **Entregas Principais** — resultados tangíveis esperados
6. **Premissas e Restrições**
7. **Riscos Iniciais** — tabela resumida com probabilidade e impacto
8. **Cronograma Macro** — milestones principais com datas estimadas
9. **Orçamento Estimado** — resumo financeiro
10. **Stakeholders Principais** — tabela com nome, papel e nível de influência
11. **Critérios de Sucesso** — como medir se o projeto foi bem-sucedido
12. **Aprovações** — campos de assinatura em Markdown puro (linha horizontal, negrito para cargo/nome, formato **Data:** (DD/MM/AAAA))

Preencha todas as seções com os dados reais do projeto fornecidos abaixo. Onde não houver dados específicos, gere conteúdo profissional e coerente baseado no contexto disponível. Use linguagem corporativa formal em português brasileiro.`,

  DOC_RISK_PLAN: `Gere um Plano de Gerenciamento de Riscos completo e profissional seguindo as melhores práticas do PMBoK.

O documento deve conter as seguintes seções em formato Markdown:
1. **Objetivo** — propósito do plano de riscos para este projeto
2. **Metodologia** — como os riscos serão identificados, analisados e tratados
3. **Papéis e Responsabilidades** — quem faz o quê na gestão de riscos
4. **Categorias de Risco** — taxonomia (Técnico, Organizacional, Externo, Gerenciamento, Financeiro)
5. **Matriz de Probabilidade x Impacto** — escalas de 1-5 com descrição de cada nível
6. **Registro de Riscos Atual** — tabela com os riscos já identificados no projeto (usar dados reais)
7. **Estratégias de Resposta** — mitigação, transferência, aceitação, eliminação para cada risco
8. **Plano de Contingência** — ações se os riscos se materializarem
9. **Frequência de Monitoramento** — quando e como os riscos serão revisados
10. **Gatilhos de Escalação** — critérios para escalar riscos ao patrocinador

Preencha com os dados reais do projeto. Use os riscos já cadastrados no sistema. Use linguagem corporativa formal em português brasileiro.`,

  DOC_COMM_PLAN: `Gere um Plano de Comunicação do Projeto completo e profissional seguindo as melhores práticas do PMBoK.

O documento deve conter as seguintes seções em formato Markdown:
1. **Objetivo** — propósito das comunicações do projeto
2. **Stakeholders e Necessidades de Comunicação** — tabela com cada stakeholder, suas necessidades e expectativas
3. **Matriz de Comunicação** — tabela com: Tipo de Comunicação | Público-Alvo | Frequência | Meio/Canal | Responsável
4. **Reuniões do Projeto** — tipos de reunião (kickoff, status, retrospectiva, etc.) com frequência e participantes
5. **Ferramentas e Canais** — quais ferramentas serão usadas (email, Teams, Slack, etc.)
6. **Relatórios** — tipos de relatórios, frequência e destinatários
7. **Gestão de Expectativas** — como lidar com conflitos e mudanças de expectativa
8. **Escalação** — fluxo de escalação para problemas de comunicação

Preencha com os dados reais do projeto. Use os stakeholders já cadastrados. Sugira rituais baseados na classificação do projeto. Use linguagem corporativa formal em português brasileiro.`,

  DOC_PROJECT_PLAN: `Gere um Plano do Projeto (Plano de Gerenciamento do Projeto) completo e profissional seguindo as melhores práticas do PMBoK.

O documento deve conter as seguintes seções em formato Markdown:
1. **Visão Geral do Projeto** — resumo executivo
2. **Objetivos e Critérios de Sucesso**
3. **Escopo Detalhado** — baseado na EAP/WBS existente
4. **Cronograma** — fases, milestones e dependências
5. **Recursos e Equipe** — papéis, responsabilidades e alocação
6. **Orçamento Detalhado** — breakdown por fase/entrega
7. **Gestão de Mudanças** — processo para solicitação e aprovação de mudanças
8. **Gestão de Qualidade** — critérios e processos de verificação
9. **Gestão de Riscos** — resumo das estratégias (referência ao Plano de Riscos)
10. **Gestão de Comunicação** — resumo (referência ao Plano de Comunicação)
11. **Critérios de Aceite** — como as entregas serão validadas
12. **Premissas, Restrições e Dependências**

Preencha com os dados reais do projeto. Use a EAP existente como base para o cronograma. Use linguagem corporativa formal em português brasileiro.`,

  DOC_MEETING_MINUTES: `Gere um Modelo/Template de Ata de Reunião profissional adequado para este projeto.

O documento deve conter as seguintes seções em formato Markdown, com campos para preenchimento:
1. **Informações da Reunião** — Data, Horário, Local/Link, Facilitador
2. **Participantes** — tabela com Nome, Papel, Presente (Sim/Não)
3. **Pauta** — itens numerados da agenda
4. **Discussões** — resumo dos pontos discutidos por item da pauta
5. **Decisões** — tabela com Decisão, Responsável, Prazo
6. **Ações/Action Items** — tabela com Ação, Responsável, Prazo, Status
7. **Riscos Identificados** — novos riscos levantados na reunião
8. **Próxima Reunião** — data e pauta preliminar
9. **Aprovação** — espaço para validação

Pré-preencha o template com informações do projeto (nome do projeto, gerente, stakeholders) e deixe os campos de conteúdo dinâmico indicados com [A PREENCHER]. Use linguagem corporativa formal em português brasileiro.`,

  DOC_STATUS_REPORT: `Gere um Modelo/Template de Relatório de Status profissional adequado para este projeto.

O documento deve conter as seguintes seções em formato Markdown:
1. **Cabeçalho** — Nome do Projeto, Período, Gerente, Data do Relatório
2. **Resumo Executivo** — 2-3 frases sobre o estado geral
3. **Indicadores de Saúde** — Escopo (Verde/Amarelo/Vermelho), Cronograma, Orçamento, Qualidade
4. **Progresso Geral** — percentual e visualização
5. **Conquistas do Período** — o que foi entregue/concluído
6. **Próximos Passos** — atividades planejadas para o próximo período
7. **Riscos e Problemas** — tabela atualizada com status
8. **Mudanças de Escopo** — alterações aprovadas ou pendentes
9. **Orçamento** — realizado vs. planejado
10. **Solicitações ao Patrocinador** — decisões ou recursos necessários

Se houver dados de Status Reports anteriores, use-os como referência para preencher o modelo com dados reais. Caso contrário, deixe campos com [A PREENCHER]. Use linguagem corporativa formal em português brasileiro.`,

  DOC_QUALITY_PLAN: `Gere um Plano de Qualidade do Projeto completo e profissional seguindo as melhores práticas do PMBoK.

O documento deve conter as seguintes seções em formato Markdown:
1. **Objetivo** — propósito da gestão de qualidade neste projeto
2. **Padrões de Qualidade** — normas e padrões aplicáveis
3. **Critérios de Qualidade por Entrega** — tabela com cada entrega principal e seus critérios de aceite
4. **Processos de Garantia de Qualidade** — atividades preventivas (revisões, auditorias, etc.)
5. **Processos de Controle de Qualidade** — atividades de verificação (testes, inspeções, etc.)
6. **Métricas de Qualidade** — indicadores mensuráveis
7. **Papéis e Responsabilidades** — quem garante e controla a qualidade
8. **Ferramentas e Técnicas** — checklists, diagramas, etc.
9. **Não Conformidades** — processo para tratar desvios
10. **Melhoria Contínua** — como lições aprendidas alimentam a qualidade

Preencha com os dados reais do projeto. Baseie os critérios de qualidade nos critérios de sucesso e entregas do Charter. Use linguagem corporativa formal em português brasileiro.`,
};
