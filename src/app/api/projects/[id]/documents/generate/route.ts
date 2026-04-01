import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { getProjectContext } from "@/lib/ai-context";
import { DOCUMENT_PROMPTS, DOCUMENT_CATALOG, DocumentType } from "@/lib/ai-document-prompts";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: projectId } = await params;
    const { documentType } = await req.json();

    if (!documentType || !(documentType in DOCUMENT_PROMPTS)) {
      return NextResponse.json(
        { error: `Tipo de documento inválido: ${documentType}` },
        { status: 400 }
      );
    }

    const docType = documentType as DocumentType;
    const catalogEntry = DOCUMENT_CATALOG.find((d) => d.type === docType);

    const ctx = await getProjectContext(projectId, true);
    if (!ctx) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Você é um PMO Master especialista em gestão de projetos corporativos com profundo conhecimento do PMBoK, PRINCE2 e metodologias ágeis.

${DOCUMENT_PROMPTS[docType]}

Contexto do Projeto:
${ctx.contextText}

IMPORTANTE:
- Gere o documento COMPLETO em formato Markdown
- Use os dados reais do projeto fornecidos acima
- Onde não houver dados específicos, gere conteúdo profissional e coerente
- NÃO retorne JSON — retorne apenas o documento em Markdown puro
- NÃO inclua introdução, saudação, comentário ou qualquer texto conversacional — comece diretamente com o título do documento
- NÃO use tags HTML como <br>, <p>, <div> etc. — use apenas Markdown puro (linhas em branco para espaçamento)
- Para campos de data/assinatura, use: **Data:** (DD/MM/AAAA)
- Use tabelas Markdown quando apropriado
- Seja detalhado e profissional`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: { maxOutputTokens: 16384 },
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 16384 },
      });
    }

    let content = "";
    try {
      content = response.text || "";
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA" },
        { status: 500 }
      );
    }

    // Remove markdown code fences if present
    content = content.replace(/^```(?:markdown)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    // Remove possible intro/conversational text before the first heading
    const firstHeading = content.indexOf("\n#");
    if (firstHeading > 0 && firstHeading < 500) {
      content = content.substring(firstHeading + 1).trim();
    }

    if (!content) {
      return NextResponse.json(
        { error: "IA retornou conteúdo vazio" },
        { status: 500 }
      );
    }

    // Check if artifact already exists for this document type
    const existingArtifact = await prisma.artifact.findFirst({
      where: { projectId, type: docType },
    });

    let artifact;
    if (existingArtifact) {
      // Save version before overwriting
      await prisma.projectVersion.create({
        data: {
          projectId,
          label: `Antes de regenerar ${catalogEntry?.label || docType}`,
          artifactType: docType,
          snapshotData: {
            artifactId: existingArtifact.id,
            type: existingArtifact.type,
            content: existingArtifact.content,
          },
        },
      });

      artifact = await prisma.artifact.update({
        where: { id: existingArtifact.id },
        data: { content: { text: content } },
      });
    } else {
      artifact = await prisma.artifact.create({
        data: {
          projectId,
          type: docType,
          content: { text: content },
        },
      });
    }

    return NextResponse.json({
      id: artifact.id,
      type: artifact.type,
      content: { text: content },
      label: catalogEntry?.label || docType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[documents/generate] Error:", message);
    return NextResponse.json(
      { error: `Erro ao gerar documento: ${message}` },
      { status: 500 }
    );
  }
}
