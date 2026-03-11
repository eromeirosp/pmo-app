import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const items = await prisma.statusReport.findMany({
      where: { projectId: id },
      orderBy: { reportDate: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching status reports:", error);
    return NextResponse.json({ error: "Erro ao buscar relatórios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      period, overallStatus, scopeStatus, scheduleStatus, budgetStatus,
      progress, budgetSpent, accomplishments, nextSteps, issues, reportDate,
    } = body;

    if (!period?.trim()) {
      return NextResponse.json({ error: "Período obrigatório" }, { status: 400 });
    }

    const item = await prisma.statusReport.create({
      data: {
        projectId: id,
        period: period.trim(),
        overallStatus: overallStatus || "Verde",
        scopeStatus: scopeStatus || "No Escopo",
        scheduleStatus: scheduleStatus || "No Prazo",
        budgetStatus: budgetStatus || "Em Dia",
        progress: typeof progress === "number" ? progress : 0,
        budgetSpent: typeof budgetSpent === "number" ? budgetSpent : null,
        accomplishments: accomplishments || null,
        nextSteps: nextSteps || null,
        issues: issues || null,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
      },
    });

    await recordAuditLog({
      projectId: id,
      action: "CREATE",
      entity: "StatusReport",
      entityId: item.id,
      newValue: JSON.stringify(item),
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating status report:", error);
    return NextResponse.json({ error: "Erro ao criar relatório" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const itemId = new URL(req.url).searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });
    }

    const oldItem = await prisma.statusReport.findUnique({ where: { id: itemId } });
    await prisma.statusReport.delete({ where: { id: itemId, projectId: id } });

    if (oldItem) {
      await recordAuditLog({
        projectId: id,
        action: "DELETE",
        entity: "StatusReport",
        entityId: itemId,
        oldValue: JSON.stringify(oldItem),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting status report:", error);
    return NextResponse.json({ error: "Erro ao excluir relatório" }, { status: 500 });
  }
}
