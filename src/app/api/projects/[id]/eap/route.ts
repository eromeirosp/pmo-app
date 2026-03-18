import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const items = await prisma.eAPItem.findMany({
      where: { projectId: id },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" }
      ],
    });
    return NextResponse.json(items);
  } catch (error) {
    const err = error as Error;
    console.error("EAP GET Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { name, description, parentId, status, order } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    // If no order provided, put it at the end of its sibling group
    let finalOrder = order;
    if (order === undefined) {
      const lastItem = await prisma.eAPItem.findFirst({
        where: { projectId: id, parentId: parentId || null },
        orderBy: { order: "desc" },
      });
      finalOrder = (lastItem?.order || 0) + 1000;
    }

    const item = await prisma.eAPItem.create({
      data: {
        projectId: id,
        name: name.trim(),
        description,
        parentId,
        status: status || "PENDING",
        order: finalOrder,
        dependsOn: [],
      },
    });
    await recordAuditLog({ projectId: id, action: "CREATE", entity: "EAPItem", entityId: item.id, newValue: name.trim() });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error("EAP POST Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  // Single item update (status, name, description, dependsOn)
  if (body.itemId) {
    const { itemId, status, name, description, dependsOn } = body;
    const current = await prisma.eAPItem.findUnique({ where: { id: itemId } });
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (dependsOn !== undefined) data.dependsOn = dependsOn;

    // If changing to DONE, validate that all dependencies are DONE
    if (status !== undefined) {
      if (status === "DONE") {
        const item = await prisma.eAPItem.findUnique({ where: { id: itemId } });
        if (item && item.dependsOn.length > 0) {
          const deps = await prisma.eAPItem.findMany({
            where: { id: { in: item.dependsOn }, projectId: id },
            select: { id: true, name: true, status: true },
          });
          const notDone = deps.filter((d) => d.status !== "DONE");
          if (notDone.length > 0) {
            return NextResponse.json(
              {
                error: "Dependências não concluídas",
                blockedBy: notDone.map((d) => d.name),
              },
              { status: 422 }
            );
          }
        }
      }
      data.status = status;
    }

    const updated = await prisma.eAPItem.update({
      where: { id: itemId, projectId: id },
      data,
    });
    // Audit log for tracked changes
    if (current) {
      if (status !== undefined && status !== current.status) {
        await recordAuditLog({ projectId: id, action: "UPDATE", entity: "EAPItem", entityId: itemId, field: "status", oldValue: current.status, newValue: status });
      }
      if (dependsOn !== undefined) {
        await recordAuditLog({ projectId: id, action: "UPDATE", entity: "EAPItem", entityId: itemId, field: "dependsOn", newValue: JSON.stringify(dependsOn) });
      }
    }
    return NextResponse.json(updated);
  }

  // Batch reorder: Array of { id, order }
  const { items } = body;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  await prisma.$transaction(
    items.map((item: { id: string; order: number }) =>
      prisma.eAPItem.update({
        where: { id: item.id, projectId: id },
        data: { order: item.order },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  const existing = await prisma.eAPItem.findUnique({ where: { id: itemId } });
  await prisma.eAPItem.delete({ where: { id: itemId, projectId: id } });
  if (existing) {
    await recordAuditLog({ projectId: id, action: "DELETE", entity: "EAPItem", entityId: itemId, oldValue: existing.name });
  }
  return NextResponse.json({ ok: true });
}
