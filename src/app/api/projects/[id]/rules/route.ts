import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — Get rule overrides for a project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const overrides = await prisma.projectRuleOverride.findMany({
      where: { projectId: id },
    })
    return NextResponse.json(overrides)
  } catch (error) {
    console.error('[Project Rules] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar overrides' }, { status: 500 })
  }
}

// PUT — Save rule override for a project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { ruleKey, threshold, enabled } = body

    if (!ruleKey) {
      return NextResponse.json({ error: 'ruleKey é obrigatório' }, { status: 400 })
    }

    // If both values are explicitly null, delete the override entirely
    if (threshold === null && enabled === null) {
      await prisma.projectRuleOverride.deleteMany({
        where: { projectId: id, ruleKey },
      })
      return NextResponse.json({ deleted: true })
    }

    const override = await prisma.projectRuleOverride.upsert({
      where: {
        projectId_ruleKey: { projectId: id, ruleKey },
      },
      update: {
        ...(threshold !== undefined ? { threshold } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
      create: {
        projectId: id,
        ruleKey,
        threshold: threshold ?? null,
        enabled: enabled ?? null,
      },
    })

    return NextResponse.json(override)
  } catch (error) {
    console.error('[Project Rules] PUT error:', error)
    return NextResponse.json({ error: 'Erro ao salvar override' }, { status: 500 })
  }
}
