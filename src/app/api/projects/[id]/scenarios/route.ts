import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — List saved scenarios for a project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const scenarios = await prisma.scenario.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(scenarios)
  } catch (error) {
    console.error('[Scenarios] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar cenários' }, { status: 500 })
  }
}

// POST — Save a named scenario
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { label, parameters, result, narrative, radarData } = body

    if (!label?.trim()) {
      return NextResponse.json({ error: 'Label é obrigatório' }, { status: 400 })
    }

    const scenario = await prisma.scenario.create({
      data: {
        projectId: id,
        label: label.trim(),
        parameters,
        result,
        narrative: narrative || null,
        radarData: radarData || null,
      },
    })

    return NextResponse.json(scenario)
  } catch (error) {
    console.error('[Scenarios] POST error:', error)
    return NextResponse.json({ error: 'Erro ao salvar cenário' }, { status: 500 })
  }
}
