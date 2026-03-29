import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE — Remove a saved scenario
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; scenarioId: string }> }
) {
  try {
    const { id, scenarioId } = await params

    // Verify scenario belongs to this project
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, projectId: id },
    })

    if (!scenario) {
      return NextResponse.json({ error: 'Cenário não encontrado' }, { status: 404 })
    }

    await prisma.scenario.delete({ where: { id: scenarioId } })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[Scenarios] DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir cenário' }, { status: 500 })
  }
}
