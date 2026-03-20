import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
  try {
    const data = await req.json();
    const { userName, userEmail, type, description, currentPath, screenshotBase64 } = data;

    if (!userName || !type || !description || !currentPath) {
      return NextResponse.json(
        { error: "Campos obrigatórios: userName, type, description, currentPath" },
        { status: 400 }
      );
    }

    let screenshotUrl: string | null = null;

    if (screenshotBase64) {
      const matches = screenshotBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const fileName = `${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;
        const filePath = path.join(process.cwd(), "public", "uploads", "tickets", fileName);
        await writeFile(filePath, buffer);
        screenshotUrl = `/uploads/tickets/${fileName}`;
      }
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
    console.error("[tickets POST] Error:", error);
    return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 });
  }
}
