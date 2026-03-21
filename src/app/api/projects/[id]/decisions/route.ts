import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const decisions = await prisma.decision.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(decisions);
  } catch (error) {
    console.error("[decisions GET] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar decisões" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { description, madeBy, context } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      );
    }

    const decision = await prisma.decision.create({
      data: {
        projectId: id,
        description,
        madeBy: madeBy || null,
        context: context || null,
      },
    });

    await recordAuditLog({
      projectId: id,
      action: "CREATE",
      entity: "Decision",
      entityId: decision.id,
      newValue: description,
    });

    return NextResponse.json(decision, { status: 201 });
  } catch (error) {
    console.error("[decisions POST] Error:", error);
    return NextResponse.json(
      { error: "Erro ao criar decisão" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId é obrigatório" },
        { status: 400 }
      );
    }

    const decision = await prisma.decision.delete({
      where: { id: itemId },
    });

    await recordAuditLog({
      projectId: id,
      action: "DELETE",
      entity: "Decision",
      entityId: itemId,
      oldValue: decision.description,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[decisions DELETE] Error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir decisão" },
      { status: 500 }
    );
  }
}
