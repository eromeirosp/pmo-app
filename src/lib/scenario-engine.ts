/**
 * Scenario Engine — Pure simulation engine.
 * Mutates data IN MEMORY only, never touches the database.
 * Reuses intelligence rules to compare current vs simulated health scores.
 */

import {
  evaluateRules,
  calculateHealthScore,
  type EffectiveRule,
  type TriggeredAlert,
} from './intelligence-engine'

// ── Types ───────────────────────────────────────────────

export interface RadarDimensions {
  budget: number      // 0-100: budget health (100 = on track)
  timeline: number    // 0-100: timeline health (100 = on track)
  risks: number       // 0-100: risk health (100 = no risk)
  scope: number       // 0-100: scope completeness
  health: number      // 0-100: overall health score
}

export interface ScenarioParameters {
  budgetAdjustmentPct: number       // -50 to +50
  timelineDeltaDays: number         // -60 to +60
  materializedRiskIds: string[]     // IDs of risks to simulate as materialized
  removedEapItemIds: string[]       // IDs of EAP items to simulate as removed
}

export interface SimulationResult {
  currentScore: number
  simulatedScore: number
  currentAlerts: TriggeredAlert[]
  simulatedAlerts: TriggeredAlert[]
  diff: {
    appeared: TriggeredAlert[]      // new alerts in simulation
    disappeared: TriggeredAlert[]   // alerts that go away
    unchanged: TriggeredAlert[]     // alerts present in both
  }
  currentRadar: RadarDimensions
  simulatedRadar: RadarDimensions
}

// ── Simulation Data Types ───────────────────────────────

interface SimProject {
  id: string
  name: string
  budget: number
  startDate: Date | null
  endDate: Date | null
  status: string
  department: string | null
  classification: string | null
}

interface SimEapItem {
  id: string
  name: string
  status: string
  dependsOn: string[]
  createdAt: Date
  updatedAt: Date
}

interface SimRisk {
  id: string
  title: string
  level: string
  probability: number
  responsible: string | null
}

interface SimStatusReport {
  id: string
  issues: string | null
  reportDate: Date
  progress: number
}

interface SimBudgetEntry {
  amount: number
  type: string
}

export interface ProjectData {
  project: SimProject | null
  eapItems: SimEapItem[]
  risks: SimRisk[]
  statusReports: SimStatusReport[]
  budgetEntries: SimBudgetEntry[]
}

// ── Radar Dimensions ────────────────────────────────────

function computeRadarDimensions(data: ProjectData, alerts: TriggeredAlert[], healthScore: number): RadarDimensions {
  const { project, eapItems, risks, budgetEntries } = data

  // Budget dimension: 100 = under budget, 0 = way over
  let budgetDim = 100
  if (project && project.budget > 0) {
    const totalSpent = budgetEntries
      .filter((e) => e.type === 'EXPENSE')
      .reduce((sum, e) => sum + e.amount, 0)
    const usedPct = (totalSpent / project.budget) * 100
    budgetDim = Math.max(0, Math.min(100, 100 - Math.max(0, usedPct - 80) * 5))
  }
  // Deduct if budget alerts are present
  const budgetAlerts = alerts.filter((a) => a.ruleKey.startsWith('budget_'))
  if (budgetAlerts.length > 0) budgetDim = Math.max(0, budgetDim - budgetAlerts.length * 20)

  // Timeline dimension: 100 = on schedule, 0 = critical delay
  let timelineDim = 100
  if (project?.startDate && project?.endDate) {
    const now = new Date()
    const start = new Date(project.startDate)
    const end = new Date(project.endDate)
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000)
    const elapsed = Math.max(0, (now.getTime() - start.getTime()) / 86400000)
    const elapsedPct = (elapsed / totalDays) * 100
    const doneItems = eapItems.filter((e) => e.status === 'DONE').length
    const progressPct = eapItems.length > 0 ? (doneItems / eapItems.length) * 100 : 0
    const gap = elapsedPct - progressPct
    timelineDim = Math.max(0, Math.min(100, 100 - Math.max(0, gap)))
  }
  const scheduleAlerts = alerts.filter((a) => a.ruleKey === 'schedule_performance' || a.ruleKey === 'project_stagnation')
  if (scheduleAlerts.length > 0) timelineDim = Math.max(0, timelineDim - scheduleAlerts.length * 15)

  // Risk dimension: 100 = no risk, 0 = critical
  const materializedCount = risks.filter((r) => r.level === 'Materializado').length
  const highCount = risks.filter((r) => ['Alto', 'Muito Alto', 'Crítico'].includes(r.level)).length
  const riskDim = Math.max(0, 100 - materializedCount * 25 - highCount * 10)

  // Scope dimension: % of EAP items not removed (active)
  const totalEap = eapItems.length
  const scopeDim = totalEap > 0 ? 100 : 80 // If no EAP, neutral

  return {
    budget: Math.round(budgetDim),
    timeline: Math.round(timelineDim),
    risks: Math.round(riskDim),
    scope: Math.round(scopeDim),
    health: healthScore,
  }
}

// ── Core Simulation ─────────────────────────────────────

/**
 * Deep clone project data to avoid mutating originals.
 */
function cloneData(data: ProjectData): ProjectData {
  return JSON.parse(JSON.stringify(data))
}

/**
 * Apply scenario parameters to cloned data.
 */
function applyParameters(data: ProjectData, params: ScenarioParameters): ProjectData {
  if (!data.project) return data

  // 1. Budget adjustment
  if (params.budgetAdjustmentPct !== 0) {
    data.project.budget *= (1 + params.budgetAdjustmentPct / 100)
  }

  // 2. Timeline adjustment
  if (params.timelineDeltaDays !== 0 && data.project.endDate) {
    const endDate = new Date(data.project.endDate)
    endDate.setDate(endDate.getDate() + params.timelineDeltaDays)
    data.project.endDate = endDate
  }

  // 3. Materialize risks
  if (params.materializedRiskIds.length > 0) {
    const idsToMaterialize = new Set(params.materializedRiskIds)
    data.risks = data.risks.map((risk) => {
      if (idsToMaterialize.has(risk.id)) {
        return { ...risk, level: 'Materializado' }
      }
      return risk
    })
  }

  // 4. Remove EAP items (simulate scope reduction)
  if (params.removedEapItemIds.length > 0) {
    const idsToRemove = new Set(params.removedEapItemIds)
    data.eapItems = data.eapItems.filter((item) => !idsToRemove.has(item.id))
  }

  return data
}

/**
 * Run a what-if simulation. Pure function — no DB writes.
 *
 * @param rules - Effective rules for this project
 * @param data - Current project data (from loadProjectData)
 * @param params - Scenario parameters to apply
 * @returns Comparison of current vs simulated state
 */
export function runSimulation(
  rules: EffectiveRule[],
  data: ProjectData,
  params: ScenarioParameters
): SimulationResult {
  // Evaluate current state
  const currentAlerts = evaluateRules(rules, data)
  const currentScore = calculateHealthScore(currentAlerts)

  // Clone and mutate for simulation
  const simulatedData = applyParameters(cloneData(data), params)
  const simulatedAlerts = evaluateRules(rules, simulatedData)
  const simulatedScore = calculateHealthScore(simulatedAlerts)

  // Compute diff
  const currentKeys = new Set(currentAlerts.map((a) => a.ruleKey))
  const simulatedKeys = new Set(simulatedAlerts.map((a) => a.ruleKey))

  const appeared = simulatedAlerts.filter((a) => !currentKeys.has(a.ruleKey))
  const disappeared = currentAlerts.filter((a) => !simulatedKeys.has(a.ruleKey))
  const unchanged = simulatedAlerts.filter((a) => currentKeys.has(a.ruleKey))

  // Compute radar dimensions
  const currentRadar = computeRadarDimensions(data, currentAlerts, currentScore)
  const simulatedRadar = computeRadarDimensions(simulatedData, simulatedAlerts, simulatedScore)

  return {
    currentScore,
    simulatedScore,
    currentAlerts,
    simulatedAlerts,
    diff: { appeared, disappeared, unchanged },
    currentRadar,
    simulatedRadar,
  }
}
