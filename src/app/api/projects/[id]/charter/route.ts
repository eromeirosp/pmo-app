import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// type: CRITERIA | DELIVERABLE | PREMISE | RESTRICTION
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const type = new URL(req.url).searchParams.get("type");
  const where = type ? { projectId: id, type } : { projectId: id };
  const items = await prisma.charterItem.findMany({ where, orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { type, text } = await req.json();
  if (!text?.trim() || !type) return NextResponse.json({ error: "type e text são obrigatórios" }, { status: 400 });

  const item = await prisma.charterItem.create({ data: { projectId: id, type, text: text.trim() } });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  await prisma.charterItem.delete({ where: { id: itemId, projectId: id } });
  return NextResponse.json({ ok: true });
}
