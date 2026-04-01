import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("[tickets GET] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição" }, { status: 400 });
  }

  try {
    const { userName, userEmail, type, description, currentPath, screenshotBase64 } = data as {
      userName?: string;
      userEmail?: string;
      type?: string;
      description?: string;
      currentPath?: string;
      screenshotBase64?: string;
    };

    if (
      typeof userName !== "string" || !userName.trim() ||
      typeof type !== "string" || !type.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof currentPath !== "string" || !currentPath.trim()
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: userName, type, description, currentPath (todos devem ser strings não-vazias)" },
        { status: 400 }
      );
    }

    const VALID_TYPES = ["BUG", "IMPROVEMENT", "FEATURE"];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Valores aceitos: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "Descrição muito longa. Máximo 5000 caracteres." },
        { status: 400 }
      );
    }

    // Store screenshot as base64 data URI directly in the database
    // This works on Vercel (serverless has read-only filesystem)
    let screenshotUrl: string | null = null;
    if (screenshotBase64) {
      if (!/^data:image\/(png|jpeg|jpg|webp);base64,.+$/.test(screenshotBase64)) {
        return NextResponse.json(
          { error: "Formato de imagem inválido. Use PNG, JPEG ou WebP." },
          { status: 400 }
        );
      }
      // Limit screenshot size to ~5MB (base64 is ~33% larger than binary)
      const MAX_BASE64_LENGTH = 7_000_000;
      if (screenshotBase64.length > MAX_BASE64_LENGTH) {
        return NextResponse.json(
          { error: "Imagem muito grande. Máximo ~5MB." },
          { status: 400 }
        );
      }
      screenshotUrl = screenshotBase64;
    }

    const ticket = await prisma.ticket.create({
      data: {
        userName,
        userEmail: userEmail || null,
        type,
        description,
        currentPath,
        screenshotUrl,
        status: "Backlog",
        likes: [],
        comments: [],
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[tickets POST] Error:", message);
    return NextResponse.json({ error: `Erro ao criar ticket: ${message}` }, { status: 500 });
  }
}
