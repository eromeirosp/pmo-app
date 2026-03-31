import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID do projeto não fornecido" }, { status: 400 });
        }

        const { type, content } = await req.json();

        if (!type || content === undefined) {
            return NextResponse.json({ error: "type e content são obrigatórios" }, { status: 400 });
        }

        const existing = await prisma.artifact.findFirst({
            where: { projectId: id, type },
        });

        const artifact = existing
            ? await prisma.artifact.update({
                where: { id: existing.id },
                data: { content },
            })
            : await prisma.artifact.create({
                data: { projectId: id, type, content },
            });

        return NextResponse.json(artifact);
    } catch (error) {
        console.error("[Artifacts Upsert] Error:", error);
        return NextResponse.json({ error: "Erro ao salvar artifact" }, { status: 500 });
    }
}
