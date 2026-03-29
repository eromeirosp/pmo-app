import { NextResponse } from 'next/server'
import { getProjectHealth, getHealthSparkline } from '@/lib/intelligence-engine'

// GET — Get health score, trend, alerts, and sparkline for a project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [health, sparkline] = await Promise.all([
      getProjectHealth(id),
      getHealthSparkline(id),
    ])

    return NextResponse.json({
      ...health,
      sparkline,
    })
  } catch (error) {
    console.error('[Project Health] GET error:', error)
    return NextResponse.json({ error: 'Erro ao carregar health score' }, { status: 500 })
  }
}
