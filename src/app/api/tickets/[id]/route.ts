import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_STATUSES = ["Backlog", "Em Análise", "Priorizado", "Em Execução", "Concluído"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      if (!VALID_STATUSES.includes(data.status)) {
        return NextResponse.json(
          { error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = data.status;
    }

    if (data.toggleLike) {
      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) {
        return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
      }
      const userName = data.toggleLike;
      const likes = ticket.likes || [];
      if (likes.includes(userName)) {
        updateData.likes = likes.filter((l: string) => l !== userName);
      } else {
        updateData.likes = [...likes, userName];
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[tickets PATCH] Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar ticket" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tickets DELETE] Error:", error);
    return NextResponse.json({ error: "Erro ao excluir ticket" }, { status: 500 });
  }
}
