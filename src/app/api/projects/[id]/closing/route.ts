import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// type: DELIVERABLE | LESSON | RECOMMENDATION
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const type = new URL(req.url).searchParams.get("type");
  const where = type ? { projectId: id, type } : { projectId: id };
  const items = await prisma.closingItem.findMany({ where, orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { type, text } = await req.json();
  if (!text?.trim() || !type) return NextResponse.json({ error: "type e text são obrigatórios" }, { status: 400 });

  const item = await prisma.closingItem.create({ data: { projectId: id, type, text: text.trim() } });
  
  await recordAuditLog({
    projectId: id,
    action: "CREATE",
    entity: `CLOSING_${type}`,
    entityId: item.id,
    newValue: text.trim(),
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  // Get item before deletion to record in audit log
  const item = await prisma.closingItem.findUnique({
    where: { id: itemId, projectId: id }
  });

  if (item) {
    await prisma.closingItem.delete({ where: { id: itemId, projectId: id } });
    
    await recordAuditLog({
      projectId: id,
      action: "DELETE",
      entity: `CLOSING_${item.type}`,
      entityId: itemId,
      oldValue: item.text,
    });
  }

  return NextResponse.json({ ok: true });
}

