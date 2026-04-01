import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { evaluateProject } from '@/lib/intelligence-engine'
import { runAutopilot } from '@/lib/autopilot-engine'

// GET — List autopilot actions for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const actions = await prisma.autopilotAction.findMany({
      where: {
        projectId: id,
        ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(actions)
  } catch (error) {
    console.error('[Autopilot] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar ações' }, { status: 500 })
  }
}

// POST — Trigger manual autopilot evaluation for a project
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Evaluate project intelligence first
    const evaluation = await evaluateProject(id)

    // Run autopilot with triggered alerts
    const result = await runAutopilot(id, evaluation.alerts)

    return NextResponse.json({
      success: true,
      evaluated: {
        healthScore: evaluation.healthScore,
        alertCount: evaluation.alerts.length,
      },
      autopilot: result,
    })
  } catch (error) {
    console.error('[Autopilot] POST error:', error)
    return NextResponse.json({ error: 'Erro ao executar autopilot' }, { status: 500 })
  }
}
