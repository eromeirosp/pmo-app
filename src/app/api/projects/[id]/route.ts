import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID do projeto não fornecido" }, { status: 400 });
        }


        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                artifacts: {
                    orderBy: { createdAt: 'asc' }
                },
                risks: true,
                versions: true,
                eapItems: { select: { status: true, dependsOn: true } },
                statusReports: { orderBy: { reportDate: "desc" }, take: 1, select: { overallStatus: true, budgetSpent: true } },
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        // Compute suggested status based on project data
        const signals: string[] = [];

        // 1. EAP signals
        const eapItems = (project as any).eapItems || [];
        if (eapItems.length > 0) {
            const doneCount = eapItems.filter((i: any) => i.status === "DONE").length;
            const inProgressCount = eapItems.filter((i: any) => i.status === "IN_PROGRESS").length;
            if (inProgressCount > 0 && doneCount === 0 && eapItems.length > 3) {
                signals.push("YELLOW"); // lots of WIP, no deliveries
            }
        }

        // 2. Risk signals
        const risks = project.risks || [];
        for (const risk of risks) {
            const score = risk.probability * risk.impact;
            if (risk.status === "Ocorrido" && score >= 16) signals.push("RED");
            else if (risk.status === "Ocorrido" && score >= 10) signals.push("YELLOW");
        }

        // 3. Latest status report signal
        const lastReport = (project as any).statusReports?.[0];
        if (lastReport?.overallStatus) {
            const statusMap: Record<string, string> = { "Verde": "GREEN", "Amarelo": "YELLOW", "Vermelho": "RED" };
            const mapped = statusMap[lastReport.overallStatus];
            if (mapped) signals.push(mapped);
        }

        // 4. Budget signal
        if (lastReport?.budgetSpent && project.budget > 0) {
            const ratio = lastReport.budgetSpent / project.budget;
            if (ratio > 0.9) signals.push("RED");
            else if (ratio > 0.75) signals.push("YELLOW");
        }

        // Worst status wins
        let computedStatus = "GREEN";
        if (signals.includes("RED")) computedStatus = "RED";
        else if (signals.includes("YELLOW")) computedStatus = "YELLOW";

        // Effective status: override takes priority over computed
        const effectiveStatus = (project as any).statusOverride || computedStatus;

        // Strip helper relations from response, add computedStatus + effectiveStatus
        const { eapItems: _, statusReports: __, ...projectData } = project as any;

        return NextResponse.json({ ...projectData, computedStatus, effectiveStatus }, { status: 200 });

    } catch (error) {
        const err = error as Error;
        console.error("Error fetching project:", err);
        return NextResponse.json({ error: "Erro ao buscar detalhes do projeto" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const data = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID do projeto não fornecido" }, { status: 400 });
        }

        // Fetch current project for audit comparison
        const currentProject = await prisma.project.findUnique({ where: { id } });
        if (!currentProject) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        const updateData: any = {
            name: data.name,
            description: data.description,
            manager: data.manager,
            stakeholders: data.stakeholders,
            department: data.department,
            classification: data.classification,
            status: data.status,
            budget: data.budget ? parseFloat(data.budget.toString().replace(/[^\d.]/g, '')) : undefined,
            startDate: data.startDate ? new Date(data.startDate + 'T00:00:00.000Z') : undefined,
            endDate: data.endDate ? new Date(data.endDate + 'T00:00:00.000Z') : undefined,
        };

        if (typeof data.charterApproved === "boolean") {
            updateData.charterApproved = data.charterApproved;
            updateData.charterApprovedAt = data.charterApproved ? new Date() : null;
        }

        // Status override: allow setting or clearing
        if (data.statusOverride !== undefined) {
            updateData.statusOverride = data.statusOverride || null;
            updateData.statusOverrideReason = data.statusOverrideReason || null;
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: updateData
        });

        // Audit log for changed fields
        const auditFields = ["name", "status", "classification", "manager", "department", "charterApproved", "statusOverride", "statusOverrideReason"] as const;
        for (const field of auditFields) {
            const oldVal = String(currentProject[field] ?? "");
            const newVal = String(updatedProject[field] ?? "");
            if (oldVal !== newVal) {
                await recordAuditLog({ projectId: id, action: "UPDATE", entity: "Project", entityId: id, field, oldValue: oldVal, newValue: newVal });
            }
        }
        // Budget (compare as numbers)
        if (currentProject.budget !== updatedProject.budget) {
            await recordAuditLog({ projectId: id, action: "UPDATE", entity: "Project", entityId: id, field: "budget", oldValue: String(currentProject.budget), newValue: String(updatedProject.budget) });
        }

        return NextResponse.json(updatedProject, { status: 200 });

    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID do projeto não fornecido" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        await prisma.project.delete({ where: { id } });

        return NextResponse.json({ ok: true, message: "Projeto excluído com sucesso" });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ error: "Erro ao excluir projeto" }, { status: 500 });
    }
}
