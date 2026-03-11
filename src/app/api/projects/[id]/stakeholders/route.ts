import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await prisma.stakeholder.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { name, role, email, interest, influence } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const item = await prisma.stakeholder.create({
    data: { projectId: id, name, role: role || "", email, interest: interest || "Médio", influence: influence || "Média" },
  });

  await recordAuditLog({
    projectId: id,
    action: "CREATE",
    entity: "Stakeholder",
    entityId: item.id,
    newValue: JSON.stringify(item),
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { itemId, ...updates } = await req.json();

  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  const oldItem = await prisma.stakeholder.findUnique({ where: { id: itemId } });

  const item = await prisma.stakeholder.update({
    where: { id: itemId, projectId: id },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.interest !== undefined && { interest: updates.interest }),
      ...(updates.influence !== undefined && { influence: updates.influence }),
    },
  });

  await recordAuditLog({
    projectId: id,
    action: "UPDATE",
    entity: "Stakeholder",
    entityId: item.id,
    oldValue: JSON.stringify(oldItem),
    newValue: JSON.stringify(item),
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  const item = await prisma.stakeholder.findUnique({ where: { id: itemId } });
  await prisma.stakeholder.delete({ where: { id: itemId, projectId: id } });

  if (item) {
    await recordAuditLog({
      projectId: id,
      action: "DELETE",
      entity: "Stakeholder",
      entityId: itemId,
      oldValue: JSON.stringify(item),
    });
  }

  return NextResponse.json({ ok: true });
}
