import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const data = await req.json();

        const { name, manager, budget, stakeholders, problems, returns, impacts } = data;

        if (!name || !budget || !problems) {
            return NextResponse.json({ error: 'Campos nome, orçamento e problemas são obrigatórios' }, { status: 400 });
        }

        const prompt = `
      Você atua como um PMO Master. Analise os dados do projeto abaixo e retorne ESTRITAMENTE um arquivo JSON válido usando a seguinte estrutura:
      
      {
        "classification": "TRADITIONAL" | "AGILE" | "HYBRID",
        "businessCase": "Um texto de storytelling corporativo justificando o projeto com base nos retornos e impactos.",
        "preliminaryScope": "Uma descrição macro do que será entregue para resolver os problemas.",
        "initialRisks": [
           { "description": "Risco 1", "probability": 1 a 5, "impact": 1 a 5 },
           { "description": "Risco 2", "probability": 1 a 5, "impact": 1 a 5 }
        ]
      }

      Dados do Projeto:
      Nome: ${name}
      Gerente: ${manager}
      Orçamento: R$ ${budget}
      Stakeholders: ${stakeholders}
      Problemas a resolver: ${problems}
      Retornos Esperados: ${returns}
      Impactos: ${impacts}

      Retorne apenas o JSON, sem marcações markdown ou texto antes/depois.
    `;

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-3.1-pro',
                contents: prompt,
            });
        } catch (apiError) {
            const err = apiError as Error;
            console.warn('Fallback triggered: gemini-3.1-pro failed.', err.message || err);
            // Attempt fallback with gemini-2.5-pro
            response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
        }

        let rawText = response.text || "{}";

        // Cleanup potential markdown blocks from LLM
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let result;
        try {
            result = JSON.parse(rawText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response", rawText, parseError);
            return NextResponse.json({ error: 'Erro ao formatar resposta da IA.' }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error) {
            const err = error as Error;
        console.error('Error generating AI content:', err);
        return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
