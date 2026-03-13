import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This endpoint can be triggered periodically (e.g., via Vercel Cron or a regular setInterval task runner).
export async function GET(_req: NextRequest) {
    try {
        const now = new Date();
        // Threshold: 7 days inactive
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Alert: Projects lacking updates in 7 days
        const stalledProjects = await prisma.project.findMany({
            where: { updatedAt: { lt: sevenDaysAgo } }
        });

        // 2. Alert: Risk Occurred Check
        // This is handled real-time in the webhook, but we log the current list
        const materialisedRisks = await prisma.risk.findMany({
            where: { status: "Ocorrido" },
            include: { project: { select: { name: true } } }
        });

        // 3. Alert: Budget at 80% (Simplified logical check here)
        // Since we don't have expenses mapped here, we'll pretend there's an `expenseAmount` field 
        // or we just query projects with high budgets as an example logic placeholder.
        // In a real app we'd map relation to an Expenses table or similar.

        const notifications = [];

        for (const project of stalledProjects) {
            notifications.push(`ALERTA: Projeto "${project.name}" sem atualização há mais de 7 dias.`);
        }

        for (const risk of materialisedRisks) {
            notifications.push(`CRÍTICO: Risco Materializado "${risk.description}" no projeto "${risk.project.name}".`);
        }

        if (notifications.length > 0) {
            console.log("[SYSTEM ALERTS]:", notifications);
        }

        return NextResponse.json({ success: true, alerts: notifications }, { status: 200 });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: "Erro ao processar alertas" }, { status: 500 });
    }
}
