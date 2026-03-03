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
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
        }

        return NextResponse.json(project, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ error: "Erro ao buscar detalhes do projeto" }, { status: 500 });
    }
}
