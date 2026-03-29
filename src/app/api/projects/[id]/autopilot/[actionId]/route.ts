import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { applyApprovedAction } from '@/lib/autopilot-engine'

// PATCH — Approve or reject an autopilot action
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const { id, actionId } = await params
    const body = await request.json()
    const { status, editedDraft } = body as {
      status: 'APPROVED' | 'REJECTED'
      editedDraft?: Record<string, unknown>
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Verify action belongs to this project
    const action = await prisma.autopilotAction.findFirst({
      where: { id: actionId, projectId: id, status: 'PENDING' },
    })

    if (!action) {
      return NextResponse.json({ error: 'Ação não encontrada ou já processada' }, { status: 404 })
    }

    // If user edited the draft before approving, update it
    if (editedDraft && status === 'APPROVED') {
      await prisma.autopilotAction.update({
        where: { id: actionId },
        data: { draftData: editedDraft as unknown as Prisma.InputJsonValue },
      })
    }

    // Update status
    const updated = await prisma.autopilotAction.update({
      where: { id: actionId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    })

    // If approved, apply the action
    if (status === 'APPROVED') {
      await applyApprovedAction(actionId)
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        projectId: id,
        action: status === 'APPROVED' ? 'AUTOPILOT_APPROVED' : 'AUTOPILOT_REJECTED',
        entity: 'AutopilotAction',
        entityId: actionId,
        field: action.type,
        newValue: status,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Autopilot] PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao processar ação' }, { status: 500 })
  }
}
