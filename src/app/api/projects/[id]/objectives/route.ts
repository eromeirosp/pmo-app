import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await prisma.objective.findMany({
    where: { projectId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Texto obrigatório" }, { status: 400 });

  const count = await prisma.objective.count({ where: { projectId: id } });
  const item = await prisma.objective.create({
    data: { projectId: id, text: text.trim(), order: count },
  });

  await recordAuditLog({
    projectId: id,
    action: "CREATE",
    entity: "Objective",
    entityId: item.id,
    newValue: item.text,
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { itemId, text } = await req.json();
  const item = await prisma.objective.update({
    where: { id: itemId, projectId: id },
    data: { text },
  });

  await recordAuditLog({
    projectId: id,
    action: "UPDATE",
    entity: "Objective",
    entityId: item.id,
    newValue: text,
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  const item = await prisma.objective.findUnique({ where: { id: itemId } });
  await prisma.objective.delete({ where: { id: itemId, projectId: id } });

  if (item) {
    await recordAuditLog({
      projectId: id,
      action: "DELETE",
      entity: "Objective",
      entityId: itemId,
      oldValue: item.text,
    });
  }

  return NextResponse.json({ ok: true });
}
