import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const INTELLIGENCE_RULES = [
  {
    key: 'budget_burn_rate',
    name: 'Queima de Orçamento Desproporcional',
    description:
      'Detecta quando o orçamento está sendo consumido mais rápido que o progresso da EAP. Baseado no Cost Performance Index (CPI) do PMBOK.',
    category: 'BUDGET' as const,
    formula:
      'Dispara se (gastos / budget) > threshold E (% EAP concluída) < (gastos / budget) - 0.15',
    defaultThreshold: 0.7,
    severity: 'HIGH' as const,
  },
  {
    key: 'budget_deviation',
    name: 'Desvio Orçamentário',
    description:
      'Detecta desvio significativo entre gastos reais e gastos esperados com base no progresso reportado.',
    category: 'BUDGET' as const,
    formula:
      'Dispara se abs(gastos_reais - (budget × progress%)) / budget > threshold',
    defaultThreshold: 0.15,
    severity: 'MEDIUM' as const,
  },
  {
    key: 'schedule_performance',
    name: 'Performance de Cronograma',
    description:
      'Detecta quando o tempo decorrido está desproporcional ao progresso real. Baseado no Schedule Performance Index (SPI) do PMBOK.',
    category: 'SCHEDULE' as const,
    formula:
      'Dispara se (dias_decorridos / dias_totais) > (% EAP concluída) + threshold',
    defaultThreshold: 0.2,
    severity: 'HIGH' as const,
  },
  {
    key: 'project_stagnation',
    name: 'Projeto Estagnado',
    description:
      'Detecta quando nenhum item da EAP foi atualizado por um período prolongado.',
    category: 'SCHEDULE' as const,
    formula: 'Dispara se nenhum item EAP mudou de status em X dias',
    defaultThreshold: 7,
    severity: 'MEDIUM' as const,
  },
  {
    key: 'risk_cascade',
    name: 'Cascata de Riscos',
    description:
      'Detecta quando um risco materializado pode afetar itens da EAP que dependem dele.',
    category: 'RISK' as const,
    formula:
      'Dispara se risco materializado tem itens EAP dependentes não concluídos',
    defaultThreshold: 0,
    severity: 'CRITICAL' as const,
  },
  {
    key: 'risk_concentration',
    name: 'Concentração de Riscos',
    description:
      'Detecta quando um stakeholder acumula responsabilidade sobre muitos riscos ativos.',
    category: 'RISK' as const,
    formula:
      'Dispara se stakeholder é responsável por mais de X riscos ativos (probabilidade >= 3)',
    defaultThreshold: 3,
    severity: 'MEDIUM' as const,
  },
  {
    key: 'scope_creep',
    name: 'Crescimento de Escopo',
    description:
      'Detecta quando o escopo (itens da EAP) cresce sem ajuste proporcional de orçamento ou prazo.',
    category: 'SCOPE' as const,
    formula:
      'Dispara se itens EAP cresceram > X% desde o baseline sem aumento de budget/prazo',
    defaultThreshold: 0.2,
    severity: 'HIGH' as const,
  },
  {
    key: 'recurring_issues',
    name: 'Problemas Recorrentes',
    description:
      'Detecta quando os mesmos impedimentos aparecem repetidamente nos status reports.',
    category: 'QUALITY' as const,
    formula:
      'Dispara se mesmos issues aparecem em X status reports consecutivos (similaridade semântica via IA)',
    defaultThreshold: 3,
    severity: 'HIGH' as const,
  },
  {
    key: 'historical_benchmark',
    name: 'Benchmark Histórico',
    description:
      'Compara o projeto com projetos encerrados do mesmo departamento ou classificação. Identifica padrões históricos e lições aprendidas relevantes.',
    category: 'QUALITY' as const,
    formula:
      'Dispara se projetos similares encerrados tiveram health score médio < threshold',
    defaultThreshold: 60,
    severity: 'LOW' as const,
  },
]

async function main() {
  console.log('Seeding intelligence rules...')

  for (const rule of INTELLIGENCE_RULES) {
    await prisma.intelligenceRule.upsert({
      where: { key: rule.key },
      update: {
        name: rule.name,
        description: rule.description,
        category: rule.category,
        formula: rule.formula,
        defaultThreshold: rule.defaultThreshold,
        severity: rule.severity,
      },
      create: {
        ...rule,
        isSystem: true,
        enabled: true,
      },
    })
    console.log(`  ✓ ${rule.key}`)
  }

  console.log(`\nSeeded ${INTELLIGENCE_RULES.length} intelligence rules.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
