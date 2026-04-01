import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — List all intelligence rules
export async function GET() {
  try {
    const rules = await prisma.intelligenceRule.findMany({
      orderBy: [{ category: 'asc' }, { severity: 'desc' }],
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('[Intelligence Rules] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar regras' }, { status: 500 })
  }
}

// PUT — Update global rule settings (threshold, enabled)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { key, enabled, defaultThreshold } = body

    if (!key) {
      return NextResponse.json({ error: 'key é obrigatório' }, { status: 400 })
    }

    const rule = await prisma.intelligenceRule.findUnique({ where: { key } })
    if (!rule) {
      return NextResponse.json({ error: 'Regra não encontrada' }, { status: 404 })
    }

    const updated = await prisma.intelligenceRule.update({
      where: { key },
      data: {
        ...(typeof enabled === 'boolean' ? { enabled } : {}),
        ...(typeof defaultThreshold === 'number' ? { defaultThreshold } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Intelligence Rules] PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar regra' }, { status: 500 })
  }
}
