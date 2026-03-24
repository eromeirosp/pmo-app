import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/ai-sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Pergunta é obrigatória" },
        { status: 400 }
      );
    }

    const sanitizedQuestion = sanitizeForPrompt(question, 1000);

    // Fetch all portfolio data
    const projects = await prisma.project.findMany({
      include: {
        risks: true,
        statusReports: { orderBy: { reportDate: "desc" }, take: 2 },
        eapItems: true,
        budgetEntries: true,
        stakeholdersList: true,
        decisions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    // Build rich context
    const portfolioContext = projects.map((p) => {
      const totalSpent = p.budgetEntries
        .filter((b) => b.type === "EXPENSE")
        .reduce((sum, b) => sum + b.amount, 0);

      const eapDone = p.eapItems.filter((e) => e.status === "DONE").length;
      const eapTotal = p.eapItems.filter((e) => !e.parentId).length;

      const latestReport = p.statusReports[0];

      return `
Projeto: ${p.name}
  ID: ${p.id}
  Gerente: ${p.manager}
  Departamento: ${p.department || "N/A"}
  Status: ${p.status}${p.statusOverride ? ` (Sobrescrito: ${p.statusOverride}, Razão: ${p.statusOverrideReason})` : ""}
  Classificação: ${p.classification || "N/A"}
  Orçamento: R$ ${p.budget.toLocaleString("pt-BR")}
  Gasto: R$ ${totalSpent.toLocaleString("pt-BR")} (${p.budget > 0 ? ((totalSpent / p.budget) * 100).toFixed(0) : 0}%)
  ROI Esperado: ${p.expectedReturn ? `R$ ${p.expectedReturn.toLocaleString("pt-BR")}` : "N/A"}
  Data Início: ${p.startDate ? new Date(p.startDate).toLocaleDateString("pt-BR") : "N/A"}
  Data Fim: ${p.endDate ? new Date(p.endDate).toLocaleDateString("pt-BR") : "N/A"}
  EAP: ${eapDone}/${eapTotal} pacotes concluídos
  Riscos: ${p.risks.length} (${p.risks.filter((r) => r.probability * r.impact >= 12).length} críticos)
  Stakeholders: ${p.stakeholdersList.map((s) => s.name).join(", ") || "Nenhum"}
  Último Status Report: ${latestReport ? `${latestReport.period} — ${latestReport.overallStatus}, Progresso: ${latestReport.progress}%` : "Nenhum"}
  Decisões recentes: ${p.decisions.map((d) => d.description).join("; ") || "Nenhuma"}`.trim();
    });

    const summaryStats = {
      total: projects.length,
      green: projects.filter((p) => p.status === "GREEN").length,
      yellow: projects.filter((p) => p.status === "YELLOW").length,
      red: projects.filter((p) => p.status === "RED").length,
      totalBudget: projects.reduce((s, p) => s + p.budget, 0),
      totalRisks: projects.reduce((s, p) => s + p.risks.length, 0),
    };

    const prompt = `Você é o Assistente de Portfólio IA de um PMO corporativo. Responda a pergunta do usuário com base nos dados REAIS dos projetos abaixo.

Diretrizes:
- Responda em português brasileiro, de forma profissional mas acessível
- Use dados concretos: nomes de projetos, valores, percentuais
- Quando relevante, inclua recomendações baseadas em boas práticas de PMO
- Formate a resposta em Markdown para boa legibilidade
- Se a pergunta não puder ser respondida com os dados disponíveis, diga claramente
- Seja conciso mas completo

Resumo do Portfólio:
- ${summaryStats.total} projetos no total
- Status: ${summaryStats.green} verde, ${summaryStats.yellow} amarelo, ${summaryStats.red} vermelho
- Orçamento total: R$ ${summaryStats.totalBudget.toLocaleString("pt-BR")}
- Total de riscos: ${summaryStats.totalRisks}

Dados Detalhados dos Projetos:
${portfolioContext.join("\n\n")}

Pergunta do usuário: ${sanitizedQuestion}

Responda em Markdown. Não use blocos de código JSON.`;

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

    const text = response.text || "";
    if (!text) {
      return NextResponse.json(
        { error: "IA não retornou conteúdo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer: text });
  } catch (error) {
    const err = error as Error;
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
