import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH — Dismiss or resolve an alert
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { dismissed } = body

    const alert = await prisma.predictiveAlert.findUnique({ where: { id } })
    if (!alert) {
      return NextResponse.json({ error: 'Alerta não encontrado' }, { status: 404 })
    }

    const updated = await prisma.predictiveAlert.update({
      where: { id },
      data: {
        ...(typeof dismissed === 'boolean' ? { dismissed } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Intelligence Alert] PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar alerta' }, { status: 500 })
  }
}
