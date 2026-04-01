import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — List active predictive alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const projectId = searchParams.get('projectId')
    const severity = searchParams.get('severity')
    const includeResolved = searchParams.get('includeResolved') === 'true'

    const where: Record<string, unknown> = {
      dismissed: false,
    }

    if (!includeResolved) {
      where.resolvedAt = null
    }
    if (projectId) where.projectId = projectId
    if (severity) where.severity = severity

    const alerts = await prisma.predictiveAlert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('[Intelligence Alerts] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar alertas' }, { status: 500 })
  }
}
