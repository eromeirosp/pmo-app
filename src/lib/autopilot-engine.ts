/**
 * Autopilot Engine — Generates draft actions when intelligence rules trigger.
 * Pattern: Draft → Review → Approve. Never applies changes directly.
 */

import prisma from '@/lib/prisma'
import type { AutopilotActionType, Prisma } from '@prisma/client'
import { GoogleGenAI } from '@google/genai'
import type { TriggeredAlert, EvaluationResult } from './intelligence-engine'

// ── Rule → Action Type Mapping ──────────────────────────

const RULE_ACTION_MAP: Record<string, AutopilotActionType> = {
  project_stagnation: 'STATUS_REPORT_DRAFT',
  recurring_issues: 'STATUS_REPORT_DRAFT',
  risk_cascade: 'RISK_ESCALATION',
  risk_concentration: 'RISK_ESCALATION',
  // budget/schedule/scope alerts are already visible in the health panel — no autopilot action needed
}

// ── Draft Generation ────────────────────────────────────

async function generateDraftData(
  type: AutopilotActionType,
  projectName: string,
  alert: TriggeredAlert
): Promise<Record<string, unknown>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const prompts: Record<AutopilotActionType, string> = {
    STATUS_REPORT_DRAFT: `Você é um PMO assistente. Gere um draft de Status Report para o projeto "${projectName}".

Contexto do alerta: ${alert.title} — ${alert.message}
Evidência: ${JSON.stringify(alert.evidence)}

Gere um JSON com estes campos (todos strings):
- period: período do relatório (ex: "Semana de DD/MM/YYYY")
- overallStatus: "Verde", "Amarelo" ou "Vermelho"
- accomplishments: realizações do período
- nextSteps: próximos passos recomendados
- issues: problemas identificados
- progress: número de 0 a 100

Responda APENAS com o JSON, sem markdown, sem texto adicional.`,

    RISK_ESCALATION: `Você é um PMO assistente. O projeto "${projectName}" apresentou um alerta de risco na avaliação automática.

Contexto do alerta: ${alert.title} — ${alert.message}
Evidência: ${JSON.stringify(alert.evidence)}

Com base nisso, gere um draft de risco para ser adicionado à Matriz de Riscos do projeto.

Gere um JSON com:
- title: título curto e objetivo do risco (máx 80 chars)
- description: descrição detalhada do risco e seu contexto no projeto
- probability: número de 1 a 5 (1=Muito Baixo, 5=Muito Alto)
- impact: número de 1 a 5 (1=Muito Baixo, 5=Muito Alto)
- category: uma de "Cronograma", "Orçamento", "Escopo", "Qualidade", "Recursos", "Técnico", "Externo"
- mitigation: ação preventiva recomendada (1-2 frases)

Responda APENAS com o JSON, sem markdown, sem texto adicional.`,

    BUDGET_ALERT: ``,
    SCHEDULE_ALERT: ``,
    STAGNATION_NUDGE: ``,
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompts[type],
    })

    let text = response.text?.trim() || '{}'
    // Strip markdown fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

    return JSON.parse(text)
  } catch (err) {
    console.error('[Autopilot] AI draft generation failed:', err)
    // Fallback: return a minimal draft based on the alert
    return {
      summary: alert.message,
      recommendedAction: 'Revisar situação e tomar ações corretivas.',
      generatedByFallback: true,
    }
  }
}

// ── Core Engine ─────────────────────────────────────────

/**
 * Run autopilot for a single project. Creates draft actions for triggered alerts.
 */
export async function runAutopilot(
  projectId: string,
  triggeredAlerts: TriggeredAlert[]
): Promise<{ created: number }> {
  if (triggeredAlerts.length === 0) return { created: 0 }

  // Get project name for prompts
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  })
  if (!project) return { created: 0 }

  // Check existing PENDING actions for dedup
  const pendingActions = await prisma.autopilotAction.findMany({
    where: { projectId, status: 'PENDING' },
    select: { type: true, triggeredByRule: true },
  })
  const pendingSet = new Set(pendingActions.map((a) => `${a.type}:${a.triggeredByRule}`))

  let created = 0

  for (const alert of triggeredAlerts) {
    const actionType = RULE_ACTION_MAP[alert.ruleKey]
    if (!actionType) continue

    // Skip if there's already a PENDING action for this rule
    if (pendingSet.has(`${actionType}:${alert.ruleKey}`)) continue

    const draftData = await generateDraftData(actionType, project.name, alert)

    await prisma.autopilotAction.create({
      data: {
        projectId,
        type: actionType,
        triggeredByRule: alert.ruleKey,
        draftData: draftData as unknown as Prisma.InputJsonValue,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        projectId,
        type: 'AUTOPILOT_ACTION',
        title: `Autopilot: ${alert.title}`,
        message: `Uma ação automática foi sugerida para o projeto "${project.name}". Revise e aprove ou rejeite.`,
      },
    })

    created++
  }

  return { created }
}

/**
 * Run autopilot for all projects after intelligence evaluation.
 */
export async function runAutopilotForAll(
  evaluationResults: EvaluationResult[]
): Promise<{ totalCreated: number }> {
  let totalCreated = 0

  for (const result of evaluationResults) {
    if (result.alerts.length === 0) continue
    try {
      const { created } = await runAutopilot(result.projectId, result.alerts)
      totalCreated += created
    } catch (err) {
      console.error(`[Autopilot] Failed for project ${result.projectId}:`, err)
    }
  }

  return { totalCreated }
}

/**
 * Apply an approved action (create the actual entity).
 */
export async function applyApprovedAction(actionId: string): Promise<{ applied: boolean }> {
  const action = await prisma.autopilotAction.findUnique({ where: { id: actionId } })
  if (!action || action.status !== 'APPROVED') return { applied: false }

  const draft = action.draftData as Record<string, unknown>

  switch (action.type) {
    case 'STATUS_REPORT_DRAFT': {
      await prisma.statusReport.create({
        data: {
          projectId: action.projectId,
          period: (draft.period as string) || `Semana de ${new Date().toLocaleDateString('pt-BR')}`,
          overallStatus: (draft.overallStatus as string) || 'Amarelo',
          accomplishments: (draft.accomplishments as string) || '',
          nextSteps: (draft.nextSteps as string) || '',
          issues: (draft.issues as string) || '',
          progress: Number(draft.progress) || 0,
        },
      })
      break
    }
    case 'RISK_ESCALATION': {
      const probability = Math.max(1, Math.min(5, Number(draft.probability) || 3))
      const impact = Math.max(1, Math.min(5, Number(draft.impact) || 3))
      const level = probability * impact >= 15 ? 'Crítico'
        : probability * impact >= 8 ? 'Alto'
        : probability * impact >= 4 ? 'Médio'
        : 'Baixo'
      await prisma.risk.create({
        data: {
          projectId: action.projectId,
          title: (draft.title as string) || 'Risco identificado pelo Autopiloto',
          description: (draft.description as string) || '',
          probability,
          impact,
          level,
          category: (draft.category as string) || 'Geral',
          mitigation: (draft.mitigation as string) || '',
          status: 'Identificado',
        },
      })
      break
    }
    case 'BUDGET_ALERT':
    case 'SCHEDULE_ALERT':
    case 'STAGNATION_NUDGE':
      break
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      projectId: action.projectId,
      action: 'AUTOPILOT_APPROVED',
      entity: 'AutopilotAction',
      entityId: action.id,
      field: action.type,
      newValue: JSON.stringify(draft).substring(0, 500),
    },
  })

  return { applied: true }
}
