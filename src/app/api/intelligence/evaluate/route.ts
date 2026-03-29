import { NextResponse } from 'next/server'
import { evaluateProject, evaluateAllProjects } from '@/lib/intelligence-engine'

// POST — Evaluate intelligence rules for one project or all
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { projectId } = body as { projectId?: string }

    if (projectId) {
      const result = await evaluateProject(projectId)
      return NextResponse.json(result)
    }

    const results = await evaluateAllProjects()
    return NextResponse.json({
      evaluated: results.length,
      results,
    })
  } catch (error) {
    console.error('[Intelligence Evaluate] POST error:', error)
    return NextResponse.json({ error: 'Erro ao avaliar inteligência' }, { status: 500 })
  }
}
