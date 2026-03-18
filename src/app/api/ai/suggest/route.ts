import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/ai-sanitize";
import { SUGGEST_SCHEMAS } from "@/lib/ai-schemas";

export const dynamic = "force-dynamic";

type SuggestType =
  | "charter_criteria"
  | "charter_deliverables"
  | "charter_premises"
  | "charter_restrictions"
  | "status_report"
  | "risk_suggest"
  | "classification"
  | "eap_suggest"
  | "closing_suggest";

const PROMPTS: Record<SuggestType, string> = {
  charter_criteria: `Com base no contexto do projeto abaixo, sugira de 3 a 5 critérios de sucesso MENSURÁVEIS e específicos.
Cada critério deve ser claro, quantificável quando possível, e diretamente relacionado aos objetivos do projeto.
Exemplo: "Redução de 25% no tempo de processamento de pedidos até Q3 2025"`,

  charter_deliverables: `Com base no contexto do projeto abaixo, sugira de 3 a 5 entregas principais (deliverables).
Cada entrega deve ser um resultado tangível e verificável do projeto.
Exemplo: "Plataforma web de gestão de pedidos com dashboard em tempo real"`,

  charter_premises: `Com base no contexto do projeto abaixo, sugira de 3 a 5 premissas (assumptions) do projeto.
Premissas são condições assumidas como verdadeiras para o planejamento.
Exemplo: "A equipe de TI terá disponibilidade de 80% para o projeto"`,

  charter_restrictions: `Com base no contexto do projeto abaixo, sugira de 3 a 5 restrições (constraints) do projeto.
Restrições são limitações que o projeto precisa operar dentro.
Exemplo: "O orçamento não pode exceder R$ 500.000 sem aprovação do comitê"`,

  status_report: `Com base no contexto do projeto abaixo, sugira conteúdo para um relatório de status.
Retorne um JSON com as chaves: "accomplishments" (conquistas do período), "nextSteps" (próximos passos prioritários), "issues" (problemas/impedimentos identificados).
Cada campo deve ter 2-3 frases profissionais e específicas ao projeto.`,

  risk_suggest: `Com base no contexto do projeto abaixo e nos riscos já identificados, sugira de 2 a 3 NOVOS riscos que ainda não foram catalogados.
Para cada risco, inclua: title, description, probability (1-5), impact (1-5), category, mitigation (estratégia de mitigação).
Categorias possíveis: Técnico, Organizacional, Externo, Gerenciamento de Projeto, Financeiro.`,

  classification: `Com base no contexto do projeto abaixo, analise e sugira a classificação metodológica mais adequada.
As opções são:
- TRADITIONAL (Cascata/Waterfall): projetos com escopo bem definido, requisitos estáveis, entregas sequenciais
- AGILE (Ágil): projetos com requisitos evolutivos, entregas incrementais, alta incerteza
- HYBRID (Híbrido): combinação de ambas, planejamento cascata com execução ágil

Considere: complexidade, incerteza de requisitos, tamanho da equipe, tipo de entrega, stakeholders e orçamento.
Retorne ESTRITAMENTE um JSON válido: { "classification": "TRADITIONAL|AGILE|HYBRID", "justification": "justificativa em 1-2 frases" }`,

  eap_suggest: `Com base no contexto do projeto abaixo, sugira uma Estrutura Analítica do Projeto (EAP/WBS) hierárquica.
Considere a classificação do projeto, o escopo preliminar, os critérios de sucesso e as entregas do charter.
Se já existirem itens na EAP, NÃO os repita — sugira apenas itens complementares.

Crie de 3 a 6 pacotes de trabalho principais (fases), cada um com 2 a 4 sub-pacotes (atividades).
Cada item deve ter: name (nome claro e descritivo) e description (1 frase sobre o escopo).

A estrutura deve seguir boas práticas de PMO: fases lógicas do projeto do início ao encerramento.`,

  closing_suggest: `Com base no contexto COMPLETO do projeto abaixo (incluindo status reports, EAP, riscos e charter), gere um relatório de encerramento completo.

Analise:
- O progresso real do projeto (EAP e status reports)
- Riscos que se materializaram vs. mitigados
- Entregas planejadas vs. realizadas
- Problemas reportados nos status reports

Gere:
1. "summary": Resumo executivo de 2-3 parágrafos sobre o projeto (contexto, execução, resultado)
2. "deliverables": Array de entregas com "text" (nome da entrega) e "status" ("concluído", "parcial" ou "não entregue"), baseado nos dados reais
3. "lessons": Array de 3-5 lições aprendidas baseadas no histórico real do projeto
4. "recommendations": Array de 3-5 recomendações para projetos futuros baseadas na experiência deste projeto`,
};

async function getProjectContext(projectId: string, enriched = false) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      risks: true,
      charterItems: true,
      artifacts: true,
      eapItems: true,
      closingItems: enriched ? true : undefined,
      statusReports: enriched
        ? { orderBy: { reportDate: "desc" } }
        : { orderBy: { reportDate: "desc" }, take: 3 },
    },
  });

  if (!project) return null;

  const businessCase = project.artifacts.find(
    (a) => a.type === "BUSINESS_CASE"
  );
  const scope = project.artifacts.find(
    (a) => a.type === "ESCOPO_PRELIMINAR"
  );

  // Sanitizar dados do projeto antes de incluir no prompt
  let contextText = `
Nome: ${sanitizeForPrompt(project.name, 500)}
Gerente: ${sanitizeForPrompt(project.manager, 500)}
Orçamento: R$ ${project.budget.toLocaleString("pt-BR")}
Classificação: ${project.classification || "Não definida"}
Problemas: ${sanitizeForPrompt(project.problems)}
Retornos esperados: ${sanitizeForPrompt(project.returns)}
Impactos: ${sanitizeForPrompt(project.impacts)}
Business Case: ${businessCase ? JSON.stringify(businessCase.content) : "Não gerado"}
Escopo Preliminar: ${scope ? JSON.stringify(scope.content) : "Não gerado"}
Riscos existentes: ${project.risks.map((r) => `${sanitizeForPrompt(r.title || r.description, 200)} (P:${r.probability} I:${r.impact})`).join("; ") || "Nenhum"}
Itens do Charter: ${project.charterItems.map((c) => `[${c.type}] ${sanitizeForPrompt(c.text, 300)}`).join("; ") || "Nenhum"}
Últimos Status Reports: ${project.statusReports.map((s) => `${s.period}: ${s.overallStatus} (${s.progress}%)`).join("; ") || "Nenhum"}
  `.trim();

  // Contexto adicional para EAP e Encerramento
  if (project.eapItems && project.eapItems.length > 0) {
    contextText += `\nEAP atual: ${project.eapItems.map((e) => `${sanitizeForPrompt(e.name, 200)} [${e.status}]${e.parentId ? ` (filho de ${project.eapItems.find(p => p.id === e.parentId)?.name || e.parentId})` : ""}`).join("; ")}`;
  }

  if (enriched && project.statusReports.length > 0) {
    contextText += `\n\nHistórico completo de Status Reports:`;
    for (const sr of project.statusReports) {
      contextText += `\n- ${sr.period}: Status ${sr.overallStatus}, Progresso ${sr.progress}%, Escopo: ${sr.scopeStatus}, Cronograma: ${sr.scheduleStatus}, Orçamento: ${sr.budgetStatus}`;
      if (sr.accomplishments) contextText += ` | Conquistas: ${sanitizeForPrompt(sr.accomplishments, 500)}`;
      if (sr.issues) contextText += ` | Problemas: ${sanitizeForPrompt(sr.issues, 500)}`;
    }
  }

  if (enriched && "closingItems" in project) {
    const closingItems = project.closingItems as Array<{ type: string; text: string }>;
    if (closingItems.length > 0) {
      contextText += `\nItens de encerramento já existentes: ${closingItems.map((c) => `[${c.type}] ${sanitizeForPrompt(c.text, 300)}`).join("; ")}`;
    }
  }

  return {
    project,
    contextText,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { projectId, type } = await req.json();

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "projectId e type são obrigatórios" },
        { status: 400 }
      );
    }

    if (!(type in PROMPTS)) {
      return NextResponse.json(
        { error: `Tipo inválido: ${type}` },
        { status: 400 }
      );
    }

    // Encerramento e EAP precisam de contexto enriquecido
    const needsEnriched = type === "closing_suggest" || type === "eap_suggest";
    const ctx = await getProjectContext(projectId, needsEnriched);
    if (!ctx) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const isListType = type.startsWith("charter_");
    const isRisk = type === "risk_suggest";
    const isClassification = type === "classification";
    const isEap = type === "eap_suggest";
    const isClosing = type === "closing_suggest";

    let responseFormat: string;
    if (isListType) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": ["item 1", "item 2", ...] }`;
    } else if (isRisk) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": [{ "title": "...", "description": "...", "probability": 3, "impact": 4, "category": "...", "mitigation": "...", "contingency": "..." }] }`;
    } else if (isClassification) {
      responseFormat = ""; // Already included in the prompt
    } else if (isEap) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": [{ "name": "Fase 1 - Nome", "description": "Descrição", "children": [{ "name": "Sub-pacote", "description": "Descrição" }] }] }`;
    } else if (isClosing) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "summary": "Resumo executivo...", "deliverables": [{ "text": "Entrega X", "status": "concluído|parcial|não entregue" }], "lessons": ["Lição 1", ...], "recommendations": ["Recomendação 1", ...] }`;
    } else {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "accomplishments": "...", "nextSteps": "...", "issues": "..." }`;
    }

    const prompt = `Você atua como um PMO Master especialista em gestão de projetos corporativos.

${PROMPTS[type as SuggestType]}

Contexto do Projeto:
${ctx.contextText}

${responseFormat}
Retorne apenas o JSON, sem marcações markdown ou texto antes/depois.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    }

    let rawText = "";
    try {
      rawText = response.text || "";
    } catch (e) {
      console.error("Error accessing response.text:", e);
      console.log("Full response object:", JSON.stringify(response, null, 2));
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA." },
        { status: 500 }
      );
    }

    if (!rawText) {
      console.error("Empty response from AI. Full response:", JSON.stringify(response, null, 2));
      return NextResponse.json(
        { error: "IA não retornou conteúdo." },
        { status: 500 }
      );
    }

    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse AI suggest response:", rawText);
      return NextResponse.json(
        { error: "Erro ao formatar resposta da IA." },
        { status: 500 }
      );
    }

    // Validar resposta com schema Zod
    const schema = SUGGEST_SCHEMAS[type];
    if (schema) {
      const parsed = schema.safeParse(result);
      if (!parsed.success) {
        console.error("AI response validation failed:", JSON.stringify(parsed.error.flatten()));
        return NextResponse.json(
          { error: "Resposta da IA em formato inesperado." },
          { status: 502 }
        );
      }
      return NextResponse.json(parsed.data);
    }

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error("AI suggest error:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
