import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Check if digest was requested
        const { searchParams } = new URL(req.url);
        const generateDigest = searchParams.get("digest") === "true";

        // Fetch all recent notifications in one query to check for duplicates
        const recentNotifications = await prisma.notification.findMany({
            where: { createdAt: { gte: oneDayAgo } },
            select: { projectId: true, type: true },
        });
        const existingSet = new Set(
            recentNotifications.map((n) => `${n.projectId}:${n.type}`)
        );

        const pending: { projectId: string | null; type: string; title: string; message: string }[] = [];

        // 1. Stalled projects (no update in 7 days)
        const stalledProjects = await prisma.project.findMany({
            where: { updatedAt: { lt: sevenDaysAgo } },
        });

        for (const project of stalledProjects) {
            if (!existingSet.has(`${project.id}:STALLED`)) {
                pending.push({
                    projectId: project.id,
                    type: "STALLED",
                    title: "Projeto parado",
                    message: `O projeto "${project.name}" não recebe atualizações há mais de 7 dias.`,
                });
            }
        }

        // 2. Materialized risks
        const materialisedRisks = await prisma.risk.findMany({
            where: { status: "Ocorrido" },
            include: { project: { select: { id: true, name: true } } },
        });

        for (const risk of materialisedRisks) {
            if (!existingSet.has(`${risk.project.id}:RISK_MATERIALIZED`)) {
                pending.push({
                    projectId: risk.project.id,
                    type: "RISK_MATERIALIZED",
                    title: "Risco materializado",
                    message: `O risco "${risk.description}" ocorreu no projeto "${risk.project.name}".`,
                });
            }
        }

        // 3. Budget > 80%
        const projects = await prisma.project.findMany({
            where: { budget: { gt: 0 } },
            include: { budgetEntries: true },
        });

        for (const project of projects) {
            const totalSpent = project.budgetEntries
                .filter((e) => e.type === "EXPENSE")
                .reduce((sum, e) => sum + e.amount, 0);
            const adjustments = project.budgetEntries
                .filter((e) => e.type === "ADJUSTMENT")
                .reduce((sum, e) => sum + e.amount, 0);
            const effectiveSpent = totalSpent + adjustments;
            const burnRate = effectiveSpent / project.budget;

            if (burnRate >= 0.8 && !existingSet.has(`${project.id}:BUDGET_WARNING`)) {
                pending.push({
                    projectId: project.id,
                    type: "BUDGET_WARNING",
                    title: "Orçamento em alerta",
                    message: `O projeto "${project.name}" já consumiu ${Math.round(burnRate * 100)}% do orçamento.`,
                });
            }
        }

        // Batch insert all new notifications
        if (pending.length > 0) {
            await prisma.notification.createMany({ data: pending });
        }

        // 4. Weekly Digest (only when ?digest=true)
        let digestCreated = false;
        if (generateDigest) {
            // Check if a digest was already created this week
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const existingDigest = await prisma.notification.findFirst({
                where: { type: "WEEKLY_DIGEST", createdAt: { gte: weekAgo } },
            });

            if (!existingDigest) {
                const digest = await generateWeeklyDigest();
                if (digest) {
                    await prisma.notification.create({
                        data: {
                            projectId: null,
                            type: "WEEKLY_DIGEST",
                            title: "Resumo Semanal do Portfólio",
                            message: digest,
                        },
                    });
                    digestCreated = true;
                }
            }
        }

        return NextResponse.json({
            success: true,
            checked: {
                stalledProjects: stalledProjects.length,
                materialisedRisks: materialisedRisks.length,
                budgetProjects: projects.length,
            },
            notificationsCreated: pending.length,
            digestCreated,
        });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Erro ao processar alertas" }, { status: 500 });
    }
}

async function generateWeeklyDigest(): Promise<string | null> {
    try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Fetch recent changes
        const allProjects = await prisma.project.findMany({
            include: {
                risks: { where: { createdAt: { gte: weekAgo } } },
                statusReports: { where: { createdAt: { gte: weekAgo } }, orderBy: { reportDate: "desc" } },
                decisions: { where: { createdAt: { gte: weekAgo } } },
                eapItems: { where: { updatedAt: { gte: weekAgo } } },
                budgetEntries: { where: { createdAt: { gte: weekAgo } } },
            },
        });

        const recentProjects = await prisma.project.findMany({
            where: { createdAt: { gte: weekAgo } },
            select: { name: true },
        });

        // Build context for AI
        const changes: string[] = [];

        if (recentProjects.length > 0) {
            changes.push(`Novos projetos: ${recentProjects.map((p) => p.name).join(", ")}`);
        }

        for (const p of allProjects) {
            const projectChanges: string[] = [];
            if (p.statusReports.length > 0) projectChanges.push(`${p.statusReports.length} relatório(s) de status`);
            if (p.risks.length > 0) projectChanges.push(`${p.risks.length} risco(s) novo(s)`);
            if (p.decisions.length > 0) projectChanges.push(`${p.decisions.length} decisão(ões)`);
            if (p.eapItems.length > 0) projectChanges.push(`${p.eapItems.length} item(ns) EAP atualizado(s)`);
            if (p.budgetEntries.length > 0) projectChanges.push(`${p.budgetEntries.length} movimentação(ões) financeira(s)`);

            if (projectChanges.length > 0) {
                changes.push(`${p.name} (${p.status}): ${projectChanges.join(", ")}`);
            }
        }

        if (changes.length === 0) {
            return "Sem movimentações significativas no portfólio esta semana.";
        }

        // Summary stats
        const statusCounts = { GREEN: 0, YELLOW: 0, RED: 0 };
        for (const p of allProjects) {
            if (p.status in statusCounts) statusCounts[p.status as keyof typeof statusCounts]++;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Você é um PMO executivo. Gere um resumo semanal CONCISO do portfólio de projetos em Markdown.

Dados do portfólio:
- Total: ${allProjects.length} projetos (${statusCounts.GREEN} verde, ${statusCounts.YELLOW} amarelo, ${statusCounts.RED} vermelho)

Mudanças da semana:
${changes.join("\n")}

Gere um resumo em Markdown com:
1. **Destaque da semana** — O fato mais relevante em 1 frase
2. **Movimentações** — Lista curta das mudanças mais importantes (max 5 items)
3. **Pontos de atenção** — Projetos que merecem atenção especial (se houver)
4. **Recomendação** — 1 ação recomendada para a próxima semana

Seja direto, profissional e conciso. Máximo 200 palavras.`;

        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
        } catch {
            return `## Resumo Semanal\n\nPortfólio: ${allProjects.length} projetos (${statusCounts.GREEN}🟢 ${statusCounts.YELLOW}🟡 ${statusCounts.RED}🔴)\n\n**Movimentações:** ${changes.slice(0, 5).join(" | ")}`;
        }

        return response.text || null;
    } catch (error) {
        console.error("Weekly digest error:", error);
        return null;
    }
}
