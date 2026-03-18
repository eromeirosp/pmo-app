import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            select: { budget: true },
        });

        if (!project) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        const entries = await prisma.budgetEntry.findMany({
            where: { projectId: id },
            orderBy: { date: "desc" },
        });

        const totalSpent = entries
            .filter((e) => e.type === "EXPENSE")
            .reduce((sum, e) => sum + e.amount, 0);

        const totalAdjustments = entries
            .filter((e) => e.type === "ADJUSTMENT")
            .reduce((sum, e) => sum + e.amount, 0);

        const effectiveSpent = totalSpent + totalAdjustments;
        const remaining = project.budget - effectiveSpent;
        const burnRate = project.budget > 0 ? effectiveSpent / project.budget : 0;

        const byCategory: Record<string, number> = {};
        for (const entry of entries) {
            const cat = entry.category || "Outros";
            byCategory[cat] = (byCategory[cat] || 0) + entry.amount;
        }

        return NextResponse.json({
            entries,
            summary: {
                totalBudget: project.budget,
                totalSpent: effectiveSpent,
                remaining,
                burnRate,
                byCategory,
            },
        });
    } catch (error) {
        console.error("Error fetching budget entries:", error);
        return NextResponse.json({ error: "Erro ao buscar lançamentos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await req.json();

        if (!data.description?.trim() || !data.amount) {
            return NextResponse.json({ error: "Descrição e valor são obrigatórios" }, { status: 400 });
        }

        const entry = await prisma.budgetEntry.create({
            data: {
                projectId: id,
                description: data.description.trim(),
                amount: parseFloat(data.amount),
                type: data.type || "EXPENSE",
                category: data.category || null,
                date: data.date ? new Date(data.date) : new Date(),
            },
        });

        await recordAuditLog({
            projectId: id,
            action: "CREATE",
            entity: "BudgetEntry",
            entityId: entry.id,
            field: "amount",
            newValue: `${entry.type}: R$ ${entry.amount} - ${entry.description}`,
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error("Error creating budget entry:", error);
        return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const entryId = searchParams.get("entryId");

        if (!entryId) {
            return NextResponse.json({ error: "entryId é obrigatório" }, { status: 400 });
        }

        const entry = await prisma.budgetEntry.findUnique({ where: { id: entryId } });
        if (!entry || entry.projectId !== id) {
            return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
        }

        await prisma.budgetEntry.delete({ where: { id: entryId } });

        await recordAuditLog({
            projectId: id,
            action: "DELETE",
            entity: "BudgetEntry",
            entityId: entryId,
            field: "amount",
            oldValue: `${entry.type}: R$ ${entry.amount} - ${entry.description}`,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting budget entry:", error);
        return NextResponse.json({ error: "Erro ao excluir lançamento" }, { status: 500 });
    }
}
