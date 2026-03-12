import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Limpar projetos existentes (cuidado ao rodar em prod!)
    await prisma.project.deleteMany({});

    // Projeto Fictício 1 - Traditional/Waterfall (Em andamento - Atrasado)
    const p1 = await prisma.project.create({
        data: {
            name: "Migração do Data Center Legado",
            manager: "Carlos Almeida",
            budget: 1250000.00,
            stakeholders: "Diretoria de TI, Infraestrutura",
            classification: "TRADITIONAL",
            status: "RED",
            problems: "A infraestrutura atual está defasada, causando instabilidade no ERP e gerando altos custos de manutenção com hardware de mais de 7 anos.",
            returns: "Redução de 35% no custo de hardware, aumento de 99.9% de uptime no ERP, segurança aprimorada.",
            impacts: "Downtime programado de 8 horas para transição nos sistemas não críticos.",
            artifacts: {
                create: [
                    {
                        type: "BUSINESS_CASE",
                        content: {
                            justification: "A modernização é imperativa para suportar a expansão prevista pela AIR Company nos próximos 3 anos.",
                            roi: "Payback estimado de 18 meses."
                        }
                    },
                    {
                        type: "ESCOPO_PRELIMINAR",
                        content: {
                            inScope: "Migração de 45 servidores físicos para o provedor Cloud XYZ, refatoração de rede estrutural.",
                            outOfScope: "Modernização das regras de negócio do ERP."
                        }
                    }
                ]
            },
            risks: {
                create: [
                    { description: "Fornecedor da Nuvem não entregar as máquinas a tempo.", probability: 3, impact: 5, status: "OCCURRED" },
                    { description: "Perda de dados legados durante transferência via VPN.", probability: 2, impact: 4, status: "IDENTIFIED" }
                ]
            }
        }
    });
    console.log(`Created Project: ${p1.name}`);

    // Projeto Fictício 2 - Agile (No Prazo)
    const p2 = await prisma.project.create({
        data: {
            name: "Renovação do App Cliente B2B",
            manager: "Mariana Costa",
            budget: 450000.00,
            stakeholders: "Marketing, Vendas, Clientes VIP",
            classification: "AGILE",
            status: "GREEN",
            problems: "O app B2B atual tem avaliação nota 2.3 nas lojas e fluxos confusos, causando alta taxa de churn no digital.",
            returns: "Aumento das vendas b2b pelo app em 20%, elevação do NPS.",
            impacts: "Treinamento necessário para o time de suporte que vai atender o novo canal Omni.",
            artifacts: {
                create: [
                    {
                        type: "BUSINESS_CASE",
                        content: {
                            justification: "Clientes B2B exigem auto-atendimento. Renovar o canal digital protege a receita do pipeline principal."
                        }
                    }
                ]
            }
        }
    });
    console.log(`Created Project: ${p2.name}`);

    // Projeto Fictício 3 - Hybrid (Atenção)
    const p3 = await prisma.project.create({
        data: {
            name: "Integração M&A - Studio XYZ",
            manager: "Julio Tavares",
            budget: 85000.00,
            stakeholders: "RH, Jurídico, TI",
            classification: "HYBRID",
            status: "YELLOW",
            problems: "Há duplicidade em folhas de pagamento e falta de comunicação sistêmica após a aquisição do novo Studio XYZ pela AIR.",
            returns: "Sistema único de RH com compliance legal em 60 dias.",
            impacts: "Alteração da data de corte do ponto para os funcionários da XYZ.",
            risks: {
                create: [
                    { description: "Processos judiciais trabalhistas devido a erros no primeiro contracheque integrado.", probability: 4, impact: 5, status: "IDENTIFIED" }
                ]
            }
        }
    });
    console.log(`Created Project: ${p3.name}`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
