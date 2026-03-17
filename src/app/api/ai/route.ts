import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { sanitizeShort, sanitizeForPrompt } from '@/lib/ai-sanitize';
import { ProjectCreationSchema } from '@/lib/ai-schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const data = await req.json();

        const { name, manager, budget, stakeholders, problems, returns, impacts } = data;

        if (!name || !budget || !problems) {
            return NextResponse.json({ error: 'Campos nome, orçamento e problemas são obrigatórios' }, { status: 400 });
        }

        // Sanitizar inputs antes de enviar ao prompt
        const sName = sanitizeShort(name);
        const sManager = sanitizeShort(manager);
        const sStakeholders = sanitizeShort(stakeholders);
        const sProblems = sanitizeForPrompt(problems);
        const sReturns = sanitizeForPrompt(returns);
        const sImpacts = sanitizeForPrompt(impacts);

        const prompt = `Você atua como um PMO Master certificado PMP com vasta experiência em gestão de projetos corporativos.
Analise os dados do projeto abaixo e retorne ESTRITAMENTE um JSON válido.

## Instruções detalhadas por campo:

**classification**: Classifique como TRADITIONAL (projetos com escopo bem definido, baixa incerteza), AGILE (projetos com requisitos evolutivos, entregas incrementais) ou HYBRID (combina ambos). Considere o tipo de problema, orçamento e stakeholders.

**businessCase**: Escreva um business case profissional de 3-4 parágrafos em formato narrativo corporativo. Deve conter: (1) contexto do problema, (2) justificativa estratégica do investimento, (3) benefícios esperados quantificados, (4) consequências de não agir. Não use bullet points.

**preliminaryScope**: Descrição macro de 2-3 parágrafos do que será entregue. Inclua: entregas principais, limites do escopo (o que está fora), e abordagem técnica resumida.

**preliminaryTimeline**: Cronograma resumido em texto com fases principais e duração estimada de cada uma. Exemplo: "Fase 1 - Descoberta e Planejamento (3 semanas): levantamento de requisitos e definição de arquitetura. Fase 2 - Desenvolvimento (8 semanas): implementação das funcionalidades core..."

**milestones**: Array de 4-6 marcos principais do projeto em ordem cronológica. Exemplo: ["Kickoff e Aprovação do Escopo", "Conclusão do MVP", "Testes de Aceitação", "Go-Live", "Encerramento e Lições Aprendidas"]

**successCriteria**: Array de 3-5 critérios de sucesso mensuráveis e específicos. Exemplo: ["Redução de 30% no tempo de processamento até Q3", "NPS do usuário final acima de 8.0", "ROI positivo em 12 meses"]

**initialRisks**: Array de 3-5 riscos com campos: description (texto descritivo), probability (1 a 5), impact (1 a 5), category (Técnico|Organizacional|Externo|Financeiro|Gerenciamento de Projeto), mitigation (estratégia de mitigação concreta).

## Estrutura JSON esperada:
{
  "classification": "TRADITIONAL" | "AGILE" | "HYBRID",
  "businessCase": "Texto narrativo completo...",
  "preliminaryScope": "Descrição macro do escopo...",
  "preliminaryTimeline": "Fase 1 - Nome (duração): descrição. Fase 2 - ...",
  "milestones": ["Marco 1", "Marco 2", "Marco 3", "Marco 4"],
  "successCriteria": ["Critério mensurável 1", "Critério mensurável 2"],
  "initialRisks": [
    { "description": "Descrição do risco", "probability": 3, "impact": 4, "category": "Técnico", "mitigation": "Estratégia de mitigação" }
  ]
}

## Dados do Projeto:
Nome: ${sName}
Gerente: ${sManager || 'Não definido'}
Orçamento: R$ ${Number(budget).toLocaleString('pt-BR')}
Stakeholders: ${sStakeholders || 'Não informado'}
Problemas a resolver: ${sProblems}
Retornos Esperados: ${sReturns || 'Não informado'}
Impactos de Não Solução: ${sImpacts || 'Não informado'}

Retorne apenas o JSON, sem marcações markdown ou texto antes/depois.`;

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
        } catch (apiError) {
            const err = apiError as Error;
            console.warn('Fallback triggered: gemini-2.5-flash failed.', err.message || err);
            response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
        }

        let rawText = response.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(rawText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response", rawText, parseError);
            return NextResponse.json({ error: 'Erro ao formatar resposta da IA.' }, { status: 500 });
        }

        // Validar estrutura da resposta com Zod
        const parsed = ProjectCreationSchema.safeParse(result);
        if (!parsed.success) {
            console.error("AI response validation failed:", parsed.error.flatten());
            return NextResponse.json({ error: 'Resposta da IA em formato inesperado.' }, { status: 502 });
        }

        return NextResponse.json(parsed.data);
    } catch (error) {
        const err = error as Error;
        console.error('Error generating AI content:', err);
        return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
