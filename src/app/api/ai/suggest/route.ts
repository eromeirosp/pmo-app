import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SuggestType =
  | "charter_criteria"
  | "charter_deliverables"
  | "charter_premises"
  | "charter_restrictions"
  | "status_report"
  | "risk_suggest";

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
};

async function getProjectContext(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      risks: true,
      charterItems: true,
      artifacts: true,
      statusReports: { orderBy: { reportDate: "desc" }, take: 3 },
    },
  });

  if (!project) return null;

  const businessCase = project.artifacts.find(
    (a) => a.type === "BUSINESS_CASE"
  );
  const scope = project.artifacts.find(
    (a) => a.type === "ESCOPO_PRELIMINAR"
  );

  return {
    project,
    contextText: `
Nome: ${project.name}
Gerente: ${project.manager}
Orçamento: R$ ${project.budget.toLocaleString("pt-BR")}
Classificação: ${project.classification || "Não definida"}
Problemas: ${project.problems || "Não informado"}
Retornos esperados: ${project.returns || "Não informado"}
Impactos: ${project.impacts || "Não informado"}
Business Case: ${businessCase ? JSON.stringify(businessCase.content) : "Não gerado"}
Escopo Preliminar: ${scope ? JSON.stringify(scope.content) : "Não gerado"}
Riscos existentes: ${project.risks.map((r) => `${r.title || r.description} (P:${r.probability} I:${r.impact})`).join("; ") || "Nenhum"}
Itens do Charter: ${project.charterItems.map((c) => `[${c.type}] ${c.text}`).join("; ") || "Nenhum"}
Últimos Status Reports: ${project.statusReports.map((s) => `${s.period}: ${s.overallStatus} (${s.progress}%)`).join("; ") || "Nenhum"}
    `.trim(),
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

    const ctx = await getProjectContext(projectId);
    if (!ctx) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const isListType = type.startsWith("charter_");
    const isRisk = type === "risk_suggest";

    let responseFormat: string;
    if (isListType) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": ["item 1", "item 2", ...] }`;
    } else if (isRisk) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": [{ "title": "...", "description": "...", "probability": 3, "impact": 4, "category": "...", "mitigation": "...", "contingency": "..." }] }`;
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
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
      });
    }

    let rawText = response.text || "{}";
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
