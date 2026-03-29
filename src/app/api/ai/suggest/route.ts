import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/ai-sanitize";
import { SUGGEST_SCHEMAS } from "@/lib/ai-schemas";
import { getProjectContext } from "@/lib/ai-context";

export const dynamic = "force-dynamic";

type SuggestType =
  | "charter_criteria"
  | "charter_deliverables"
  | "charter_premises"
  | "charter_restrictions"
  | "status_report"
  | "risk_suggest"
  | "classification"
  | "eap_suggest"
  | "closing_suggest"
  | "cadence_suggest"
  | "meeting_transcript";

const PROMPTS: Record<SuggestType, string> = {
  charter_criteria: `Com base no contexto do projeto abaixo, sugira de 3 a 5 critérios de sucesso MENSURÁVEIS e específicos.
Cada critério deve ser claro, quantificável quando possível, e diretamente relacionado aos objetivos do projeto.
Exemplo: "Redução de 25% no tempo de processamento de pedidos até Q3 2025"`,

  charter_deliverables: `Com base no contexto do projeto abaixo, sugira de 3 a 5 entregas principais (deliverables).
Cada entrega deve ser um resultado tangível e verificável do projeto.
Exemplo: "Plataforma web de gestão de pedidos com dashboard em tempo real"`,

  charter_premises: `Com base no contexto do projeto abaixo, sugira de 3 a 5 premissas (assumptions) do projeto.
Premissas são condições assumidas como verdadeiras para o planejamento.
Exemplo: "A equipe de TI terá disponibilidade de 80% para o projeto"`,

  charter_restrictions: `Com base no contexto do projeto abaixo, sugira de 3 a 5 restrições (constraints) do projeto.
Restrições são limitações que o projeto precisa operar dentro.
Exemplo: "O orçamento não pode exceder R$ 500.000 sem aprovação do comitê"`,

  status_report: `Com base no contexto do projeto abaixo, sugira conteúdo para um relatório de status.
Retorne um JSON com as chaves: "accomplishments" (conquistas do período), "nextSteps" (próximos passos prioritários), "issues" (problemas/impedimentos identificados).
Cada campo deve ter 2-3 frases profissionais e específicas ao projeto.`,

  risk_suggest: `Com base no contexto do projeto abaixo e nos riscos já identificados, sugira de 2 a 3 NOVOS riscos que ainda não foram catalogados.
Para cada risco, inclua: title, description, probability (1-5), impact (1-5), category, mitigation (estratégia de mitigação), contingency (plano de contingência).
Categorias possíveis: Técnico, Organizacional, Externo, Gerenciamento de Projeto, Financeiro.`,

  classification: `Com base no contexto do projeto abaixo, analise e sugira a classificação metodológica mais adequada.
As opções são:
- TRADITIONAL (Cascata/Waterfall): projetos com escopo bem definido, requisitos estáveis, entregas sequenciais
- AGILE (Ágil): projetos com requisitos evolutivos, entregas incrementais, alta incerteza
- HYBRID (Híbrido): combinação de ambas, planejamento cascata com execução ágil

Considere: complexidade, incerteza de requisitos, tamanho da equipe, tipo de entrega, stakeholders e orçamento.
Retorne ESTRITAMENTE um JSON válido: { "classification": "TRADITIONAL|AGILE|HYBRID", "justification": "justificativa em 1-2 frases" }`,

  eap_suggest: `Com base no contexto do projeto abaixo, sugira uma Estrutura Analítica do Projeto (EAP/WBS) hierárquica.
Considere a classificação do projeto, o escopo preliminar, os critérios de sucesso e as entregas do charter.
Se já existirem itens na EAP, NÃO os repita — sugira apenas itens complementares.

Crie de 3 a 6 pacotes de trabalho principais (fases), cada um com 2 a 4 sub-pacotes (atividades).
Cada item deve ter: name (nome claro e descritivo) e description (1 frase sobre o escopo).

A estrutura deve seguir boas práticas de PMO: fases lógicas do projeto do início ao encerramento.`,

  cadence_suggest: `Com base no contexto do projeto abaixo, avalie os seguintes rituais/cerimônias de gestão e recomende quais fazem sentido para ESTE projeto específico.
Princípio: MENOS ritual por padrão. Só recomende o que o contexto do projeto realmente exige.
Projetos pequenos (< R$50.000) e baixo risco precisam de poucos ritos.
Projetos AGILE favorecem ritos iterativos. TRADITIONAL favorecem gates formais. HYBRID mistura ambos.

Rituais a avaliar: Daily Standup, Sprint Planning, Sprint Review, Retrospectiva, Weekly Sync, Comitê Diretivo, Gate Review, Lições Aprendidas.

Para cada: name, recommended (true/false), frequency (Diária|Semanal|Quinzenal|Mensal|Por Fase|Ao Final), justification.
Inclua governanceSummary: resumo de 2-3 frases sobre a filosofia de governança recomendada.

Retorne ESTRITAMENTE um JSON válido: { "governanceSummary": "...", "rituals": [{ "name": "...", "recommended": true, "frequency": "...", "justification": "..." }] }`,

  closing_suggest: `Com base no contexto COMPLETO do projeto abaixo (incluindo status reports, EAP, riscos e charter), gere um relatório de encerramento completo.

Analise:
- O progresso real do projeto (EAP e status reports)
- Riscos que se materializaram vs. mitigados
- Entregas planejadas vs. realizadas
- Problemas reportados nos status reports

Gere:
1. "summary": Resumo executivo de 2-3 parágrafos sobre o projeto (contexto, execução, resultado)
2. "deliverables": Array de entregas com "text" (nome da entrega) e "status" ("concluído", "parcial" ou "não entregue"), baseado nos dados reais
3. "lessons": Array de 3-5 lições aprendidas baseadas no histórico real do projeto
4. "recommendations": Array de 3-5 recomendações para projetos futuros baseadas na experiência deste projeto`,

  meeting_transcript: `Você é um PMO Master especialista. Analise a transcrição de reunião abaixo no contexto do projeto e extraia TODAS as informações estruturadas possíveis.

A transcrição será fornecida no campo "transcript" do input do usuário.

Extraia TODAS as informações relevantes que encontrar:
1. "summary": Resumo executivo da reunião em 2-3 frases.
2. "statusReport": Se houver informações sobre progresso, conquistas, próximos passos ou problemas:
   - "accomplishments": o que foi realizado
   - "nextSteps": próximas ações definidas
   - "issues": problemas ou impedimentos mencionados
   - "overallStatus": se a reunião indica mudança de status do projeto, sugira "Verde (Saudável)", "Amarelo (Atenção)" ou "Vermelho (Risco)"
   - "statusJustification": justificativa para a mudança de status sugerida
3. "stakeholders": Nomes de pessoas mencionadas com papéis [{ "name", "role", "alreadyRegistered" }]. Se o stakeholder JÁ está na lista de cadastrados do projeto, marque "alreadyRegistered": true. Caso contrário, "alreadyRegistered": false.
4. "eapItems": NOVAS tarefas, atividades ou entregas identificadas [{ "name", "description" }].
5. "eapUpdates": Tarefas EXISTENTES que mudaram de status na reunião [{ "name" (nome exato ou aproximado do item EAP), "newStatus" ("PENDING" | "IN_PROGRESS" | "DONE"), "reason" (por que mudou) }]. Compare com os itens da EAP do contexto do projeto.
6. "risks": Riscos, problemas potenciais ou preocupações [{ "title", "description", "probability" (1-5), "impact" (1-5), "category" }].
7. "decisions": Decisões tomadas na reunião [{ "description" (o que foi decidido), "madeBy" (quem decidiu, se mencionado), "context" (contexto/justificativa da decisão) }].

Seja inteligente: extraia apenas o que faz sentido. Se a transcrição não menciona riscos, retorne array vazio para risks. Idem para outros campos. Mas seja AGRESSIVO em identificar decisões — qualquer "ficou decidido que", "vamos fazer X", "combinamos que" é uma decisão.`,
};

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { projectId, type, transcript } = await req.json();

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "projectId e type são obrigatórios" },
        { status: 400 }
      );
    }

    if (!(type in PROMPTS)) {
      return NextResponse.json(
        { error: `Tipo inválido: ${type}` },
        { status: 400 }
      );
    }

    // Encerramento e EAP precisam de contexto enriquecido
    const needsEnriched = type === "closing_suggest" || type === "eap_suggest";
    const ctx = await getProjectContext(projectId, needsEnriched);
    if (!ctx) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const isListType = type.startsWith("charter_");
    const isRisk = type === "risk_suggest";
    const isClassification = type === "classification";
    const isEap = type === "eap_suggest";
    const isClosing = type === "closing_suggest";
    const isCadence = type === "cadence_suggest";
    const isMeetingTranscript = type === "meeting_transcript";

    let responseFormat: string;
    if (isListType) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": ["item 1", "item 2", ...] }`;
    } else if (isRisk) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": [{ "title": "...", "description": "...", "probability": 3, "impact": 4, "category": "...", "mitigation": "...", "contingency": "..." }] }`;
    } else if (isClassification) {
      responseFormat = "";
    } else if (isEap) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "suggestions": [{ "name": "Fase 1 - Nome", "description": "Descrição", "children": [{ "name": "Sub-pacote", "description": "Descrição" }] }] }`;
    } else if (isClosing) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "summary": "Resumo executivo...", "deliverables": [{ "text": "Entrega X", "status": "concluído|parcial|não entregue" }], "lessons": ["Lição 1", ...], "recommendations": ["Recomendação 1", ...] }`;
    } else if (isCadence) {
      responseFormat = "";
    } else if (isMeetingTranscript) {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "summary": "...", "statusReport": { "accomplishments": "...", "nextSteps": "...", "issues": "...", "overallStatus": "Verde (Saudável)|Amarelo (Atenção)|Vermelho (Risco)", "statusJustification": "..." }, "stakeholders": [{ "name": "...", "role": "..." }], "eapItems": [{ "name": "...", "description": "..." }], "eapUpdates": [{ "name": "...", "newStatus": "PENDING|IN_PROGRESS|DONE", "reason": "..." }], "risks": [{ "title": "...", "description": "...", "probability": 3, "impact": 3, "category": "..." }], "decisions": [{ "description": "...", "madeBy": "...", "context": "..." }] }`;
    } else {
      responseFormat = `Retorne ESTRITAMENTE um JSON válido: { "accomplishments": "...", "nextSteps": "...", "issues": "..." }`;
    }

    let transcriptSection = "";
    if (isMeetingTranscript && transcript) {
      transcriptSection = `\n\nTranscrição da Reunião:\n${sanitizeForPrompt(transcript, 10000)}`;

      // Fetch existing stakeholders to avoid duplicates
      const existingStakeholders = await prisma.stakeholder.findMany({
        where: { projectId },
        select: { name: true, role: true },
      });
      if (existingStakeholders.length > 0) {
        transcriptSection += `\n\nSTAKEHOLDERS JÁ CADASTRADOS NESTE PROJETO (não sugira como novos — marque alreadyRegistered: true):\n${existingStakeholders.map((s) => `- ${s.name}${s.role ? ` (${s.role})` : ""}`).join("\n")}`;
      }
    }

    const prompt = `Você atua como um PMO Master especialista em gestão de projetos corporativos.

${PROMPTS[type as SuggestType]}

Contexto do Projeto:
${ctx.contextText}${transcriptSection}

${responseFormat}
Retorne apenas o JSON, sem marcações markdown ou texto antes/depois.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: { maxOutputTokens: 8192 },
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: 8192 },
      });
    }

    let rawText = "";
    try {
      rawText = response.text || "";
    } catch (e) {
      console.error("Error accessing response.text:", e);
      console.log("Full response object:", JSON.stringify(response, null, 2));
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA." },
        { status: 500 }
      );
    }

    if (!rawText) {
      console.error("Empty response from AI. Full response:", JSON.stringify(response, null, 2));
      return NextResponse.json(
        { error: "IA não retornou conteúdo." },
        { status: 500 }
      );
    }

    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Extract JSON object from potential preamble/postamble text
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      rawText = rawText.slice(firstBrace, lastBrace + 1);
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      // Attempt to recover truncated JSON by closing open brackets
      let recovered = rawText;
      // Remove trailing incomplete string/value (e.g., `"text": "some trunc`)
      recovered = recovered.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, "");
      // Count unclosed brackets and close them
      const openBraces = (recovered.match(/{/g) || []).length - (recovered.match(/}/g) || []).length;
      const openBrackets = (recovered.match(/\[/g) || []).length - (recovered.match(/]/g) || []).length;
      recovered += "]".repeat(Math.max(0, openBrackets)) + "}".repeat(Math.max(0, openBraces));
      try {
        result = JSON.parse(recovered);
        console.warn("Recovered truncated AI JSON response");
      } catch {
        console.error("Failed to parse AI suggest response:", rawText.slice(0, 500));
        return NextResponse.json(
          { error: "Erro ao formatar resposta da IA. Tente com um texto menor." },
          { status: 500 }
        );
      }
    }

    // Validar resposta com schema Zod
    const schema = SUGGEST_SCHEMAS[type];
    if (schema) {
      const parsed = schema.safeParse(result);
      if (!parsed.success) {
        const flatErrors = parsed.error.flatten();
        console.error("AI response validation failed for type:", type);
        console.error("Zod errors:", JSON.stringify(flatErrors));
        console.error("Raw AI response (first 1000 chars):", rawText.slice(0, 1000));
        console.error("Parsed result keys:", Object.keys(result));
        return NextResponse.json(
          { error: "Resposta da IA em formato inesperado. Tente novamente ou use um texto mais curto." },
          { status: 502 }
        );
      }
      return NextResponse.json(parsed.data);
    }

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error("AI suggest error:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
