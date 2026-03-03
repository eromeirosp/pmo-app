import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
    try {
        const data = await req.json();
        const { artifactId, projectId, newContent } = data;

        if (!artifactId || !projectId || !newContent) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        // Capture the current state of the artifact before updating
        const currentArtifact = await prisma.artifact.findUnique({
            where: { id: artifactId },
        });

        if (!currentArtifact) {
            return NextResponse.json({ error: "Artefato não encontrado." }, { status: 404 });
        }

        // Auto-Versioning: save the previous state into ProjectVersion
        await prisma.projectVersion.create({
            data: {
                projectId,
                snapshotData: {
                    artifactId: currentArtifact.id,
                    type: currentArtifact.type,
                    content: currentArtifact.content,
                },
            }
        });

        // Update the Artifact with the new content
        const updatedArtifact = await prisma.artifact.update({
            where: { id: artifactId },
            data: { content: newContent },
        });

        return NextResponse.json(updatedArtifact, { status: 200 });

    } catch (error: any) {
        console.error("Error updating artifact:", error);
        return NextResponse.json({ error: "Erro ao atualizar o documento" }, { status: 500 });
    }
}
