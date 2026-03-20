import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

interface TicketComment {
  id: string;
  userName: string;
  text: string;
  createdAt: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { userName, text } = data;

    if (!userName || !text) {
      return NextResponse.json(
        { error: "Campos obrigatórios: userName, text" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
    }

    const existingComments = (ticket.comments as unknown as TicketComment[]) || [];
    const newComment: TicketComment = {
      id: randomUUID(),
      userName,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...existingComments, newComment].map((c) => ({
      id: c.id,
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt,
    }));

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        comments: updatedComments,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[tickets comment POST] Error:", error);
    return NextResponse.json({ error: "Erro ao adicionar comentário" }, { status: 500 });
  }
}
