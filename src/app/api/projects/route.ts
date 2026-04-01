import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        const {
            name,
            manager,
            budget,
            stakeholders,
            problems,
            returns,
            impacts,
            classification,
            businessCase,
            preliminaryScope,
            preliminaryTimeline,
            milestones,
            successCriteria,
            expectedReturn,
            cadence,
            initialRisks,
            currency,
        } = data;

        // Validate Anti-Error logic: High budget with empty scope description
        if (budget > 10000 && (!preliminaryScope || preliminaryScope.trim().length < 20)) {
            return NextResponse.json(
                { error: "Erro de Contradição: Orçamento alto não pode ter descrição de escopo vazia ou curta." },
                { status: 400 }
            );
        }

        // Creating Project with nested Artifacts and Risks
        const project = await prisma.project.create({
            data: {
                name,
                manager,
                budget: parseFloat(budget),
                stakeholders,
                classification,
                expectedReturn: expectedReturn ? parseFloat(expectedReturn) : null,
                currency: currency || "BRL",
                problems,
                returns,
                impacts,
                preliminaryTimeline,
                milestones: milestones ? JSON.stringify(milestones) : null,
                successCriteria: successCriteria ? JSON.stringify(successCriteria) : null,
                status: 'GREEN',
                artifacts: {
                    create: [
                        {
                            type: "BUSINESS_CASE",
                            content: { text: businessCase },
                        },
                        {
                            type: "ESCOPO_PRELIMINAR",
                            content: { text: preliminaryScope },
                        },
                        {
                            type: "RISCOS_INICIAIS",
                            content: { items: initialRisks },
                        },
                        ...(cadence ? [{
                            type: "CADENCE_RITUALS",
                            content: cadence,
                        }] : []),
                    ],
                },
                risks: {
                    create: (initialRisks || []).map((risk: {description: string; probability: string; impact: string; category?: string; mitigation?: string}) => ({
                        description: risk.description,
                        probability: parseInt(risk.probability),
                        impact: parseInt(risk.impact),
                        category: risk.category || "Geral",
                        mitigation: risk.mitigation || null,
                        status: "Identificado",
                    })),
                },
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        const err = error as Error;
        console.error("Error saving project:", err);
        return NextResponse.json({ error: "Erro ao salvar o projeto" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        const projects = await prisma.project.findMany({
            where: {
                name: {
                    contains: search,
                    mode: 'insensitive',
                }
            },
            include: {
                eapItems: {
                    select: { id: true, status: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(projects);
    } catch (err) {
        console.error("Erro ao buscar projetos:", err);
        return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 });
    }
}
