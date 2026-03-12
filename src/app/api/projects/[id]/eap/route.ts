import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  } catch (error: any) {
    console.error("EAP GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { name, description, parentId, status, order } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

    // If no order provided, put it at the end
    let finalOrder = order;
    if (order === undefined) {
      const lastItem = await prisma.eAPItem.findFirst({
        where: { projectId: id },
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
        order: finalOrder
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("EAP POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  // Single item update (status, name, description)
  if (body.itemId) {
    const { itemId, status, name, description } = body;
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const updated = await prisma.eAPItem.update({
      where: { id: itemId, projectId: id },
      data,
    });
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

  await prisma.eAPItem.delete({ where: { id: itemId, projectId: id } });
  return NextResponse.json({ ok: true });
}
