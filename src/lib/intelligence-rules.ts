/**
 * Intelligence Rules — Pure evaluation functions for each rule.
 * Each function receives project data and returns { triggered, evidence }.
 */

export interface RuleResult {
  triggered: boolean
  evidence: Record<string, unknown>
}

interface EffectiveRule {
  key: string
  threshold: number
  enabled: boolean
  severity: string
}

// ── BUDGET ──────────────────────────────────────────────

export function budgetBurnRate(
  rule: EffectiveRule,
  project: { budget: number },
  budgetEntries: { amount: number; type: string }[],
  eapItems: { status: string }[]
): RuleResult {
  if (!project.budget || project.budget <= 0) return { triggered: false, evidence: {} }

  const totalExpenses = budgetEntries
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + e.amount, 0)

  const burnRatio = totalExpenses / project.budget
  const totalItems = eapItems.length
  const doneItems = eapItems.filter((i) => i.status === 'DONE').length
  const eapProgress = totalItems > 0 ? doneItems / totalItems : 0

  const triggered = burnRatio > rule.threshold && eapProgress < burnRatio - 0.15

  return {
    triggered,
    evidence: {
      budgetUsedPercent: Math.round(burnRatio * 100),
      eapProgressPercent: Math.round(eapProgress * 100),
      totalExpenses,
      budget: project.budget,
    },
  }
}

export function budgetDeviation(
  rule: EffectiveRule,
  project: { budget: number },
  budgetEntries: { amount: number; type: string }[],
  latestProgress: number | null
): RuleResult {
  if (!project.budget || project.budget <= 0 || latestProgress === null) {
    return { triggered: false, evidence: {} }
  }

  const totalExpenses = budgetEntries
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + e.amount, 0)

  const expectedSpend = project.budget * (latestProgress / 100)
  const deviation = Math.abs(totalExpenses - expectedSpend) / project.budget

  return {
    triggered: deviation > rule.threshold,
    evidence: {
      totalExpenses,
      expectedSpend: Math.round(expectedSpend),
      deviationPercent: Math.round(deviation * 100),
      reportedProgress: latestProgress,
    },
  }
}

// ── SCHEDULE ────────────────────────────────────────────

export function schedulePerformance(
  rule: EffectiveRule,
  project: { startDate: Date | null; endDate: Date | null },
  eapItems: { status: string }[]
): RuleResult {
  if (!project.startDate || !project.endDate) return { triggered: false, evidence: {} }

  const now = new Date()
  const start = new Date(project.startDate)
  const end = new Date(project.endDate)
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

  if (totalDays <= 0 || elapsedDays < 0) return { triggered: false, evidence: {} }

  const timeRatio = Math.min(elapsedDays / totalDays, 1)
  const totalItems = eapItems.length
  const doneItems = eapItems.filter((i) => i.status === 'DONE').length
  const eapProgress = totalItems > 0 ? doneItems / totalItems : 0

  const triggered = timeRatio > eapProgress + rule.threshold

  return {
    triggered,
    evidence: {
      timeElapsedPercent: Math.round(timeRatio * 100),
      eapProgressPercent: Math.round(eapProgress * 100),
      elapsedDays: Math.round(elapsedDays),
      totalDays: Math.round(totalDays),
    },
  }
}

export function projectStagnation(
  rule: EffectiveRule,
  eapItems: { updatedAt: Date }[]
): RuleResult {
  if (eapItems.length === 0) return { triggered: false, evidence: {} }

  const now = new Date()
  const latestUpdate = eapItems.reduce((latest, item) => {
    const d = new Date(item.updatedAt)
    return d > latest ? d : latest
  }, new Date(0))

  const daysSinceUpdate = (now.getTime() - latestUpdate.getTime()) / (1000 * 60 * 60 * 24)

  return {
    triggered: daysSinceUpdate > rule.threshold,
    evidence: {
      daysSinceLastUpdate: Math.round(daysSinceUpdate),
      thresholdDays: rule.threshold,
      lastUpdateDate: latestUpdate.toISOString(),
    },
  }
}

// ── RISK ────────────────────────────────────────────────

export function riskCascade(
  _rule: EffectiveRule,
  risks: { id: string; title: string; level: string }[],
  eapItems: { id: string; status: string; dependsOn: string[]; name: string }[]
): RuleResult {
  const materializedRisks = risks.filter(
    (r) => r.level === 'MATERIALIZADO' || r.level === 'Materializado'
  )

  if (materializedRisks.length === 0) return { triggered: false, evidence: {} }

  // Check if any non-DONE EAP items exist that could be affected
  const pendingItems = eapItems.filter((i) => i.status !== 'DONE')

  // Simple heuristic: if there are materialized risks AND pending EAP items, flag it
  const triggered = materializedRisks.length > 0 && pendingItems.length > 0

  return {
    triggered,
    evidence: {
      materializedRisks: materializedRisks.map((r) => ({
        id: r.id,
        title: r.title,
      })),
      pendingEapItems: pendingItems.length,
      affectedItems: pendingItems.slice(0, 5).map((i) => ({ id: i.id, name: i.name })),
    },
  }
}

export function riskConcentration(
  rule: EffectiveRule,
  risks: { responsible: string | null; probability: number }[]
): RuleResult {
  const activeRisks = risks.filter((r) => r.probability >= 3 && r.responsible)

  const byResponsible: Record<string, number> = {}
  for (const risk of activeRisks) {
    const name = risk.responsible!
    byResponsible[name] = (byResponsible[name] || 0) + 1
  }

  const overloaded = Object.entries(byResponsible).filter(
    ([, count]) => count > rule.threshold
  )

  return {
    triggered: overloaded.length > 0,
    evidence: {
      overloadedStakeholders: overloaded.map(([name, count]) => ({ name, riskCount: count })),
      threshold: rule.threshold,
    },
  }
}

// ── SCOPE ───────────────────────────────────────────────

export function scopeCreep(
  rule: EffectiveRule,
  eapItems: { createdAt: Date }[],
  firstReportDate: Date | null
): RuleResult {
  if (!firstReportDate || eapItems.length === 0) return { triggered: false, evidence: {} }

  const baselineCount = eapItems.filter(
    (i) => new Date(i.createdAt) <= firstReportDate
  ).length

  if (baselineCount === 0) return { triggered: false, evidence: {} }

  const currentCount = eapItems.length
  const growthRatio = (currentCount - baselineCount) / baselineCount

  return {
    triggered: growthRatio > rule.threshold,
    evidence: {
      baselineItemCount: baselineCount,
      currentItemCount: currentCount,
      growthPercent: Math.round(growthRatio * 100),
      thresholdPercent: Math.round(rule.threshold * 100),
    },
  }
}

// ── CROSS-PROJECT ──────────────────────────────────────

export interface HistoricalProject {
  id: string
  name: string
  department: string | null
  classification: string | null
  lastHealthScore: number | null
  lessons: string[]
}

export function historicalBenchmark(
  rule: EffectiveRule,
  project: { department: string | null; classification: string | null },
  historicalProjects: HistoricalProject[]
): RuleResult {
  if (historicalProjects.length === 0) return { triggered: false, evidence: {} }

  // Find similar projects (same department OR same classification)
  const similar = historicalProjects.filter(
    (hp) =>
      (project.department && hp.department === project.department) ||
      (project.classification && hp.classification === project.classification)
  )

  if (similar.length === 0) return { triggered: false, evidence: {} }

  // Only consider projects that have a health score
  const withScores = similar.filter((hp) => hp.lastHealthScore !== null)
  if (withScores.length === 0) return { triggered: false, evidence: {} }

  const avgScore =
    withScores.reduce((sum, hp) => sum + (hp.lastHealthScore ?? 0), 0) / withScores.length

  // Collect lessons from all similar projects
  const allLessons = similar.flatMap((hp) => hp.lessons).filter(Boolean)
  const relevantLessons = allLessons.slice(0, 5)

  // Trigger if average historical score was below threshold
  const triggered = avgScore < rule.threshold

  return {
    triggered,
    evidence: {
      similarProjectCount: similar.length,
      avgHistoricalScore: Math.round(avgScore),
      threshold: rule.threshold,
      similarProjects: withScores.slice(0, 5).map((hp) => ({
        name: hp.name,
        score: hp.lastHealthScore,
      })),
      relevantLessons,
      matchCriteria: project.department
        ? `departamento "${project.department}"`
        : `classificação "${project.classification}"`,
    },
  }
}

// ── QUALITY ─────────────────────────────────────────────

/**
 * recurring_issues — checks if similar issues appear across consecutive status reports.
 * This is a simplified version that does keyword matching.
 * The full version with Gemini semantic similarity is in the engine.
 */
export function recurringIssuesSimple(
  rule: EffectiveRule,
  statusReports: { issues: string | null; reportDate: Date }[]
): RuleResult {
  if (statusReports.length < rule.threshold) return { triggered: false, evidence: {} }

  // Sort by date descending, take the latest N
  const sorted = [...statusReports]
    .filter((r) => r.issues && r.issues.trim().length > 0)
    .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())

  const recentReports = sorted.slice(0, Math.ceil(rule.threshold))
  if (recentReports.length < rule.threshold) return { triggered: false, evidence: {} }

  // Simple heuristic: extract words (>4 chars), find words that appear in ALL recent reports
  const wordSets = recentReports.map((r) => {
    const words = (r.issues || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
    return new Set(words)
  })

  const commonWords = [...wordSets[0]].filter((word) =>
    wordSets.every((set) => set.has(word))
  )

  const triggered = commonWords.length >= 2

  return {
    triggered,
    evidence: {
      reportsAnalyzed: recentReports.length,
      commonTerms: commonWords.slice(0, 10),
      threshold: rule.threshold,
    },
  }
}
