import { NextResponse } from 'next/server'
import { getEffectiveRules, loadProjectData } from '@/lib/intelligence-engine'
import { runSimulation, type ScenarioParameters } from '@/lib/scenario-engine'

// POST — Run a what-if simulation (pure, no DB writes)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const parameters: ScenarioParameters = {
      budgetAdjustmentPct: Number(body.budgetAdjustmentPct) || 0,
      timelineDeltaDays: Number(body.timelineDeltaDays) || 0,
      materializedRiskIds: Array.isArray(body.materializedRiskIds) ? body.materializedRiskIds : [],
      removedEapItemIds: Array.isArray(body.removedEapItemIds) ? body.removedEapItemIds : [],
    }

    // Clamp values
    parameters.budgetAdjustmentPct = Math.max(-50, Math.min(50, parameters.budgetAdjustmentPct))
    parameters.timelineDeltaDays = Math.max(-60, Math.min(60, parameters.timelineDeltaDays))

    const [rules, data] = await Promise.all([
      getEffectiveRules(id),
      loadProjectData(id),
    ])

    if (!data.project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const result = runSimulation(rules, data, parameters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Scenario] Simulate error:', error)
    return NextResponse.json({ error: 'Erro ao executar simulação' }, { status: 500 })
  }
}
