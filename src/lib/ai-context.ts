import prisma from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/ai-sanitize";
import { formatCurrency } from "@/lib/format";

/**
 * Busca o contexto completo de um projeto para uso em prompts de IA.
 * Reutilizado por /api/ai/suggest e /api/projects/[id]/documents/generate.
 */
export async function getProjectContext(projectId: string, enriched = false) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      risks: true,
      charterItems: true,
      artifacts: true,
      eapItems: true,
      stakeholdersList: true,
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

  let contextText = `
Nome: ${sanitizeForPrompt(project.name, 500)}
Gerente: ${sanitizeForPrompt(project.manager, 500)}
Orçamento: ${formatCurrency(project.budget, project.currency || "BRL")}
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

  if (project.eapItems && project.eapItems.length > 0) {
    contextText += `\nEAP atual: ${project.eapItems.map((e) => `${sanitizeForPrompt(e.name, 200)} [${e.status}]${e.parentId ? ` (filho de ${project.eapItems.find(p => p.id === e.parentId)?.name || e.parentId})` : ""}`).join("; ")}`;
  }

  if (project.stakeholdersList && project.stakeholdersList.length > 0) {
    contextText += `\nStakeholders: ${project.stakeholdersList.map((s) => `${sanitizeForPrompt(s.name, 100)}${s.role ? ` (${sanitizeForPrompt(s.role, 100)})` : ""}`).join("; ")}`;
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
