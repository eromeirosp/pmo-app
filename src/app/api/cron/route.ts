import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function createNotificationIfNew(data: {
    projectId: string | null;
    type: string;
    title: string;
    message: string;
}) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existing = await prisma.notification.findFirst({
        where: {
            type: data.type,
            projectId: data.projectId,
            createdAt: { gte: oneDayAgo },
        },
    });

    if (!existing) {
        await prisma.notification.create({ data });
    }
}

export async function GET(_req: NextRequest) {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let created = 0;

        // 1. Stalled projects (no update in 7 days)
        const stalledProjects = await prisma.project.findMany({
            where: { updatedAt: { lt: sevenDaysAgo } },
        });

        for (const project of stalledProjects) {
            await createNotificationIfNew({
                projectId: project.id,
                type: "STALLED",
                title: "Projeto parado",
                message: `O projeto "${project.name}" não recebe atualizações há mais de 7 dias.`,
            });
            created++;
        }

        // 2. Materialized risks
        const materialisedRisks = await prisma.risk.findMany({
            where: { status: "Ocorrido" },
            include: { project: { select: { id: true, name: true } } },
        });

        for (const risk of materialisedRisks) {
            await createNotificationIfNew({
                projectId: risk.project.id,
                type: "RISK_MATERIALIZED",
                title: "Risco materializado",
                message: `O risco "${risk.description}" ocorreu no projeto "${risk.project.name}".`,
            });
            created++;
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

            if (burnRate >= 0.8) {
                await createNotificationIfNew({
                    projectId: project.id,
                    type: "BUDGET_WARNING",
                    title: "Orçamento em alerta",
                    message: `O projeto "${project.name}" já consumiu ${Math.round(burnRate * 100)}% do orçamento.`,
                });
                created++;
            }
        }

        return NextResponse.json({ success: true, checked: { stalledProjects: stalledProjects.length, materialisedRisks: materialisedRisks.length, budgetProjects: projects.length }, notificationsCreated: created });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Erro ao processar alertas" }, { status: 500 });
    }
}
