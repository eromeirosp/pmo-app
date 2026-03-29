/**
 * Intelligence Engine — Evaluates all rules for a project, calculates health score,
 * manages alerts and snapshots.
 */

import prisma from '@/lib/prisma'
import type { AlertSeverity, Prisma } from '@prisma/client'
import {
  budgetBurnRate,
  budgetDeviation,
  schedulePerformance,
  projectStagnation,
  riskCascade,
  riskConcentration,
  scopeCreep,
  recurringIssuesSimple,
  historicalBenchmark,
  type RuleResult,
  type HistoricalProject,
} from './intelligence-rules'

// ── Types ───────────────────────────────────────────────

interface EffectiveRule {
  key: string
  name: string
  description: string
  category: string
  threshold: number
  enabled: boolean
  severity: string
}

interface EvaluationResult {
  projectId: string
  healthScore: number
  trend: 'improving' | 'stable' | 'declining'
  alerts: TriggeredAlert[]
  evaluatedAt: string
}

interface TriggeredAlert {
  ruleKey: string
  ruleName: string
  severity: string
  title: string
  message: string
  evidence: Record<string, unknown>
}

// ── Severity Deductions ─────────────────────────────────

const SEVERITY_DEDUCTIONS: Record<string, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
}

// ── Alert Message Templates ─────────────────────────────

function buildAlertMessage(ruleKey: string, evidence: Record<string, unknown>): { title: string; message: string } {
  switch (ruleKey) {
    case 'budget_burn_rate':
      return {
        title: 'Queima de Orçamento Desproporcional',
        message: `Orçamento ${evidence.budgetUsedPercent}% consumido, mas apenas ${evidence.eapProgressPercent}% da EAP entregue.`,
      }
    case 'budget_deviation':
      return {
        title: 'Desvio Orçamentário',
        message: `Desvio de ${evidence.deviationPercent}% entre gastos reais e esperados (progresso reportado: ${evidence.reportedProgress}%).`,
      }
    case 'schedule_performance':
      return {
        title: 'Performance de Cronograma Baixa',
        message: `${evidence.timeElapsedPercent}% do tempo decorrido, mas apenas ${evidence.eapProgressPercent}% dos entregáveis concluídos.`,
      }
    case 'project_stagnation':
      return {
        title: 'Projeto Estagnado',
        message: `Nenhuma atualização na EAP há ${evidence.daysSinceLastUpdate} dias.`,
      }
    case 'risk_cascade':
      return {
        title: 'Cascata de Riscos',
        message: `${(evidence.materializedRisks as Array<unknown>)?.length || 0} risco(s) materializado(s) com ${evidence.pendingEapItems} itens da EAP pendentes.`,
      }
    case 'risk_concentration':
      return {
        title: 'Concentração de Riscos',
        message: `Stakeholder(s) com sobrecarga de riscos: ${(evidence.overloadedStakeholders as Array<{ name: string; riskCount: number }>)?.map((s) => `${s.name} (${s.riskCount} riscos)`).join(', ')}.`,
      }
    case 'scope_creep':
      return {
        title: 'Crescimento de Escopo',
        message: `EAP cresceu ${evidence.growthPercent}% (de ${evidence.baselineItemCount} para ${evidence.currentItemCount} itens) desde o baseline.`,
      }
    case 'recurring_issues':
      return {
        title: 'Problemas Recorrentes',
        message: `Termos recorrentes nos últimos ${evidence.reportsAnalyzed} status reports: ${(evidence.commonTerms as string[])?.slice(0, 5).join(', ')}.`,
      }
    case 'historical_benchmark':
      return {
        title: 'Benchmark Histórico',
        message: `Projetos similares (${evidence.matchCriteria}) tiveram health score médio de ${evidence.avgHistoricalScore}/100. Lições aprendidas: ${(evidence.relevantLessons as string[])?.slice(0, 3).join('; ') || 'nenhuma registrada'}.`,
      }
    default:
      return { title: ruleKey, message: JSON.stringify(evidence) }
  }
}

// ── Core Engine ─────────────────────────────────────────

/**
 * Get effective rules for a project (global defaults + per-project overrides).
 */
async function getEffectiveRules(projectId: string): Promise<EffectiveRule[]> {
  const [rules, overrides] = await Promise.all([
    prisma.intelligenceRule.findMany({ where: { enabled: true } }),
    prisma.projectRuleOverride.findMany({ where: { projectId } }),
  ])

  const overrideMap = new Map(overrides.map((o) => [o.ruleKey, o]))

  return rules.map((rule) => {
    const override = overrideMap.get(rule.key)
    return {
      key: rule.key,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      threshold: override?.threshold ?? rule.defaultThreshold,
      enabled: override?.enabled ?? rule.enabled,
      severity: rule.severity,
    }
  }).filter((r) => r.enabled)
}

/**
 * Load all project data needed for evaluation.
 */
/**
 * Load historical data from closed projects for cross-project intelligence.
 */
async function loadHistoricalData(excludeProjectId: string): Promise<HistoricalProject[]> {
  const closedProjects = await prisma.project.findMany({
    where: {
      closingApproved: true,
      id: { not: excludeProjectId },
    },
    select: {
      id: true,
      name: true,
      department: true,
      classification: true,
      closingItems: {
        where: { type: 'LESSON' },
        select: { text: true },
      },
    },
  })

  if (closedProjects.length === 0) return []

  // Get latest health snapshot for each closed project
  const snapshots = await prisma.projectHealthSnapshot.findMany({
    where: {
      projectId: { in: closedProjects.map((p) => p.id) },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['projectId'],
    select: { projectId: true, score: true },
  })

  const snapshotMap = new Map(snapshots.map((s) => [s.projectId, s.score]))

  return closedProjects.map((p) => ({
    id: p.id,
    name: p.name,
    department: p.department,
    classification: p.classification,
    lastHealthScore: snapshotMap.get(p.id) ?? null,
    lessons: p.closingItems.map((ci) => ci.text),
  }))
}

async function loadProjectData(projectId: string) {
  const [project, eapItems, risks, statusReports, budgetEntries] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        budget: true,
        startDate: true,
        endDate: true,
        status: true,
        department: true,
        classification: true,
      },
    }),
    prisma.eAPItem.findMany({
      where: { projectId },
      select: { id: true, name: true, status: true, dependsOn: true, createdAt: true, updatedAt: true },
    }),
    prisma.risk.findMany({
      where: { projectId },
      select: { id: true, title: true, level: true, probability: true, responsible: true },
    }),
    prisma.statusReport.findMany({
      where: { projectId },
      select: { id: true, issues: true, reportDate: true, progress: true },
      orderBy: { reportDate: 'desc' },
    }),
    prisma.budgetEntry.findMany({
      where: { projectId },
      select: { amount: true, type: true },
    }),
  ])

  return { project, eapItems, risks, statusReports, budgetEntries }
}

/**
 * Run all rules against a project and return triggered alerts.
 */
function evaluateRules(
  rules: EffectiveRule[],
  data: Awaited<ReturnType<typeof loadProjectData>>,
  historicalProjects?: HistoricalProject[]
): TriggeredAlert[] {
  const { project, eapItems, risks, statusReports, budgetEntries } = data
  if (!project) return []

  const latestProgress = statusReports.length > 0 ? statusReports[0].progress : null
  const firstReportDate = statusReports.length > 0
    ? new Date(statusReports[statusReports.length - 1].reportDate)
    : null

  const ruleEvaluators: Record<string, () => RuleResult> = {
    budget_burn_rate: () => budgetBurnRate(
      rules.find((r) => r.key === 'budget_burn_rate')!,
      project,
      budgetEntries,
      eapItems
    ),
    budget_deviation: () => budgetDeviation(
      rules.find((r) => r.key === 'budget_deviation')!,
      project,
      budgetEntries,
      latestProgress
    ),
    schedule_performance: () => schedulePerformance(
      rules.find((r) => r.key === 'schedule_performance')!,
      project,
      eapItems
    ),
    project_stagnation: () => projectStagnation(
      rules.find((r) => r.key === 'project_stagnation')!,
      eapItems
    ),
    risk_cascade: () => riskCascade(
      rules.find((r) => r.key === 'risk_cascade')!,
      risks,
      eapItems
    ),
    risk_concentration: () => riskConcentration(
      rules.find((r) => r.key === 'risk_concentration')!,
      risks
    ),
    scope_creep: () => scopeCreep(
      rules.find((r) => r.key === 'scope_creep')!,
      eapItems,
      firstReportDate
    ),
    recurring_issues: () => recurringIssuesSimple(
      rules.find((r) => r.key === 'recurring_issues')!,
      statusReports
    ),
    historical_benchmark: () => historicalBenchmark(
      rules.find((r) => r.key === 'historical_benchmark')!,
      project,
      historicalProjects || []
    ),
  }

  const triggered: TriggeredAlert[] = []

  for (const rule of rules) {
    const evaluator = ruleEvaluators[rule.key]
    if (!evaluator) continue

    try {
      const result = evaluator()
      if (result.triggered) {
        const { title, message } = buildAlertMessage(rule.key, result.evidence)
        triggered.push({
          ruleKey: rule.key,
          ruleName: rule.name,
          severity: rule.severity,
          title,
          message,
          evidence: result.evidence,
        })
      }
    } catch (err) {
      console.warn(`[Intelligence] Rule ${rule.key} failed:`, err)
      // Skip failed rules, don't block evaluation
    }
  }

  return triggered
}

/**
 * Calculate health score from triggered alerts.
 */
function calculateHealthScore(triggeredAlerts: TriggeredAlert[]): number {
  const totalDeduction = triggeredAlerts.reduce(
    (sum, alert) => sum + (SEVERITY_DEDUCTIONS[alert.severity] || 0),
    0
  )
  return Math.max(0, 100 - totalDeduction)
}

/**
 * Calculate trend by comparing current score with historical snapshots.
 */
async function calculateTrend(
  projectId: string,
  currentScore: number
): Promise<'improving' | 'stable' | 'declining'> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const oldSnapshot = await prisma.projectHealthSnapshot.findFirst({
    where: {
      projectId,
      createdAt: { lte: sevenDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    select: { score: true },
  })

  if (!oldSnapshot) return 'stable'

  const diff = currentScore - oldSnapshot.score
  if (diff > 5) return 'improving'
  if (diff < -5) return 'declining'
  return 'stable'
}

// ── Exported for reuse by Autopilot & Scenario engines ──

export { getEffectiveRules, loadProjectData, loadHistoricalData, evaluateRules, calculateHealthScore, buildAlertMessage }
export type { EffectiveRule, TriggeredAlert, EvaluationResult }

// ── Public API ──────────────────────────────────────────

/**
 * Evaluate a single project. Creates snapshot and manages alerts.
 */
export async function evaluateProject(projectId: string): Promise<EvaluationResult> {
  const rules = await getEffectiveRules(projectId)
  const [data, historicalProjects] = await Promise.all([
    loadProjectData(projectId),
    // Only load historical data if the historical_benchmark rule is active
    rules.some((r) => r.key === 'historical_benchmark')
      ? loadHistoricalData(projectId)
      : Promise.resolve([]),
  ])

  if (!data.project) {
    throw new Error(`Project ${projectId} not found`)
  }

  const triggeredAlerts = evaluateRules(rules, data, historicalProjects)
  const healthScore = calculateHealthScore(triggeredAlerts)
  const trend = await calculateTrend(projectId, healthScore)

  // Save snapshot
  await prisma.projectHealthSnapshot.create({
    data: {
      projectId,
      score: healthScore,
      triggeredRules: triggeredAlerts.map((a) => ({
        ruleKey: a.ruleKey,
        severity: a.severity,
      })),
    },
  })

  // Manage alerts: resolve old ones that are no longer triggered, create new ones
  const existingAlerts = await prisma.predictiveAlert.findMany({
    where: { projectId, dismissed: false, resolvedAt: null },
  })

  const triggeredKeys = new Set(triggeredAlerts.map((a) => a.ruleKey))
  const existingKeys = new Set(existingAlerts.map((a) => a.ruleKey))

  // Resolve alerts that are no longer triggered
  const toResolve = existingAlerts.filter((a) => !triggeredKeys.has(a.ruleKey))
  if (toResolve.length > 0) {
    await prisma.predictiveAlert.updateMany({
      where: { id: { in: toResolve.map((a) => a.id) } },
      data: { resolvedAt: new Date() },
    })
  }

  // Create new alerts (only for rules not already alerting)
  const newAlerts = triggeredAlerts.filter((a) => !existingKeys.has(a.ruleKey))
  if (newAlerts.length > 0) {
    await prisma.predictiveAlert.createMany({
      data: newAlerts.map((a) => ({
        projectId,
        ruleKey: a.ruleKey,
        severity: a.severity as AlertSeverity,
        title: a.title,
        message: a.message,
        evidence: a.evidence as unknown as Prisma.InputJsonValue,
      })),
    })
  }

  // Update existing alerts that are still triggered (refresh evidence)
  const toUpdate = triggeredAlerts.filter((a) => existingKeys.has(a.ruleKey))
  for (const alert of toUpdate) {
    const existing = existingAlerts.find((e) => e.ruleKey === alert.ruleKey)
    if (existing) {
      await prisma.predictiveAlert.update({
        where: { id: existing.id },
        data: {
          message: alert.message,
          evidence: alert.evidence as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }

  return {
    projectId,
    healthScore,
    trend,
    alerts: triggeredAlerts,
    evaluatedAt: new Date().toISOString(),
  }
}

/**
 * Get health data for a project (with freshness check).
 * Returns cached snapshot if fresh enough, otherwise re-evaluates.
 */
export async function getProjectHealth(
  projectId: string,
  maxAgeMinutes = 60
): Promise<EvaluationResult> {
  const cutoff = new Date()
  cutoff.setMinutes(cutoff.getMinutes() - maxAgeMinutes)

  const latestSnapshot = await prisma.projectHealthSnapshot.findFirst({
    where: { projectId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
  })

  if (latestSnapshot) {
    const trend = await calculateTrend(projectId, latestSnapshot.score)
    const activeAlerts = await prisma.predictiveAlert.findMany({
      where: { projectId, dismissed: false, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    return {
      projectId,
      healthScore: latestSnapshot.score,
      trend,
      alerts: activeAlerts.map((a) => ({
        ruleKey: a.ruleKey,
        ruleName: a.title,
        severity: a.severity,
        title: a.title,
        message: a.message,
        evidence: a.evidence as Record<string, unknown>,
      })),
      evaluatedAt: latestSnapshot.createdAt.toISOString(),
    }
  }

  return evaluateProject(projectId)
}

/**
 * Evaluate all projects in batch. Used by cron.
 */
export async function evaluateAllProjects(): Promise<EvaluationResult[]> {
  const projects = await prisma.project.findMany({
    select: { id: true },
  })

  const results: EvaluationResult[] = []

  for (const project of projects) {
    try {
      const result = await evaluateProject(project.id)
      results.push(result)
    } catch (err) {
      console.error(`[Intelligence] Failed to evaluate project ${project.id}:`, err)
    }
  }

  return results
}

/**
 * Get sparkline data (health scores over last 30 days).
 */
export async function getHealthSparkline(
  projectId: string,
  days = 30
): Promise<{ date: string; score: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const snapshots = await prisma.projectHealthSnapshot.findMany({
    where: { projectId, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    select: { score: true, createdAt: true },
  })

  return snapshots.map((s) => ({
    date: s.createdAt.toISOString().split('T')[0],
    score: s.score,
  }))
}
