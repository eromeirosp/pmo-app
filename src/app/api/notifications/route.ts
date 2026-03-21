import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const typeFilter = searchParams.get("type");
        const limitParam = searchParams.get("limit");
        const take = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 100) : 50;

        const where: Record<string, unknown> = {};
        if (unreadOnly) where.read = false;
        if (typeFilter) where.type = typeFilter;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
        });

        const unreadCount = await prisma.notification.count({ where: { read: false } });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const data = await req.json();

        if (data.markAllRead) {
            await prisma.notification.updateMany({
                where: { read: false },
                data: { read: true },
            });
            return NextResponse.json({ ok: true });
        }

        if (data.id) {
            await prisma.notification.update({
                where: { id: data.id },
                data: { read: true },
            });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: "id ou markAllRead é obrigatório" }, { status: 400 });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Erro ao atualizar notificação" }, { status: 500 });
    }
}
