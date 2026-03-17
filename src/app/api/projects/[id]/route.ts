import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
                charterItems: true,
                statusReports: true,
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        return NextResponse.json(project, { status: 200 });

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

        const updateData: Record<string, string | number | Date | undefined> = {
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
            charterApproved: data.charterApproved !== undefined ? data.charterApproved : undefined,
            charterApprovedAt: data.charterApproved !== undefined ? (data.charterApproved ? new Date() : null) : undefined,
        };

        const updatedProject = await prisma.project.update({
            where: { id },
            data: updateData
        });

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
