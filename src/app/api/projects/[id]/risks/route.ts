import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const items = await prisma.risk.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, level, category, responsible, mitigation, contingency, probability, impact, status } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const item = await prisma.risk.create({
    data: {
      projectId: id,
      title: title.trim(),
      description: description || title,
      level: level || "Médio",
      category: category || "Geral",
      responsible: responsible || null,
      mitigation: mitigation || null,
      contingency: contingency || null,
      probability: typeof probability === "number" ? probability : 3,
      impact: typeof impact === "number" ? impact : 3,
      status: status || "IDENTIFIED",
    },
  });

  await recordAuditLog({
    projectId: id,
    action: "CREATE",
    entity: "Risk",
    entityId: item.id,
    newValue: JSON.stringify(item),
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { itemId, ...updates } = body;

  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  const oldItem = await prisma.risk.findUnique({ where: { id: itemId } });

  const item = await prisma.risk.update({
    where: { id: itemId, projectId: id },
    data: {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.level !== undefined && { level: updates.level }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.responsible !== undefined && { responsible: updates.responsible }),
      ...(updates.mitigation !== undefined && { mitigation: updates.mitigation }),
      ...(updates.contingency !== undefined && { contingency: updates.contingency }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.probability !== undefined && { probability: updates.probability }),
      ...(updates.impact !== undefined && { impact: updates.impact }),
    },
  });

  await recordAuditLog({
    projectId: id,
    action: "UPDATE",
    entity: "Risk",
    entityId: item.id,
    oldValue: JSON.stringify(oldItem),
    newValue: JSON.stringify(item),
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  // Get item before deletion for audit log
  const oldItem = await prisma.risk.findUnique({
    where: { id: itemId }
  });

  await prisma.risk.delete({ where: { id: itemId, projectId: id } });

  if (oldItem) {
    await recordAuditLog({
      projectId: id,
      action: "DELETE",
      entity: "Risk",
      entityId: itemId,
      oldValue: JSON.stringify(oldItem),
    });
  }

  return NextResponse.json({ ok: true });
}

