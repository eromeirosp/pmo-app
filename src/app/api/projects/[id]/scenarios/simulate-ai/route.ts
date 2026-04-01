import { getEffectiveRules, loadProjectData } from '@/lib/intelligence-engine'
import { runSimulation, type ScenarioParameters } from '@/lib/scenario-engine'
import { getProjectContext } from '@/lib/ai-context'
import { GoogleGenAI } from '@google/genai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const parameters: ScenarioParameters = {
      budgetAdjustmentPct: Math.max(-50, Math.min(50, Number(body.budgetAdjustmentPct) || 0)),
      timelineDeltaDays: Math.max(-60, Math.min(60, Number(body.timelineDeltaDays) || 0)),
      materializedRiskIds: Array.isArray(body.materializedRiskIds) ? body.materializedRiskIds : [],
      removedEapItemIds: Array.isArray(body.removedEapItemIds) ? body.removedEapItemIds : [],
    }

    // 1. Run rules-based simulation (instant)
    const [rules, data] = await Promise.all([
      getEffectiveRules(id),
      loadProjectData(id),
    ])

    if (!data.project) {
      return new Response(JSON.stringify({ error: 'Projeto não encontrado' }), { status: 404 })
    }

    const result = runSimulation(rules, data, parameters)

    // 2. Get project context for AI prompt
    const ctx = await getProjectContext(id, true)
    if (!ctx) {
      return new Response(JSON.stringify({ error: 'Contexto não encontrado' }), { status: 404 })
    }

    // 3. Build prompt
    const riskNames = parameters.materializedRiskIds.length > 0
      ? data.risks
          .filter((r) => parameters.materializedRiskIds.includes(r.id))
          .map((r) => r.title || 'Sem título')
          .join(', ')
      : 'Nenhum'

    const eapNames = parameters.removedEapItemIds.length > 0
      ? data.eapItems
          .filter((e) => parameters.removedEapItemIds.includes(e.id))
          .map((e) => e.name)
          .join(', ')
      : 'Nenhum'

    const prompt = `Você é um consultor sênior de gestão de projetos (PMO Master).
Analise o cenário simulado abaixo e produza um briefing executivo.

IMPORTANTE: Responda DIRETAMENTE com os headers markdown abaixo. NÃO inclua introdução, saudação, confirmação ou qualquer texto antes do primeiro header.

CONTEXTO DO PROJETO:
${ctx.contextText}

PARÂMETROS DA SIMULAÇÃO:
- Orçamento: ${parameters.budgetAdjustmentPct > 0 ? '+' : ''}${parameters.budgetAdjustmentPct}%
- Prazo: ${parameters.timelineDeltaDays > 0 ? '+' : ''}${parameters.timelineDeltaDays} dias
- Riscos materializados: ${riskNames}
- Itens EAP removidos: ${eapNames}

RESULTADO DAS REGRAS:
- Score atual: ${result.currentScore} → Simulado: ${result.simulatedScore} (${result.simulatedScore - result.currentScore > 0 ? '+' : ''}${result.simulatedScore - result.currentScore} pontos)
- Novos alertas: ${result.diff.appeared.map((a) => a.title).join(', ') || 'Nenhum'}
- Alertas resolvidos: ${result.diff.disappeared.map((a) => a.title).join(', ') || 'Nenhum'}

ESTRUTURE SUA ANÁLISE EXATAMENTE COM ESTES HEADERS MARKDOWN:

## Diagnóstico de Impacto
O que essa mudança causa no projeto, em linguagem de negócio. Seja específico sobre entregas, cronograma e custos afetados.

## Efeitos em Cascata
Riscos que podem escalar, itens de EAP que ficam inviáveis, impacto no cronograma. Conecte os pontos.

## Recomendações de Mitigação
2-3 ações concretas e acionáveis que o GP poderia tomar para minimizar danos (ou maximizar ganhos se for cenário positivo).

## Veredito
Uma frase síntese clara sobre a viabilidade do cenário. Ex: "Cenário viável com ajustes" ou "Cenário crítico — requer aprovação do comitê".

Seja direto, profissional e use linguagem de negócio. Não repita os dados que já foram apresentados.`

    // 4. Stream response: first chunk is JSON result, then AI narrative
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send simulation result as first chunk
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'result', data: result })}\n\n`
        ))

        try {
          // Stream AI narrative
          let model = 'gemini-2.5-flash'
          try {
            const response = await ai.models.generateContentStream({
              model: 'gemini-2.5-pro',
              contents: prompt,
              config: { maxOutputTokens: 8192 },
            })
            for await (const chunk of response) {
              const text = chunk.text || ''
              if (text) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'narrative', data: text })}\n\n`
                ))
              }
            }
          } catch {
            // Fallback to flash
            const response = await ai.models.generateContentStream({
              model,
              contents: prompt,
              config: { maxOutputTokens: 8192 },
            })
            for await (const chunk of response) {
              const text = chunk.text || ''
              if (text) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'narrative', data: text })}\n\n`
                ))
              }
            }
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          ))
        } catch (error) {
          console.error('[Scenario AI] Streaming error:', error)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', data: 'Erro ao gerar análise da IA' })}\n\n`
          ))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Scenario AI] Error:', error)
    return new Response(JSON.stringify({ error: 'Erro ao executar simulação' }), { status: 500 })
  }
}
