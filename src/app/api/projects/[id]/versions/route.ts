import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const versions = await prisma.projectVersion.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error("Error fetching versions:", error);
        return NextResponse.json({ error: "Erro ao buscar versões" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const versionId = searchParams.get("versionId");

        if (!versionId) {
            return NextResponse.json({ error: "versionId é obrigatório" }, { status: 400 });
        }

        const version = await prisma.projectVersion.findUnique({ where: { id: versionId } });
        if (!version || version.projectId !== id) {
            return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
        }

        const snapshot = version.snapshotData as { artifactId: string; type: string; content: unknown };
        if (!snapshot?.artifactId) {
            return NextResponse.json({ error: "Dados da versão inválidos" }, { status: 400 });
        }

        const currentArtifact = await prisma.artifact.findUnique({ where: { id: snapshot.artifactId } });
        if (!currentArtifact) {
            return NextResponse.json({ error: "Artefato original não encontrado" }, { status: 404 });
        }

        // Save current state before rollback (non-destructive)
        await prisma.projectVersion.create({
            data: {
                projectId: id,
                label: `Antes de restaurar ${currentArtifact.type}`,
                artifactType: currentArtifact.type,
                snapshotData: {
                    artifactId: currentArtifact.id,
                    type: currentArtifact.type,
                    content: currentArtifact.content,
                },
            },
        });

        // Rollback: restore the artifact content
        await prisma.artifact.update({
            where: { id: snapshot.artifactId },
            data: { content: snapshot.content as object },
        });

        await recordAuditLog({
            projectId: id,
            action: "UPDATE",
            entity: "Artifact",
            entityId: snapshot.artifactId,
            field: "content",
            oldValue: "estado atual",
            newValue: `restaurado da versão ${versionId}`,
        });

        return NextResponse.json({ ok: true, message: "Versão restaurada com sucesso" });
    } catch (error) {
        console.error("Error rolling back version:", error);
        return NextResponse.json({ error: "Erro ao restaurar versão" }, { status: 500 });
    }
}
